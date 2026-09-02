class ProfileManager {
    constructor() {
        this.currentOrganizer = null;
        this.originalData = null;
    }

    init(currentOrganizer) {
        this.currentOrganizer = currentOrganizer;
        this.setupEventListeners();
        this.loadProfile();
    }

    setupEventListeners() {
        const profileForm = document.getElementById('profileForm');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this.resetProfileForm());
        }
    }

    async loadProfile() {
        await this.loadOrganizerData();
        this.updateProfileStatus();
        this.loadChangeHistory();
    }

    async loadOrganizerData() {
        try {
            const doc = await firebase.firestore().collection('organizers').doc(this.currentOrganizer.uid).get();
            if (doc.exists) {
                const organizerData = doc.data();
                console.log('Loaded organizer data:', organizerData);
                
                this.originalData = { ...organizerData };
                this.updateProfileForm(organizerData);
                this.updateUI(organizerData);
            }
        } catch (error) {
            console.error('Error loading organizer data:', error);
            this.showToast('Error loading profile data', 'error');
        }
    }

    updateProfileForm(organizerData) {
        // Use the exact field names from your Firestore data
        this.setInputValue('orgNameInput', organizerData.organizationName);
        this.setSelectValue('orgType', organizerData.organizationType);
        this.setInputValue('orgRegNumber', organizerData.registrationNumber);
        this.setInputValue('orgWebsite', organizerData.website);
        this.setInputValue('contactPerson', organizerData.contactPerson);
        this.setInputValue('contactPosition', organizerData.position); // Note: this is 'position' not 'contactPosition'
        this.setInputValue('orgEmailInput', organizerData.officialEmail); // Note: this is 'officialEmail' not 'email'
        this.setInputValue('orgPhone', organizerData.contactNumber); // Note: this is 'contactNumber' not 'phone'
        this.setInputValue('orgUsername', organizerData.username);
        
        console.log('Form populated with:', {
            organizationType: organizerData.organizationType,
            position: organizerData.position,
            officialEmail: organizerData.officialEmail,
            contactNumber: organizerData.contactNumber
        });
    }

    setInputValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) element.value = value || '';
    }

    setSelectValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) element.value = value || '';
    }

    updateUI(organizerData) {
        // Update header info with correct field names
        const orgNameEl = document.getElementById('orgName');
        const orgEmailEl = document.getElementById('orgEmail');
        const orgInitialsEl = document.getElementById('orgInitials');
        const orgStatusEl = document.getElementById('orgStatus');
        
        if (orgNameEl) orgNameEl.textContent = organizerData.organizationName || 'Organization';
        if (orgEmailEl) orgEmailEl.textContent = organizerData.officialEmail || organizerData.authEmail || 'No email';
        
        // Set organization initials
        const orgName = organizerData.organizationName || 'Organization';
        const initials = orgName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
        if (orgInitialsEl) orgInitialsEl.textContent = initials;

        // Update status with appropriate styling
        const status = organizerData.status || 'active';
        if (orgStatusEl) {
            const statusBadge = orgStatusEl.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
                statusBadge.className = `px-2 py-1 rounded-full text-xs ${this.getStatusBadgeClass(status)}`;
            }
        }
        
        // Show suspension banner if suspended
        const suspendedBanner = document.getElementById('suspendedBanner');
        if (suspendedBanner) {
            if (status === 'suspended') {
                suspendedBanner.classList.remove('hidden');
            } else {
                suspendedBanner.classList.add('hidden');
            }
        }
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'approved': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'rejected': 'bg-red-100 text-red-800',
            'cancelled': 'bg-red-100 text-red-800',
            'active': 'bg-green-100 text-green-800',
            'suspended': 'bg-red-100 text-red-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    updateProfileStatus() {
        const statusElement = document.getElementById('profileStatus');
        const lastUpdatedElement = document.getElementById('lastUpdated');
        const pendingChangesAlert = document.getElementById('pendingChangesAlert');

        if (this.originalData) {
            if (statusElement) statusElement.textContent = this.originalData.status || 'active';
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = this.originalData.updatedAt ? 
                    this.formatDate(this.originalData.updatedAt.toDate()) : 'Never';
            }
            
            if (pendingChangesAlert) {
                if (this.originalData.pendingUpdates) {
                    pendingChangesAlert.classList.remove('hidden');
                } else {
                    pendingChangesAlert.classList.add('hidden');
                }
            }
        }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    loadChangeHistory() {
        const changeHistory = document.getElementById('changeHistory');
        if (changeHistory) {
            changeHistory.innerHTML = `
                <div class="text-sm text-gray-500 text-center py-4">
                    <i data-feather="clock" class="w-8 h-8 mx-auto mb-2 text-gray-400"></i>
                    <p>No recent changes</p>
                </div>
            `;
            if (typeof feather !== 'undefined') feather.replace();
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const username = document.getElementById('orgUsername')?.value;
        const password = document.getElementById('orgPassword')?.value;

        if (!username) {
            this.showToast('Username is required', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
        }

        // Use the correct field names that match your Firestore structure
        const updates = {
            organizationName: document.getElementById('orgNameInput')?.value || '',
            organizationType: document.getElementById('orgType')?.value || '',
            registrationNumber: document.getElementById('orgRegNumber')?.value || '',
            website: document.getElementById('orgWebsite')?.value || '',
            contactPerson: document.getElementById('contactPerson')?.value || '',
            position: document.getElementById('contactPosition')?.value || '', // Maps to 'position' in Firestore
            officialEmail: document.getElementById('orgEmailInput')?.value || '', // Maps to 'officialEmail' in Firestore
            contactNumber: document.getElementById('orgPhone')?.value || '', // Maps to 'contactNumber' in Firestore
            username: username,
            pendingUpdates: true,
            updatedAt: new Date()
        };

        // Only change the password when the organizer actually typed a new one
        if (password) {
            updates.password = password;
        }
        
        console.log('Submitting profile updates:', updates);
        
        try {
            await firebase.firestore().collection('organizers').doc(this.currentOrganizer.uid).update(updates);
            this.showToast('Profile updates submitted for admin approval', 'success');
            
            // Update current organizer data in localStorage
            const updatedOrganizer = { ...this.currentOrganizer, ...updates };
            localStorage.setItem('organizerUser', JSON.stringify(updatedOrganizer));
            
            this.currentOrganizer = updatedOrganizer;
            
            // Update UI
            this.updateUI(updatedOrganizer);
            this.updateProfileStatus();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Error updating profile', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    resetProfileForm() {
        if (this.originalData) {
            this.updateProfileForm(this.originalData);
        }
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}