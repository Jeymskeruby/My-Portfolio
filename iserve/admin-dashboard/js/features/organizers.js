class AdminOrganizersManager {
    constructor() {
        this.organizers = [];
        this.currentAdmin = null;
        this.currentOrganizerId = null;
    }

    init(currentAdmin) {
        this.currentAdmin = currentAdmin;
        this.setupEventListeners();
        this.setupRealTimeListeners();
        this.setupBanModalListeners();
    }

    setupEventListeners() {
        // Search and filter
        const searchInput = document.getElementById('organizerSearch');
        const filterSelect = document.getElementById('organizerFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', AdminUtils.debounce(() => this.filterOrganizers(), 300));
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterOrganizers());
        }
    }

    setupBanModalListeners() {
        const form = document.getElementById('banOrganizerForm');
        const actionTypeSelect = document.getElementById('banOrganizerActionType');
        const durationSelect = document.getElementById('organizerSuspensionDuration');

        // Handle form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBanAction();
            });
        }

        // Show/hide duration fields based on action type
        if (actionTypeSelect) {
            actionTypeSelect.addEventListener('change', (e) => {
                this.toggleDurationFields(e.target.value);
            });
        }

        // Show/hide custom duration field
        if (durationSelect) {
            durationSelect.addEventListener('change', (e) => {
                this.toggleCustomDurationField(e.target.value);
            });
        }
    }

    toggleDurationFields(actionType) {
        const durationGroup = document.getElementById('organizerSuspensionDurationGroup');
        const customDurationGroup = document.getElementById('organizerCustomDurationGroup');
        const modalTitle = document.getElementById('banOrganizerModalTitle');
        const confirmBtn = document.getElementById('confirmOrganizerBanBtn');

        if (actionType === 'suspend') {
            durationGroup.classList.remove('hidden');
            modalTitle.textContent = 'Suspend Organizer';
            confirmBtn.textContent = 'Confirm Suspension';
            confirmBtn.className = confirmBtn.className.replace('btn-danger', 'btn-warning');
            confirmBtn.classList.add('btn-warning');
        } else if (actionType === 'ban') {
            durationGroup.classList.add('hidden');
            customDurationGroup.classList.add('hidden');
            modalTitle.textContent = 'Ban Organizer';
            confirmBtn.textContent = 'Confirm Ban';
            confirmBtn.className = confirmBtn.className.replace('btn-warning', 'btn-danger');
            confirmBtn.classList.add('btn-danger');
        } else {
            durationGroup.classList.add('hidden');
            customDurationGroup.classList.add('hidden');
        }
    }

    toggleCustomDurationField(durationValue) {
        const customDurationGroup = document.getElementById('organizerCustomDurationGroup');
        if (durationValue === 'custom') {
            customDurationGroup.classList.remove('hidden');
        } else {
            customDurationGroup.classList.add('hidden');
        }
    }

    setupRealTimeListeners() {
        // Real-time listener for organizers
        db.collection('organizers').onSnapshot((snapshot) => {
            this.organizers = [];
            snapshot.forEach(doc => {
                this.organizers.push({ id: doc.id, ...doc.data() });
            });
            this.loadOrganizers();
        }, (error) => {
            console.error('Error listening to organizers:', error);
        });
    }

    loadOrganizers() {
        const organizersList = document.getElementById('organizersList');
        
        if (this.organizers.length === 0) {
            organizersList.innerHTML = this.getEmptyStateHTML('briefcase', 'No organizers found');
        } else {
            organizersList.innerHTML = this.organizers.map(organizer => 
                this.createOrganizerCard(organizer)
            ).join('');
        }
        feather.replace();
    }

    filterOrganizers() {
        const searchTerm = document.getElementById('organizerSearch').value.toLowerCase();
        const filterValue = document.getElementById('organizerFilter').value;
        
        let filteredOrganizers = this.organizers;
        
        // Apply status filter
        if (filterValue !== 'all') {
            filteredOrganizers = filteredOrganizers.filter(organizer => 
                organizer.status === filterValue
            );
        }
        
        // Apply search filter
        if (searchTerm) {
            filteredOrganizers = filteredOrganizers.filter(organizer => {
                const orgName = organizer.organizationName ? organizer.organizationName.toLowerCase() : '';
                const contactPerson = organizer.contactPerson ? organizer.contactPerson.toLowerCase() : '';
                const email = organizer.officialEmail ? organizer.officialEmail.toLowerCase() : '';
                
                return orgName.includes(searchTerm) || 
                       contactPerson.includes(searchTerm) || 
                       email.includes(searchTerm);
            });
        }
        
        const organizersList = document.getElementById('organizersList');
        if (filteredOrganizers.length === 0) {
            organizersList.innerHTML = this.getEmptyStateHTML('briefcase', 'No organizers match your criteria');
        } else {
            organizersList.innerHTML = filteredOrganizers.map(organizer => 
                this.createOrganizerCard(organizer)
            ).join('');
        }
        feather.replace();
    }

    createOrganizerCard(organizer) {
        const orgName = organizer.organizationName || 'Unknown Organization';
        const contactPerson = organizer.contactPerson || 'Unknown';
        const email = organizer.officialEmail || 'No email';
        const regDate = AdminUtils.formatDate(organizer.createdAt);
        const statusBadge = AdminUtils.getStatusBadge(organizer.status || 'pending');

        // Check if organizer is currently suspended or banned
        const isSuspended = organizer.status === 'suspended';
        const isBanned = organizer.status === 'banned';
        const isApproved = organizer.status === 'approved';

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i data-feather="briefcase" class="w-6 h-6 text-green-600"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 text-lg">${orgName}</h4>
                                <p class="text-sm text-gray-600">${email}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span class="font-medium">Contact:</span> ${contactPerson}
                            </div>
                            <div>
                                <span class="font-medium">Type:</span> ${organizer.organizationType || 'N/A'}
                            </div>
                            <div>
                                <span class="font-medium">Registered:</span> ${regDate}
                            </div>
                            <div>
                                <span class="font-medium">Status:</span> ${statusBadge}
                            </div>
                        </div>
                        
                        <div class="text-sm text-gray-600">
                            <span class="font-medium">Registration #:</span> ${organizer.registrationNumber || 'Not provided'}
                        </div>

                        ${isSuspended && organizer.suspensionEndDate ? `
                            <div class="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                <span class="font-medium">Suspended until:</span> 
                                ${AdminUtils.formatDate(organizer.suspensionEndDate)}
                                ${organizer.suspensionReason ? `<br><span class="font-medium">Reason:</span> ${this.getReasonText(organizer.suspensionReason)}` : ''}
                            </div>
                        ` : ''}

                        ${isBanned ? `
                            <div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <span class="font-medium">Banned permanently</span>
                                ${organizer.banReason ? `<br><span class="font-medium">Reason:</span> ${this.getReasonText(organizer.banReason)}` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="adminOrganizersManager.viewOrganizerDetails('${organizer.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        ${organizer.status === 'pending' ? `
                            <button onclick="adminOrganizersManager.approveOrganizer('${organizer.id}')" 
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Approve
                            </button>
                            <button onclick="adminOrganizersManager.rejectOrganizer('${organizer.id}')" 
                                    class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Reject
                            </button>
                        ` : ''}
                        ${isApproved ? `
                            <button onclick="adminOrganizersManager.openBanModal('${organizer.id}', 'suspend')" 
                                    class="bg-warning hover:bg-yellow-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Suspend
                            </button>
                            <button onclick="adminOrganizersManager.openBanModal('${organizer.id}', 'ban')" 
                                    class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Ban
                            </button>
                        ` : ''}
                        ${isSuspended ? `
                            <button onclick="adminOrganizersManager.activateOrganizer('${organizer.id}')" 
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Activate
                            </button>
                        ` : ''}
                        ${isBanned ? `
                            <button onclick="adminOrganizersManager.activateOrganizer('${organizer.id}')" 
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Unban
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    openBanModal(organizerId, actionType = 'suspend') {
        this.currentOrganizerId = organizerId;
        const form = document.getElementById('banOrganizerForm');
        
        // Reset form
        if (form) {
            form.reset();
        }
        
        // Set action type
        document.getElementById('banOrganizerActionType').value = actionType;
        document.getElementById('banOrganizerId').value = organizerId;
        
        // Initialize duration fields
        this.toggleDurationFields(actionType);
        this.toggleCustomDurationField('1');
        
        // Open modal
        AdminUtils.openModal('banOrganizerModal');
    }

    async handleBanAction() {
        const organizerId = this.currentOrganizerId;
        const actionType = document.getElementById('banOrganizerActionType').value;
        const reason = document.getElementById('banOrganizerReason').value;
        const details = document.getElementById('banOrganizerDetails').value;
        
        if (!actionType || !reason || !details) {
            AdminUtils.showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            const organizerDoc = await db.collection('organizers').doc(organizerId).get();
            if (!organizerDoc.exists) {
                AdminUtils.showToast('Organizer not found', 'error');
                return;
            }

            const organizerData = organizerDoc.data();
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
                const durationSelect = document.getElementById('organizerSuspensionDuration').value;
                let durationDays = parseInt(durationSelect);
                
                if (durationSelect === 'custom') {
                    durationDays = parseInt(document.getElementById('organizerCustomDuration').value) || 1;
                }

                const suspensionEndDate = new Date();
                suspensionEndDate.setDate(suspensionEndDate.getDate() + durationDays);
                updateData.suspensionEndDate = suspensionEndDate;
            }

            // Update organizer status
            await db.collection('organizers').doc(organizerId).update(updateData);

            // Create admin notification
            await db.collection('adminNotifications').add({
                type: `organizer_${actionType}ed`,
                title: `Organizer ${actionType === 'ban' ? 'Banned' : 'Suspended'}`,
                message: `Organizer ${organizerData.organizationName} has been ${actionType === 'ban' ? 'banned' : 'suspended'}`,
                organizerId: organizerId,
                adminId: this.currentAdmin.uid,
                read: false,
                createdAt: new Date()
            });

            AdminUtils.showToast(`Organizer ${actionType === 'ban' ? 'banned' : 'suspended'} successfully`, 'success');
            AdminUtils.closeModal('banOrganizerModal');

        } catch (error) {
            console.error(`Error ${actionType}ing organizer:`, error);
            AdminUtils.showToast(`Error ${actionType}ing organizer`, 'error');
        }
    }

    async viewOrganizerDetails(organizerId) {
        try {
            const organizerDoc = await db.collection('organizers').doc(organizerId).get();
            if (!organizerDoc.exists) {
                AdminUtils.showToast('Organizer not found', 'error');
                return;
            }

            const organizerData = organizerDoc.data();
            const orgName = organizerData.organizationName || 'Unknown Organization';
            
            // Get organizer's events
            const eventsSnapshot = await db.collection('events')
                .where('organizerId', '==', organizerId)
                .get();
            
            const events = [];
            eventsSnapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });

            const modalContent = `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Organization Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Organization Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Name:</span> ${orgName}</p>
                                    <p><span class="font-medium">Type:</span> ${organizerData.organizationType || 'N/A'}</p>
                                    <p><span class="font-medium">Registration #:</span> ${organizerData.registrationNumber || 'Not provided'}</p>
                                    <p><span class="font-medium">Website:</span> ${organizerData.website || 'Not provided'}</p>
                                    <p><span class="font-medium">Status:</span> ${AdminUtils.getStatusBadge(organizerData.status || 'pending')}</p>
                                    <p><span class="font-medium">Registered:</span> ${AdminUtils.formatDate(organizerData.createdAt)}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Contact Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Contact Person:</span> ${organizerData.contactPerson || 'N/A'}</p>
                                    <p><span class="font-medium">Position:</span> ${organizerData.position || 'N/A'}</p>
                                    <p><span class="font-medium">Email:</span> ${organizerData.officialEmail || 'N/A'}</p>
                                    <p><span class="font-medium">Phone:</span> ${organizerData.contactNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Statistics</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Total Events:</span> ${events.length}</p>
                                    <p><span class="font-medium">Approved Events:</span> ${events.filter(e => e.status === 'approved').length}</p>
                                    <p><span class="font-medium">Pending Events:</span> ${events.filter(e => e.status === 'pending').length}</p>
                                    <p><span class="font-medium">Active Events:</span> ${events.filter(e => e.status === 'active').length}</p>
                                </div>
                            </div>

                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Account Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Username:</span> ${organizerData.username || 'N/A'}</p>
                                    <p><span class="font-medium">Auth Email:</span> ${organizerData.authEmail || organizerData.officialEmail || 'N/A'}</p>
                                    ${organizerData.pendingUpdates ? 
                                        '<p class="text-warning font-medium">⚠️ Has pending profile updates</p>' : 
                                        '<p class="text-success">✓ Profile up to date</p>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Events -->
                    ${events.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Recent Events (${events.length})</h4>
                        <div class="mt-2 space-y-3 text-sm">
                            ${events.slice(0, 5).map(event => `
                                <div class="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                                    <p class="font-medium text-blue-800">${event.name || 'Unknown Event'}</p>
                                    <p class="text-blue-600">Status: ${event.status || 'unknown'}</p>
                                    <p class="text-blue-600">Date: ${AdminUtils.formatDate(event.startTime)}</p>
                                    <p class="text-blue-600">Volunteers: ${event.currentVolunteers || 0}/${event.maxVolunteers || 0}</p>
                                </div>
                            `).join('')}
                            ${events.length > 5 ? 
                                `<p class="text-sm text-gray-500 text-center mt-2">+${events.length - 5} more events</p>` : 
                                ''
                            }
                        </div>
                    </div>
                    ` : `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Events</h4>
                        <div class="mt-2 text-sm text-gray-500">
                            <p>No events created yet.</p>
                        </div>
                    </div>
                    `}

                    <!-- Action Buttons -->
                    <div class="flex gap-2 pt-4 border-t">
                        ${organizerData.status === 'pending' ? `
                            <button onclick="adminOrganizersManager.approveOrganizer('${organizerId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Approve Organizer
                            </button>
                            <button onclick="adminOrganizersManager.rejectOrganizer('${organizerId}')" 
                                    class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Reject Organizer
                            </button>
                        ` : ''}
                        ${organizerData.status === 'approved' ? `
                            <button onclick="adminOrganizersManager.openBanModal('${organizerId}', 'suspend')" 
                                    class="flex-1 bg-warning hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Suspend Organizer
                            </button>
                            <button onclick="adminOrganizersManager.openBanModal('${organizerId}', 'ban')" 
                                    class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Ban Organizer
                            </button>
                        ` : ''}
                        ${organizerData.status === 'suspended' ? `
                            <button onclick="adminOrganizersManager.activateOrganizer('${organizerId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Activate Organizer
                            </button>
                        ` : ''}
                        ${organizerData.status === 'banned' ? `
                            <button onclick="adminOrganizersManager.activateOrganizer('${organizerId}')" 
                                    class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                                Unban Organizer
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            document.getElementById('userModalTitle').textContent = `Organizer: ${orgName}`;
            document.getElementById('userModalContent').innerHTML = modalContent;
            AdminUtils.openModal('userDetailsModal');

        } catch (error) {
            console.error('Error loading organizer details:', error);
            AdminUtils.showToast('Error loading organizer details', 'error');
        }
    }

    async approveOrganizer(organizerId) {
        AdminUtils.showConfirmation(
            'Approve Organizer',
            'Are you sure you want to approve this organizer? They will be able to create and manage events.',
            async () => {
                try {
                    await db.collection('organizers').doc(organizerId).update({
                        status: 'approved',
                        approvedAt: new Date(),
                        approvedBy: this.currentAdmin.uid
                    });

                    // Create notification
                    await db.collection('adminNotifications').add({
                        type: 'organizer_approved',
                        title: 'Organizer Approved',
                        message: `An organizer account has been approved by admin`,
                        read: false,
                        createdAt: new Date()
                    });

                    AdminUtils.showToast('Organizer approved successfully', 'success');
                    AdminUtils.closeModal('confirmationModal');
                    
                } catch (error) {
                    console.error('Error approving organizer:', error);
                    AdminUtils.showToast('Error approving organizer', 'error');
                }
            }
        );
    }

    async rejectOrganizer(organizerId) {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await db.collection('organizers').doc(organizerId).update({
                status: 'rejected',
                rejectionReason: reason,
                rejectedAt: new Date(),
                rejectedBy: this.currentAdmin.uid
            });

            // Create notification
            await db.collection('adminNotifications').add({
                type: 'organizer_rejected',
                title: 'Organizer Rejected',
                message: `An organizer account has been rejected by admin. Reason: ${reason}`,
                read: false,
                createdAt: new Date()
            });

            AdminUtils.showToast('Organizer rejected successfully', 'success');
            
        } catch (error) {
            console.error('Error rejecting organizer:', error);
            AdminUtils.showToast('Error rejecting organizer', 'error');
        }
    }

    async activateOrganizer(organizerId) {
        try {
            await db.collection('organizers').doc(organizerId).update({
                status: 'approved',
                activatedAt: new Date(),
                activatedBy: this.currentAdmin.uid,
                suspensionEndDate: null,
                suspensionReason: null,
                suspensionDetails: null,
                banReason: null,
                banDetails: null
            });

            AdminUtils.showToast('Organizer activated successfully', 'success');
            
        } catch (error) {
            console.error('Error activating organizer:', error);
            AdminUtils.showToast('Error activating organizer', 'error');
        }
    }

    getReasonText(reasonCode) {
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
window.adminOrganizersManager = new AdminOrganizersManager();