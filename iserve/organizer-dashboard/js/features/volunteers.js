// Volunteers management feature module
class VolunteersManager {
    constructor() {
        this.joinRequests = [];
        this.participants = [];
        this.events = [];
        this.currentOrganizer = null;
        this.selectedRequests = new Set();
    }

    init(currentOrganizer) {
        this.currentOrganizer = currentOrganizer;
        this.setupEventListeners();
        this.setupRealTimeListeners();
    }

    setupEventListeners() {
        // Export button
        document.getElementById('exportVolunteersBtn').addEventListener('click', () => this.exportVolunteersData());

        // Bulk action buttons
        document.getElementById('selectAllRequests').addEventListener('click', () => this.toggleSelectAllRequests());
        document.getElementById('bulkApproveBtn').addEventListener('click', () => this.handleBulkApprove());
        document.getElementById('bulkRejectBtn').addEventListener('click', () => this.handleBulkReject());

        // Participants filter
        document.getElementById('eventParticipantsFilter').addEventListener('change', () => this.loadParticipants());

        // Volunteer tab buttons
        document.querySelectorAll('.volunteer-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-volunteer-tab');
                this.switchVolunteerTab(tabName);
            });
        });

        // Rejection form
        document.getElementById('rejectionForm').addEventListener('submit', (e) => this.handleRejection(e));

        // Removal form
        document.getElementById('removalForm').addEventListener('submit', (e) => this.handleRemoval(e));
    }

    setupRealTimeListeners() {
        const organizerId = this.currentOrganizer.uid;
        
        // Listen for join requests for this organizer's events
        db.collection('joinRequests')
            .where('organizerId', '==', organizerId)
            .where('status', '==', 'pending')
            .onSnapshot((snapshot) => {
                this.joinRequests = [];
                snapshot.forEach(doc => {
                    this.joinRequests.push({ id: doc.id, ...doc.data() });
                });
                this.loadJoinRequests();
            }, (error) => {
                console.error('Error listening to join requests:', error);
            });

        // Listen for events changes to update participants filter
        db.collection('events')
            .where('organizerId', '==', organizerId)
            .onSnapshot((snapshot) => {
                this.events = [];
                snapshot.forEach(doc => {
                    this.events.push({ id: doc.id, ...doc.data() });
                });
                this.loadEventsForParticipants();
            }, (error) => {
                console.error('Error listening to events:', error);
            });
    }

    switchVolunteerTab(tabName) {
        console.log(`🔄 Switching to volunteer tab: ${tabName}`);
        
        // Hide all volunteer tab contents
        document.querySelectorAll('.volunteer-tab-content').forEach(tab => {
            console.log(`👻 Hiding tab: ${tab.id}`);
            tab.classList.add('hidden');
        });
        
        // Remove active class from all volunteer tab buttons
        document.querySelectorAll('.volunteer-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-gray-600');
        });
        
        // CORRECTED: Map tab names to actual element IDs
        let activeTabId;
        if (tabName === 'requests') {
            activeTabId = 'joinRequestsContent'; // This matches your HTML id
        } else if (tabName === 'participants') {
            activeTabId = 'participantsContent'; // This matches your HTML id
        }
        
        const activeTab = document.getElementById(activeTabId);
        const activeBtn = document.querySelector(`[data-volunteer-tab="${tabName}"]`);
        
        if (activeTab) {
            console.log(`👁️ Showing tab: ${activeTab.id}`);
            activeTab.classList.remove('hidden');
        } else {
            console.error(`❌ Tab ${activeTabId} not found!`);
        }
        
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary', 'text-primary');
            activeBtn.classList.remove('border-transparent', 'text-gray-600');
        }
        
        // Load appropriate data when switching tabs
        if (tabName === 'requests') {
            console.log('🎯 Loading join requests for requests tab');
            // Clear any previous selections
            this.selectedRequests.clear();
            // Always reload when switching to this tab
            this.loadJoinRequests();
        } else if (tabName === 'participants') {
            console.log('🎯 Loading participants for participants tab');
            // Reset the filter and show empty state
            document.getElementById('eventParticipantsFilter').value = '';
            document.getElementById('participantsList').innerHTML = this.getEmptyStateHTML('users', 'Select an event to view participants');
        }
        
        console.log(`✅ Tab switch to ${tabName} completed`);
    }

    async loadJoinRequests() {
        const joinRequestsList = document.getElementById('joinRequestsList');
        
        if (this.joinRequests.length === 0) {
            joinRequestsList.innerHTML = this.getEmptyStateHTML('users', 'No pending join requests');
        } else {
            // Calculate skill matches for each request (don't overwrite this.joinRequests)
            const requestsForDisplay = await Promise.all(
                this.joinRequests.map(async (request) => {
                    const skillMatches = await this.calculateSkillMatches(request);
                    return { 
                        ...request, 
                        skillMatches,
                        // Keep a reference to the original ID for checkbox selection
                        id: request.id
                    };
                })
            );
            
            // Render with the enhanced data
            joinRequestsList.innerHTML = requestsForDisplay.map(request => this.createRequestCard(request)).join('');
        }
        feather.replace();
        this.toggleBulkActions();
    }

    async calculateSkillMatches(request) {
        try {
            // Get event data
            const eventDoc = await db.collection('events').doc(request.eventId).get();
            if (!eventDoc.exists) return null;
            
            const event = eventDoc.data();
            const requiredSkills = event.requiredSkills || [];
            
            // Get volunteer skills
            const userDoc = await db.collection('users').doc(request.userId).get();
            if (!userDoc.exists) return null;
            
            const userSkills = userDoc.data().skills || [];
            
            // Calculate matches
            const matchedSkills = userSkills.filter(skill => 
                requiredSkills.includes(skill)
            );
            
            const matchCount = matchedSkills.length;
            const totalRequired = requiredSkills.length;
            const matchPercentage = totalRequired > 0 ? (matchCount / totalRequired) * 100 : 0;
            
            return {
                matchCount,
                totalRequired,
                matchPercentage,
                matchedSkills
            };
        } catch (error) {
            console.error('Error calculating skill matches:', error);
            return null;
        }
    }

    createRequestCard(request) {
        const isChecked = this.selectedRequests.has(request.id);
        const volunteerName = `${request.userFirstName || ''} ${request.userLastName || ''}`.trim() || request.userName || 'Unknown Volunteer';
        const eventName = request.eventName || 'Unknown Event';
        
        let skillMatchHTML = '';
        if (request.skillMatches) {
            skillMatchHTML = `
                <div class="mb-3">
                    <span class="font-medium text-sm">Skill Match:</span>
                    <span class="ml-2 text-sm ${request.skillMatches.matchPercentage >= 50 ? 'text-green-600' : 'text-orange-600'}">
                        ${request.skillMatches.matchPercentage.toFixed(0)}% (${request.skillMatches.matchCount}/${request.skillMatches.totalRequired})
                    </span>
                    ${request.skillMatches.matchedSkills.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${request.skillMatches.matchedSkills.map(skill => 
                                `<span class="skill-chip">${skill}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <input type="checkbox" class="request-checkbox" value="${request.id}" 
                                   ${isChecked ? 'checked' : ''} onchange="window.volunteersManager.toggleRequestSelection('${request.id}')">
                            <div>
                                <h4 class="font-semibold text-gray-800 text-lg">${volunteerName}</h4>
                                <p class="text-sm text-gray-600">wants to join <strong class="text-primary">${eventName}</strong></p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span class="font-medium">Email:</span> ${request.userEmail || 'N/A'}
                            </div>
                            <div>
                                <span class="font-medium">Applied:</span> ${request.requestedAt?.toDate ? DashboardUtils.formatDate(request.requestedAt.toDate()) : 'Unknown date'}
                            </div>
                        </div>
                        
                        ${skillMatchHTML}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="window.volunteersManager.viewVolunteerDetails('${request.userId}', '${request.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        <button onclick="window.volunteersManager.approveRequest('${request.id}')" 
                                class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            Approve
                        </button>
                        <button onclick="window.volunteersManager.openRejectionModal('${request.id}')" 
                                class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async viewVolunteerDetails(userId, requestId = null) {
        try {
            // Get volunteer details
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                DashboardUtils.showToast('Volunteer not found', 'error');
                return;
            }

            const userData = userDoc.data();
            const volunteerName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            
            // Get volunteer's past event participations (approved events)
            const participationsSnapshot = await db.collection('eventParticipants')
                .where('userId', '==', userId)
                .where('status', '==', 'approved')
                .get();
            
            const pastEvents = [];
            participationsSnapshot.forEach(doc => {
                pastEvents.push(doc.data());
            });

            // Create enhanced modal content
            const modalContent = `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Personal Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Personal Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Name:</span> ${volunteerName}</p>
                                    <p><span class="font-medium">Email:</span> ${userData.email || 'N/A'}</p>
                                    <p><span class="font-medium">Phone:</span> ${userData.phoneNumber || 'N/A'}</p>
                                    <p><span class="font-medium">Username:</span> ${userData.username || 'N/A'}</p>
                                    <p><span class="font-medium">Gender:</span> ${userData.gender || 'N/A'}</p>
                                    ${userData.birthdate ? `<p><span class="font-medium">Birthdate:</span> ${new Date(userData.birthdate).toLocaleDateString()}</p>` : ''}
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

                    <!-- Past Event Participations -->
                    ${pastEvents.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Past Event Participations (${pastEvents.length})</h4>
                        <div class="mt-2 space-y-3 text-sm">
                            ${pastEvents.map(event => `
                                <div class="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                                    <p class="font-medium text-green-800">${event.eventName || 'Unknown Event'}</p>
                                    <p class="text-green-600">Joined on ${event.joinedAt?.toDate ? DashboardUtils.formatDate(event.joinedAt.toDate()) : 'Unknown date'}</p>
                                    ${event.approvedAt ? `<p class="text-green-600">Approved on ${event.approvedAt?.toDate ? DashboardUtils.formatDate(event.approvedAt.toDate()) : 'Unknown date'}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : `
                    <div>
                        <h4 class="font-semibold text-gray-700 border-b pb-2">Event History</h4>
                        <div class="mt-2 text-sm text-gray-500">
                            <p>No past event participations found.</p>
                        </div>
                    </div>
                    `}

                    ${requestId ? `
                    <div class="flex gap-2 pt-4 border-t">
                        <button onclick="window.volunteersManager.approveRequest('${requestId}')" 
                                class="flex-1 bg-success hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Approve Request
                        </button>
                        <button onclick="window.volunteersManager.openRejectionModal('${requestId}')" 
                                class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Reject Request
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;

            DashboardUtils.showCustomModal(`Volunteer Profile: ${volunteerName}`, modalContent);

        } catch (error) {
            console.error('Error loading volunteer details:', error);
            DashboardUtils.showToast('Error loading volunteer details', 'error');
        }
    }

    loadEventsForParticipants() {
        const filter = document.getElementById('eventParticipantsFilter');
        filter.innerHTML = '<option value="">Select Event</option>';
        
        this.events.forEach(event => {
            if (event.status === 'approved' || event.status === 'active') {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.name;
                filter.appendChild(option);
            }
        });
    }

    async loadParticipants() {
        const eventId = document.getElementById('eventParticipantsFilter').value;
        if (!eventId) {
            document.getElementById('participantsList').innerHTML = this.getEmptyStateHTML('users', 'Select an event to view participants');
            return;
        }
        
        try {
            // Query eventParticipants collection
            const snapshot = await db.collection('eventParticipants')
                .where('eventId', '==', eventId)
                .where('status', 'in', ['registered', 'active', 'approved'])
                .get();

            const participantsList = document.getElementById('participantsList');
            this.participants = [];
            
            // Get detailed information for each participant
            const participantPromises = snapshot.docs.map(async (doc) => {
                const participant = { id: doc.id, ...doc.data() };
                
                // Get user details
                try {
                    const userDoc = await db.collection('users').doc(participant.userId).get();
                    if (userDoc.exists) {
                        participant.userDetails = userDoc.data();
                    }
                } catch (error) {
                    console.error('Error loading user details:', error);
                }
                
                return participant;
            });
            
            this.participants = await Promise.all(participantPromises);
            
            if (this.participants.length === 0) {
                participantsList.innerHTML = this.getEmptyStateHTML('users', 'No participants for this event');
            } else {
                participantsList.innerHTML = this.participants.map(participant => this.createParticipantCard(participant)).join('');
            }
            feather.replace();
        } catch (error) {
            console.error('Error loading participants:', error);
            DashboardUtils.showToast('Error loading participants', 'error');
        }
    }

    createParticipantCard(participant) {
        const userName = participant.userDetails ? 
            `${participant.userDetails.firstName || ''} ${participant.userDetails.lastName || ''}`.trim() : 
            'Unknown User';
            
        const userEmail = participant.userDetails?.email || participant.userEmail || 'N/A';
        const userPhone = participant.userDetails?.phoneNumber || 'N/A';
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 text-lg">${userName}</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm mt-2">
                            <div>
                                <span class="font-medium">Email:</span> ${userEmail}
                            </div>
                            <div>
                                <span class="font-medium">Phone:</span> ${userPhone}
                            </div>
                            <div>
                                <span class="font-medium">Joined:</span> ${participant.joinedAt?.toDate ? DashboardUtils.formatDate(participant.joinedAt.toDate()) : 'Unknown date'}
                            </div>
                            <div>
                                <span class="font-medium">Status:</span> 
                                <span class="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    ${participant.status || 'active'}
                                </span>
                            </div>
                        </div>
                        
                        ${participant.userDetails?.skills && participant.userDetails.skills.length > 0 ? `
                        <div class="mt-3">
                            <span class="font-medium text-sm">Skills:</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${participant.userDetails.skills.map(skill => 
                                    `<span class="skill-chip">${skill}</span>`
                                ).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="window.volunteersManager.viewVolunteerDetails('${participant.userId}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        <button onclick="window.volunteersManager.openRemovalModal('${participant.id}', '${participant.eventId}')" 
                                class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    toggleRequestSelection(requestId) {
        if (this.selectedRequests.has(requestId)) {
            this.selectedRequests.delete(requestId);
        } else {
            this.selectedRequests.add(requestId);
        }
        this.toggleBulkActions();
    }

    toggleSelectAllRequests() {
        const allChecked = this.joinRequests.every(request => 
            this.selectedRequests.has(request.id)
        );
        
        if (allChecked) {
            this.selectedRequests.clear();
        } else {
            this.joinRequests.forEach(request => {
                this.selectedRequests.add(request.id);
            });
        }
        
        this.loadJoinRequests(); // Re-render to update checkboxes
    }

    toggleBulkActions() {
        const bulkApproveBtn = document.getElementById('bulkApproveBtn');
        const bulkRejectBtn = document.getElementById('bulkRejectBtn');
        
        if (this.selectedRequests.size > 0) {
            bulkApproveBtn.classList.remove('hidden');
            bulkRejectBtn.classList.remove('hidden');
            bulkApproveBtn.textContent = `Approve (${this.selectedRequests.size})`;
            bulkRejectBtn.textContent = `Reject (${this.selectedRequests.size})`;
        } else {
            bulkApproveBtn.classList.add('hidden');
            bulkRejectBtn.classList.add('hidden');
        }
    }

    async approveRequest(requestId) {
        const request = this.joinRequests.find(r => r.id === requestId);
        if (!request) return;

        // Guard against a double-click landing before the snapshot re-renders
        // (would create two eventParticipants + double-increment the count).
        this._processingRequests = this._processingRequests || new Set();
        if (this._processingRequests.has(requestId)) return;
        this._processingRequests.add(requestId);

        try {
            const batch = db.batch();
            
            // Update join request status
            const requestRef = db.collection('joinRequests').doc(requestId);
            batch.update(requestRef, { 
                status: 'approved',
                respondedAt: new Date()
            });
            
            // Add to eventParticipants
            const participantRef = db.collection('eventParticipants').doc();
            batch.set(participantRef, {
                eventId: request.eventId,
                userId: request.userId,
                organizerId: this.currentOrganizer.uid,
                eventName: request.eventName,
                status: 'approved',
                joinedAt: new Date(),
                approvedBy: this.currentOrganizer.uid,
                approvedAt: new Date()
            });
            
            // Update event volunteer count
            const eventRef = db.collection('events').doc(request.eventId);
            batch.update(eventRef, {
                currentVolunteers: firebase.firestore.FieldValue.increment(1)
            });
            
            // inside approveRequest
            const notificationRef = db.collection('volunteerNotifications').doc();
            batch.set(notificationRef, {
                userId: request.userId,
                type: 'request_approved',
                title: 'Join Request Approved',
                message: `Your request to join ${request.eventName} has been approved by the organizer.`,
                read: false,
                createdAt: new Date(),
                link: `events/${request.eventId}`
            });
            
            await batch.commit();
            DashboardUtils.showToast('Join request approved', 'success');

        } catch (error) {
            console.error('Error approving request:', error);
            DashboardUtils.showToast('Error approving request', 'error');
        } finally {
            this._processingRequests.delete(requestId);
        }
    }

    openRejectionModal(requestId) {
        document.getElementById('rejectRequestId').value = requestId;
        document.getElementById('rejectionReason').value = '';
        DashboardUtils.openModal('rejectionModal');
    }

    async handleRejection(e) {
        e.preventDefault();
        const requestId = document.getElementById('rejectRequestId').value;
        const reason = document.getElementById('rejectionReason').value;

        const request = this.joinRequests.find(r => r.id === requestId);
        if (!request) return;

        const submitBtn = e.target.querySelector('[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
        }

        try {
            await db.collection('joinRequests').doc(requestId).update({
                status: 'rejected',
                rejectionReason: reason,
                respondedAt: new Date()
            });

            await db.collection('volunteerNotifications').add({
                userId: request.userId,
                type: 'request_rejected',
                title: 'Join Request Rejected',
                message: `Your request to join ${request.eventName} was rejected. Reason: ${reason}`,
                read: false,
                createdAt: new Date()
            });

            DashboardUtils.showToast('Join request rejected', 'success');
            DashboardUtils.closeModal('rejectionModal');

        } catch (error) {
            console.error('Error rejecting request:', error);
            DashboardUtils.showToast('Error rejecting request', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    openRemovalModal(participantId, eventId) {
        document.getElementById('removeParticipantId').value = participantId;
        document.getElementById('removeEventId').value = eventId;
        document.getElementById('removalReason').value = '';
        DashboardUtils.openModal('removalModal');
    }

    async handleRemoval(e) {
        e.preventDefault();
        const participantId = document.getElementById('removeParticipantId').value;
        const eventId = document.getElementById('removeEventId').value;
        const reason = document.getElementById('removalReason').value;
        
        if (!reason.trim()) {
            DashboardUtils.showToast('Please provide a reason for removal', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('[type="submit"]');
        if (submitBtn) {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
        }

        try {
            const participantDoc = await db.collection('eventParticipants').doc(participantId).get();
            if (!participantDoc.exists) throw new Error('Participant not found');
            
            const participant = participantDoc.data();
            const batch = db.batch();
            
            // Remove participant from eventParticipants
            batch.delete(participantDoc.ref);
            
            // Update event volunteer count
            const eventRef = db.collection('events').doc(eventId);
            batch.update(eventRef, {
                currentVolunteers: firebase.firestore.FieldValue.increment(-1)
            });
            
            const notificationRef = db.collection('volunteerNotifications').doc();
                batch.set(notificationRef, {
                    userId: participant.userId,
                    type: 'removed_from_event',
                    title: 'Removed from Event',
                    message: `You have been removed from ${participant.eventName}. Reason: ${reason}`,
                    read: false,
                    createdAt: new Date()
                });
            
            await batch.commit();
            DashboardUtils.showToast('Participant removed successfully', 'success');
            DashboardUtils.closeModal('removalModal');
            this.loadParticipants();

        } catch (error) {
            console.error('Error removing participant:', error);
            DashboardUtils.showToast('Error removing participant', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    async handleBulkApprove() {
        if (this.selectedRequests.size === 0) return;
        
        if (confirm(`Are you sure you want to approve ${this.selectedRequests.size} join requests?`)) {
            try {
                const batch = db.batch();
                const requestIds = Array.from(this.selectedRequests);
                
                requestIds.forEach(requestId => {
                    const request = this.joinRequests.find(r => r.id === requestId);
                    if (request) {
                        const requestRef = db.collection('joinRequests').doc(requestId);
                        batch.update(requestRef, { 
                            status: 'approved',
                            respondedAt: new Date()
                        });
                        
                        const participantRef = db.collection('eventParticipants').doc();
                        batch.set(participantRef, {
                            eventId: request.eventId,
                            userId: request.userId,
                            organizerId: this.currentOrganizer.uid,
                            eventName: request.eventName,
                            status: 'approved',
                            joinedAt: new Date(),
                            approvedBy: this.currentOrganizer.uid,
                            approvedAt: new Date()
                        });
                        
                        // Update event volunteer count
                        const eventRef = db.collection('events').doc(request.eventId);
                        batch.update(eventRef, {
                            currentVolunteers: firebase.firestore.FieldValue.increment(1)
                        });
                        
                        const notificationRef = db.collection('volunteerNotifications').doc();
                            batch.set(notificationRef, {
                                userId: request.userId,
                                type: 'request_approved',
                                title: 'Join Request Approved',
                                message: `Your request to join ${request.eventName} has been approved by the organizer.`,
                                read: false,
                                createdAt: new Date(),
                                link: `events/${request.eventId}`
                            });
                    }
                });
                
                await batch.commit();
                DashboardUtils.showToast(`${this.selectedRequests.size} requests approved successfully`, 'success');
                this.selectedRequests.clear();
                this.toggleBulkActions();
                
            } catch (error) {
                console.error('Error bulk approving requests:', error);
                DashboardUtils.showToast('Error approving requests', 'error');
            }
        }
    }

    async handleBulkReject() {
        if (this.selectedRequests.size === 0) return;
        
        const reason = prompt(`Please provide a reason for rejecting ${this.selectedRequests.size} requests:`);
        if (!reason) return;
        
        try {
            const batch = db.batch();
            const requestIds = Array.from(this.selectedRequests);
            
            requestIds.forEach(requestId => {
                const request = this.joinRequests.find(r => r.id === requestId);
                const requestRef = db.collection('joinRequests').doc(requestId);
                batch.update(requestRef, {
                    status: 'rejected',
                    rejectionReason: reason,
                    respondedAt: new Date()
                });
                
                if (request) {
                    const notificationRef = db.collection('volunteerNotifications').doc();
                    batch.set(notificationRef, {
                        userId: request.userId,
                        type: 'request_rejected',
                        title: 'Join Request Rejected',
                        message: `Your request to join ${request.eventName} was rejected. Reason: ${reason}`,
                        read: false,
                        createdAt: new Date()
                    });
                }
            });
            
            await batch.commit();
            DashboardUtils.showToast(`${this.selectedRequests.size} requests rejected`, 'success');
            this.selectedRequests.clear();
            this.toggleBulkActions();
            
        } catch (error) {
            console.error('Error bulk rejecting requests:', error);
            DashboardUtils.showToast('Error rejecting requests', 'error');
        }
    }

    async exportVolunteersData() {
        try {
            // Get all participants data for this organizer
            const participantsSnapshot = await db.collection('eventParticipants')
                .where('organizerId', '==', this.currentOrganizer.uid)
                .get();
            
            const exportData = [];
            
            for (const doc of participantsSnapshot.docs) {
                const participant = doc.data();
                const userDoc = await db.collection('users').doc(participant.userId).get();
                const eventDoc = await db.collection('events').doc(participant.eventId).get();
                
                if (userDoc.exists && eventDoc.exists) {
                    const userData = userDoc.data();
                    const eventData = eventDoc.data();
                    
                    exportData.push({
                        'Volunteer Name': `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                        'Email': userData.email || '',
                        'Phone': userData.phoneNumber || '',
                        'Event Name': eventData.name || '',
                        'Event Date': eventData.startTime?.toDate ? DashboardUtils.formatDate(eventData.startTime.toDate()) : '',
                        'Status': participant.status || '',
                        'Joined Date': participant.joinedAt?.toDate ? DashboardUtils.formatDate(participant.joinedAt.toDate()) : '',
                        'Skills': (userData.skills || []).join(', ')
                    });
                }
            }
            
            // Convert to CSV
            if (exportData.length === 0) {
                DashboardUtils.showToast('No data to export', 'warning');
                return;
            }
            
            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map(row => 
                    headers.map(header => 
                        `"${String(row[header] || '').replace(/"/g, '""')}"`
                    ).join(',')
                )
            ].join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `volunteers_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            DashboardUtils.showToast(`Exported ${exportData.length} volunteers`, 'success');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            DashboardUtils.showToast('Error exporting data', 'error');
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
window.volunteersManager = new VolunteersManager();