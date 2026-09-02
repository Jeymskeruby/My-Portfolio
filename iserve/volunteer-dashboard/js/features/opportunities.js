// js/features/opportunities.js - Opportunities feature module

let currentUserSkills = [];
let currentUserId = null;
let currentEventId = null;
let isUserLoggedIn = false;
let currentUserData = null;
// initializeOpportunitiesFeatures() re-runs on every Opportunities-tab visit;
// this keeps the one document-level click listener from being added again.
let opportunitiesDelegationBound = false;

function initializeOpportunitiesFeatures(user, userData) {
    currentUserId = user.uid;
    currentUserData = userData;
    currentEventId = null;
    isUserLoggedIn = true;

    if (userData && userData.skills) {
        currentUserSkills = userData.skills;
    }

    setupOpportunitiesListeners();
    loadEvents();
}

function setupOpportunitiesListeners() {
    // Search functionality — assigned handlers so re-running this doesn't stack.
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) searchBtn.onclick = loadEvents;
    if (searchInput) {
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') loadEvents(); };
    }

    // Modal buttons — assigned handlers.
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelLoginBtn = document.getElementById('cancelLoginBtn');
    const modalJoinEventBtn = document.getElementById('joinEventBtn');

    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            document.getElementById('eventDetailsModal').classList.add('hidden');
            const jb = document.getElementById('joinEventBtn');
            if (jb) jb.classList.add('hidden');
        };
    }

    if (cancelLoginBtn) {
        cancelLoginBtn.onclick = () => {
            document.getElementById('loginPromptModal').classList.add('hidden');
        };
    }

    if (modalJoinEventBtn) {
        modalJoinEventBtn.onclick = async () => {
            if (modalJoinEventBtn.disabled) return;
            modalJoinEventBtn.disabled = true;
            if (modalJoinEventBtn.dataset.status === 'rejected') {
                await resubmitJoinRequest(currentEventId, modalJoinEventBtn);
            } else {
                updateJoinButtonState(modalJoinEventBtn, 'submitting');
                await submitJoinRequest(modalJoinEventBtn);
            }
        };
    }

    // Delegated click handler for dynamic cards — bound ONCE for the page.
    // Scoped to the Opportunities list (#eventsContainer) so it doesn't also
    // fire for the identically classed .view-details-btn buttons in the "My
    // Events" tabs, which events.js owns.
    if (opportunitiesDelegationBound) return;
    opportunitiesDelegationBound = true;

    document.addEventListener('click', async (e) => {
        const inOpportunities = e.target.closest('#eventsContainer');
        if (!inOpportunities) return;

        // Join button
        if (e.target.classList.contains('join-event-btn')) {
            if (e.target.disabled) return;
            currentEventId = e.target.dataset.id;
            if (!isUserLoggedIn) {
                document.getElementById('loginPromptModal').classList.remove('hidden');
            } else if (e.target.dataset.status === 'rejected') {
                // Rejected before — clear the old request, then submit a fresh one.
                e.target.disabled = true;
                await resubmitJoinRequest(e.target.dataset.id, e.target);
            } else {
                e.target.disabled = true;
                updateJoinButtonState(e.target, 'submitting');
                await submitJoinRequest(e.target);
            }
            return;
        }

        // View details button
        if (e.target.classList.contains('view-details-btn')) {
            currentEventId = e.target.dataset.id;
            await showOpportunityDetails(currentEventId);
        }
    });
}

async function loadEvents() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;
    
    eventsContainer.innerHTML = '<div class="text-center py-8">Loading events...</div>';

    try {
        let events = [];
        
        // Query for approved, non-deleted events
        try {
            const query = db.collection('events')
                .where('status', '==', 'approved')
                .where('isDeleted', '==', false)
                .orderBy('startTime');
            
            const snapshot = await query.get();
            
            if (snapshot.empty) {
                eventsContainer.innerHTML = '<div class="text-center py-8">No events found. Check back later for new opportunities!</div>';
                return;
            }
            
            snapshot.forEach(doc => {
                const event = doc.data();
                event.id = doc.id;
                events.push(event);
            });
            
        } catch (indexError) {
            // Fallback to client-side filtering
            console.warn('Index not ready, using fallback query:', indexError);
            
            const snapshot = await db.collection('events').get();
            
            if (snapshot.empty) {
                eventsContainer.innerHTML = '<div class="text-center py-8">No events found. Check back later for new opportunities!</div>';
                return;
            }
            
            // Client-side filtering for approved, non-deleted events
            snapshot.forEach(doc => {
                const event = doc.data();
                if (event.status === 'Approved' && event.isDeleted !== true) {
                    event.id = doc.id;
                    events.push(event);
                }
            });
            
            // Client-side sorting by start time
            events.sort((a, b) => {
                const timeA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
                const timeB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
                return timeA - timeB;
            });
        }

        // Filter by search term if provided
        if (searchTerm) {
            events = events.filter(event => 
                event.name.toLowerCase().includes(searchTerm) ||
                event.description.toLowerCase().includes(searchTerm) ||
                event.location.toLowerCase().includes(searchTerm)
            );
        }

        // Check join request status for each event if user is logged in
        if (isUserLoggedIn) {
            events = await Promise.all(events.map(async (event) => {
                const requestStatus = await getJoinRequestStatus(event.id);
                event.joinRequestStatus = requestStatus;
                return event;
            }));
        }

        // Sort events by skill match only if user is logged in
        if (isUserLoggedIn && currentUserSkills.length > 0) {
            events.sort((a, b) => {
                const aSkills = a.requiredSkills || [];
                const bSkills = b.requiredSkills || [];
                
                const aMatches = aSkills.filter(skill => currentUserSkills.includes(skill)).length;
                const bMatches = bSkills.filter(skill => currentUserSkills.includes(skill)).length;
                
                if (aMatches > bMatches) return -1;
                if (aMatches < bMatches) return 1;
                return 0;
            });
        }

        renderEvents(events);
    } catch (error) {
        console.error("Failed to load events:", error);
        showModal({ title: "Error", message: "Failed to load events: " + error.message });
        eventsContainer.innerHTML = '<div class="text-center py-8">Error loading events</div>';
    }
}

async function getJoinRequestStatus(eventId) {
    if (!currentUserId) return null;
    
    try {
        const query = await db.collection('joinRequests')
            .where('userId', '==', currentUserId)
            .where('eventId', '==', eventId)
            .limit(1)
            .get();
            
        if (!query.empty) {
            const request = query.docs[0].data();
            return {
                status: request.status,
                id: query.docs[0].id,
                requestedAt: request.requestedAt
            };
        }
        return null;
    } catch (error) {
        console.error('Error checking join request status:', error);
        return null;
    }
}

function renderEvents(events) {
    const eventsContainer = document.getElementById('eventsContainer');
    if (!eventsContainer) return;
    
    if (events.length === 0) {
        eventsContainer.innerHTML = '<div class="text-center py-8">No events found</div>';
        return;
    }

    eventsContainer.innerHTML = '';
    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition';
        
        const skills = event.requiredSkills || [];
        let skillsMatchText = 'Login to see skill matches';
        let matchClass = 'text-gray-600';
        let joinButtonHTML = '';
        
        if (isUserLoggedIn) {
            const matchedSkills = skills.filter(skill => currentUserSkills.includes(skill));
            skillsMatchText = `${matchedSkills.length}/${skills.length} skills match`;
            
            // Color code based on match percentage
            const matchPercentage = skills.length > 0 ? (matchedSkills.length / skills.length) : 0;
            if (matchPercentage >= 0.8) matchClass = 'text-green-600';
            else if (matchPercentage >= 0.5) matchClass = 'text-yellow-600';
            else if (matchPercentage > 0) matchClass = 'text-orange-600';
            else matchClass = 'text-red-600';
            
            // In the renderEvents function, update the button generation:
            if (event.joinRequestStatus) {
                const status = event.joinRequestStatus.status;
                if (status === 'pending') {
                    joinButtonHTML = `
                        <button class="join-event-btn bg-yellow-600 text-white font-medium py-2 px-4 rounded-md cursor-not-allowed opacity-75" disabled data-id="${event.id}">
                            Request Pending
                        </button>
                    `;
                } else if (status === 'approved') {
                    joinButtonHTML = `
                        <button class="join-event-btn bg-green-600 text-white font-medium py-2 px-4 rounded-md cursor-not-allowed opacity-75" disabled data-id="${event.id}">
                            Approved ✓
                        </button>
                    `;
                } else if (status === 'rejected') {
                    joinButtonHTML = `
                        <button class="join-event-btn bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md"
                            data-id="${event.id}" data-status="rejected">
                            Resubmit Request
                        </button>
                    `;
                }
            } else {
                joinButtonHTML = `
                    <button class="join-event-btn bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                        data-id="${event.id}">
                        Submit Join Request
                    </button>
                `;
            }
        } else {
            joinButtonHTML = `
                <button class="join-event-btn bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                    data-id="${event.id}">
                    Join Event
                </button>
            `;
        }
        
        // Format date and time
        const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
        const endTime = event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime);
        const formattedDate = startTime.toLocaleDateString();
        const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        eventCard.innerHTML = `
            <h3 class="text-xl font-bold text-gray-800 mb-2">${event.name}</h3>
            <div class="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Date & Time</h4>
                    <p>${formattedDate}</p>
                    <p class="text-sm text-gray-600">${formattedStartTime} - ${formattedEndTime}</p>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Location</h4>
                    <p>${event.location || 'Not specified'}</p>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Skills Match</h4>
                    <p class="${matchClass}">${skillsMatchText}</p>
                </div>
            </div>
            ${event.description ? `
                <div class="mb-4">
                    <p class="text-gray-600 text-sm">${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}</p>
                </div>
            ` : ''}
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">
                    ${event.currentVolunteers || 0} volunteers joined
                </span>
                <div class="flex gap-2">
                    <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                        data-id="${event.id}">
                        View Details
                    </button>
                    ${joinButtonHTML}
                </div>
            </div>
        `;
        
        eventsContainer.appendChild(eventCard);
    });
}

async function showOpportunityDetails(eventId) {
    try {
        const doc = await db.collection('events').doc(eventId).get();
        if (!doc.exists) {
            showModal({ title: "Error", message: "Event not found" });
            return;
        }

        const event = doc.data();

        // This modal is shared with the "My Events" tabs — reset the buttons
        // that path shows so an Opportunities view doesn't inherit them.
        document.getElementById('leaveEventBtn')?.classList.add('hidden');
        document.getElementById('cancelRequestBtn')?.classList.add('hidden');
        document.getElementById('rejectionReasonSection')?.classList.add('hidden');
        const modalStatus = document.getElementById('modalEventStatus');
        if (modalStatus) {
            modalStatus.textContent = event.status
                ? event.status.charAt(0).toUpperCase() + event.status.slice(1)
                : 'Open';
            modalStatus.className = 'text-gray-700';
        }
        document.getElementById('joinEventBtn')?.classList.remove('hidden');
        
        // Format dates for display
        const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
        const endTime = event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime);
        
        const formattedDate = startTime.toLocaleDateString();
        const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Only update elements that actually exist
        const modalTitle = document.getElementById('modalEventTitle');
        const modalDate = document.getElementById('modalEventDate');
        const modalLocation = document.getElementById('modalEventLocation');
        const modalOrganizer = document.getElementById('modalEventOrganizer');
        const modalDesc = document.getElementById('modalEventDesc');
        const modalSkills = document.getElementById('modalEventSkills');

        if (modalTitle) modalTitle.textContent = event.name || 'No title';
        if (modalDate) modalDate.textContent = `${formattedDate} (${formattedStartTime} - ${formattedEndTime})`;
        if (modalLocation) modalLocation.textContent = event.location || 'Not specified';
        if (modalOrganizer) modalOrganizer.textContent = event.organizerName || 'Not specified';
        if (modalDesc) modalDesc.textContent = event.description || 'No description provided';

        // Display skills with skill chip styling
        if (modalSkills) {
            modalSkills.innerHTML = '';
            (event.requiredSkills || []).forEach(skill => {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-chip';
                skillTag.textContent = skill;
                modalSkills.appendChild(skillTag);
            });
        }

        // Update join button based on login status and existing request
        const joinButton = document.getElementById('joinEventBtn');
        if (joinButton) {
            delete joinButton.dataset.status;
            if (!isUserLoggedIn) {
                joinButton.textContent = 'Login to Join Event';
                joinButton.classList.add('opacity-75');
            } else {
                // Check if user already has a request for this event
                const existingRequest = await getJoinRequestStatus(eventId);
                if (existingRequest) {
                    if (existingRequest.status === 'pending') {
                        joinButton.textContent = 'Request Pending';
                        joinButton.classList.add('bg-yellow-600', 'cursor-not-allowed');
                        joinButton.disabled = true;
                    } else if (existingRequest.status === 'approved') {
                        joinButton.textContent = 'Approved ✓';
                        joinButton.classList.add('bg-green-600', 'cursor-not-allowed');
                        joinButton.disabled = true;
                    } else if (existingRequest.status === 'rejected') {
                        joinButton.textContent = 'Resubmit Request';
                        joinButton.classList.add('bg-orange-600');
                        joinButton.dataset.status = 'rejected';
                        joinButton.disabled = false;
                    }
                } else {
                    joinButton.textContent = 'Submit Join Request';
                    joinButton.classList.remove('opacity-75', 'bg-yellow-600', 'bg-green-600', 'cursor-not-allowed');
                    joinButton.disabled = false;
                }
            }
        }

        document.getElementById('eventDetailsModal').classList.remove('hidden');
    } catch (error) {
        console.error("Failed to load event details:", error);
        showModal({ title: "Error", message: "Failed to load event details: " + error.message });
    }
}

async function submitJoinRequest(buttonElement = null) {
    if (!isUserLoggedIn) {
        document.getElementById('eventDetailsModal').classList.add('hidden');
        document.getElementById('loginPromptModal').classList.remove('hidden');
        return;
    }

    if (!currentUserId || !currentEventId) {
        showModal({ title: "Error", message: "Missing user or event information" });
        if (buttonElement) updateJoinButtonState(buttonElement, 'error');
        return;
    }

    try {
        // Check if already has a pending or approved request
        const existingRequestQuery = await db.collection('joinRequests')
            .where('userId', '==', currentUserId)
            .where('eventId', '==', currentEventId)
            .get();

        if (!existingRequestQuery.empty) {
            const existingRequest = existingRequestQuery.docs[0].data();
            showModal({ 
                title: "Already Applied", 
                message: `You have already submitted a join request for this event. Status: ${existingRequest.status}` 
            });
            
            // Update button based on existing status
            if (buttonElement) {
                updateJoinButtonState(buttonElement, existingRequest.status);
            }
            return;
        }

        // Get user and event data
        const [userDoc, eventDoc] = await Promise.all([
            db.collection('users').doc(currentUserId).get(),
            db.collection('events').doc(currentEventId).get()
        ]);
        
        const userData = userDoc.data();
        const eventData = eventDoc.data();

        if (!eventData) {
            showModal({ title: "Error", message: "Event not found" });
            if (buttonElement) updateJoinButtonState(buttonElement, 'error');
            return;
        }

        if (!eventData.organizerId) {
            console.error('Event organizerId is missing:', eventData);
            showModal({ 
                title: "Error", 
                message: "Event organizer information is missing. Cannot submit request." 
            });
            if (buttonElement) updateJoinButtonState(buttonElement, 'error');
            return;
        }

        // Create join request data
        const joinRequestData = {
            userId: currentUserId,
            eventId: currentEventId,
            organizerId: eventData.organizerId,
            userFirstName: userData.firstName,
            userLastName: userData.lastName,
            userEmail: userData.email,
            userPhone: userData.phoneNumber || 'Not provided',
            userSkills: userData.skills || [],
            userInterests: userData.interests || [],
            eventName: eventData.name,
            eventDescription: eventData.description,
            eventLocation: eventData.location,
            eventStartTime: eventData.startTime,
            eventEndTime: eventData.endTime,
            organizerName: eventData.organizerName,
            status: 'pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
            userAvailability: userData.availability || {},
            userAddress: userData.address || {},
            userGender: userData.gender || 'Not specified',
            userBirthdate: userData.birthdate || 'Not specified',
            skillMatches: calculateSkillMatches(userData.skills || [], eventData.requiredSkills || [])
        };

        // Submit the request
        await db.collection('joinRequests').add(joinRequestData);

        await Promise.all([
            notifyAdminOfJoinRequest(joinRequestData),
            notifyOrganizerOfJoinRequest(joinRequestData)
        ]);

        // Update button to pending state immediately
        if (buttonElement) {
            updateJoinButtonState(buttonElement, 'pending');
        }

        // Also update the modal button if it's different
        const modalJoinBtn = document.getElementById('joinEventBtn');
        if (modalJoinBtn && modalJoinBtn !== buttonElement) {
            updateJoinButtonState(modalJoinBtn, 'pending');
        }

        showModal({
            title: "Request Submitted",
            message: "Your join request has been submitted to the organizer for approval. You'll be notified when they respond.",
            onClose: () => {
                document.getElementById('eventDetailsModal').classList.add('hidden');
                loadEvents(); // Refresh events list
            }
        });
        
    } catch (error) {
        console.error("Failed to submit join request:", error);
        
        // Reset button state on error
        if (buttonElement) {
            updateJoinButtonState(buttonElement, 'error');
        }
        
        let errorMessage = "Failed to submit join request: " + error.message;
        if (error.code === 'permission-denied') {
            errorMessage += "\n\nThis is a permissions issue. Please ensure you are logged in correctly.";
        }
        
        showModal({ title: "Error", message: errorMessage });
    }
}

async function resubmitJoinRequest(eventId, buttonElement = null) {
    currentEventId = eventId;
    
    try {
        // Update button state immediately
        if (buttonElement) {
            updateJoinButtonState(buttonElement, 'submitting');
        }

        // Delete the existing rejected request
        const existingRequestQuery = await db.collection('joinRequests')
            .where('userId', '==', currentUserId)
            .where('eventId', '==', eventId)
            .where('status', '==', 'rejected')
            .get();

        if (!existingRequestQuery.empty) {
            const batch = db.batch();
            existingRequestQuery.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        // Submit new request
        await submitJoinRequest(buttonElement);
    } catch (error) {
        console.error("Failed to resubmit join request:", error);
        if (buttonElement) {
            updateJoinButtonState(buttonElement, 'error');
        }
        showModal({ title: "Error", message: "Failed to resubmit join request: " + error.message });
    }
}

function updateJoinButtonState(button, status) {
    if (!button) return;
    
    button.disabled = true;
    
    switch(status) {
        case 'pending':
            button.textContent = 'Request Pending';
            button.className = 'bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md cursor-not-allowed opacity-75';
            break;
        case 'submitting':
            button.textContent = 'Submitting...';
            button.className = 'bg-gray-600 text-white font-medium py-2 px-4 rounded-md cursor-not-allowed opacity-75';
            break;
        case 'approved':
            button.textContent = 'Approved ✓';
            button.className = 'bg-green-600 text-white font-medium py-2 px-4 rounded-md cursor-not-allowed opacity-75';
            break;
        case 'error':
            button.textContent = 'Error - Try Again';
            button.className = 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md';
            button.disabled = false;
            break;
        default:
            button.textContent = 'Submit Join Request';
            button.className = 'bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md';
            button.disabled = false;
    }
}

// Helper function to calculate skill matches for the organizer
function calculateSkillMatches(userSkills, eventSkills) {
    const matchedSkills = userSkills.filter(skill => eventSkills.includes(skill));
    return {
        matchedSkills: matchedSkills,
        matchCount: matchedSkills.length,
        totalRequired: eventSkills.length,
        matchPercentage: eventSkills.length > 0 ? (matchedSkills.length / eventSkills.length) * 100 : 0
    };
}

async function notifyAdminOfJoinRequest(joinRequestData) {
    try {
        const notificationData = {
            type: 'join_request',
            title: 'New Event Join Request',
            message: `${joinRequestData.userFirstName} ${joinRequestData.userLastName} wants to join "${joinRequestData.eventName}".`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),

            // extra info
            volunteerId: joinRequestData.userId,
            eventId: joinRequestData.eventId,
            organizerId: joinRequestData.organizerId,
            volunteerEmail: joinRequestData.userEmail,
            eventLocation: joinRequestData.eventLocation,
            eventStartTime: joinRequestData.eventStartTime,
            eventEndTime: joinRequestData.eventEndTime,
            status: 'pending'
        };

        await db.collection('adminNotifications').add(notificationData);
        console.log('Admin notified of join request');
    } catch (error) {
        console.error('Error notifying admin of join request:', error);
    }
}

async function notifyOrganizerOfJoinRequest(joinRequestData) {
    try {
        const notificationData = {
            type: 'join_request',
            title: 'New Volunteer Join Request',
            message: `${joinRequestData.userFirstName} ${joinRequestData.userLastName} requested to join your event "${joinRequestData.eventName}".`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),

            // who and which event
            organizerId: joinRequestData.organizerId,
            volunteerId: joinRequestData.userId,
            eventId: joinRequestData.eventId,
            volunteerEmail: joinRequestData.userEmail,
            status: 'pending'
        };

        await db.collection('organizerNotifications').add(notificationData);
        console.log('Organizer notified of join request');
    } catch (error) {
        console.error('Error notifying organizer of join request:', error);
    }
}


// Make functions available globally
window.calculateSkillMatches = calculateSkillMatches;
window.showOpportunityDetails = showOpportunityDetails;
window.resubmitJoinRequest = resubmitJoinRequest;