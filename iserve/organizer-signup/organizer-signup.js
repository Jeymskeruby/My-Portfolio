// organizer-signup.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    let auth, db;
    try {
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Firebase initialization failed. Please check your configuration.');
        return;
    }

    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Form elements
    const form = document.getElementById('organizerSignupForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const passwordError = document.getElementById('passwordError');
    const usernameError = document.getElementById('usernameError');
    const cancelBtn = document.getElementById('cancelBtn');
    const successModal = document.getElementById('successModal');
    const successModalCloseBtn = document.getElementById('successModalCloseBtn');

    // Form fields
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Username uniqueness check with debounce
    let usernameCheckTimeout;
    usernameInput.addEventListener('input', () => {
        clearTimeout(usernameCheckTimeout);
        const username = usernameInput.value.trim();
        
        if (username.length > 0) {
            usernameCheckTimeout = setTimeout(() => {
                checkUsernameAvailability(username);
            }, 500);
        } else {
            hideUsernameError();
        }
    });

    // Password confirmation validation
    confirmPasswordInput.addEventListener('input', () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordError.classList.remove('hidden');
            passwordError.textContent = 'Passwords do not match';
        } else {
            passwordError.classList.add('hidden');
        }
    });

    passwordInput.addEventListener('input', () => {
        if (confirmPasswordInput.value) {
            if (passwordInput.value !== confirmPasswordInput.value) {
                passwordError.classList.remove('hidden');
                passwordError.textContent = 'Passwords do not match';
            } else {
                passwordError.classList.add('hidden');
            }
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
            window.location.href = '../index.html';
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous messages
        hideMessages();

        // Validate form (sync)
        if (!validateForm()) {
            return;
        }

        // Check if passwords match (sync)
        if (passwordInput.value !== confirmPasswordInput.value) {
            showError('Passwords do not match.');
            return;
        }

        // Lock the submit button BEFORE the first await so a double-click
        // can't run the handler twice and write a second organizer record.
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering...';
        }
        const releaseBtn = () => {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText || 'Confirm Registration'; }
        };

        try {
            // Check if username is available
            const usernameAvailable = await checkUsernameAvailability(usernameInput.value.trim(), true);
            if (!usernameAvailable) {
                showError('This username is already taken. Please choose a different username.');
                releaseBtn();
                return;
            }

            // Register organizer
            await registerOrganizer();
            releaseBtn();

        } catch (error) {
            console.error('Registration error:', error);
            showError(error.message || 'An error occurred during registration. Please try again.');
            releaseBtn();
        }
    });

    // Check username availability
    async function checkUsernameAvailability(username, isSubmissionCheck = false) {
        if (!username) {
            hideUsernameError();
            return true;
        }

        try {
            const organizersSnapshot = await db.collection('organizers')
                .where('username', '==', username)
                .limit(1)
                .get();

            if (!organizersSnapshot.empty) {
                if (isSubmissionCheck) {
                    return false;
                }
                showUsernameError('This username is already taken. Please choose a different username.');
                return false;
            } else {
                hideUsernameError();
                return true;
            }
        } catch (error) {
            console.error('Error checking username availability:', error);
            if (isSubmissionCheck) {
                throw new Error('Unable to verify username availability. Please try again.');
            }
            return true; // Assume available if there's an error (to not block user)
        }
    }

    function showUsernameError(message) {
        usernameError.textContent = message;
        usernameError.classList.remove('hidden');
        usernameInput.classList.add('border-red-500');
    }

    function hideUsernameError() {
        usernameError.classList.add('hidden');
        usernameInput.classList.remove('border-red-500');
    }

    function validateForm() {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        const missingFields = [];

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                const label = form.querySelector(`label[for="${field.id}"]`);
                missingFields.push(label ? label.textContent.replace('*', '').trim() : field.id);
            }
        });

        if (!isValid) {
            showError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        }

        return isValid;
    }

    async function registerOrganizer() {
        const organizerData = {
            // Organization details
            organizationName: document.getElementById('organizationName').value.trim(),
            organizationType: document.getElementById('organizationType').value,
            registrationNumber: document.getElementById('registrationNumber').value.trim(),
            website: document.getElementById('website').value.trim() || null,
            
            // Contact details
            contactPerson: document.getElementById('contactPerson').value.trim(),
            position: document.getElementById('position').value.trim(),
            officialEmail: document.getElementById('officialEmail').value.trim(),
            contactNumber: document.getElementById('contactNumber').value.trim(),
            
            // Account details
            username: usernameInput.value.trim(),
            password: passwordInput.value, // Store password (in production, hash this!)
            
            // Metadata
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            registrationDate: new Date().toISOString().split('T')[0],
            registrationAttempts: 1,
            documentStatus: 'will_request', // Track that documents need to be requested
            loginAttempts: 0,
            lastLoginAttempt: null,
            lastLogin: null
        };

        try {
            // Double-check username availability before registration
            const finalUsernameCheck = await checkUsernameAvailability(organizerData.username, true);
            if (!finalUsernameCheck) {
                throw new Error('This username is no longer available. Please choose a different username.');
            }

            // 1. Create Firebase auth user (optional - you can remove this if using custom auth only)
            let user;
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(
                    organizerData.officialEmail, 
                    passwordInput.value
                );
                user = userCredential.user;

                // Update user profile
                await user.updateProfile({
                    displayName: 'pending_organizer'
                });
            } catch (authError) {
                console.warn('Firebase auth creation failed, continuing with custom auth only:', authError);
                // Continue with custom auth only if Firebase auth fails
                user = null;
            }

            // 2. Save organizer data to Firestore
            if (user) {
                organizerData.uid = user.uid;
                organizerData.authEmail = organizerData.officialEmail;
            } else {
                // Generate a custom ID if no Firebase auth user
                organizerData.uid = 'org_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            organizerData.authDisabled = false; // Enable custom auth
            
            await db.collection('organizers').doc(organizerData.uid).set(organizerData);

            // 3. Send pending registration email notification
            await sendRegistrationNotification(organizerData);

            // 4. Sign out the user immediately if Firebase auth was used
            if (user) {
                await auth.signOut();
            }

            // 5. Show success modal
            showSuccessModal();

            // 6. Reset form
            form.reset();
            feather.replace();

        } catch (error) {
            console.error('Registration error:', error);
            
            // Clean up: delete user if creation failed after auth was created
            if (auth.currentUser) {
                try {
                    await auth.currentUser.delete();
                } catch (deleteError) {
                    console.error('Error cleaning up user:', deleteError);
                }
            }
            
            throw error;
        }
    }

    async function sendRegistrationNotification(organizerData) {
        try {
            const notificationData = {
                // For UI
                type: 'new_organizer', // matches your getNotificationTypeInfo
                title: 'New Organizer Registration Request',
                message: `You have received a new organizer registration request from ${organizerData.organizationName}.`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),

                // Extra details the admin may need
                organizerId: organizerData.uid,
                organizerName: organizerData.organizationName,
                organizerEmail: organizerData.officialEmail,
                contactPerson: organizerData.contactPerson,
                registrationNumber: organizerData.registrationNumber,
                registrationDate: organizerData.registrationDate,
                status: 'pending',
                documentStatus: 'needs_request'
            };

            await db.collection('adminNotifications').add(notificationData);
            console.log('Registration notification stored for admin');
        } catch (error) {
            console.error('Error storing registration notification:', error);
        }
    }

    function showSuccessModal() {
        successModal.classList.remove('hidden');
    }

    successModalCloseBtn.addEventListener('click', () => {
        successModal.classList.add('hidden');
        window.location.href = '../organizer-login/organizer-login.html';
    });

    // Utility functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        successMessage.classList.add('hidden');
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    }

    function hideMessages() {
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        hideUsernameError();
    }
});