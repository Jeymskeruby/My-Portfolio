// volunteer-dashboard.js - Main controller for volunteer dashboard

// Global state
let currentUser = null;
let userData = null;

// Tab management
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Hide all tab contents - handle both class systems
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden'); // Ensure hidden for events tab system
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'text-primary');
        btn.classList.add('border-transparent', 'text-gray-600');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.classList.remove('hidden'); // Remove hidden for events tab
    }
    
    // Activate selected tab button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active', 'border-primary', 'text-primary');
        selectedBtn.classList.remove('border-transparent', 'text-gray-600');
    }
    
    // Load tab-specific content
    loadTabContent(tabName);
}

function loadTabContent(tabName) {
    switch(tabName) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'profile':
            initializeProfile();
            break;
        case 'opportunities':
            initializeOpportunities();
            break;
        case 'events':
            initializeEvents();
            break;
    }
}

// Initialize dashboard functionality
function initializeDashboard() {
    if (window.volunteerDashboard) {
        window.volunteerDashboard.init(currentUser, userData);
    } else if (typeof initializeDashboardFeatures === 'function') {
        initializeDashboardFeatures(currentUser, userData);
    }
}

// Initialize profile functionality  
function initializeProfile() {
    if (typeof initializeProfileFeatures === 'function') {
        initializeProfileFeatures(currentUser, userData);
    }
}

// Initialize opportunities functionality
function initializeOpportunities() {
    if (typeof initializeOpportunitiesFeatures === 'function') {
        initializeOpportunitiesFeatures(currentUser, userData);
    }
}

// Initialize events functionality
function initializeEvents() {
    console.log('Initializing events tab...');
    
    // Check if events features are available
    if (typeof initializeEventsFeatures === 'function') {
        // Make sure currentUser and userData are available
        if (currentUser && userData) {
            console.log('Calling initializeEventsFeatures with user:', currentUser.uid);
            // initializeEventsFeatures() already shows + loads the default
            // sub-tab; no follow-up switchEventTab call needed (that caused a
            // second load of the Joined list ~500ms after the first paint).
            initializeEventsFeatures(currentUser, userData);
        } else {
            console.error('User data not available for events initialization');
            showEventsLoginPrompt();
        }
    } else {
        console.error('initializeEventsFeatures function not found - events.js may not be loaded');
        showEventsError();
        
        // Try to load debug info anyway
        setTimeout(() => {
            if (typeof debugUserEvents === 'function') {
                debugUserEvents();
            }
        }, 1000);
    }
}

// Fallback function for events tab switching
function showEventsTab(tabName) {
    console.log('Manual events tab switch to:', tabName);
    
    // Hide all event tab contents
    document.querySelectorAll('.event-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Update event tab buttons
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'text-primary');
        btn.classList.add('border-transparent', 'text-gray-600');
    });
    
    // Show selected event tab
    const selectedEventTab = document.getElementById(`${tabName}Content`);
    const selectedEventBtn = document.querySelector(`[data-event-tab="${tabName}"]`);
    
    if (selectedEventTab) {
        selectedEventTab.classList.remove('hidden');
    }
    
    if (selectedEventBtn) {
        selectedEventBtn.classList.add('active', 'border-primary', 'text-primary');
        selectedEventBtn.classList.remove('border-transparent', 'text-gray-600');
    }
}

// Show login prompt for events tab
function showEventsLoginPrompt() {
    const containers = [
        'joinedEventsContainer',
        'pendingRequestsContainer', 
        'completedEventsContainer',
        'rejectedRequestsContainer'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i data-feather="log-in" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                    <p class="text-lg mb-4">Sign In Required</p>
                    <p class="text-sm mb-4">Please sign in to view your events and requests.</p>
                    <a href="../volunteer-login/volunteer-login.html" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md inline-block">
                        Sign In Now
                    </a>
                </div>
            `;
        }
    });
    feather.replace();
}

// Show error for events tab
function showEventsError() {
    const containers = [
        'joinedEventsContainer',
        'pendingRequestsContainer', 
        'completedEventsContainer',
        'rejectedRequestsContainer'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-red-500">
                    <i data-feather="alert-triangle" class="w-16 h-16 mx-auto mb-4"></i>
                    <p class="text-lg mb-4">Events Feature Error</p>
                    <p class="text-sm mb-4">Unable to load events. Please refresh the page.</p>
                    <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    });
    feather.replace();
}

// Setup event delegation for dynamic content
function setupEventDelegation() {
    console.log('Setting up event delegation...');
    
    // Debug buttons
    document.addEventListener('click', (e) => {
        if (e.target.id === 'debugEventsBtn' || e.target.closest('#debugEventsBtn')) {
            console.log('Debug button clicked');
            if (typeof debugUserEvents === 'function') {
                debugUserEvents();
            } else {
                console.error('debugUserEvents function not available');
                // Fallback debug
                fallbackDebug();
            }
        }
        
        if (e.target.id === 'reloadEventsBtn' || e.target.closest('#reloadEventsBtn')) {
            console.log('Reload button clicked');
            if (typeof loadAllEventsData === 'function') {
                loadAllEventsData();
            } else {
                console.error('loadAllEventsData function not available');
            }
        }
        
        if (e.target.id === 'forceLoadJoinedBtn' || e.target.closest('#forceLoadJoinedBtn')) {
            console.log('Force load joined button clicked');
            if (typeof loadJoinedEvents === 'function') {
                loadJoinedEvents();
            } else {
                console.error('loadJoinedEvents function not available');
            }
        }
    });

    // NOTE: the .event-tab-btn / .view-details-btn / .cancel-request-btn buttons
    // are wired by events.js (setupEventTabListeners + attachEventListeners, via
    // assigned .onclick). A second delegated copy used to live here — it made
    // sub-tabs switch twice, raced the Opportunities "View Details" modal, and
    // prompted a SECOND cancel confirm (calling a non-existent `cancelRequest`).
    // Removed; events.js is the single owner.
}

// Fallback debug function
async function fallbackDebug() {
    console.log('=== FALLBACK DEBUG ===');
    console.log('Current User:', currentUser);
    console.log('User Data:', userData);
    
    if (!currentUser) {
        console.error('No current user');
        return;
    }
    
    try {
        // Check if events.js functions are available
        console.log('Available functions:');
        console.log('- debugUserEvents:', typeof debugUserEvents);
        console.log('- loadAllEventsData:', typeof loadAllEventsData);
        console.log('- loadJoinedEvents:', typeof loadJoinedEvents);
        console.log('- initializeEventsFeatures:', typeof initializeEventsFeatures);
        
        // Manual check of collections
        console.log('=== MANUAL COLLECTION CHECK ===');
        
        // Check eventParticipants
        const participantsSnapshot = await db.collection('eventParticipants')
            .where('userId', '==', currentUser.uid)
            .get();
        console.log('Event Participants:', participantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Check joinRequests
        const requestsSnapshot = await db.collection('joinRequests')
            .where('userId', '==', currentUser.uid)
            .get();
        console.log('Join Requests:', requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Check events collection
        const eventsSnapshot = await db.collection('events').limit(5).get();
        console.log('Sample Events:', eventsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        
    } catch (error) {
        console.error('Fallback debug error:', error);
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', async function() {
    feather.replace();

    setupEventDelegation();
    
    // Initialize tab functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            showModal({
                title: "Session Expired",
                message: "Please log in to access your dashboard."
            });
            setTimeout(() => { window.location.href = "../volunteer-login/volunteer-login.html"; }, 1500);
            return;
        }

        // Ensure email is verified
        if (!user.emailVerified) {
            showModal({
                title: "Email Not Verified",
                message: "Please verify your email before accessing the dashboard."
            });
            setTimeout(() => { window.location.href = "../volunteer-login/volunteer-login.html"; }, 2000);
            return;
        }

        currentUser = user;
        
        // Store user ID in localStorage for consistency
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userEmail', user.email);

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                showModal({
                    title: "Profile Not Found",
                    message: "Your profile data is missing. Please contact support."
                });
                return;
            }

            userData = userDoc.data();
            
            // Use the correct field names from your signup form
            const displayName = userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}`
                : userData.username || "Volunteer";
                
            // Update welcome message
            const welcomeMsg = document.getElementById('welcomeMessage');
            if (welcomeMsg) {
                welcomeMsg.textContent = `Welcome, ${displayName}!`;
            }

            // Initialize current tab - REMOVE the duplicate initializeEventsFeatures call
            const currentTab = document.querySelector('.tab-content.active').id.replace('-tab', '');
            console.log('Current active tab:', currentTab);
            loadTabContent(currentTab);

        } catch (err) {
            console.error('Dashboard error:', err);
            showModal({
                title: "Dashboard Error",
                message: "Could not load your profile data. Please try refreshing."
            });
        }
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');
    const logoutModal = document.getElementById('logoutModal');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutModal.classList.remove('hidden');
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', function() {
            logoutModal.classList.add('hidden');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', function() {
            auth.signOut()
                .then(() => {
                    localStorage.clear();
                    window.location.href = "../index.html";
                })
                .catch((err) => {
                    showModal({
                        title: "Logout Error",
                        message: err.message
                    });
                });
        });
    }

    // Modal functionality
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalOverlay = document.getElementById('centeredModalOverlay');

    if (modalCloseBtn && modalOverlay) {
        modalCloseBtn.addEventListener('click', function() {
            modalOverlay.classList.add('hidden');
        });

        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
    }
});

// Make switchTab available globally
window.switchTab = switchTab;

// NOTE: showModal is defined once in script.js (supports { title, message,
// closeText, onClose }). It used to be re-declared here with a smaller
// signature that dropped onClose — removed so callers like
// opportunities.js submitJoinRequest get their onClose refresh callback.

// Close modal function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Make closeModal available globally
window.closeModal = closeModal;