document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');
    const verifyEmailModal = document.getElementById('verifyEmailModal');
    const detailsFormModal = document.getElementById('detailsFormModal');
    const checkVerificationBtn = document.getElementById('checkVerificationBtn');
    const detailsForm = document.getElementById('detailsForm');
    const skipDetailsBtn = document.getElementById('skipDetailsBtn');

    // Interest-Skills mapping
    const interestSkillsMap = {
        "Education & Training": [
            "Teaching & Tutoring",
            "Public Speaking",
            "Writing",
            "Editing"
        ],
        "Technology & Digital Services": [
            "Web Development",
            "Graphic Design",
            "Social Media Management",
            "IT Support & Troubleshooting",
            "Robotics",
            "Coding Instruction"
        ],
        "Community Service": [
            "Event Planning",
            "Fundraising",
            "Community Organizing",
            "Research & Documentation",
            "Translation",
            "Interpretation"
        ],
        "Disaster Relief & Humanitarian Aid": [
            "First Aid & Medical Assistance",
            "Disaster Response",
            "Relief Operations",
            "Construction & Carpentry",
            "Cooking & Food Preparation"
        ],
        "Health & Well-being": [
            "Counseling & Mental Health Support",
            "Sports & Fitness Coaching",
            "Nursing & Patient Care",
            "Public Health & Disease Prevention"
        ],
        "Environmental & Sustainability": [
            "Agriculture & Gardening",
            "Wildlife & Animal Care",
            "Recycling & Waste Management",
            "Disaster Resilience & Risk Reduction"
        ],
        "Legal & Advocacy": [
            "Legal Assistance & Paralegal Support",
            "Human Rights Advocacy",
            "Mediation & Conflict Resolution"
        ],
        "Arts, Culture & Media": [
            "Photography",
            "Videography",
            "Music & Performing Arts",
            "Illustration & Animation",
            "Content Creation",
            "Blogging"
        ],
        "STEM & Research": [
            "Data Analysis & Research",
            "Engineering & Technical Support"
        ],
        "Social & Humanitarian Work": [
            "Crisis Intervention & Peer Counseling",
            "Accessibility & Disability Rights"
        ]
    };

    // Create skills to interests mapping
    const skillInterestMap = {};
    Object.keys(interestSkillsMap).forEach(interest => {
        interestSkillsMap[interest].forEach(skill => {
            skillInterestMap[skill] = interest;
        });
    });

    // Get all unique skills and interests
    const allSkills = [...new Set(Object.values(interestSkillsMap).flat())];
    const allInterests = Object.keys(interestSkillsMap);

    // State management
    let selectedInterests = [];
    let selectedSkills = [];
    let interestAddedBySkill = new Set();

    // Initialize components
    initializeSkillsDropdown();
    initializeInterestsDropdown();

    // Password match validation
    confirmPasswordInput.addEventListener('input', function() {
        const passwordsMatch = passwordInput.value === confirmPasswordInput.value;
        passwordError.classList.toggle('hidden', passwordsMatch);
    });

    // Email validation to block admin emails
    function isAdminEmail(email) {
        return email.toLowerCase().includes('@admin.') || 
               email.toLowerCase().endsWith('@admin.com') ||
               email.toLowerCase().includes('@admin@');
    }

    // Signup form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorElement.classList.add('hidden');
        successElement.classList.add('hidden');
        
        // Check if passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            showModal({ title: "Error", message: "Passwords do not match." });
            return;
        }

        // Enforce a minimum password length client-side
        if (passwordInput.value.length < 6) {
            showModal({ title: "Weak Password", message: "Password should be at least 6 characters long." });
            return;
        }

        // Check if terms are accepted
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox.checked) {
            showModal({ title: "Terms Required", message: "Please accept the terms and conditions to continue." });
            return;
        }

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;

        // Check for admin email restriction
        if (isAdminEmail(email)) {
            showModal({ 
                title: "Registration Restricted", 
                message: "Email addresses with '@admin' are reserved for administrators. Please use a different email address." 
            });
            return;
        }

        // Lock the submit button so a fast double-click can't fire a second
        // createUserWithEmailAndPassword (which would throw email-already-in-use).
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-60', 'cursor-not-allowed'); }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Store user data in Firestore
            await db.collection('users').doc(user.uid).set({
                firstName,
                lastName,
                username,
                email,
                emailVerified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: false
            });

            await sendVolunteerSignupNotification(user.uid, firstName, lastName, email);

            // Send email verification
            await user.sendEmailVerification();

            successElement.textContent = 'Registration successful! Please check your email for verification.';
            successElement.classList.remove('hidden');
            verifyEmailModal.classList.remove('hidden');

        } catch (err) {
            console.error('Signup error:', err);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('opacity-60', 'cursor-not-allowed'); }

            if (err.code === 'auth/email-already-in-use') {
                showModal({ 
                    title: "Duplicate Email", 
                    message: "This email is already registered but not verified.<br>Please login and resend the verification email."
                });
            } else if (err.code === 'auth/invalid-email') {
                showModal({ 
                    title: "Invalid Email", 
                    message: "Please enter a valid email address." 
                });
            } else if (err.code === 'auth/weak-password') {
                showModal({ 
                    title: "Weak Password", 
                    message: "Password should be at least 6 characters long." 
                });
            } else {
                showModal({ 
                    title: "Registration Error", 
                    message: err.message || "An error occurred during registration. Please try again." 
                });
            }
        }
    });

    // Email verification handler
    checkVerificationBtn.addEventListener('click', async function() {
        try {
            // Reload user to get latest verification status
            await auth.currentUser.reload();
            const user = auth.currentUser;
            
            if (user && user.emailVerified) {
                // Update Firestore with verification status
                await db.collection('users').doc(user.uid).update({ 
                    emailVerified: true,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                verifyEmailModal.classList.add('hidden');
                detailsFormModal.classList.remove('hidden');
                feather.replace();
            } else {
                showModal({ 
                    title: "Email Not Verified", 
                    message: "Email not verified yet. Please check your inbox (and spam folder), then click 'Check Verification' again."
                });
            }
        } catch (err) {
            console.error('Verification check error:', err);
            showModal({ 
                title: "Verification Error", 
                message: err.message || "Error checking verification status. Please try again." 
            });
        }
    });

    // Skip Details button logic
    skipDetailsBtn.addEventListener('click', async function() {
        const user = auth.currentUser;
        if (!user) {
            showModal({
                title: "Session Expired",
                message: "Session expired. Please login again."
            });
            window.location.href = '../volunteer-login/volunteer-login.html';
            return;
        }

        if (this.disabled) return;
        this.disabled = true;

        try {
            // Ensure user is properly authenticated before redirect
            await user.reload();
            
            if (!user.emailVerified) {
                showModal({ 
                    title: "Email Not Verified", 
                    message: "Please verify your email before proceeding." 
                });
                return;
            }

            // Update user profile as incomplete
            await db.collection('users').doc(user.uid).set({
                profileComplete: false,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Clear form and redirect
            signupForm.reset();
            resetDetailsForm();
            
            const eventToJoin = localStorage.getItem("pendingJoinEventId");
            if (eventToJoin) {
                localStorage.removeItem("pendingJoinEventId"); // clear up front, even on failure
                try {
                    const already = await db.collection("eventParticipants")
                        .where('userId', '==', user.uid)
                        .where('eventId', '==', eventToJoin)
                        .get();
                    if (already.empty) {
                        await db.collection("eventParticipants").add({
                            userId: user.uid,
                            eventId: eventToJoin,
                            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            status: "approved"
                        });
                    }
                    localStorage.setItem('userId', user.uid);
                    localStorage.setItem('userEmail', user.email);
                    window.location.href = "../index.html?joined=1";
                    return;
                } catch (err) {
                    console.error("Auto-join after signup (skip) failed:", err);
                }
            }

            setTimeout(() => {
                // After successful verification and before redirect
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('userEmail', user.email);
                window.location.href = '../volunteer-dashboard/volunteer-dashboard.html';
            }, 500);

        } catch (err) {
            console.error('Skip details error:', err);
            this.disabled = false;
            showModal({
                title: "Error",
                message: err.message || "Error saving profile. Please try again."
            });
        }
    });

    // Details Form submission
    detailsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const user = auth.currentUser;
        
        if (!user) {
            showModal({ 
                title: "Session Expired", 
                message: "Session expired. Please login again." 
            });
            window.location.href = '../volunteer-login/volunteer-login.html';
            return;
        }

        try {
            // Ensure user is properly authenticated
            await user.reload();
            
            if (!user.emailVerified) {
                showModal({ 
                    title: "Email Not Verified", 
                    message: "Please verify your email before completing your profile." 
                });
                return;
            }

            // Get selected skills
            if (selectedSkills.length === 0) {
                showModal({
                    title: "Skills Required",
                    message: "Please select at least one skill to continue."
                });
                return;
            }

            // Lock submit so a double-click can't run this handler twice
            const submitBtn = this.querySelector('[type="submit"]');
            if (submitBtn) {
                if (submitBtn.disabled) return;
                submitBtn.disabled = true;
            }

            // Get additional details
            const phoneNumber = document.getElementById('phoneNumber').value;
            const birthdate = document.getElementById('birthdate').value;
            const gender = document.querySelector('input[name="gender"]:checked')?.value || '';
            const street = document.getElementById('street').value;
            const province = document.getElementById('province').value;
            const municipality = document.getElementById('municipality').value;
            const barangay = document.getElementById('barangay').value;
            const availabilityDay = document.getElementById('availabilityDay').value;
            const availabilityTime = document.getElementById('availabilityTime').value;

            // Save complete profile
            await db.collection('users').doc(user.uid).set({
                phoneNumber,
                birthdate,
                gender,
                address: {
                    street,
                    province,
                    municipality,
                    barangay
                },
                availability: {
                    day: availabilityDay,
                    time: availabilityTime
                },
                interests: selectedInterests,
                skills: selectedSkills,
                profileComplete: true,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Clear forms and redirect
            signupForm.reset();
            resetDetailsForm();
            
            const eventToJoin = localStorage.getItem("pendingJoinEventId");
            if (eventToJoin) {
                localStorage.removeItem("pendingJoinEventId"); // clear up front, even on failure
                try {
                    const already = await db.collection("eventParticipants")
                        .where('userId', '==', user.uid)
                        .where('eventId', '==', eventToJoin)
                        .get();
                    if (already.empty) {
                        await db.collection("eventParticipants").add({
                            userId: user.uid,
                            eventId: eventToJoin,
                            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            status: "approved"
                        });
                    }
                    localStorage.setItem('userId', user.uid);
                    localStorage.setItem('userEmail', user.email);
                    window.location.href = "../index.html?joined=1";
                    return;
                } catch (err) {
                    console.error("Auto-join after signup (details) failed:", err);
                }
            }

            setTimeout(() => {
                // After successful verification and before redirect
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('userEmail', user.email);
                window.location.href = '../volunteer-dashboard/volunteer-dashboard.html';
            }, 500);

        } catch (err) {
            console.error('Details form error:', err);
            const submitBtn = this.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = false;
            showModal({
                title: "Error",
                message: err.message || "Error saving profile details. Please try again."
            });
        }
    });

    async function sendVolunteerSignupNotification(userId, firstName, lastName, email) {
    try {
        const notificationData = {
            type: 'new_volunteer', // you can add this type in getNotificationTypeInfo if you want a custom icon
            title: 'New Volunteer Registration',
            message: `A new volunteer has registered: ${firstName} ${lastName}.`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),

            // extra info for admin
            volunteerId: userId,
            volunteerFirstName: firstName,
            volunteerLastName: lastName,
            volunteerEmail: email,
            status: 'active'
        };

        await db.collection('adminNotifications').add(notificationData);
        console.log('Volunteer signup notification stored for admin');
    } catch (error) {
        console.error('Error storing volunteer signup notification:', error);
    }
}


    // Initialize skills dropdown
    function initializeSkillsDropdown() {
        const skillsDropdown = document.getElementById('skillsDropdown');
        const skillsDropdownContent = document.getElementById('skillsDropdownContent');
        
        // Toggle dropdown
        skillsDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = !skillsDropdownContent.classList.contains('hidden');
            
            // Close all other dropdowns
            document.querySelectorAll('[id$="DropdownContent"]').forEach(dropdown => {
                if (dropdown !== skillsDropdownContent) {
                    dropdown.classList.add('hidden');
                }
            });
            document.querySelectorAll('[id$="Dropdown"]').forEach(dropdown => {
                if (dropdown !== skillsDropdown) {
                    dropdown.classList.remove('dropdown-open');
                }
            });
            
            if (!isOpen) {
                skillsDropdownContent.classList.remove('hidden');
                skillsDropdown.classList.add('dropdown-open');
            } else {
                skillsDropdownContent.classList.add('hidden');
                skillsDropdown.classList.remove('dropdown-open');
            }
        });
        
        // Prevent dropdown from closing when clicking inside the dropdown content
        skillsDropdownContent.addEventListener('click', function(e) {
            e.stopPropagation(); // This is the key line - prevents click from bubbling up
        });
        
        // Initialize skills checkboxes
        initializeSkillsCheckboxes();
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            // Check if click is outside both the dropdown trigger and the dropdown content
            if (!skillsDropdown.contains(e.target) && !skillsDropdownContent.contains(e.target)) {
                skillsDropdownContent.classList.add('hidden');
                skillsDropdown.classList.remove('dropdown-open');
            }
        });
    }

    // Initialize interests dropdown
    function initializeInterestsDropdown() {
        const interestsDropdown = document.getElementById('interestsDropdown');
        const interestsDropdownContent = document.getElementById('interestsDropdownContent');
        
        // Toggle dropdown
        interestsDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = !interestsDropdownContent.classList.contains('hidden');
            
            // Close all other dropdowns
            document.querySelectorAll('[id$="DropdownContent"]').forEach(dropdown => {
                if (dropdown !== interestsDropdownContent) {
                    dropdown.classList.add('hidden');
                }
            });
            document.querySelectorAll('[id$="Dropdown"]').forEach(dropdown => {
                if (dropdown !== interestsDropdown) {
                    dropdown.classList.remove('dropdown-open');
                }
            });
            
            if (!isOpen) {
                interestsDropdownContent.classList.remove('hidden');
                interestsDropdown.classList.add('dropdown-open');
            } else {
                interestsDropdownContent.classList.add('hidden');
                interestsDropdown.classList.remove('dropdown-open');
            }
        });
        
        // Prevent dropdown from closing when clicking inside the dropdown content
        interestsDropdownContent.addEventListener('click', function(e) {
            e.stopPropagation(); // This is the key line - prevents click from bubbling up
        });
        
        // Initialize interests checkboxes
        initializeInterestsCheckboxes();
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            // Check if click is outside both the dropdown trigger and the dropdown content
            if (!interestsDropdown.contains(e.target) && !interestsDropdownContent.contains(e.target)) {
                interestsDropdownContent.classList.add('hidden');
                interestsDropdown.classList.remove('dropdown-open');
            }
        });
    }

    // Initialize skills checkboxes in 3 columns
    function initializeSkillsCheckboxes() {
        const container = document.getElementById('skillsCheckboxContainer');
        container.innerHTML = '';
        
        allSkills.forEach(skill => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'flex items-center';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = skill;
            checkbox.id = `skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            checkbox.className = 'mr-2';
            checkbox.checked = selectedSkills.includes(skill);
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation(); // Add the event parameter here
                if (this.checked) {
                    addSkill(skill);
                } else {
                    removeSkill(skill);
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = skill;
            label.className = 'text-sm cursor-pointer truncate';
            
            skillDiv.appendChild(checkbox);
            skillDiv.appendChild(label);
            container.appendChild(skillDiv);
        });
    }

    // Initialize interests checkboxes in 3 columns
    function initializeInterestsCheckboxes() {
        const container = document.getElementById('interestsCheckboxContainer');
        container.innerHTML = '';
        
        allInterests.forEach(interest => {
            const interestDiv = document.createElement('div');
            interestDiv.className = 'flex items-center';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = interest;
            checkbox.id = `interest-${interest.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            checkbox.className = 'mr-2';
            checkbox.checked = selectedInterests.includes(interest);
            checkbox.addEventListener('change', function(e) {
                e.stopPropagation(); // Add the event parameter here
                if (this.checked) {
                    addInterestManually(interest);
                } else {
                    removeInterest(interest);
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = interest;
            label.className = 'text-sm cursor-pointer truncate';
            
            interestDiv.appendChild(checkbox);
            interestDiv.appendChild(label);
            container.appendChild(interestDiv);
        });
    }

    // Add interest manually (from checkbox) - adds ALL skills from that interest
    function addInterestManually(interest) {
        if (!selectedInterests.includes(interest)) {
            selectedInterests.push(interest);
            updateSelectedInterestsChips();
            updateInterestsCheckbox(interest, true);
            
            // Add ALL skills for this interest when added manually
            if (interestSkillsMap[interest]) {
                interestSkillsMap[interest].forEach(skill => {
                    if (!selectedSkills.includes(skill)) {
                        addSkill(skill, true); // true = skip interest update
                    }
                });
            }
        }
    }

    // Add interest via skill selection - only adds the interest, NOT all skills
    function addInterestViaSkill(interest) {
        if (!selectedInterests.includes(interest)) {
            selectedInterests.push(interest);
            interestAddedBySkill.add(interest); // Mark as added via skill
            updateSelectedInterestsChips();
            updateInterestsCheckbox(interest, true);
            // DO NOT add all skills from this interest
        }
    }

    // Remove interest from selected interests
    function removeInterest(interest) {
        selectedInterests = selectedInterests.filter(i => i !== interest);
        interestAddedBySkill.delete(interest); // Remove from tracking
        updateSelectedInterestsChips();
        updateInterestsCheckbox(interest, false);
        
        // Remove skills that were only available through this interest
        if (interestSkillsMap[interest]) {
            interestSkillsMap[interest].forEach(skill => {
                // Check if this skill belongs to any other selected interest
                const skillHasOtherInterest = selectedInterests.some(int => 
                    interestSkillsMap[int] && interestSkillsMap[int].includes(skill)
                );
                
                if (!skillHasOtherInterest) {
                    removeSkill(skill, true); // true = skip interest update
                }
            });
        }
    }

    // Add skill to selected skills
    function addSkill(skill, skipInterestUpdate = false) {
        if (!selectedSkills.includes(skill)) {
            selectedSkills.push(skill);
            updateSelectedSkillsChips();
            updateSkillCheckbox(skill, true);
            
            // Add corresponding interest if not already added (via skill method)
            if (!skipInterestUpdate && skillInterestMap[skill] && !selectedInterests.includes(skillInterestMap[skill])) {
                addInterestViaSkill(skillInterestMap[skill]);
            }
        }
    }

    // Remove skill from selected skills
    function removeSkill(skill, skipInterestUpdate = false) {
        selectedSkills = selectedSkills.filter(s => s !== skill);
        updateSelectedSkillsChips();
        updateSkillCheckbox(skill, false);
        
        // Remove interest if no more skills from that interest are selected
        // Only remove if the interest was added via skill selection
        if (!skipInterestUpdate && skillInterestMap[skill]) {
            const interest = skillInterestMap[skill];
            const hasOtherSkillsFromInterest = selectedSkills.some(s => 
                skillInterestMap[s] === interest
            );
            
            if (!hasOtherSkillsFromInterest && interestAddedBySkill.has(interest)) {
                removeInterest(interest);
            }
        }
    }

    // Update skill checkbox state
    function updateSkillCheckbox(skill, isChecked) {
        const checkbox = document.getElementById(`skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
        if (checkbox) {
            checkbox.checked = isChecked;
        }
    }

    // Update interests checkbox state
    function updateInterestsCheckbox(interest, isChecked) {
        const checkbox = document.getElementById(`interest-${interest.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
        if (checkbox) {
            checkbox.checked = isChecked;
        }
    }

    // Update selected interests chips display
    function updateSelectedInterestsChips() {
        const container = document.getElementById('selectedInterests');
        const placeholder = document.getElementById('interestsPlaceholder');
        container.innerHTML = '';
        
        if (selectedInterests.length > 0) {
            placeholder.classList.add('hidden');
        } else {
            placeholder.classList.remove('hidden');
        }
        
        selectedInterests.forEach(interest => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.innerHTML = `
                ${interest}
                <button type="button" onclick="removeInterest('${interest}')">
                    <i data-feather="x" class="w-3 h-3"></i>
                </button>
            `;
            container.appendChild(chip);
        });
        
        feather.replace();
    }

    // Update selected skills chips display
    function updateSelectedSkillsChips() {
        const container = document.getElementById('selectedSkills');
        const placeholder = document.getElementById('skillsPlaceholder');
        container.innerHTML = '';
        
        if (selectedSkills.length > 0) {
            placeholder.classList.add('hidden');
        } else {
            placeholder.classList.remove('hidden');
        }
        
        selectedSkills.forEach(skill => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.innerHTML = `
                ${skill}
                <button type="button" onclick="removeSkill('${skill}')">
                    <i data-feather="x" class="w-3 h-3"></i>
                </button>
            `;
            container.appendChild(chip);
        });
        
        feather.replace();
    }

    // Reset details form
    function resetDetailsForm() {
        detailsForm.reset();
        selectedInterests = [];
        selectedSkills = [];
        interestAddedBySkill.clear();
        updateSelectedInterestsChips();
        updateSelectedSkillsChips();
        initializeSkillsCheckboxes();
        initializeInterestsCheckboxes();
    }

    // Make functions available globally for onclick handlers
    window.removeInterest = removeInterest;
    window.removeSkill = removeSkill;

    // Add real-time auth state monitoring
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        if (user) {
            console.log('User UID:', user.uid);
            console.log('Email verified:', user.emailVerified);
        }
    });
});