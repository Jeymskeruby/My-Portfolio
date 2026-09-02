// js/features/profile.js - Profile feature module

let profileUserData = null;
let selectedInterests = [];
let selectedSkills = [];
let interestAddedBySkill = new Set();
// initializeEventListeners() runs again on every Profile-tab visit; this flag
// keeps the one document-level listener from being added more than once.
let profileOutsideClickBound = false;

// Interest-Skills mapping (same as signup)
const interestSkillsMap = {
    "Education & Training": [
        "Teaching & Tutoring", "Public Speaking", "Writing", "Editing"
    ],
    "Technology & Digital Services": [
        "Web Development", "Graphic Design", "Social Media Management",
        "IT Support & Troubleshooting", "Robotics", "Coding Instruction"
    ],
    "Community Service": [
        "Event Planning", "Fundraising", "Community Organizing",
        "Research & Documentation", "Translation", "Interpretation"
    ],
    "Disaster Relief & Humanitarian Aid": [
        "First Aid & Medical Assistance", "Disaster Response", "Relief Operations",
        "Construction & Carpentry", "Cooking & Food Preparation"
    ],
    "Health & Well-being": [
        "Counseling & Mental Health Support", "Sports & Fitness Coaching",
        "Nursing & Patient Care", "Public Health & Disease Prevention"
    ],
    "Environmental & Sustainability": [
        "Agriculture & Gardening", "Wildlife & Animal Care",
        "Recycling & Waste Management", "Disaster Resilience & Risk Reduction"
    ],
    "Legal & Advocacy": [
        "Legal Assistance & Paralegal Support", "Human Rights Advocacy",
        "Mediation & Conflict Resolution"
    ],
    "Arts, Culture & Media": [
        "Photography", "Videography", "Music & Performing Arts",
        "Illustration & Animation", "Content Creation", "Blogging"
    ],
    "STEM & Research": [
        "Data Analysis & Research", "Engineering & Technical Support"
    ],
    "Social & Humanitarian Work": [
        "Crisis Intervention & Peer Counseling", "Accessibility & Disability Rights"
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

function initializeProfileFeatures(user, userData) {
    profileUserData = userData;
    displayUserProfile(userData);
    initializeEventListeners();
}

function displayUserProfile(data) {
    // Basic Information
    const displayName = data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}`
        : "Not set";
    
    const fullNameEl = document.getElementById('fullName');
    const emailEl = document.getElementById('email');
    const usernameEl = document.getElementById('username');
    const phoneNumberEl = document.getElementById('phoneNumber');
    const birthdateEl = document.getElementById('birthdate');
    const genderEl = document.getElementById('gender');
    
    if (fullNameEl) fullNameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = data.email || "Not set";
    if (usernameEl) usernameEl.textContent = data.username || "Not set";
    if (phoneNumberEl) phoneNumberEl.textContent = data.phoneNumber || "Not set";
    if (birthdateEl) birthdateEl.textContent = data.birthdate ? new Date(data.birthdate).toLocaleDateString() : "Not set";
    if (genderEl) genderEl.textContent = data.gender || "Not set";

    // Address Information
    const streetEl = document.getElementById('street');
    const barangayEl = document.getElementById('barangay');
    const municipalityEl = document.getElementById('municipality');
    const provinceEl = document.getElementById('province');
    
    if (data.address) {
        if (streetEl) streetEl.textContent = data.address.street || "Not set";
        if (barangayEl) barangayEl.textContent = data.address.barangay || "Not set";
        if (municipalityEl) municipalityEl.textContent = data.address.municipality || "Not set";
        if (provinceEl) provinceEl.textContent = data.address.province || "Not set";
    } else {
        if (streetEl) streetEl.textContent = "Not set";
        if (barangayEl) barangayEl.textContent = "Not set";
        if (municipalityEl) municipalityEl.textContent = "Not set";
        if (provinceEl) provinceEl.textContent = "Not set";
    }

    // Display skills as chips
    const skillsDisplay = document.getElementById('skillsDisplay');
    if (skillsDisplay) {
        skillsDisplay.innerHTML = '';
        if (data.skills && data.skills.length) {
            data.skills.forEach(skill => {
                const chip = document.createElement('span');
                chip.className = 'skill-chip';
                chip.textContent = skill;
                skillsDisplay.appendChild(chip);
            });
        } else {
            skillsDisplay.innerHTML = '<span class="text-gray-400">No skills added</span>';
        }
    }
    
    // Display interests as chips
    const interestsDisplay = document.getElementById('interestsDisplay');
    if (interestsDisplay) {
        interestsDisplay.innerHTML = '';
        if (data.interests && data.interests.length) {
            data.interests.forEach(interest => {
                const chip = document.createElement('span');
                chip.className = 'skill-chip';
                chip.textContent = interest;
                interestsDisplay.appendChild(chip);
            });
        } else {
            interestsDisplay.innerHTML = '<span class="text-gray-400">No interests added</span>';
        }
    }
    
    // Display availability — may be a plain string ("Weekends") or a
    // { day, time } object depending on how the profile was saved.
    const availabilityDisplay = document.getElementById('availabilityDisplay');
    if (availabilityDisplay) {
        availabilityDisplay.innerHTML = '';
        let availabilityText = '';
        if (typeof data.availability === 'string') {
            availabilityText = data.availability.trim();
        } else if (data.availability && data.availability.day && data.availability.time) {
            availabilityText = `${data.availability.day} • ${data.availability.time}`;
        }
        if (availabilityText) {
            const availabilityChip = document.createElement('span');
            availabilityChip.className = 'skill-chip bg-blue-100 text-blue-800';
            availabilityChip.textContent = availabilityText;
            availabilityDisplay.appendChild(availabilityChip);
        } else {
            availabilityDisplay.innerHTML = '<span class="text-gray-400">No availability set</span>';
        }
    }
}

function initializeEventListeners() {
    const editDetailsBtn = document.getElementById('editDetailsBtn');
    const detailsDisplay = document.getElementById('detailsDisplay');
    const detailsEdit = document.getElementById('detailsEdit');
    const editDetailsForm = document.getElementById('editDetailsForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');

    // Toggle Edit Mode. Assigned handlers (.onclick / .onsubmit) so this
    // function re-running on each Profile-tab visit doesn't stack listeners
    // (which caused duplicate saves and a dropdown that wouldn't open).
    if (editDetailsBtn) {
        editDetailsBtn.onclick = function() {
            if (detailsDisplay) detailsDisplay.classList.add('hidden');
            if (detailsEdit) detailsEdit.classList.remove('hidden');
            populateEditForm(profileUserData);
            selectedSkills = profileUserData.skills ? [...profileUserData.skills] : [];
            selectedInterests = profileUserData.interests ? [...profileUserData.interests] : [];
            interestAddedBySkill.clear();
            initializeDropdowns();
            updateSelectedSkillsChips();
            updateSelectedInterestsChips();
            feather.replace();
        };
    }

    // Cancel Edit
    if (cancelEditBtn) {
        cancelEditBtn.onclick = function() {
            if (detailsDisplay) detailsDisplay.classList.remove('hidden');
            if (detailsEdit) detailsEdit.classList.add('hidden');
            selectedSkills = profileUserData.skills ? [...profileUserData.skills] : [];
            selectedInterests = profileUserData.interests ? [...profileUserData.interests] : [];
            interestAddedBySkill.clear();
        };
    }

    // Handle Edit Save
    if (editDetailsForm) {
        editDetailsForm.onsubmit = async function(e) {
            e.preventDefault();
            
            try {
                const updateData = {
                    firstName: document.getElementById('editFirstName').value.trim(),
                    lastName: document.getElementById('editLastName').value.trim(),
                    username: document.getElementById('editUsername').value.trim(),
                    phoneNumber: document.getElementById('editPhoneNumber').value.trim(),
                    birthdate: document.getElementById('editBirthdate').value,
                    gender: document.querySelector('input[name="editGender"]:checked')?.value || '',
                    address: {
                        street: document.getElementById('editStreet').value.trim(),
                        barangay: document.getElementById('editBarangay').value.trim(),
                        municipality: document.getElementById('editMunicipality').value.trim(),
                        province: document.getElementById('editProvince').value.trim()
                    },
                    availability: {
                        day: document.getElementById('editAvailabilityDay').value,
                        time: document.getElementById('editAvailabilityTime').value
                    },
                    skills: selectedSkills,
                    interests: selectedInterests,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('users').doc(localStorage.getItem('userId')).set(updateData, { merge: true });

                // Update local userData and refresh display
                profileUserData = { ...profileUserData, ...updateData };
                displayUserProfile(profileUserData);

                if (detailsDisplay) detailsDisplay.classList.remove('hidden');
                if (detailsEdit) detailsEdit.classList.add('hidden');

                showModal({
                    title: "Success",
                    message: "Profile updated successfully."
                });

                feather.replace();
            } catch (err) {
                console.error('Update error:', err);
                showModal({
                    title: "Update Error",
                    message: err.message || "Could not update profile."
                });
            }
        };
    }

    // Change Password Logic
    if (changePasswordForm) {
        changePasswordForm.onsubmit = async function(e) {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                showModal({
                    title: "Password Error",
                    message: "New passwords do not match."
                });
                return;
            }

            if (newPassword.length < 6) {
                showModal({
                    title: "Password Error",
                    message: "New password must be at least 6 characters long."
                });
                return;
            }

            try {
                const user = auth.currentUser;
                if (!user) throw new Error("Session expired. Please log in again.");
                
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
                await user.reauthenticateWithCredential(credential);
                await user.updatePassword(newPassword);

                showModal({
                    title: "Success",
                    message: "Password changed successfully."
                });
                changePasswordForm.reset();
            } catch (err) {
                let errorMessage = "Failed to change password.";
                if (err.code === 'auth/wrong-password') {
                    errorMessage = "Current password is incorrect.";
                } else if (err.code === 'auth/weak-password') {
                    errorMessage = "New password is too weak.";
                } else {
                    errorMessage = err.message || errorMessage;
                }
                
                showModal({
                    title: "Password Change Error",
                    message: errorMessage
                });
            }
        };
    }

    // Close dropdowns when clicking outside — bound once for the page.
    if (!profileOutsideClickBound) {
        profileOutsideClickBound = true;
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                closeAllDropdowns();
            }
        });
    }
}

function populateEditForm(data) {
    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    const editUsername = document.getElementById('editUsername');
    const editPhoneNumber = document.getElementById('editPhoneNumber');
    const editBirthdate = document.getElementById('editBirthdate');
    const editStreet = document.getElementById('editStreet');
    const editBarangay = document.getElementById('editBarangay');
    const editMunicipality = document.getElementById('editMunicipality');
    const editProvince = document.getElementById('editProvince');
    const editAvailabilityDay = document.getElementById('editAvailabilityDay');
    const editAvailabilityTime = document.getElementById('editAvailabilityTime');

    if (editFirstName) editFirstName.value = data.firstName || '';
    if (editLastName) editLastName.value = data.lastName || '';
    if (editUsername) editUsername.value = data.username || '';
    if (editPhoneNumber) editPhoneNumber.value = data.phoneNumber || '';
    if (editBirthdate) editBirthdate.value = data.birthdate || '';
    
    // Set gender radio
    const editGenderRadios = document.querySelectorAll('input[name="editGender"]');
    editGenderRadios.forEach(radio => {
        if (radio.value === data.gender) {
            radio.checked = true;
        }
    });

    // Set address
    if (data.address) {
        if (editStreet) editStreet.value = data.address.street || '';
        if (editBarangay) editBarangay.value = data.address.barangay || '';
        if (editMunicipality) editMunicipality.value = data.address.municipality || '';
        if (editProvince) editProvince.value = data.address.province || '';
    }

    // Set availability
    if (data.availability) {
        if (editAvailabilityDay) editAvailabilityDay.value = data.availability.day || '';
        if (editAvailabilityTime) editAvailabilityTime.value = data.availability.time || '';
    }
}

// Initialize all dropdowns
function initializeDropdowns() {
    initializeSkillsDropdown();
    initializeInterestsDropdown();
    initializeSkillsCheckboxes();
    initializeInterestsCheckboxes();
}

// Toggle helper shared by both dropdowns. Assigned via .onclick (not
// addEventListener) so re-running initializeDropdowns() on every Profile-tab
// visit replaces the handler instead of stacking copies — stacked copies
// would flip the open/closed state twice per click and the panel would never
// open.
function makeDropdownToggle() {
    return function (e) {
        e.stopPropagation();
        e.preventDefault();
        const dropdown = this.closest('.dropdown');
        const isOpen = dropdown.classList.contains('dropdown-open');
        closeAllDropdowns();
        if (!isOpen) dropdown.classList.add('dropdown-open');
    };
}

function initializeSkillsDropdown() {
    const skillsDropdown = document.getElementById('skillsDropdown');
    const skillsDropdownContent = document.getElementById('skillsDropdownContent');
    if (!skillsDropdown || !skillsDropdownContent) {
        console.error('Skills dropdown elements not found');
        return;
    }
    skillsDropdown.onclick = makeDropdownToggle();
    skillsDropdownContent.onclick = function (e) { e.stopPropagation(); };
}

function initializeInterestsDropdown() {
    const interestsDropdown = document.getElementById('interestsDropdown');
    const interestsDropdownContent = document.getElementById('interestsDropdownContent');
    if (!interestsDropdown || !interestsDropdownContent) {
        console.error('Interests dropdown elements not found');
        return;
    }
    interestsDropdown.onclick = makeDropdownToggle();
    interestsDropdownContent.onclick = function (e) { e.stopPropagation(); };
}

// Update closeAllDropdowns function
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('dropdown-open');
    });
}

// Initialize skills checkboxes
function initializeSkillsCheckboxes() {
    const container = document.getElementById('skillsCheckboxContainer');
    if (!container) {
        console.error('Skills checkbox container not found');
        return;
    }
    
    container.innerHTML = '';

    // Show the standard skill vocabulary, plus any skill the volunteer already
    // has that isn't in that list (older/free-text values) so every current
    // skill shows up as a ticked box rather than silently missing.
    const extraSkills = selectedSkills.filter(s => !allSkills.includes(s));
    [...allSkills, ...extraSkills].forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = skill;
        checkbox.id = `skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        checkbox.className = 'mr-2';
        checkbox.checked = selectedSkills.includes(skill);
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
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

// Initialize interests checkboxes
function initializeInterestsCheckboxes() {
    const container = document.getElementById('interestsCheckboxContainer');
    if (!container) {
        console.error('Interests checkbox container not found');
        return;
    }
    
    container.innerHTML = '';
    
    allInterests.forEach(interest => {
        const interestDiv = document.createElement('div');
        interestDiv.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = interest;
        checkbox.id = `interest-${interest.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        checkbox.className = 'mr-2';
        checkbox.checked = selectedInterests.includes(interest);
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
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
                    addSkill(skill, true);
                }
            });
        }
    }
}

// Add interest via skill selection - only adds the interest, NOT all skills
function addInterestViaSkill(interest) {
    if (!selectedInterests.includes(interest)) {
        selectedInterests.push(interest);
        interestAddedBySkill.add(interest);
        updateSelectedInterestsChips();
        updateInterestsCheckbox(interest, true);
    }
}

// Remove interest from selected interests
function removeInterest(interest) {
    selectedInterests = selectedInterests.filter(i => i !== interest);
    interestAddedBySkill.delete(interest);
    updateSelectedInterestsChips();
    updateInterestsCheckbox(interest, false);
    
    // Remove skills that were only available through this interest
    if (interestSkillsMap[interest]) {
        interestSkillsMap[interest].forEach(skill => {
            const skillHasOtherInterest = selectedInterests.some(int => 
                interestSkillsMap[int] && interestSkillsMap[int].includes(skill)
            );
            
            if (!skillHasOtherInterest) {
                removeSkill(skill, true);
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
    if (!container) return;
    
    container.innerHTML = '';
    
    if (selectedInterests.length > 0) {
        if (placeholder) placeholder.classList.add('hidden');
    } else {
        if (placeholder) placeholder.classList.remove('hidden');
    }
    
    selectedInterests.forEach(interest => {
        const chip = document.createElement('div');
        chip.className = 'skill-chip';
        chip.innerHTML = `
            ${interest}
            <button type="button" class="skill-chip-remove" onclick="removeInterestFromProfile('${interest}')">
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
    if (!container) return;
    
    container.innerHTML = '';
    
    if (selectedSkills.length > 0) {
        if (placeholder) placeholder.classList.add('hidden');
    } else {
        if (placeholder) placeholder.classList.remove('hidden');
    }
    
    selectedSkills.forEach(skill => {
        const chip = document.createElement('div');
        chip.className = 'skill-chip';
        chip.innerHTML = `
            ${skill}
            <button type="button" class="skill-chip-remove" onclick="removeSkillFromProfile('${skill}')">
                <i data-feather="x" class="w-3 h-3"></i>
            </button>
        `;
        container.appendChild(chip);
    });
    
    feather.replace();
}

// Make functions available globally for onclick handlers
window.removeInterestFromProfile = removeInterest;
window.removeSkillFromProfile = removeSkill;

// Make other functions available globally
window.initializeProfileFeatures = initializeProfileFeatures;
window.displayUserProfile = displayUserProfile;
window.populateEditForm = populateEditForm;
window.initializeDropdowns = initializeDropdowns;