// js/features/events.js - CORRECTED VERSION
// Global variables
window.currentUserId = null;
window.currentEventId = null;
window.currentParticipantId = null;
window.currentRequestId = null;
window.currentTab = 'joined';

// Initialize function
window.initializeEventsFeatures = function(user, userData) {
    window.currentUserId = user.uid;

    setupEventListeners();
    setupEventTabListeners();
    // Load + show only the default sub-tab; the others load when clicked.
    // (Previously this called loadAllEventsData() AND the controller then
    // re-ran switchEventTab('joined') on a 500ms timer -> visible double load.)
    switchEventTab('joined');
};

function setupEventListeners() {
    // Modal close button. Assigned (.onclick) rather than addEventListener so
    // re-running this on each Events-tab visit doesn't stack handlers.
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            document.getElementById('eventDetailsModal').classList.add('hidden');
        };
    }
}

// Add this function to set up event tab listeners
function setupEventTabListeners() {
    // Event tab buttons — .onclick so tab re-entry doesn't stack handlers.
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.onclick = function() {
            const tabName = this.dataset.eventTab;

            // Update active tab button
            document.querySelectorAll('.event-tab-btn').forEach(b => {
                b.classList.remove('active', 'border-primary', 'text-primary');
                b.classList.add('border-transparent', 'text-gray-600');
            });
            this.classList.add('active', 'border-primary', 'text-primary');
            this.classList.remove('border-transparent', 'text-gray-600');

            // Show corresponding content
            switchEventTab(tabName);
        };
    });
}

function switchEventTab(tabName) {
    // Hide all event tab contents
    document.querySelectorAll('.event-tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    
    // Show the selected tab content
    const activeContent = document.getElementById(tabName + 'Content');
    if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('active');
    }
    
    // Load data for the selected tab if needed
    if (tabName === 'joined') {
        loadJoinedEvents();
    } else if (tabName === 'pending') {
        loadPendingRequests();
    } else if (tabName === 'completed') {
        loadCompletedEvents();
    } else if (tabName === 'rejected') {
        loadRejectedRequests();
    }
}

// Load all data
window.loadAllEventsData = function() {
    loadJoinedEvents();
    loadPendingRequests();
    loadCompletedEvents();
    loadRejectedRequests();
};

// Load joined events
async function loadJoinedEvents() {
    const container = document.getElementById('joinedEventsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8">Loading your joined events...</div>';

    try {
        // Query eventParticipants for approved status
        const participantsQuery = await db.collection('eventParticipants')
            .where('userId', '==', window.currentUserId)
            .where('status', '==', 'approved')
            .get();
        
        if (participantsQuery.empty) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i data-feather="calendar" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                    <p class="text-lg mb-4">No joined events yet</p>
                    <p class="text-sm">Events you've been approved for will appear here.</p>
                </div>
            `;
            feather.replace();
            return;
        }

        const now = new Date();
        const events = await Promise.all(
            participantsQuery.docs.map(async (doc) => {
                const participantData = doc.data();

                // Get event details
                const eventDoc = await db.collection('events').doc(participantData.eventId).get();

                if (eventDoc.exists) {
                    const eventData = eventDoc.data();
                    const endTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
                    if (endTime < now) return null; // finished — shown in the Completed Events tab instead
                    return {
                        id: eventDoc.id,
                        participantId: doc.id,
                        ...eventData,
                        participantData: participantData
                    };
                }
                return null;
            })
        );

        const validEvents = events.filter(event => event !== null);
        renderJoinedEvents(validEvents);
    } catch (error) {
        console.error('Error loading joined events:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Error loading joined events</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
}

function renderJoinedEvents(events) {
    const container = document.getElementById('joinedEventsContainer');
    if (!container) return;
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i data-feather="calendar" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                <p class="text-lg mb-4">No joined events yet</p>
                <p class="text-sm">Events you've been approved for will appear here.</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = '';
    events.forEach(event => {
        const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
        const endTime = event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime);
        const formattedDate = startTime.toLocaleDateString();
        const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const eventCard = document.createElement('div');
        eventCard.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition';
        
        eventCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-800">${event.name}</h3>
                <span class="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Approved
                </span>
            </div>
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
                    <h4 class="text-sm font-medium text-gray-500">Organizer</h4>
                    <p>${event.organizerName || 'Not specified'}</p>
                </div>
            </div>
            ${event.requiredSkills && event.requiredSkills.length > 0 ? `
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-500">Required Skills</h4>
                    <div class="flex flex-wrap gap-1 mt-1">
                        ${event.requiredSkills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="flex justify-end">
                <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                    data-id="${event.id}" data-participant-id="${event.participantId}" data-type="joined">
                    View Details
                </button>
            </div>
        `;
        
        container.appendChild(eventCard);
    });

    feather.replace();
    attachEventListeners();
}

// Load pending requests
async function loadPendingRequests() {
    const container = document.getElementById('pendingRequestsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-8">Loading pending requests...</div>';

    try {
        const requestsQuery = await db.collection('joinRequests')
            .where('userId', '==', window.currentUserId)
            .where('status', '==', 'pending')
            .get();

        if (requestsQuery.empty) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i data-feather="clock" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                    <p class="text-lg mb-4">No pending requests</p>
                    <p class="text-sm">Your join requests awaiting organizer approval will appear here.</p>
                </div>
            `;
            feather.replace();
            return;
        }

        const requests = requestsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderPendingRequests(requests);
    } catch (error) {
        console.error('Error loading pending requests:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Error loading pending requests</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
}

function renderPendingRequests(requests) {
    const container = document.getElementById('pendingRequestsContainer');
    
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i data-feather="clock" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                <p class="text-lg mb-4">No pending requests</p>
                <p class="text-sm">Your join requests awaiting organizer approval will appear here.</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = '';
    
    requests.forEach((request) => {
        const requestCard = document.createElement('div');
        requestCard.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-yellow-400';
        
        const requestedDate = request.requestedAt?.toDate ? 
            formatDate(request.requestedAt.toDate()) : 'Unknown date';

        requestCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-800">${request.eventName || 'Unknown Event'}</h3>
                <span class="inline-block px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Pending Approval
                </span>
            </div>
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Organizer</h4>
                    <p>${request.organizerName || 'Not specified'}</p>
                </div>
                <div>
                    <h4 class="text-sm font-medium text-gray-500">Requested On</h4>
                    <p>${requestedDate}</p>
                </div>
            </div>
            ${request.skillMatches ? `
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-500">Skill Match</h4>
                    <span class="text-sm ${request.skillMatches.matchPercentage >= 50 ? 'text-green-600' : 'text-orange-600'}">
                        ${request.skillMatches.matchPercentage?.toFixed(0) || 0}% (${request.skillMatches.matchCount || 0}/${request.skillMatches.totalRequired || 0})
                    </span>
                    ${request.skillMatches.matchedSkills && request.skillMatches.matchedSkills.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-1">
                            ${request.skillMatches.matchedSkills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="flex justify-end gap-2">
                <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                    data-id="${request.eventId}" data-request-id="${request.id}" data-type="pending">
                    View Details
                </button>
                <button class="cancel-request-btn bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
                    data-request-id="${request.id}">
                    Cancel Request
                </button>
            </div>
        `;
        
        container.appendChild(requestCard);
    });

    feather.replace();
    attachEventListeners();
}

// Load completed events — approved participations whose event has already ended
async function loadCompletedEvents() {
    const container = document.getElementById('completedEventsContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-8">Loading completed events...</div>';

    try {
        const participantsQuery = await db.collection('eventParticipants')
            .where('userId', '==', window.currentUserId)
            .where('status', '==', 'approved')
            .get();

        const now = new Date();
        const events = (await Promise.all(
            participantsQuery.docs.map(async (doc) => {
                const participantData = doc.data();
                const eventDoc = await db.collection('events').doc(participantData.eventId).get();
                if (!eventDoc.exists) return null;
                const eventData = eventDoc.data();
                const endTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
                if (endTime >= now) return null; // not finished yet — belongs in Joined Events
                return { id: eventDoc.id, participantId: doc.id, ...eventData };
            })
        )).filter(Boolean);

        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i data-feather="check-circle" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                    <p class="text-lg mb-4">No completed events yet</p>
                    <p class="text-sm">Events you attended will appear here once they've ended.</p>
                </div>
            `;
            if (typeof feather !== 'undefined') feather.replace();
            return;
        }

        events.sort((a, b) => {
            const at = a.endTime?.toDate ? a.endTime.toDate() : new Date(a.endTime);
            const bt = b.endTime?.toDate ? b.endTime.toDate() : new Date(b.endTime);
            return bt - at; // most recently completed first
        });

        container.innerHTML = '';
        events.forEach(event => {
            const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-green-500';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${event.name}</h3>
                    <span class="inline-block px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                </div>
                <div class="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <h4 class="text-sm font-medium text-gray-500">Date</h4>
                        <p>${startTime.toLocaleDateString()}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-500">Location</h4>
                        <p>${event.location || 'Not specified'}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-500">Organizer</h4>
                        <p>${event.organizerName || 'Not specified'}</p>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button class="view-details-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                        data-id="${event.id}" data-participant-id="${event.participantId}" data-type="completed">
                        View Details
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        if (typeof feather !== 'undefined') feather.replace();
        attachEventListeners();
    } catch (error) {
        console.error('Error loading completed events:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Error loading completed events</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
}

// Load rejected requests — join requests the organizer declined
async function loadRejectedRequests() {
    const container = document.getElementById('rejectedRequestsContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-8">Loading rejected requests...</div>';

    try {
        const requestsQuery = await db.collection('joinRequests')
            .where('userId', '==', window.currentUserId)
            .where('status', '==', 'rejected')
            .get();

        if (requestsQuery.empty) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i data-feather="x-circle" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                    <p class="text-lg mb-4">No rejected requests</p>
                    <p class="text-sm">Join requests an organizer has declined will appear here.</p>
                </div>
            `;
            if (typeof feather !== 'undefined') feather.replace();
            return;
        }

        container.innerHTML = '';
        requestsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() })).forEach(request => {
            const requestedDate = request.requestedAt?.toDate ? formatDate(request.requestedAt.toDate()) : 'Unknown date';
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-red-400';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${request.eventName || 'Unknown Event'}</h3>
                    <span class="inline-block px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>
                </div>
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h4 class="text-sm font-medium text-gray-500">Organizer</h4>
                        <p>${request.organizerName || 'Not specified'}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-500">Requested On</h4>
                        <p>${requestedDate}</p>
                    </div>
                </div>
                ${request.rejectionReason ? `
                    <div class="mb-2">
                        <h4 class="text-sm font-medium text-gray-500">Reason</h4>
                        <p class="text-sm text-red-600">${request.rejectionReason}</p>
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });

        if (typeof feather !== 'undefined') feather.replace();
    } catch (error) {
        console.error('Error loading rejected requests:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Error loading rejected requests</p>
                <p class="text-sm">${error.message}</p>
            </div>
        `;
    }
}

// Event details modal function
async function showEventDetails(eventId, type) {
    try {
        // Get event data
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
            alert('Event not found');
            return;
        }

        const eventData = eventDoc.data();
        
        // Populate modal with event data
        document.getElementById('modalEventTitle').textContent = eventData.name;
        document.getElementById('modalEventDate').textContent = formatEventDateTime(eventData);
        document.getElementById('modalEventLocation').textContent = eventData.location || 'Not specified';
        document.getElementById('modalEventOrganizer').textContent = eventData.organizerName || 'Not specified';
        document.getElementById('modalEventDesc').textContent = eventData.description || 'No description available';
        
        // Set status based on type
        const statusElement = document.getElementById('modalEventStatus');
        if (type === 'joined') {
            statusElement.textContent = 'Approved';
            statusElement.className = 'text-green-600 font-medium';
        } else if (type === 'pending') {
            statusElement.textContent = 'Pending Approval';
            statusElement.className = 'text-yellow-600 font-medium';
        } else if (type === 'completed') {
            statusElement.textContent = 'Completed';
            statusElement.className = 'text-gray-600 font-medium';
        }

        // Populate skills
        const skillsContainer = document.getElementById('modalEventSkills');
        skillsContainer.innerHTML = '';
        if (eventData.requiredSkills && eventData.requiredSkills.length > 0) {
            eventData.requiredSkills.forEach(skill => {
                const skillChip = document.createElement('span');
                skillChip.className = 'skill-chip';
                skillChip.textContent = skill;
                skillsContainer.appendChild(skillChip);
            });
        } else {
            skillsContainer.innerHTML = '<span class="text-gray-500">No specific skills required</span>';
        }

        // Show/hide action buttons based on type
        document.getElementById('joinEventBtn')?.classList.add('hidden'); // shared modal — Opportunities uses this
        document.getElementById('leaveEventBtn').classList.add('hidden');
        document.getElementById('cancelRequestBtn').classList.add('hidden');
        
        // An event that has already ended can't be left — by then the
        // participation is history. Checking the end time as well as the type
        // covers a "joined" card that was rendered just before the event ended.
        const modalEndTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
        const hasEnded = !isNaN(modalEndTime) && modalEndTime < new Date();

        if (type === 'joined' && !hasEnded) {
            document.getElementById('leaveEventBtn').classList.remove('hidden');
            document.getElementById('leaveEventBtn').onclick = () => leaveEvent(window.currentParticipantId);
        } else if (type === 'pending') {
            document.getElementById('cancelRequestBtn').classList.remove('hidden');
            document.getElementById('cancelRequestBtn').onclick = () => cancelJoinRequest(window.currentRequestId);
        }

        // Hide rejection reason section for non-rejected events
        document.getElementById('rejectionReasonSection').classList.add('hidden');

        // Show the modal
        document.getElementById('eventDetailsModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('Error loading event details: ' + error.message);
    }
}

// Helper function for date formatting
function formatEventDateTime(eventData) {
    const startTime = eventData.startTime?.toDate ? eventData.startTime.toDate() : new Date(eventData.startTime);
    const endTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
    
    const formattedDate = startTime.toLocaleDateString();
    const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${formattedDate}, ${formattedStartTime} - ${formattedEndTime}`;
}

// Action functions
async function leaveEvent(participantId) {
    if (!confirm('Are you sure you want to leave this event?')) return;
    
    try {
        await db.collection('eventParticipants').doc(participantId).delete();
        alert('You have left the event');
        document.getElementById('eventDetailsModal').classList.add('hidden');
        loadJoinedEvents(); // Refresh the list
    } catch (error) {
        console.error('Error leaving event:', error);
        alert('Error leaving event: ' + error.message);
    }
}

async function cancelJoinRequest(requestId) {
    if (!confirm('Are you sure you want to cancel this join request?')) return;
    
    try {
        await db.collection('joinRequests').doc(requestId).delete();
        alert('Join request cancelled');
        document.getElementById('eventDetailsModal').classList.add('hidden');
        loadPendingRequests(); // Refresh the list
    } catch (error) {
        console.error('Error cancelling request:', error);
        alert('Error cancelling request: ' + error.message);
    }
}

// Utility function to format dates
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Wire up the buttons inside freshly-rendered cards. Handlers are ASSIGNED
// (btn.onclick = ...) not added, so calling this after every render (joined /
// pending / completed) can't stack duplicate handlers on the same button —
// stacked handlers were making "cancel request" prompt several times.
function attachEventListeners() {
    // View details buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const el = e.currentTarget;
            window.currentEventId = el.dataset.id;
            window.currentParticipantId = el.dataset.participantId;
            window.currentRequestId = el.dataset.requestId;
            await showEventDetails(window.currentEventId, el.dataset.type);
        };
    });

    // Cancel request buttons. cancelJoinRequest() does its own confirm() — do
    // NOT confirm here as well or the user gets asked twice per click.
    document.querySelectorAll('.cancel-request-btn').forEach(btn => {
        btn.onclick = async (e) => {
            await cancelJoinRequest(e.currentTarget.dataset.requestId);
        };
    });
}

// Make functions available globally
window.loadJoinedEvents = loadJoinedEvents;
window.loadPendingRequests = loadPendingRequests;
window.loadCompletedEvents = loadCompletedEvents;
window.loadRejectedRequests = loadRejectedRequests;
window.switchEventTab = switchEventTab;
window.leaveEvent = leaveEvent;
window.cancelJoinRequest = cancelJoinRequest;
window.showEventDetails = showEventDetails; // REMOVE the empty function - use the actual one