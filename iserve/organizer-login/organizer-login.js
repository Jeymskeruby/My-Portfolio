// organizer-login.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded');
        showError('Firebase not loaded. Please refresh the page.');
        return;
    }

    // Initialize Firebase if not already done
    let auth, db;
    try {
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Firebase initialization failed. Please check your configuration.');
        return;
    }
    
    // Form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Custom username/password authentication
        loginWithUsernamePassword(username, password);
    });

    // Modal close button
    document.getElementById('modalCloseBtn').addEventListener('click', function() {
        document.getElementById('centeredModalOverlay').classList.add('hidden');
    });

    // Add event listener for resubmit button
    document.getElementById('modalResubmitBtn').addEventListener('click', function() {
        document.getElementById('centeredModalOverlay').classList.add('hidden');
        // Redirect to signup page
        window.location.href = '../organizer-signup/organizer-signup.html';
    });

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Hide success message if visible
        document.getElementById('successMessage').classList.add('hidden');
    }

    function showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
        
        // Hide error message if visible
        document.getElementById('errorMessage').classList.add('hidden');
    }

    function showModal(title, message, showResubmitButton = false) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').innerHTML = message; // Changed to innerHTML for formatted messages
        document.getElementById('centeredModalOverlay').classList.remove('hidden');
        
        // Handle resubmit button visibility
        const resubmitBtn = document.getElementById('modalResubmitBtn');
        if (showResubmitButton) {
            resubmitBtn.classList.remove('hidden');
        } else {
            resubmitBtn.classList.add('hidden');
        }
    }

    // Add this function to check organizer status
    async function checkOrganizerStatus(organizerData, organizerId) {
        try {
            // Check if organizer is banned
            if (organizerData.status === 'banned') {
                return {
                    allowed: false,
                    reason: 'banned',
                    message: 'Your organizer account has been permanently banned.',
                    details: {
                        reason: organizerData.banReason ? getReasonText(organizerData.banReason) : 'Not specified',
                        details: organizerData.banDetails || 'No additional details provided',
                        bannedAt: organizerData.bannedAt ? new Date(organizerData.bannedAt.toDate()).toLocaleDateString() : 'Unknown',
                        adminId: organizerData.bannedBy
                    }
                };
            }

            // Check if organizer is suspended
            if (organizerData.status === 'suspended') {
                const now = new Date();
                const suspensionEnd = organizerData.suspensionEndDate ? new Date(organizerData.suspensionEndDate.toDate()) : null;
                
                // Check if suspension period has ended
                if (suspensionEnd && suspensionEnd > now) {
                    return {
                        allowed: false,
                        reason: 'suspended',
                        message: 'Your organizer account has been temporarily suspended.',
                        details: {
                            reason: organizerData.suspensionReason ? getReasonText(organizerData.suspensionReason) : 'Not specified',
                            details: organizerData.suspensionDetails || 'No additional details provided',
                            suspendedUntil: suspensionEnd.toLocaleDateString(),
                            daysRemaining: Math.ceil((suspensionEnd - now) / (1000 * 60 * 60 * 24)),
                            suspendedAt: organizerData.suspendedAt ? new Date(organizerData.suspendedAt.toDate()).toLocaleDateString() : 'Unknown',
                            adminId: organizerData.suspendedBy
                        }
                    };
                } else {
                    // Suspension period has ended, auto-reactivate account
                    await db.collection('organizers').doc(organizerId).update({
                        status: 'approved',
                        suspensionEndDate: null,
                        suspensionReason: null,
                        suspensionDetails: null,
                        reactivatedAt: new Date()
                    });
                    return { allowed: true };
                }
            }

            // Organizer is active or approved
            return { allowed: true };
            
        } catch (error) {
            console.error('Error checking organizer status:', error);
            return { allowed: false, reason: 'error', message: 'Error checking account status' };
        }
    }

    // Helper function to get reason text
    function getReasonText(reasonCode) {
        const reasons = {
            'violation_terms': 'Violation of Terms of Service',
            'inappropriate_behavior': 'Inappropriate Behavior',
            'spam_activity': 'Spam or Suspicious Activity',
            'fake_organization': 'Fake Organization',
            'harassment': 'Harassment or Abuse',
            'fraudulent_activity': 'Fraudulent Activity',
            'poor_event_management': 'Poor Event Management',
            'other': 'Other'
        };
        return reasons[reasonCode] || 'Unknown Reason';
    }

    // Function to show modal for banned/suspended organizers
    function showAccountStatusModal(statusCheck, organizerData) {
        let title, message, details;
        
        switch (statusCheck.reason) {
            case 'banned':
                title = 'Organizer Account Banned';
                message = 'Your organizer account has been permanently banned from iServe.';
                details = `
                    <div class="text-left space-y-3 text-sm">
                        <p><strong>Organization:</strong> ${organizerData.organizationName || 'Unknown'}</p>
                        <p><strong>Reason:</strong> ${statusCheck.details.reason}</p>
                        <p><strong>Details:</strong> ${statusCheck.details.details}</p>
                        <p><strong>Banned on:</strong> ${statusCheck.details.bannedAt}</p>
                        <p class="text-red-600 font-medium">This action is permanent and cannot be reversed.</p>
                        <p>If you believe this is a mistake, please contact our support team.</p>
                    </div>
                `;
                break;
                
            case 'suspended':
                title = 'Organizer Account Suspended';
                message = 'Your organizer account has been temporarily suspended.';
                details = `
                    <div class="text-left space-y-3 text-sm">
                        <p><strong>Organization:</strong> ${organizerData.organizationName || 'Unknown'}</p>
                        <p><strong>Reason:</strong> ${statusCheck.details.reason}</p>
                        <p><strong>Details:</strong> ${statusCheck.details.details}</p>
                        <p><strong>Suspended until:</strong> ${statusCheck.details.suspendedUntil}</p>
                        <p><strong>Time remaining:</strong> ${statusCheck.details.daysRemaining} day${statusCheck.details.daysRemaining !== 1 ? 's' : ''}</p>
                        <p class="text-orange-600 font-medium">Your account will be automatically reinstated after this period.</p>
                        <p>For immediate assistance, contact our support team.</p>
                    </div>
                `;
                break;
                
            default:
                title = 'Login Failed';
                message = statusCheck.message || 'Unable to login at this time.';
                details = 'Please try again later or contact support.';
        }
        
        showModal(title, details, false);
    }

    async function loginWithUsernamePassword(username, password) {
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            // Show loading state
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
            
            console.log('Attempting login with username:', username);
            
            // Step 1: Find organizer by username to get their email
            const organizersSnapshot = await db.collection('organizers')
                .where('username', '==', username)
                .limit(1)
                .get();
            
            if (organizersSnapshot.empty) {
                throw new Error('No organizer account found with this username.');
            }
            
            const organizerDoc = organizersSnapshot.docs[0];
            const organizerData = organizerDoc.data();
            const organizerId = organizerDoc.id;
            
            console.log('Organizer found:', organizerData.organizationName);
            console.log('Organizer email:', organizerData.officialEmail);
            console.log('Organizer status:', organizerData.status);
            
            if (!organizerData.officialEmail) {
                throw new Error('Organizer account missing email address.');
            }
            
            // Step 2: Check organizer status BEFORE authentication
            const statusCheck = await checkOrganizerStatus(organizerData, organizerId);
            if (!statusCheck.allowed) {
                // Show ban/suspension modal and stop login process
                showAccountStatusModal(statusCheck, organizerData);

                // Update login attempts
                await updateLoginAttempts(organizerId, organizerData);

                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            // checkOrganizerStatus may have just auto-reactivated an expired
            // suspension (writes status:'approved' in the DB). Sync the local
            // copy so the status switch below doesn't act on the stale value
            // and bounce the organizer on this first attempt.
            if (statusCheck.reactivated || organizerData.status === 'suspended') {
                organizerData.status = 'approved';
            }

            // Step 3: Use Firebase Authentication with the email
            console.log('Attempting Firebase Auth login with email:', organizerData.officialEmail);
            const userCredential = await auth.signInWithEmailAndPassword(organizerData.officialEmail, password);
            const user = userCredential.user;
            
            console.log('Firebase Auth successful, user UID:', user.uid);
            
            // Step 4: Handle organizer account status (for non-banned/suspended cases)
            await handleOrganizerStatus(organizerData, organizerId);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Show appropriate error message
            let errorMessage = 'Login failed. ';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage += 'No account found with this username.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage += 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += 'Invalid email address associated with this account.';
            } else {
                errorMessage += error.message || 'Please check your credentials and try again.';
            }
            
            showError(errorMessage);
        }
    }

    async function handleOrganizerStatus(organizerData, organizerId) {
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        console.log('Handling organizer status:', organizerData.status);
        
        switch (organizerData.status) {
            case 'approved':
                // Account is approved - allow login
                await handleApprovedAccount(organizerData, organizerId);
                break;
                
            case 'pending':
                // Account is pending approval
                await handlePendingAccount(organizerData, organizerId);
                break;
                
            case 'rejected':
                // Account was rejected
                await handleRejectedAccount(organizerData, organizerId);
                break;
                
            case 'suspended':
                // Account is suspended (this case should be handled by checkOrganizerStatus, but kept as fallback)
                await handleSuspendedAccount(organizerData, organizerId);
                break;
                
            default:
                // Unknown status
                await handleUnknownStatus(organizerData, organizerId);
                break;
        }
        
        // Reset button state for non-approved statuses
        if (organizerData.status !== 'approved') {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            // We signed into Firebase Auth before this status check. For a
            // pending/rejected/unknown account there's no dashboard access, so
            // don't leave an authenticated session hanging around (the shared
            // header treats it as "logged in").
            try { await auth.signOut(); } catch (e) { /* no-op for the demo */ }
        }
    }

    async function handleApprovedAccount(organizerData, organizerId) {
        console.log('Processing approved account');
        
        // Login successful for approved account
        showSuccess('Login successful! Redirecting to organizer dashboard...');
        
        // Store user data in localStorage
        localStorage.setItem('organizerUser', JSON.stringify({
            uid: organizerId,
            email: organizerData.officialEmail,
            organizationName: organizerData.organizationName,
            contactPerson: organizerData.contactPerson,
            status: organizerData.status,
            username: organizerData.username,
            lastLogin: new Date().toISOString()
        }));
        
        // Update last login timestamp
        try {
            await db.collection('organizers').doc(organizerId).update({
                lastLogin: new Date(),
                updatedAt: new Date(),
                loginAttempts: 0 // Reset login attempts on successful login
            });
        } catch (updateError) {
            console.error('Error updating last login:', updateError);
            // Continue with login even if update fails
        }
            
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = '../organizer-dashboard/organizer-dashboard.html';
        }, 1500);
    }

    async function handlePendingAccount(organizerData, organizerId) {
        console.log('Processing pending account');
        
        // Update login attempts
        await updateLoginAttempts(organizerId, organizerData);
        
        // Show pending approval message
        showModal(
            'Account Pending Approval',
            `Your organizer account for "${organizerData.organizationName}" is currently under review by our administration team. ` +
            `We will notify you at ${organizerData.officialEmail} once your account has been approved. ` +
            `This process typically takes 1-3 business days. Thank you for your patience.`,
            false
        );
    }

    async function handleRejectedAccount(organizerData, organizerId) {
        console.log('Processing rejected account');
        
        // Update login attempts
        await updateLoginAttempts(organizerId, organizerData);
        
        // Get rejection reason if available
        const rejectionReason = organizerData.rejectionReason || 
            'Your application did not meet our current requirements.';
        
        // Show rejection message with option to resubmit
        showModal(
            'Account Application Rejected',
            `We're sorry, but your organizer application for "${organizerData.organizationName}" has been rejected.\n\n` +
            `Reason: ${rejectionReason}\n\n` +
            `If you believe this was a mistake or would like to submit a new application with additional information, ` +
            `you can create a new organizer account.`,
            true
        );
    }

    async function handleSuspendedAccount(organizerData, organizerId) {
        console.log('Processing suspended account');
        
        // Update login attempts
        await updateLoginAttempts(organizerId, organizerData);
        
        // Get suspension details if available
        const suspensionReason = organizerData.suspensionReason ? 
            getReasonText(organizerData.suspensionReason) : 'Your account has been suspended due to violations of our terms of service.';
        const suspensionEndDate = organizerData.suspensionEndDate ? 
            new Date(organizerData.suspensionEndDate.toDate()).toLocaleDateString() : 'indefinitely';
        
        // Show suspension message
        showModal(
            'Account Suspended',
            `Your organizer account for "${organizerData.organizationName}" has been suspended.\n\n` +
            `Reason: ${suspensionReason}\n` +
            `Suspension end date: ${suspensionEndDate}\n\n` +
            `If you believe this is a mistake, please contact our support team.`,
            false
        );
    }

    async function handleUnknownStatus(organizerData, organizerId) {
        console.log('Processing unknown status account');
        
        // Update login attempts
        await updateLoginAttempts(organizerId, organizerData);
        
        // Show unknown status message
        showModal(
            'Account Status Unknown',
            `Your organizer account has an unknown status. Please contact our support team for assistance.\n\n` +
            `Organization: ${organizerData.organizationName}\n` +
            `Status: ${organizerData.status}`,
            false
        );
    }

    async function updateLoginAttempts(organizerId, organizerData) {
        try {
            await db.collection('organizers').doc(organizerId).update({
                lastLoginAttempt: new Date(),
                loginAttempts: (organizerData.loginAttempts || 0) + 1
            });
        } catch (updateError) {
            console.error('Error updating login attempts:', updateError);
        }
    }
    
    // Initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Auto-focus on username field
    document.getElementById('username').focus();
});