document.addEventListener('DOMContentLoaded', async () => {
    // Guarded: if the Feather CDN is slow or blocked, an unguarded call here
    // would throw and abort the rest of this handler (events never load).
    if (typeof feather !== 'undefined') feather.replace();

    const eventsContainer = document.getElementById('eventsContainer');
    const searchInput = document.getElementById('eventSearch');
    const filterSelect = document.getElementById('eventFilter');

    let events = [];
    let currentUserId = null;
    let currentUserSkills = [];
    let isUserLoggedIn = false;

    // Listen for auth state
    firebase.auth().onAuthStateChanged(async user => {
        console.log("Auth state changed, user:", user ? user.uid : "none");
        if (user) {
            isUserLoggedIn = true;
            currentUserId = user.uid;

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserSkills = userDoc.data().skills || [];
                    console.log("User skills loaded:", currentUserSkills);
                }
            } catch (err) {
                console.error("Failed to load user data:", err);
            }
        } else {
            isUserLoggedIn = false;
            currentUserId = null;
            currentUserSkills = [];
        }
        // Fetch events once auth state is known
        fetchEvents();
    });

    // Fetch events from Firestore
    async function fetchEvents() {
        console.log("fetchEvents called");
        if (!eventsContainer) {
            console.error("Events container not found!");
            return;
        }
        
        eventsContainer.innerHTML = `<div class="text-center py-8">Loading events...</div>`;
        let fetchedEvents = [];

        try {
            console.log("Trying indexed query...");
            const snapshot = await db.collection('events')
                .where('status', '==', 'approved') // Changed from 'Approved' to 'approved'
                .orderBy('startTime') // Changed from 'eventDate' to 'startTime'
                .get();

            console.log(`Query successful, found ${snapshot.size} events`);
            
            if (snapshot.empty) {
                eventsContainer.innerHTML = `<div class="text-center py-8 text-gray-500">No events found</div>`;
                return;
            }

            snapshot.forEach(doc => {
                const event = doc.data();
                event.id = doc.id;
                fetchedEvents.push(event);
            });

        } catch (indexError) {
            console.warn('Index not ready, using client-side fallback:', indexError);
            try {
                const snapshot = await db.collection('events').get();
                console.log(`Fallback query found ${snapshot.size} total events`);
                
                snapshot.forEach(doc => {
                    const event = doc.data();
                    if (event.status === 'approved') { // Changed from 'Approved' to 'approved'
                        event.id = doc.id;
                        fetchedEvents.push(event);
                    }
                });
                console.log(`After filtering, ${fetchedEvents.length} approved events`);
                
                // Sort by date client-side
                fetchedEvents.sort((a,b) => {
                    const dateA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
                    const dateB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
                    return dateA - dateB;
                });
                
            } catch (fallbackError) {
                console.error("Fallback query failed:", fallbackError);
                eventsContainer.innerHTML = `<div class="text-center py-8 text-red-500">Error loading events</div>`;
                return;
            }
        }

        console.log(`Final events to render: ${fetchedEvents.length}`);
        events = fetchedEvents;
        renderEvents(events);
    }

    // Format date for display
    function formatEventDate(dateValue) {
        try {
            let date;
            if (dateValue && typeof dateValue.toDate === 'function') {
                date = dateValue.toDate();
            } else if (dateValue instanceof Date) {
                date = dateValue;
            } else if (dateValue && dateValue.seconds) {
                date = new Date(dateValue.seconds * 1000);
            } else {
                date = new Date(dateValue);
            }
            
            if (isNaN(date.getTime())) {
                return 'Date not specified';
            }
            
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date not specified';
        }
    }

    // Format time for display
    function formatEventTime(dateValue) {
        try {
            let date;
            if (dateValue && typeof dateValue.toDate === 'function') {
                date = dateValue.toDate();
            } else if (dateValue instanceof Date) {
                date = dateValue;
            } else if (dateValue && dateValue.seconds) {
                date = new Date(dateValue.seconds * 1000);
            } else {
                date = new Date(dateValue);
            }
            
            if (isNaN(date.getTime())) {
                return 'Time not specified';
            }
            
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Time not specified';
        }
    }

    // Search and filter functionality
    function filterEvents() {
        const searchTerm = (searchInput?.value || '').toLowerCase().trim();
        const selectedCategory = filterSelect?.value || '';
        
        console.log("Filtering events - Search:", searchTerm, "Category:", selectedCategory);

        const filteredEvents = events.filter(event => {
            // Search filter - UPDATED field names
            const matchesSearch = !searchTerm || 
                (event.name && event.name.toLowerCase().includes(searchTerm)) || // Changed from eventName to name
                (event.location && event.location.toLowerCase().includes(searchTerm)) || // Changed from eventLocation to location
                (event.description && event.description.toLowerCase().includes(searchTerm)) || // Changed from eventDesc to description
                (event.organizerName && event.organizerName.toLowerCase().includes(searchTerm)); // Changed from organizer to organizerName

            // Category filter - UPDATED to use category field
            const matchesCategory = !selectedCategory || 
                (event.category === selectedCategory); // Changed from eventCategory to category

            return matchesSearch && matchesCategory;
        });

        console.log(`Filtered to ${filteredEvents.length} events`);
        renderEvents(filteredEvents);
    }

    // Add event listeners for search and filter
    if (searchInput) {
        searchInput.addEventListener('input', filterEvents);
        console.log("Search input event listener added");
    } else {
        console.warn("Search input not found");
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', filterEvents);
        console.log("Filter select event listener added");
    } else {
        console.warn("Filter select not found");
    }

    // Render events
    function renderEvents(eventList) {
        console.log("Rendering events:", eventList.length);
        eventsContainer.innerHTML = '';

        if (!eventList.length) {
            eventsContainer.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <div class="text-gray-500 text-lg mb-4">No events match your search criteria</div>
                    <button onclick="clearFilters()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg">
                        Clear Filters
                    </button>
                </div>
            `;
            return;
        }

        eventList.forEach(event => {
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col justify-between h-full';

            // Truncate description to 120 characters
            const fullDescription = event.description || ''; // Changed from eventDesc to description
            const truncatedDescription = fullDescription.length > 120 
                ? fullDescription.substring(0, 120) + '...' 
                : fullDescription;

            const allSkills = event.requiredSkills || [];
            const maxSkillsToShow = 4;
            const skillsToShow = allSkills.slice(0, maxSkillsToShow);
            const hasMoreSkills = allSkills.length > maxSkillsToShow;

            const skillsChips = skillsToShow.map(skill => 
                `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">${skill}</span>`
            ).join(' ');

            // Add more skills indicator if needed
            const moreSkillsIndicator = hasMoreSkills ? 
                `<span class="inline-block text-gray-500 text-sm font-medium px-2 py-1">+${allSkills.length - maxSkillsToShow} more</span>` : 
                '';

            card.innerHTML = `
                <div class="space-y-2 flex-1">
                    <h3 class="text-xl font-bold text-gray-800">${event.name || 'Untitled Event'}</h3>
                    <p class="text-gray-600"><strong>Date:</strong> ${formatEventDate(event.startTime)}</p>
                    <p class="text-gray-600"><strong>Time:</strong> ${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}</p>
                    <p class="text-gray-600"><strong>Location:</strong> ${event.location || 'Not specified'}</p>
                    <p class="text-gray-600"><strong>Category:</strong> ${event.category || 'N/A'}</p>
                    <p class="text-gray-700 mt-2">${truncatedDescription}</p>
                    <div class="mt-2 flex flex-wrap items-center gap-2 min-h-[2rem]">${skillsChips}${moreSkillsIndicator}</div>
                    <p class="text-gray-600 text-sm"><strong>Organizer:</strong> ${event.organizerName || 'Unknown'}</p>
                    <p class="text-gray-600 text-sm"><strong>Volunteers:</strong> ${event.currentVolunteers || 0}/${event.maxVolunteers || 0}</p>
                </div>
                <div class="mt-4 flex justify-start gap-2">
                    <button class="view-details-btn bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
                        data-id="${event.id}">View Details</button>
                    <button class="join-event-btn bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                        data-id="${event.id}">Join Event</button>
                </div>
            `;

            eventsContainer.appendChild(card);
        });

        // Add view details button listeners
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const eventId = e.target.dataset.id;
                showEventDetails(eventId);
            });
        });

        // Add join button listeners
        document.querySelectorAll('.join-event-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const eventId = e.target.dataset.id;
                handleJoinEvent(eventId);
            });
        });
    }

    // Clear filters function
    window.clearFilters = function() {
        if (searchInput) searchInput.value = '';
        if (filterSelect) filterSelect.value = '';
        renderEvents(events);
    };

    // Add this new function to show event details in a modal
    async function showEventDetails(eventId) {
        try {
            const eventDoc = await db.collection('events').doc(eventId).get();
            
            if (!eventDoc.exists) {
                alert('Event not found!');
                return;
            }

            const event = eventDoc.data();
            
            // Create modal HTML
            const modalHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-4">
                                <h2 class="text-2xl font-bold text-gray-800">${event.name || 'Untitled Event'}</h2>
                                <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                            </div>
                            
                            <div class="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p class="text-gray-600"><strong>Date:</strong> ${formatEventDate(event.startTime)}</p>
                                    <p class="text-gray-600"><strong>Time:</strong> ${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}</p>
                                    <p class="text-gray-600"><strong>Category:</strong> ${event.category || 'N/A'}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600"><strong>Location:</strong> ${event.location || 'Not specified'}</p>
                                    <p class="text-gray-600"><strong>Organizer:</strong> ${event.organizerName || 'Unknown'}</p>
                                    <p class="text-gray-600"><strong>Volunteers:</strong> ${event.currentVolunteers || 0}/${event.maxVolunteers || 0}</p>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h3 class="text-lg font-semibold mb-2">Description</h3>
                                <p class="text-gray-700 whitespace-pre-line">${event.description || 'No description provided.'}</p>
                            </div>
                            
                            ${event.requiredSkills && event.requiredSkills.length > 0 ? `
                            <div class="mb-4">
                                <h3 class="text-lg font-semibold mb-2">Required Skills</h3>
                                <div class="flex flex-wrap gap-2">
                                    ${event.requiredSkills.map(skill => 
                                        `<span class="skill-chip">${skill}</span>`
                                    ).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="flex justify-end gap-2 mt-6">
                                <button class="close-modal bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md">
                                    Close
                                </button>
                                <button class="join-from-modal bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                                    data-id="${eventId}">
                                    Join Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to page
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);

            // Add event listeners for modal
            const modal = modalContainer.firstElementChild;
            
            // Close modal when clicking close button or outside
            modal.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.body.removeChild(modalContainer);
                });
            });

            // Close modal when clicking outside content
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modalContainer);
                }
            });

            // Join event from modal
            modal.querySelector('.join-from-modal').addEventListener('click', () => {
                document.body.removeChild(modalContainer);
                handleJoinEvent(eventId);
            });

        } catch (error) {
            console.error('Error loading event details:', error);
            alert('Failed to load event details.');
        }
    }

   // Handle join event (with auto-login & auto-register flow)
    async function handleJoinEvent(eventId) {
        if (!isUserLoggedIn) {
            // Not logged in — stash the event so the login/signup page can
            // finish the join, then send them to log in.
            localStorage.setItem("pendingJoinEventId", eventId);
            window.location.href = "volunteer-login/volunteer-login.html";
            return;
        }

        // Logged in: join directly. Make sure no stale pending-join flag is
        // left behind (it would hijack the user's next login to index.html).
        localStorage.removeItem("pendingJoinEventId");

        try {
            // Check if already joined
            const query = await db.collection('eventParticipants')
                .where('userId', '==', currentUserId)
                .where('eventId', '==', eventId)
                .get();

            if (!query.empty) {
                alert('You already joined this event.');
                return;
            }

            // Add participant
            await db.collection('eventParticipants').add({
                userId: currentUserId,
                eventId,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'approved'
            });

            alert('Successfully joined the event!');
        } catch(err) {
            console.error('Join event failed:', err);
            alert('Failed to join event.');
        }
    }

});