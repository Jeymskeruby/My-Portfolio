// Admin Join Requests management feature module
class AdminJoinRequestsManager {
    constructor() {
        this.joinRequests = [];
        this.events = [];
        this.currentAdmin = null;
        this.joinRequestsUnsubscribe = null;
    }

    init(currentAdmin) {
        console.log('📋 Initializing AdminJoinRequestsManager');
        this.currentAdmin = currentAdmin;
        this.setupEventListeners();
        this.setupRealTimeListeners();
        return Promise.resolve();
    }

    setupEventListeners() {
        console.log('🔗 Setting up join requests event listeners');
        
        // Add event listeners for join requests tab
        document.querySelectorAll('.participant-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('data-participant-tab');
                this.switchParticipantTab(tabName);
            });
        });
    }

    setupRealTimeListeners() {
        console.log('📡 Setting up join requests real-time listeners');
        // Listen for ALL pending join requests (across all events)
        this.setupJoinRequestsListener();
        
        // Load events for reference
        this.loadEvents();
    }

    setupJoinRequestsListener() {
        console.log('👂 Setting up join requests listener');
        
        // Remove previous listener if exists
        if (this.joinRequestsUnsubscribe) {
            console.log('🔄 Removing previous join requests listener');
            this.joinRequestsUnsubscribe();
        }
        
        // Set up listener for all pending join requests
        this.joinRequestsUnsubscribe = db.collection('joinRequests')
            .where('status', '==', 'pending')
            .onSnapshot(async (snapshot) => {
                console.log('📥 Join requests snapshot received:', snapshot.size, 'documents');
                this.joinRequests = [];
                
                // Get detailed information for each join request
                const requestPromises = snapshot.docs.map(async (doc) => {
                    const request = { id: doc.id, ...doc.data() };
                    
                    // Get user details
                    try {
                        const userDoc = await db.collection('users').doc(request.userId).get();
                        if (userDoc.exists) {
                            request.userDetails = userDoc.data();
                        }
                    } catch (error) {
                        console.error('Error loading user details:', error);
                    }
                    
                    // Get event details
                    try {
                        const eventDoc = await db.collection('events').doc(request.eventId).get();
                        if (eventDoc.exists) {
                            request.eventDetails = eventDoc.data();
                        }
                    } catch (error) {
                        console.error('Error loading event details:', error);
                    }
                    
                    return request;
                });
                
                this.joinRequests = await Promise.all(requestPromises);
                console.log(`✅ Loaded ${this.joinRequests.length} join requests`);
                this.renderJoinRequests();
            }, (error) => {
                console.error('❌ Error listening to join requests:', error);
                AdminUtils.showToast('Error loading join requests', 'error');
            });
    }

    async loadEvents() {
        try {
            const snapshot = await db.collection('events').get();
            this.events = [];
            snapshot.forEach(doc => {
                this.events.push({ id: doc.id, ...doc.data() });
            });
            console.log(`📊 Loaded ${this.events.length} events for reference`);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    switchParticipantTab(tabName) {
        console.log(`🔄 Switching to participant tab: ${tabName}`);
        
        // Hide all participant tab contents
        document.querySelectorAll('.participant-tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remove active class from all participant tab buttons
        document.querySelectorAll('.participant-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-gray-600');
        });
        
        // Show selected tab content
        const activeTab = document.getElementById(`${tabName}Content`);
        const activeBtn = document.querySelector(`[data-participant-tab="${tabName}"]`);
        
        if (activeTab) {
            activeTab.classList.remove('hidden');
            console.log(`👁️ Showing tab: ${activeTab.id}`);
        }
        
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary', 'text-primary');
            activeBtn.classList.remove('border-transparent', 'text-gray-600');
        }

        // Load appropriate data when switching tabs
        if (tabName === 'requests') {
            console.log('🎯 Rendering join requests');
            this.renderJoinRequests();
        }
        // Note: The participants tab is handled by AdminParticipantsManager
    }

    renderJoinRequests() {
        console.log('🎨 Rendering join requests');
        const joinRequestsList = document.getElementById('joinRequestsList');
        
        if (!joinRequestsList) {
            console.error('❌ joinRequestsList element not found');
            return;
        }
        
        if (this.joinRequests.length === 0) {
            joinRequestsList.innerHTML = this.getEmptyStateHTML('users', 'No pending join requests');
        } else {
            joinRequestsList.innerHTML = this.joinRequests.map(request => 
                this.createJoinRequestCard(request)
            ).join('');
        }
        
        feather.replace();
        console.log('✅ Join requests rendered');
    }

    createJoinRequestCard(request) {
        const userName = request.userDetails ? 
            `${request.userDetails.firstName || ''} ${request.userDetails.lastName || ''}`.trim() : 
            'Unknown User';
            
        const userEmail = request.userDetails?.email || 'N/A';
        const eventName = request.eventDetails?.name || 'Unknown Event';
        const organizerName = request.eventDetails?.organizerName || 'Unknown Organizer';
        const requestedDate = AdminUtils.formatDate(request.requestedAt);

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i data-feather="user-plus" class="w-6 h-6 text-purple-600"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 text-lg">${userName}</h4>
                                <p class="text-sm text-gray-600">wants to join <strong class="text-primary">${eventName}</strong></p>
                                <p class="text-xs text-gray-500">Organizer: ${organizerName}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span class="font-medium">Email:</span> ${userEmail}
                            </div>
                            <div>
                                <span class="font-medium">Requested:</span> ${requestedDate}
                            </div>
                            <div>
                                <span class="font-medium">Status:</span> 
                                <span class="status-badge status-pending">Pending</span>
                            </div>
                        </div>
                        
                        ${request.userDetails?.skills && request.userDetails.skills.length > 0 ? `
                        <div class="mb-3">
                            <span class="font-medium text-sm">Skills:</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${request.userDetails.skills.slice(0, 3).map(skill => 
                                    `<span class="skill-chip">${skill}</span>`
                                ).join('')}
                                ${request.userDetails.skills.length > 3 ? 
                                    `<span class="text-xs text-gray-500">+${request.userDetails.skills.length - 3} more</span>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="adminJoinRequestsManager.viewRequestDetails('${request.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        <button onclick="adminJoinRequestsManager.approveRequest('${request.id}', '${request.eventId}', '${request.userId}')"
                                class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            Approve
                        </button>
                        <button onclick="adminJoinRequestsManager.rejectRequest('${request.id}', '${request.eventId}', '${request.userId}')"
                                class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async viewRequestDetails(requestId) {
        try {
            const requestDoc = await db.collection('joinRequests').doc(requestId).get();
            if (!requestDoc.exists) {
                AdminUtils.showToast('Request not found', 'error');
                return;
            }

            const request = requestDoc.data();
            const userDoc = await db.collection('users').doc(request.userId).get();
            const eventDoc = await db.collection('events').doc(request.eventId).get();
            
            if (!userDoc.exists || !eventDoc.exists) {
                AdminUtils.showToast('User or event not found', 'error');
                return;
            }

            const userData = userDoc.data();
            const eventData = eventDoc.data();
            
            const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            const eventName = eventData.name || 'Unknown Event';
            const requestedDate = AdminUtils.formatDate(request.requestedAt);

            const modalContent = `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Request Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Volunteer Details</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Name:</span> ${userName}</p>
                                    <p><span class="font-medium">Email:</span> ${userData.email || 'N/A'}</p>
                                    <p><span class="font-medium">Phone:</span> ${userData.phoneNumber || 'N/A'}</p>
                                    <p><span class="font-medium">Requested:</span> ${requestedDate}</p>
                                    <p><span class="font-medium">Status:</span> <span class="status-badge status-pending">Pending</span></p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Event Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Event:</span> ${eventName}</p>
                                    <p><span class="font-medium">Organizer:</span> ${eventData.organizerName || 'Unknown'}</p>
                                    <p><span class="font-medium">Location:</span> ${eventData.location || 'Not specified'}</p>
                                    <p><span class="font-medium">Date:</span> ${AdminUtils.formatDate(eventData.startTime)}</p>
                                    <p><span class="font-medium">Volunteers:</span> ${eventData.currentVolunteers || 0}/${eventData.maxVolunteers || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Skills & Availability -->
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

                    <!-- Action Buttons -->
                    <div class="flex gap-2 pt-4 border-t">
                        <button onclick="adminJoinRequestsManager.approveRequest('${requestId}', '${request.eventId}', '${request.userId}')" 
                                class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Approve Request
                        </button>
                        <button onclick="adminJoinRequestsManager.rejectRequest('${requestId}', '${request.eventId}', '${request.userId}')" 
                                class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Reject Request
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('userModalTitle').textContent = `Join Request: ${userName}`;
            document.getElementById('userModalContent').innerHTML = modalContent;
            
            // Clear any existing action buttons
            const actionButtons = document.getElementById('userActionButtons');
            if (actionButtons) {
                actionButtons.innerHTML = '';
            }
            
            AdminUtils.openModal('userDetailsModal');

        } catch (error) {
            console.error('Error loading request details:', error);
            AdminUtils.showToast('Error loading request details', 'error');
        }
    }

    async approveRequest(requestId, eventId, userId) {
        if (!confirm('Are you sure you want to approve this join request?')) {
            return;
        }

        try {
            const batch = db.batch();
            
            // Get event name first
            const eventDoc = await db.collection('events').doc(eventId).get();
            const eventName = eventDoc.exists ? eventDoc.data().name : 'the event';
            
            // Update join request status
            const requestRef = db.collection('joinRequests').doc(requestId);
            batch.update(requestRef, { 
                status: 'approved',
                respondedAt: new Date(),
                approvedBy: this.currentAdmin.uid
            });
            
            // Add to eventParticipants
            const participantRef = db.collection('eventParticipants').doc();
            batch.set(participantRef, {
                eventId,
                userId,
                eventName,
                status: 'approved',
                joinedAt: new Date(),
                approvedBy: this.currentAdmin.uid,
                approvedAt: new Date()
            });
            
            // Update event volunteer count
            const eventRef = db.collection('events').doc(eventId);
            batch.update(eventRef, {
                currentVolunteers: firebase.firestore.FieldValue.increment(1)
            });
            
            // Send notification to volunteer
            const notificationRef = db.collection('volunteerNotifications').doc();
            batch.set(notificationRef, {
                userId,
                type: 'request_approved',
                title: 'Join Request Approved',
                message: `Your request to join "${eventName}" has been approved by an admin.`,
                read: false,
                createdAt: new Date()
            });
            
            await batch.commit();
            AdminUtils.showToast('Join request approved', 'success');
            
        } catch (error) {
            console.error('Error approving request:', error);
            AdminUtils.showToast('Error approving request', 'error');
        }
    }

    async rejectRequest(requestId, eventId, userId) {
        const reason = prompt('Please provide a reason for rejecting this request:');
        if (!reason || !reason.trim()) {
            AdminUtils.showToast('Rejection cancelled. Reason is required.', 'info');
            return;
        }

        try {
            const requestRef = db.collection('joinRequests').doc(requestId);
            const batch = db.batch();

            batch.update(requestRef, {
                status: 'rejected',
                rejectionReason: reason.trim(),
                respondedAt: new Date(),
                approvedBy: this.currentAdmin.uid
            });

            const notificationRef = db.collection('volunteerNotifications').doc();
            batch.set(notificationRef, {
                userId,
                type: 'request_rejected',
                title: 'Join Request Rejected',
                message: `Your join request was rejected. Reason: ${reason.trim()}`,
                read: false,
                createdAt: new Date()
            });

            await batch.commit();
            AdminUtils.showToast('Request rejected successfully', 'success');
            
        } catch (error) {
            console.error('Error rejecting request:', error);
            AdminUtils.showToast('Error rejecting request', 'error');
        }
    }

    getEventName(eventId) {
        const event = this.events.find(e => e.id === eventId);
        return event ? event.name : 'Unknown Event';
    }

    getEmptyStateHTML(icon, message) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i data-feather="${icon}" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Clean up listeners
    destroy() {
        if (this.joinRequestsUnsubscribe) {
            console.log('🧹 Cleaning up join requests listener');
            this.joinRequestsUnsubscribe();
        }
    }
}

// Make globally accessible
window.adminJoinRequestsManager = new AdminJoinRequestsManager();