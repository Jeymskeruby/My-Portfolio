class AdminParticipantsManager {
    constructor() {
        this.participants = [];
        this.events = [];
        this.currentAdmin = null;
    }

    init(currentAdmin) {
        this.currentAdmin = currentAdmin;
        this.setupEventListeners();
        this.setupRealTimeListeners();
    }

    setupEventListeners() {
        // Event filter
        const eventFilter = document.getElementById('eventParticipantsFilter');
        const searchInput = document.getElementById('participantSearch');
        
        if (eventFilter) {
            eventFilter.addEventListener('change', () => this.loadParticipants());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', AdminUtils.debounce(() => this.filterParticipants(), 300));
        }
    }

    setupRealTimeListeners() {
        // Load events for filter
        this.loadEventsForFilter();
    }

    async loadEventsForFilter() {
        const eventFilter = document.getElementById('eventParticipantsFilter');
        
        try {
            const snapshot = await db.collection('events').get();
            this.events = [];
            snapshot.forEach(doc => {
                this.events.push({ id: doc.id, ...doc.data() });
            });

            eventFilter.innerHTML = '<option value="">Select Event</option>';
            this.events.forEach(event => {
                if (event.status === 'approved' || event.status === 'active') {
                    const option = document.createElement('option');
                    option.value = event.id;
                    option.textContent = event.name;
                    eventFilter.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error loading events for filter:', error);
        }
    }

    async loadParticipants() {
        const eventId = document.getElementById('eventParticipantsFilter').value;
        if (!eventId) {
            document.getElementById('participantsList').innerHTML = this.getEmptyStateHTML('users', 'Select an event to view participants');
            return;
        }
        
        try {
            // Set up real-time listener for this event's participants
            this.setupParticipantsListener(eventId);
            
        } catch (error) {
            console.error('Error loading participants:', error);
            AdminUtils.showToast('Error loading participants', 'error');
        }
    }

    setupParticipantsListener(eventId) {
        // Remove previous listener if exists
        if (this.participantsUnsubscribe) {
            this.participantsUnsubscribe();
        }
        
        // Set up new listener
        this.participantsUnsubscribe = db.collection('eventParticipants')
            .where('eventId', '==', eventId)
            .onSnapshot(async (snapshot) => {
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
                this.renderParticipants();
            }, (error) => {
                console.error('Error listening to participants:', error);
            });
    }

    renderParticipants() {
        const participantsList = document.getElementById('participantsList');
        
        if (this.participants.length === 0) {
            participantsList.innerHTML = this.getEmptyStateHTML('users', 'No participants for this event');
        } else {
            participantsList.innerHTML = this.participants.map(participant => 
                this.createParticipantCard(participant)
            ).join('');
        }
        feather.replace();
    }

    filterParticipants() {
        const searchTerm = document.getElementById('participantSearch').value.toLowerCase();
        
        if (!searchTerm) {
            this.renderParticipants();
            return;
        }
        
        const filteredParticipants = this.participants.filter(participant => {
            const userName = participant.userDetails ? 
                `${participant.userDetails.firstName || ''} ${participant.userDetails.lastName || ''}`.toLowerCase() : 
                '';
            const userEmail = participant.userDetails?.email ? participant.userDetails.email.toLowerCase() : '';
            
            return userName.includes(searchTerm) || userEmail.includes(searchTerm);
        });
        
        const participantsList = document.getElementById('participantsList');
        if (filteredParticipants.length === 0) {
            participantsList.innerHTML = this.getEmptyStateHTML('users', 'No participants match your search');
        } else {
            participantsList.innerHTML = filteredParticipants.map(participant => 
                this.createParticipantCard(participant)
            ).join('');
        }
        feather.replace();
    }

    createParticipantCard(participant) {
        const userName = participant.userDetails ? 
            `${participant.userDetails.firstName || ''} ${participant.userDetails.lastName || ''}`.trim() : 
            'Unknown User';
            
        const userEmail = participant.userDetails?.email || 'N/A';
        const userPhone = participant.userDetails?.phoneNumber || 'N/A';
        const joinDate = AdminUtils.formatDate(participant.joinedAt);
        const statusBadge = AdminUtils.getStatusBadge(participant.status || 'approved');
        const canApprove = participant.status === 'registered' || participant.status === 'pending';

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i data-feather="user" class="w-6 h-6 text-blue-600"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 text-lg">${userName}</h4>
                                <p class="text-sm text-gray-600">${userEmail}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                                <span class="font-medium">Phone:</span> ${userPhone}
                            </div>
                            <div>
                                <span class="font-medium">Joined:</span> ${joinDate}
                            </div>
                            <div>
                                <span class="font-medium">Status:</span> ${statusBadge}
                            </div>
                            ${participant.approvedBy ? `
                            <div>
                                <span class="font-medium">Approved By:</span> ${participant.approvedBy === this.currentAdmin.uid ? 'You' : 'Organizer'}
                            </div>
                            ` : ''}
                        </div>
                        
                        ${participant.userDetails?.skills && participant.userDetails.skills.length > 0 ? `
                        <div class="mb-3">
                            <span class="font-medium text-sm">Skills:</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${participant.userDetails.skills.slice(0, 3).map(skill => 
                                    `<span class="skill-chip">${skill}</span>`
                                ).join('')}
                                ${participant.userDetails.skills.length > 3 ? 
                                    `<span class="text-xs text-gray-500">+${participant.userDetails.skills.length - 3} more</span>` : 
                                    ''
                                }
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="adminParticipantsManager.viewParticipantDetails('${participant.id}')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                            View Details
                        </button>
                        ${canApprove ? `
                            <button onclick="adminParticipantsManager.approveParticipant('${participant.id}', '${participant.eventId}', '${participant.userId}', '${userName}', '${userEmail}')"
                                    class="bg-success hover:bg-green-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Approve
                            </button>
                            <button onclick="adminParticipantsManager.rejectParticipant('${participant.id}', '${participant.eventId}', '${participant.userId}')"
                                    class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Reject
                                </button>

                        ` : `
                            <button onclick="adminParticipantsManager.removeParticipant('${participant.id}', '${participant.eventId}')"
                                    class="bg-danger hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition duration-300">
                                Remove
                            </button>
                        `}  
                    </div>
                </div>
            </div>
        `;
    }

    async approveParticipant(participantId, eventId, userId, userName, userEmail) {
        try {
            const participantRef = db.collection('eventParticipants').doc(participantId);
            const batch = db.batch();

            // Update participant status
            batch.update(participantRef, {
                status: 'approved',
                approvedBy: this.currentAdmin.uid,
                approvedAt: new Date()
            });

            // Update event volunteer count
            const eventRef = db.collection('events').doc(eventId);
            batch.update(eventRef, {
                currentVolunteers: firebase.firestore.FieldValue.increment(1)
            });

            // Notification for volunteer
            const notificationRef = db.collection('volunteerNotifications').doc();
            batch.set(notificationRef, {
                userId,
                type: 'request_approved',
                title: 'Join Request Approved',
                message: `Your request to join this event has been approved by an admin.`,
                read: false,
                createdAt: new Date()
            });

            await batch.commit();
            AdminUtils.showToast('Participant approved successfully', 'success');
        } catch (error) {
            console.error('Error approving participant:', error);
            AdminUtils.showToast('Error approving participant', 'error');
        }
    }

    async rejectParticipant(participantId, eventId, userId) {
        const reason = prompt('Please provide a reason for rejecting this request:');
        if (!reason || !reason.trim()) {
            AdminUtils.showToast('Rejection cancelled. Reason is required.', 'info');
            return;
        }

        try {
            const participantRef = db.collection('eventParticipants').doc(participantId);
            const batch = db.batch();

            batch.update(participantRef, {
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
                message: `Your request to join this event was rejected. Reason: ${reason.trim()}`,
                read: false,
                createdAt: new Date()
            });

            await batch.commit();
            AdminUtils.showToast('Request rejected successfully', 'success');
        } catch (error) {
            console.error('Error rejecting participant:', error);
            AdminUtils.showToast('Error rejecting request', 'error');
        }
    }


    async viewParticipantDetails(participantId) {
        try {
            const participantDoc = await db.collection('eventParticipants').doc(participantId).get();
            if (!participantDoc.exists) {
                AdminUtils.showToast('Participant not found', 'error');
                return;
            }

            const participant = participantDoc.data();
            const userDoc = await db.collection('users').doc(participant.userId).get();
            
            if (!userDoc.exists) {
                AdminUtils.showToast('User not found', 'error');
                return;
            }

            const userData = userDoc.data();
            const eventDoc = await db.collection('events').doc(participant.eventId).get();
            const eventData = eventDoc.exists ? eventDoc.data() : null;
            
            const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            const eventName = eventData ? eventData.name : 'Unknown Event';

            const modalContent = `
                <div class="space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Participant Information -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Participant Details</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    <p><span class="font-medium">Name:</span> ${userName}</p>
                                    <p><span class="font-medium">Email:</span> ${userData.email || 'N/A'}</p>
                                    <p><span class="font-medium">Phone:</span> ${userData.phoneNumber || 'N/A'}</p>
                                    <p><span class="font-medium">Event:</span> ${eventName}</p>
                                    <p><span class="font-medium">Status:</span> ${AdminUtils.getStatusBadge(participant.status || 'approved')}</p>
                                    <p><span class="font-medium">Joined:</span> ${AdminUtils.formatDate(participant.joinedAt)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div>
                                <h4 class="font-semibold text-gray-700 border-b pb-2">Event Information</h4>
                                <div class="mt-2 space-y-2 text-sm">
                                    ${eventData ? `
                                        <p><span class="font-medium">Organizer:</span> ${eventData.organizerName || 'Unknown'}</p>
                                        <p><span class="font-medium">Location:</span> ${eventData.location || 'Not specified'}</p>
                                        <p><span class="font-medium">Date:</span> ${AdminUtils.formatDate(eventData.startTime)}</p>
                                        <p><span class="font-medium">Volunteers:</span> ${eventData.currentVolunteers || 0}/${eventData.maxVolunteers || 0}</p>
                                    ` : '<p class="text-gray-500">Event details not available</p>'}
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
                        <button onclick="adminParticipantsManager.removeParticipant('${participantId}', '${participant.eventId}')" 
                                class="flex-1 bg-danger hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-300">
                            Remove from Event
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('userModalTitle').textContent = `Participant: ${userName}`;
            document.getElementById('userModalContent').innerHTML = modalContent;
            AdminUtils.openModal('userDetailsModal');

        } catch (error) {
            console.error('Error loading participant details:', error);
            AdminUtils.showToast('Error loading participant details', 'error');
        }
    }

    async removeParticipant(participantId, eventId) {
        AdminUtils.showConfirmation(
            'Remove Participant',
            'Are you sure you want to remove this participant from the event? They will be notified about the removal.',
            async () => {
                try {
                    const participantDoc = await db.collection('eventParticipants').doc(participantId).get();
                    if (!participantDoc.exists) {
                        AdminUtils.showToast('Participant not found', 'error');
                        return;
                    }

                    const participant = participantDoc.data();
                    const batch = db.batch();
                    
                    // Remove participant from eventParticipants
                    batch.delete(participantDoc.ref);
                    
                    // Update event volunteer count
                    const eventRef = db.collection('events').doc(eventId);
                    batch.update(eventRef, {
                        currentVolunteers: firebase.firestore.FieldValue.increment(-1)
                    });
                    
                    // Create notification for volunteer
                    const notificationRef = db.collection('volunteerNotifications').doc();
                    batch.set(notificationRef, {
                        userId: participant.userId,
                        type: 'removed_from_event',
                        title: 'Removed from Event',
                        message: `You have been removed from the event by admin.`,
                        read: false,
                        createdAt: new Date()
                    });
                    
                    await batch.commit();
                    AdminUtils.showToast('Participant removed successfully', 'success');
                    AdminUtils.closeModal('confirmationModal');
                    
                } catch (error) {
                    console.error('Error removing participant:', error);
                    AdminUtils.showToast('Error removing participant', 'error');
                }
            }
        );
    }

    getEmptyStateHTML(icon, message) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i data-feather="${icon}" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
                <p>${message}</p>
            </div>
        `;
    }

    // Clean up listeners when switching tabs
    destroy() {
        if (this.participantsUnsubscribe) {
            this.participantsUnsubscribe();
        }
    }
}

// Make globally accessible
window.adminParticipantsManager = new AdminParticipantsManager();