class AdminDashboardController {
    constructor() {
        this.currentAdmin = null;
        this.isInitialized = false;
        this.auth = null;
        this.db = null;
        // Add feature managers tracking
        this.featureManagers = {
            dashboard: null,
            users: null,
            organizers: null,
            events: null,
            participants: null,
            joinRequests: null  // Add this
        };
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Initialize Firebase auth first
            await this.initializeFirebase();
            
            // Check if user is authenticated and is admin
            await this.checkAdminAuth();
            
            // Initialize all feature modules
            await this.initializeFeatures();
            
            // Setup logout after everything is ready
            this.setupLogout();
            
            this.isInitialized = true;
            console.log('Admin dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.redirectToLogin();
        }
    }

    async initializeFirebase() {
        // Wait for Firebase to be available
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase not loaded');
        }

        // Get auth and firestore instances
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        
        console.log('Firebase initialized:', {
            auth: !!this.auth,
            db: !!this.db,
            currentUser: this.auth.currentUser
        });
    }

    async checkAdminAuth() {
        return new Promise((resolve, reject) => {
            // Use this.auth instead of global auth
            this.auth.onAuthStateChanged(async (user) => {
                console.log('Auth state changed:', user);
                
                if (user) {
                    try {
                        // Check if user is admin
                        const isAdmin = await this.verifyAdminUser(user.uid);
                        if (isAdmin) {
                            this.currentAdmin = user;
                            console.log('Admin user verified:', user.email);
                            resolve(user);
                        } else {
                            console.log('User is not admin:', user.email);
                            reject(new Error('User is not authorized as admin'));
                        }
                    } catch (error) {
                        console.error('Error in admin verification:', error);
                        reject(error);
                    }
                } else {
                    console.log('No user signed in');
                    reject(new Error('No user signed in'));
                }
            }, (error) => {
                console.error('Auth state change error:', error);
                reject(error);
            });
        });
    }

    async verifyAdminUser(uid) {
        try {
            console.log('Verifying admin user:', uid);
            
            // Method 1: Check admin collection
            const adminDoc = await this.db.collection('admins').doc(uid).get();
            if (adminDoc.exists) {
                console.log('User found in admin collection');
                return true;
            }
            
            // Method 2: Check user role in users collection
            const userDoc = await this.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const isAdmin = userData.role === 'admin' || userData.isAdmin === true;
                console.log('User role check:', { role: userData.role, isAdmin });
                return isAdmin;
            }
            
            // Method 3: Check custom claims (if using Firebase Admin SDK)
            // This requires backend implementation
            
            console.log('User not found in admin or users collection');
            return false;
            
        } catch (error) {
            console.error('Error verifying admin user:', error);
            // Fail closed — a verification error must not grant admin access.
            return false;
        }
    }

    async initializeFeatures() {
        console.log('Initializing features...');
        
        // Initialize all feature modules
        if (window.adminDashboard) {
            this.featureManagers.dashboard = window.adminDashboard;
            await window.adminDashboard.init(this.currentAdmin);
        }
        
        if (window.adminUsersManager) {
            this.featureManagers.users = window.adminUsersManager;
            await window.adminUsersManager.init(this.currentAdmin);
        }
        
        if (window.adminOrganizersManager) {
            this.featureManagers.organizers = window.adminOrganizersManager;
            await window.adminOrganizersManager.init(this.currentAdmin);
        }
        
        if (window.adminEventsManager) {
            this.featureManagers.events = window.adminEventsManager;
            await window.adminEventsManager.init(this.currentAdmin);
        }
        
        if (window.adminParticipantsManager) {
            this.featureManagers.participants = window.adminParticipantsManager;
            await window.adminParticipantsManager.init(this.currentAdmin);
        }
        
        // Initialize the new join requests manager
        if (window.adminJoinRequestsManager) {
            this.featureManagers.joinRequests = window.adminJoinRequestsManager;
            await window.adminJoinRequestsManager.init(this.currentAdmin);
        }

        AdminUtils.setupModalCloseOnOutsideClick();

        console.log('All features initialized');
    }

    // Global tab switching - updated
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
                if (this.featureManagers.dashboard) {
                    this.featureManagers.dashboard.loadDashboardData();
                }
                break;
            case 'volunteers':
                if (this.featureManagers.users) {
                    this.featureManagers.users.loadVolunteers();
                }
                break;
            case 'organizers':
                if (this.featureManagers.organizers) {
                    this.featureManagers.organizers.loadOrganizers();
                }
                break;
            case 'events':
                if (this.featureManagers.events) {
                    this.featureManagers.events.loadEvents();
                }
                break;
            case 'participants':
                if (this.featureManagers.joinRequests) {
                    // Initialize with join requests tab active by default
                    const joinRequestsTabBtn = document.querySelector('.participant-tab-btn[data-participant-tab="requests"]');
                    if (joinRequestsTabBtn) {
                        // Use setTimeout to ensure DOM is ready
                        setTimeout(() => {
                            joinRequestsTabBtn.click();
                        }, 100);
                    } else {
                        console.log('Join requests tab button not found, defaulting to participants tab');
                        // Fallback to participants tab
                        const participantsTabBtn = document.querySelector('.participant-tab-btn[data-participant-tab="participants"]');
                        if (participantsTabBtn) {
                            setTimeout(() => {
                                participantsTabBtn.click();
                            }, 100);
                        }
                    }
                }
                break;
            default:
                console.log(`Tab ${tabName} not recognized`);
        }
    }

    // Add a method to switch participant tabs (for internal use)
    switchParticipantTab(tabName) {
        if (this.featureManagers.joinRequests && tabName === 'requests') {
            // The joinRequestsManager will handle its own tab switching
        } else if (this.featureManagers.participants && tabName === 'participants') {
            // The participantsManager will handle its own tab switching
        }
    }

    // Add cleanup method for when switching away from participants tab
    cleanupTab(tabName) {
        switch(tabName) {
            case 'participants':
                // Clean up listeners if needed
                if (this.featureManagers.participants && typeof this.featureManagers.participants.destroy === 'function') {
                    this.featureManagers.participants.destroy();
                }
                if (this.featureManagers.joinRequests && typeof this.featureManagers.joinRequests.destroy === 'function') {
                    this.featureManagers.joinRequests.destroy();
                }
                break;
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Single assigned handler — no addEventListener + onclick pair
            // (that ran handleLogout twice per click).
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                this.handleLogout();
            };
        } else {
            console.error('Logout button not found');
        }
    }

    async handleLogout() {
        try {
            // Show custom confirmation instead of native confirm
            const confirmed = await this.showLogoutConfirmation();
            if (!confirmed) return;

            // Show loading state
            const logoutBtn = document.getElementById('logoutBtn');
            const originalText = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i data-feather="loader" class="animate-spin"></i> Logging out...';
            logoutBtn.disabled = true;

            // Clear ALL authentication states BEFORE signout
            this.clearAllAuthStates();

            // Perform logout
            await this.auth.signOut();

            // Force redirect to homepage with cache busting
            this.redirectToHomepage();
            
        } catch (error) {
            console.error('Error during logout:', error);
            AdminUtils.showToast('Error signing out: ' + error.message, 'error');
            
            // Reset button state
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.innerHTML = '<i data-feather="log-out"></i> Logout';
                logoutBtn.disabled = false;
                feather.replace(); // Refresh icons
            }
        }
    }

    clearAllAuthStates() {
        console.log('Clearing all authentication states...');
        
        // Clear localStorage items
        const itemsToRemove = [
            'isAdmin',
            'adminAuth',
            'organizerUser', 
            'userData',
            'firebase:authUser',
            'firebase:host:iServe-volunteer-connect.firebaseapp.com:authUser'
        ];
        
        itemsToRemove.forEach(item => {
            localStorage.removeItem(item);
            console.log('Removed localStorage item:', item);
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear Firebase auth state (force clear)
        if (this.auth) {
            this.auth.signOut().catch(err => {
                console.log('Firebase signout during cleanup:', err);
            });
        }
        
        // Clear any cookies that might be storing auth state
        this.clearAuthCookies();
        
        console.log('All authentication states cleared');
    }

    // Add method to clear auth cookies
    clearAuthCookies() {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Clear any potential auth-related cookies
            if (name.includes('auth') || name.includes('session') || name.includes('user')) {
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            }
        }
    }

    redirectToHomepage() {
        console.log('Redirecting to homepage...');
        
        // Use replace instead of href to prevent back button issues
        const homepageUrl = '../index.html?' + Date.now(); // Cache busting
        
        // Force a hard redirect and clear history
        window.location.replace(homepageUrl);
        
        // Fallback - if replace doesn't work
        setTimeout(() => {
            window.location.href = homepageUrl;
        }, 1000);
    }

    showLogoutConfirmation() {
        return new Promise((resolve) => {
            AdminUtils.showConfirmation(
                'Confirm Logout',
                'Are you sure you want to logout from the admin dashboard?',
                () => resolve(true)
            );
            
            // Also handle the cancel case
            const cancelBtn = document.querySelector('#confirmationModal .bg-gray-500');
            if (cancelBtn) {
                const originalOnClick = cancelBtn.onclick;
                cancelBtn.onclick = () => {
                    AdminUtils.closeModal('confirmationModal');
                    resolve(false);
                };
            }
        });
    }

    redirectToLogin() {
        // Redirect to login page, not homepage
        window.location.href = '../index.html';
    }

    // NOTE: switchTab is defined once above (the full version that also calls
    // loadTabData). A second stub used to be declared here and silently
    // overrode it — removed.
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing admin dashboard...');
    
    try {
        const adminDashboard = new AdminDashboardController();
        await adminDashboard.init();
        
        // Make globally accessible
        window.adminDashboardController = adminDashboard;
        
        console.log('Admin dashboard controller initialized successfully');
    } catch (error) {
        console.error('Failed to initialize admin dashboard controller:', error);
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Make tab switching available globally
window.switchTab = (tabName) => {
    if (window.adminDashboardController) {
        window.adminDashboardController.switchTab(tabName);
    }
};