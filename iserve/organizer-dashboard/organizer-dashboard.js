// Main dashboard controller - orchestrates all features
class OrganizerDashboard {
    constructor() {
        this.currentOrganizer = null;
        this.features = {
            dashboard: null,
            events: null,
            volunteers: null,
            profile: null
        };
    }

    async init() {
        try {
            console.log('🚀 Initializing Organizer Dashboard...');
            
            // Initialize Firebase and check authentication
            await this.initializeAuth();
            
            // Initialize all features
            await this.initializeFeatures();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            // Set up real-time listeners
            this.setupRealTimeListeners();
            
            // Load initial data
            this.loadInitialData();
            
            console.log('✅ Organizer Dashboard initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.redirectToLogin();
        }
    }

    async initializeAuth() {
        console.log('🔐 Checking authentication...');
        
        // Get organizer from localStorage
        const organizerUser = localStorage.getItem('organizerUser');
        if (!organizerUser) {
            throw new Error('No organizer user found in localStorage');
        }

        let userData;
        try {
            userData = JSON.parse(organizerUser);
            this.currentOrganizer = userData;
            console.log('📋 Organizer data:', userData);
        } catch (error) {
            console.error('Error parsing organizer user data:', error);
            throw new Error('Invalid organizer data');
        }

        // Verify Firebase auth state matches localStorage
        return new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged((user) => {
                if (!user) {
                    console.log('No Firebase user found');
                    reject(new Error('No Firebase user'));
                    return;
                }

                if (user.uid !== userData.uid) {
                    console.log('User ID mismatch between Firebase and localStorage');
                    reject(new Error('User ID mismatch'));
                    return;
                }

                console.log('✅ User authenticated successfully');
                resolve(userData);
            });
        });
    }

    async initializeFeatures() {
        console.log('🛠️ Initializing features...');
        
        // Initialize dashboard feature
        this.features.dashboard = new DashboardManager();
        this.features.dashboard.init(this.currentOrganizer);

        // Initialize events feature
        this.features.events = new EventsManager();
        this.features.events.init(this.currentOrganizer);

        // Initialize volunteers feature
        this.features.volunteers = new VolunteersManager();
        this.features.volunteers.init(this.currentOrganizer);

        // Initialize profile feature
        this.features.profile = new ProfileManager();
        this.features.profile.init(this.currentOrganizer);
        
        console.log('✅ All features initialized');
    }

    setupGlobalEventListeners() {
        console.log('🔗 Setting up global event listeners...');
        
        // Tab management
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.openModal('logoutModal');
        });

        document.getElementById('cancelLogout').addEventListener('click', () => {
            this.closeModal('logoutModal');
        });

        document.getElementById('confirmLogout').addEventListener('click', () => {
            this.performLogout();
        });

        // Quick action buttons - fix the onclick handlers
        const quickActionButtons = document.querySelectorAll('[onclick^="switchTab"]');
        quickActionButtons.forEach(btn => {
            const originalOnClick = btn.getAttribute('onclick');
            btn.removeAttribute('onclick');
            btn.addEventListener('click', () => {
                const tabName = originalOnClick.match(/switchTab\('([^']+)'\)/)[1];
                this.switchTab(tabName);
            });
        });

        // Feather icons refresh — replace icons whenever new [data-feather]
        // nodes are inserted, instead of polling feather.replace() every second.
        if (typeof MutationObserver !== 'undefined') {
            let pending = false;
            const observer = new MutationObserver(() => {
                if (pending) return;
                pending = true;
                requestAnimationFrame(() => {
                    pending = false;
                    if (typeof feather !== 'undefined') feather.replace();
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    setupRealTimeListeners() {
        const organizerId = this.currentOrganizer.uid;
        console.log('📡 Setting up real-time listeners for organizer:', organizerId);
        
        // Listen for notifications count
        firebase.firestore().collection('organizerNotifications')  // ✅ NEW COLLECTION
            .where('organizerId', '==', organizerId)
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                const unreadCount = snapshot.size;
                const notificationCount = document.getElementById('notificationCount');
                
                if (unreadCount > 0 && notificationCount) {
                    notificationCount.textContent = unreadCount;
                    notificationCount.classList.remove('hidden');
                } else if (notificationCount) {
                    notificationCount.classList.add('hidden');
                }
            });
    }

    loadInitialData() {
        console.log('📊 Loading initial data...');
        // Load organizer data for header
        this.loadOrganizerHeaderData();
    }

    async loadOrganizerHeaderData() {
        try {
            const doc = await firebase.firestore().collection('organizers').doc(this.currentOrganizer.uid).get();
            if (doc.exists) {
                const organizerData = doc.data();
                console.log('📋 Organizer header data:', organizerData);
                
                // Update header with organizer data
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

                // Update status
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
        } catch (error) {
            console.error('Error loading organizer header data:', error);
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-gray-600');
        });
        
        // Show selected tab content
        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Activate selected tab button
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary', 'text-primary');
            activeBtn.classList.remove('border-transparent', 'text-gray-600');
        }
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'dashboard':
                if (this.features.dashboard) {
                    this.features.dashboard.loadDashboardData();
                }
                break;
            case 'events':
                if (this.features.events) {
                    this.features.events.loadEvents();
                }
                break;
            case 'volunteers':
                if (this.features.volunteers) {
                    // Activate the default sub-tab so its content/empty-state
                    // isn't stale on first entry (data itself arrives via the
                    // joinRequests snapshot).
                    this.features.volunteers.switchVolunteerTab('requests');
                }
                break;
            case 'profile':
                if (this.features.profile) {
                    this.features.profile.loadProfile();
                }
                break;
        }
    }

    // Utility methods
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

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    redirectToLogin() {
        console.log('🔒 Redirecting to login...');
        localStorage.removeItem('organizerUser');
        firebase.auth().signOut().catch(console.error);
        window.location.href = '../organizer-login/organizer-login.html';
    }

    async performLogout() {
        console.log('🚪 Performing logout...');
        const logoutBtn = document.getElementById('confirmLogout');
        const originalText = logoutBtn?.textContent;
        
        if (logoutBtn) {
            logoutBtn.textContent = 'Logging out...';
            logoutBtn.disabled = true;
        }

        try {
            await firebase.auth().signOut();
            localStorage.removeItem('organizerUser');
            this.showToast('Logout successful! Redirecting...', 'info');
            
            setTimeout(() => {
                window.location.href = '../organizer-login/organizer-login.html';
            }, 1500);
            
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('organizerUser');
            this.showToast('Logged out successfully!', 'info');
            
            setTimeout(() => {
                window.location.href = '../organizer-login/organizer-login.html';
            }, 1500);
        }
    }

    showToast(message, type = 'info') {
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

// Global functions for HTML onclick attributes
function switchTab(tabName) {
    if (window.organizerDashboard) {
        window.organizerDashboard.switchTab(tabName);
    }
}

function viewEvent(eventId) {
    if (window.organizerDashboard) {
        window.organizerDashboard.showToast(`Viewing event: ${eventId}`, 'info');
    }
}

function closeModal(modalId) {
    if (window.organizerDashboard) {
        window.organizerDashboard.closeModal(modalId);
    }
}

function openModal(modalId) {
    if (window.organizerDashboard) {
        window.organizerDashboard.openModal(modalId);
    }
}

function clearAllNotifications() {
    if (window.organizerDashboard && window.organizerDashboard.features.dashboard) {
        window.organizerDashboard.features.dashboard.clearAllNotifications();
    }
}

// When switching tabs or leaving the page
function cleanupEventsManager() {
    if (window.eventsManager) {
        eventsManager.destroy();
    }
}

// Call this when switching away from events tab or page unload
window.addEventListener('beforeunload', cleanupEventsManager);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🏠 DOM Content Loaded - Initializing dashboard...');
    
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Create and initialize the dashboard
    window.organizerDashboard = new OrganizerDashboard();
    await window.organizerDashboard.init();

    // Make feature managers available globally for HTML onclick handlers
    window.dashboardManager = window.organizerDashboard.features.dashboard;
    window.eventsManager = window.organizerDashboard.features.events;
    window.volunteersManager = window.organizerDashboard.features.volunteers;
    window.profileManager = window.organizerDashboard.features.profile;
    
    console.log('🎉 Dashboard initialization complete!');
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (window.organizerDashboard) {
        const modals = ['createEventModal', 'rejectionModal', 'removalModal', 'logoutModal'];
        modals.forEach(modalId => {
            if (e.target.id === modalId) {
                window.organizerDashboard.closeModal(modalId);
            }
        });
    }
});