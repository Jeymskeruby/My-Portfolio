class AdminUsersManager {
    constructor() {
        this.volunteers = [];
        this.currentAdmin = null;
        this.currentVolunteerId = null;
    }

    init(currentAdmin) {
        this.currentAdmin = currentAdmin;
        this.setupEventListeners();
        this.setupRealTimeListeners();
        this.setupBanModalListeners();
    }

    setupEventListeners() {
        // Search and filter
        const searchInput = document.getElementById('volunteerSearch');
        const filterSelect = document.getElementById('volunteerFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', AdminUtils.debounce(() => this.filterVolunteers(), 300));
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterVolunteers());
        }
    }

    setupBanModalListeners() {
        const form = document.getElementById('banVolunteerForm');
        const actionTypeSelect = document.getElementById('banActionType');
        const durationSelect = document.getElementById('suspensionDuration');

        // Guarded (like organizers.js) — a missing element here would throw and
        // the initializeFeatures catch would bounce the admin to login.
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.handleBanAction();
            };
        }
        if (actionTypeSelect) {
            actionTypeSelect.onchange = (e) => this.toggleDurationFields(e.target.value);
        }
        if (durationSelect) {
            durationSelect.onchange = (e) => this.toggleCustomDurationField(e.target.value);
        }
    }

    toggleDurationFields(actionType) {
        const durationGroup = document.getElementById('suspensionDurationGroup');
        const customDurationGroup = document.getElementById('customDurationGroup');
        const modalTitle = document.getElementById('banModalTitle');
        const confirmBtn = document.getElementById('confirmBanBtn');

        if (actionType === 'suspend') {
            durationGroup.classList.remove('hidden');
            modalTitle.textContent = 'Suspend Volunteer';
            confirmBtn.textContent = 'Confirm Suspension';
            confirmBtn.className = confirmBtn.className.replace('btn-danger', 'btn-warning');
            confirmBtn.classList.add('btn-warning');
        } else if (actionType === 'ban') {
            durationGroup.classList.add('hidden');
            customDurationGroup.classList.add('hidden');
            modalTitle.textContent = 'Ban Volunteer';
            confirmBtn.textContent = 'Confirm Ban';
            confirmBtn.className = confirmBtn.className.replace('btn-warning', 'btn-danger');
            confirmBtn.classList.add('btn-danger');
        } else {
            durationGroup.classList.add('hidden');
            customDurationGroup.classList.add('hidden');
        }
    }

    toggleCustomDurationField(durationValue) {
        const customDurationGroup = document.getElementById('customDurationGroup');
        if (durationValue === 'custom') {
            customDurationGroup.classList.remove('hidden');
        } else {
            customDurationGroup.classList.add('hidden');
        }
    }

    setupRealTimeListeners() {
        // Real-time listener for volunteers
        db.collection('users').onSnapshot((snapshot) => {
            this.volunteers = [];
            snapshot.forEach(doc => {
                this.volunteers.push({ id: doc.id, ...doc.data() });
            });
            this.loadVolunteers();
        }, (error) => {
            console.error('Error listening to volunteers:', error);
        });
    }

    loadVolunteers() {
        const volunteersList = document.getElementById('volunteersList');
        
        if (this.volunteers.length === 0) {
            volunteersList.innerHTML = this.getEmptyStateHTML('users', 'No volunteers found');
        } else {
            volunteersList.innerHTML = this.volunteers.map(volunteer => 
                this.createVolunteerCard(volunteer)
            ).join('');
        }
        feather.replace();
    }

    filterVolunteers() {
        const searchTerm = document.getElementById('volunteerSearch').value.toLowerCase();
        const filterValue = document.getElementById('volunteerFilter').value;
        
        let filteredVolunteers = this.volunteers;
        
        // Apply status filter. Volunteers with no explicit status are treated
        // as 'active' (that's the default state until an admin suspends/bans).
        if (filterValue !== 'all') {
            filteredVolunteers = filteredVolunteers.filter(volunteer =>
                (volunteer.status || 'active') === filterValue
            );
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredVolunteers = filteredVolunteers.filter(volunteer => {
                const fullName = `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.toLowerCase();
                const email = volunteer.email ? volunteer.email.toLowerCase() : '';
                const username = volunteer.username ? volunteer.username.toLowerCase() : '';
                
                return fullName.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       username.includes(searchTerm);
            });
        }
        
        const volunteersList = document.getElementById('volunteersList');
        if (filteredVolunteers.length === 0) {
            volunteersList.innerHTML = this.getEmptyStateHTML('users', 'No volunteers match your criteria');
        } else {
            volunteersList.innerHTML = filteredVolunteers.map(volunteer => 
                this.createVolunteerCard(volunteer)
            ).join('');
        }
        feather.replace();
    }

    createVolunteerCard(volunteer) {
        const fullName = `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim() || 'Unknown User';
        const email = volunteer.email || 'No email';
        const joinDate = AdminUtils.formatDate(volunteer.createdAt);
        const statusBadge = AdminUtils.getStatusBadge(volunteer.status || 'active');
        const skillsCount = volunteer.skills ? volunteer.skills.length : 0;

        // Check if user is currently suspended or banned
        const isSuspended = volunteer.status === 'suspended';
        const isBanned = volunteer.status === 'banned';

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i data-feather="user" class="w-6 h-6 text-blue-600"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 text-lg">${fullName}</h4>
                                <p class="text-sm text-gray-600">${email}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span class="font-medium">Username:</span> ${volunteer.username || 'N/A'}
                            </div>
                            <div>
                                <span class="font-medium">Joined:</span> ${joinDate}
                            </div>
                            <div>
                                <span class="font-medium">Skills:</span> ${skillsCount}
                            </div>
                            <div>
                                <span class="font-medium">Status:</span> ${statusBadge}
                            </div>
                        </div>
                        
                        ${volunteer.skills && volunteer.skills.length > 0 ? `
                        <div class="mb-3">
                            <span class="font-medium text-sm">Top Skills:</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${volunteer.skills.slice(0, 3).map(skill => 
                                    `<span class="skill-chip">${skill}</span>`
                                ).join('')}
                                ${volunteer.skills.length > 3 ? 
                                    `<span class="text-xs text-gray-500">+${volunteer.skills.length - 3} more</span>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ` : ''}

                        ${isSuspended && volunteer.suspensionEndDate ? `
                            <div class="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                <span class="font-medium">Suspended until:</span> 
                                ${AdminUtils.formatDate(volunteer.suspensionEndDate)}
                                ${volunteer.suspensionReason ? `<br><span class="font-medium">Reason:</span> ${this.getReasonText(volunteer.suspensionReason)}` : ''}
                            </div>
                        ` : ''}

                        ${isBanned ? `
                            <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <span class="font-medium">Banned permanently</span>
                                ${volunteer.banReason ? `<br><span class="font-medium">Reason:</span> ${this.getReasonText(volunteer.banReason)}` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="adminUsersManager.viewVolunteerDetails('${volunteer.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        ${!isBanned && !isSuspended ? `
                            <button onclick="adminUsersManager.openBanModal('${volunteer.id}', 'suspend')" 
                                    class="bg-warning hover:bg-yellow-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Suspend
                            </button>
                            <button onclick="adminUsersManager.openBanModal('${volunteer.id}', 'ban')" 
                                    class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Ban
                            </button>
                        ` : ''}
                        ${isSuspended ? `
                            <button onclick="adminUsersManager.activateVolunteer('${volunteer.id}')" 
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Activate
                            </button>
                        ` : ''}
                        ${isBanned ? `
                            <button onclick="adminUsersManager.activateVolunteer('${volunteer.id}')" 
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Unban
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    openBanModal(userId, actionType = 'suspend') {
        this.currentVolunteerId = userId;
        const form = document.getElementById('banVolunteerForm');
        
        // Reset form
        form.reset();
        
        // Set action type
        document.getElementById('banActionType').value = actionType;
        document.getElementById('banVolunteerId').value = userId;
        
        // Initialize duration fields
        this.toggleDurationFields(actionType);
        this.toggleCustomDurationField('1'); // Default to non-custom
        
        // Open modal
        AdminUtils.openModal('banVolunteerModal');
    }

    async handleBanAction() {
        const userId = this.currentVolunteerId;
        const actionType = document.getElementById('banActionType').value;
        const reason = document.getElementById('banReason').value;
        const details = document.getElementById('banDetails').value;
        
        if (!actionType || !reason || !details) {
            AdminUtils.showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                AdminUtils.showToast('Volunteer not found', 'error');
                return;
            }

            const userData = userDoc.data();
            const updateData = {
                status: actionType === 'ban' ? 'banned' : 'suspended',
                [`${actionType === 'ban' ? 'banned' : 'suspended'}At`]: new Date(),
                [`${actionType === 'ban' ? 'banned' : 'suspended'}By`]: this.currentAdmin.uid,
                [`${actionType === 'ban' ? 'ban' : 'suspension'}Reason`]: reason,
                [`${actionType === 'ban' ? 'ban' : 'suspension'}Details`]: details,
                [`${actionType === 'ban' ? 'ban' : 'suspension'}AdminId`]: this.currentAdmin.uid
            };

            // Calculate suspension end date if suspending
            if (actionType === 'suspend') {
                const durationSelect = document.getElementById('suspensionDuration').value;
                let durationDays = parseInt(durationSelect);
                
                if (durationSelect === 'custom') {
                    durationDays = parseInt(document.getElementById('customDuration').value) || 1;
                }

                const suspensionEndDate = new Date();
                suspensionEndDate.setDate(suspensionEndDate.getDate() + durationDays);
                updateData.suspensionEndDate = suspensionEndDate;
            }

            // Update user status
            await db.collection('users').doc(userId).update(updateData);

            // Create admin notification
            await db.collection('adminNotifications').add({
                type: `user_${actionType}ed`,
                title: `Volunteer ${actionType === 'ban' ? 'Banned' : 'Suspended'}`,
                message: `Volunteer ${userData.firstName} ${userData.lastName} has been ${actionType === 'ban' ? 'banned' : 'suspended'}`,
                userId: userId,
                adminId: this.currentAdmin.uid,
                read: false,
                createdAt: new Date()
            });

            AdminUtils.showToast(`Volunteer ${actionType === 'ban' ? 'banned' : 'suspended'} successfully`, 'success');
            AdminUtils.closeModal('banVolunteerModal');

        } catch (error) {
            console.error(`Error ${actionType}ing volunteer:`, error);
            AdminUtils.showToast(`Error ${actionType}ing volunteer`, 'error');
        }
    }

    async activateVolunteer(userId) {
        try {
            await db.collection('users').doc(userId).update({
                status: 'active',
                activatedAt: new Date(),
                activatedBy: this.currentAdmin.uid,
                suspensionEndDate: null, // Clear suspension end date
                suspensionReason: null,
                suspensionDetails: null,
                banReason: null,
                banDetails: null
            });

            AdminUtils.showToast('Volunteer activated successfully', 'success');
            
        } catch (error) {
            console.error('Error activating volunteer:', error);
            AdminUtils.showToast('Error activating volunteer', 'error');
        }
    }

    getReasonText(reasonCode) {
        const reasons = {
            'violation_terms': 'Violation of Terms of Service',
            'inappropriate_behavior': 'Inappropriate Behavior',
            'spam_activity': 'Spam or Suspicious Activity',
            'fake_account': 'Fake Account',
            'harassment': 'Harassment or Abuse',
            'other': 'Other'
        };
        return reasons[reasonCode] || 'Unknown Reason';
    }

    async viewVolunteerDetails(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                AdminUtils.showToast('Volunteer not found', 'error');
                return;
            }

            const userData = userDoc.data();
            const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            
            // Get volunteer's event participations
            const participationsSnapshot = await db.collection('eventParticipants')
                .where('userId', '==', userId)
                .get();
            
            const participations = [];
            participationsSnapshot.forEach(doc => {
                participations.push(doc.data());
            });

            // Get join requests
            const requestsSnapshot = await db.collection('joinRequests')
                .where('userId', '==', userId)
                .get();
            
            const joinRequests = [];
            requestsSnapshot.forEach(doc => {
                joinRequests.push(doc.data());
            });

            const modalContent = `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Personal Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Personal Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Name:</span> ${fullName}</p>
                                    <p><span class="font-medium">Email:</span> ${userData.email || 'N/A'}</p>
                                    <p><span class="font-medium">Phone:</span> ${userData.phoneNumber || 'N/A'}</p>
                                    <p><span class="font-medium">Username:</span> ${userData.username || 'N/A'}</p>
                                    <p><span class="font-medium">Gender:</span> ${userData.gender || 'N/A'}</p>
                                    ${userData.birthdate ? `<p><span class="font-medium">Birthdate:</span> ${new Date(userData.birthdate).toLocaleDateString()}</p>` : ''}
                                    <p><span class="font-medium">Status:</span> ${AdminUtils.getStatusBadge(userData.status || 'active')}</p>
                                    <p><span class="font-medium">Joined:</span> ${AdminUtils.formatDate(userData.createdAt)}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Availability</h4>
                                <div class="mt-2 text-sm">
                                    ${userData.availability ? 
                                        `<p><span class="font-medium">Days:</span> ${userData.availability.day || 'Flexible'}</p>
                                        <p><span class="font-medium">Time:</span> ${userData.availability.time || 'Flexible'}</p>` :
                                        '<p class="text-gray-500">No availability specified</p>'
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Address</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    ${userData.address ? `
                                        <p><span class="font-medium">Street:</span> ${userData.address.street || 'N/A'}</p>
                                        <p><span class="font-medium">Barangay:</span> ${userData.address.barangay || 'N/A'}</p>
                                        <p><span class="font-medium">Municipality:</span> ${userData.address.municipality || 'N/A'}</p>
                                        <p><span class="font-medium">Province:</span> ${userData.address.province || 'N/A'}</p>
                                    ` : '<p class="text-gray-500">No address provided</p>'}
                                </div>
                            </div>

                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Statistics</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Events Joined:</span> ${participations.length}</p>
                                    <p><span class="font-medium">Pending Requests:</span> ${joinRequests.filter(req => req.status === 'pending').length}</p>
                                    <p><span class="font-medium">Skills:</span> ${userData.skills ? userData.skills.length : 0}</p>
                                    <p><span class="font-medium">Interests:</span> ${userData.interests ? userData.interests.length : 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Skills & Interests -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold text-gray-700 border-b pb-2">Skills (${userData.skills?.length || 0})</h4>
                            <div class="mt-2 flex flex-wrap gap-1">
                                ${userData.skills && userData.skills.length > 0 ? 
                                    userData.skills.map(skill => `<span class="skill-chip">${skill}</span>`).join('') :
                                    '<span class="text-gray-500 text-sm">No skills listed</span>'
                                }
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold text-gray-700 border-b pb-2">Interests (${userData.interests?.length || 0})</h4>
                            <div class="mt-2 flex flex-wrap gap-1">
                                ${userData.interests && userData.interests.length > 0 ? 
                                    userData.interests.map(interest => `<span class="skill-chip bg-purple-100 text-purple-800 border-purple-200">${interest}</span>`).join('') :
                                    '<span class="text-gray-500 text-sm">No interests listed</span>'
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Event Participations -->
                    ${participations.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Event Participations (${participations.length})</h4>
                        <div class="mt-2 space-y-3 text-sm">
                            ${participations.slice(0, 5).map(participation => `
                                <div class="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                                    <p class="font-medium text-green-800">${participation.eventName || 'Unknown Event'}</p>
                                    <p class="text-green-600">Status: ${participation.status || 'unknown'}</p>
                                    <p class="text-green-600">Joined: ${AdminUtils.formatDate(participation.joinedAt)}</p>
                                </div>
                            `).join('')}
                            ${participations.length > 5 ? 
                                `<p class="text-sm text-gray-500 text-center mt-2">+${participations.length - 5} more participations</p>` : 
                                ''
                            }
                        </div>
                    </div>
                    ` : `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Event History</h4>
                        <div class="mt-2 text-sm text-gray-500">
                            <p>No event participations found.</p>
                        </div>
                    </div>
                    `}

                    <!-- Action Buttons -->
                    <div class="flex gap-2 pt-4 border-t">
                        ${userData.status === 'active' ? `
                            <button onclick="adminUsersManager.suspendVolunteer('${userId}')" 
                                    class="flex-1 bg-warning hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Suspend Account
                            </button>
                            <button onclick="adminUsersManager.banVolunteer('${userId}')" 
                                    class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Ban Account
                            </button>
                        ` : ''}
                        ${userData.status === 'suspended' ? `
                            <button onclick="adminUsersManager.activateVolunteer('${userId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Activate Account
                            </button>
                        ` : ''}
                        ${userData.status === 'banned' ? `
                            <button onclick="adminUsersManager.activateVolunteer('${userId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Unban Account
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            document.getElementById('userModalTitle').textContent = `Volunteer: ${fullName}`;
            document.getElementById('userModalContent').innerHTML = modalContent;
            AdminUtils.openModal('userDetailsModal');

        } catch (error) {
            console.error('Error loading volunteer details:', error);
            AdminUtils.showToast('Error loading volunteer details', 'error');
        }
    }

    async suspendVolunteer(userId) {
        AdminUtils.showConfirmation(
            'Suspend Volunteer',
            'Are you sure you want to suspend this volunteer? They will not be able to access their account until activated.',
            async () => {
                try {
                    await db.collection('users').doc(userId).update({
                        status: 'suspended',
                        suspendedAt: new Date(),
                        suspendedBy: this.currentAdmin.uid
                    });

                    // Create notification
                    await db.collection('adminNotifications').add({
                        type: 'user_suspended',
                        title: 'Volunteer Suspended',
                        message: `A volunteer account has been suspended by admin`,
                        read: false,
                        createdAt: new Date()
                    });

                    AdminUtils.showToast('Volunteer suspended successfully', 'success');
                    AdminUtils.closeModal('confirmationModal');
                    
                } catch (error) {
                    console.error('Error suspending volunteer:', error);
                    AdminUtils.showToast('Error suspending volunteer', 'error');
                }
            }
        );
    }

    async banVolunteer(userId) {
        AdminUtils.showConfirmation(
            'Ban Volunteer',
            'Are you sure you want to ban this volunteer? This action is permanent and cannot be undone.',
            async () => {
                try {
                    await db.collection('users').doc(userId).update({
                        status: 'banned',
                        bannedAt: new Date(),
                        bannedBy: this.currentAdmin.uid
                    });

                    // Create notification
                    await db.collection('adminNotifications').add({
                        type: 'user_banned',
                        title: 'Volunteer Banned',
                        message: `A volunteer account has been permanently banned by admin`,
                        read: false,
                        createdAt: new Date()
                    });

                    AdminUtils.showToast('Volunteer banned successfully', 'success');
                    AdminUtils.closeModal('confirmationModal');
                    
                } catch (error) {
                    console.error('Error banning volunteer:', error);
                    AdminUtils.showToast('Error banning volunteer', 'error');
                }
            }
        );
    }

    async activateVolunteer(userId) {
        try {
            await db.collection('users').doc(userId).update({
                status: 'active',
                activatedAt: new Date(),
                activatedBy: this.currentAdmin.uid
            });

            AdminUtils.showToast('Volunteer activated successfully', 'success');
            
        } catch (error) {
            console.error('Error activating volunteer:', error);
            AdminUtils.showToast('Error activating volunteer', 'error');
        }
    }

    getEmptyStateHTML(icon, message) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i data-feather="${icon}" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Make globally accessible
window.adminUsersManager = new AdminUsersManager();