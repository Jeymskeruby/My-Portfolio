// Dashboard feature module
class DashboardManager {
    constructor() {
        this.currentOrganizer = null;
        this.events = [];
        this.notifications = [];
        this.recentEvents = [];
        this.allNotifications = []; // Store all notifications for the center
        this.notificationFilter = 'all'; // Current filter
    }

    init(currentOrganizer) {
        this.currentOrganizer = currentOrganizer;
        this.loadDashboardData();
        this.setupEventListeners();
        this.setupNotificationsCenter();
    }

    setupEventListeners() {
        // Notification bell
        document.getElementById('notificationBell').addEventListener('click', () => this.showNotificationsCenter());
        
        // Clear notifications
        const clearNotificationsBtn = document.querySelector('[onclick="clearAllNotifications()"]');
        if (clearNotificationsBtn) {
            clearNotificationsBtn.onclick = () => this.clearAllNotifications();
        }
    }

    setupNotificationsCenter() {
        // Mark all as read button
        document.getElementById('markAllAsRead').addEventListener('click', () => this.markAllAsRead());
        
        // Notification filter tabs
        document.querySelectorAll('.notification-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-notification-tab');
                this.switchNotificationTab(tabName);
            });
        });
    }

    switchNotificationTab(tabName) {
        this.notificationFilter = tabName;
        
        // Update active tab
        document.querySelectorAll('.notification-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-gray-600');
        });
        
        const activeBtn = document.querySelector(`[data-notification-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary', 'text-primary');
            activeBtn.classList.remove('border-transparent', 'text-gray-600');
        }
        
        // Filter and display notifications
        this.displayFilteredNotifications();
    }

    async loadDashboardData() {
        await this.loadOrganizerStats();
        await this.loadRecentEvents();
        await this.loadNotifications();
        await this.loadAllNotifications(); // Load all notifications for the center
    }

    async loadOrganizerStats() {
        const organizerId = this.currentOrganizer.uid;
        
        try {
            // Load events count
            const eventsSnapshot = await db.collection('events')
                .where('organizerId', '==', organizerId)
                .get();
            document.getElementById('totalEvents').textContent = eventsSnapshot.size;

            // Load volunteers count
            const volunteersSnapshot = await db.collection('eventParticipants')
                .where('organizerId', '==', organizerId)
                .get();
            document.getElementById('totalVolunteers').textContent = volunteersSnapshot.size;

            // Load pending requests count
            const pendingRequestsSnapshot = await db.collection('joinRequests')
                .where('organizerId', '==', organizerId)
                .where('status', '==', 'pending')
                .get();
            document.getElementById('pendingRequests').textContent = pendingRequestsSnapshot.size;

            // Calculate completion rate (simplified)
            const completedEvents = eventsSnapshot.docs.filter(doc => 
                doc.data().status === 'completed'
            ).length;
            const completionRate = eventsSnapshot.size > 0 ? 
                Math.round((completedEvents / eventsSnapshot.size) * 100) : 0;
            document.getElementById('completionRate').textContent = `${completionRate}%`;

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            DashboardUtils.showToast('Error loading dashboard data', 'error');
        }
    }

    async loadRecentEvents() {
        const recentEventsList = document.getElementById('recentEventsList');
        const organizerId = this.currentOrganizer.uid;
        
        try {
            const snapshot = await db.collection('events')
                .where('organizerId', '==', organizerId)
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();

            this.recentEvents = [];
            snapshot.forEach(doc => {
                this.recentEvents.push({ id: doc.id, ...doc.data() });
            });

            if (this.recentEvents.length === 0) {
                recentEventsList.innerHTML = this.getEmptyStateHTML('calendar', 'No events created yet');
            } else {
                recentEventsList.innerHTML = this.recentEvents.map(event => `
                    <div class="border-b border-gray-200 py-3 last:border-b-0">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-gray-800">${event.name}</h4>
                                <p class="text-sm text-gray-600">${DashboardUtils.formatDate(event.startTime)}</p>
                                <span class="inline-block px-2 py-1 text-xs rounded-full ${DashboardUtils.getStatusBadgeClass(event.status)}">
                                    ${event.status}
                                </span>
                            </div>
                            <button data-event-id="${event.id}" class="view-event-btn text-primary hover:text-secondary text-sm font-medium">
                                View
                            </button>
                        </div>
                    </div>
                `).join('');
                
                this.setupRecentEventsListeners();
            }
            feather.replace();
        } catch (error) {
            console.error('Error loading recent events:', error);
            recentEventsList.innerHTML = this.getErrorStateHTML('Error loading events');
        }
    }

    setupRecentEventsListeners() {
        const viewButtons = document.querySelectorAll('.view-event-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const eventId = e.target.getAttribute('data-event-id');
                this.viewRecentEvent(eventId);
            });
        });
    }

    viewRecentEvent(eventId) {
        if (window.eventsManager && typeof window.eventsManager.viewEventDetails === 'function') {
            window.eventsManager.viewEventDetails(eventId);
        } else {
            const event = this.recentEvents.find(e => e.id === eventId);
            if (event) {
                const modalContent = `
                    <h3 class="text-lg font-semibold mb-4">${event.name}</h3>
                    <div class="space-y-3">
                        <p><strong>Description:</strong> ${event.description}</p>
                        <p><strong>Location:</strong> ${event.location}</p>
                        <p><strong>Start:</strong> ${DashboardUtils.formatDate(event.startTime)}</p>
                        <p><strong>End:</strong> ${DashboardUtils.formatDate(event.endTime)}</p>
                        <p><strong>Status:</strong> <span class="inline-block px-2 py-1 text-xs rounded-full ${DashboardUtils.getStatusBadgeClass(event.status)}">${event.status}</span></p>
                    </div>
                `;
                
                DashboardUtils.showCustomModal('Event Details', modalContent);
            }
        }
    }

    async loadNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        const organizerId = this.currentOrganizer.uid;
        
        try {
            const snapshot = await db.collection('organizerNotifications')  // ✅ NEW COLLECTION
                .where('organizerId', '==', organizerId)
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });

            if (notifications.length === 0) {
                notificationsList.innerHTML = this.getEmptyStateHTML('bell', 'No new notifications');
            } else {
                notificationsList.innerHTML = notifications.map(notification => 
                    this.createNotificationItem(notification)
                ).join('');
            }
            feather.replace();
            
            // Update notification count
            this.updateNotificationCount(notifications);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            notificationsList.innerHTML = this.getErrorStateHTML('Error loading notifications');
        }
    }

    async loadAllNotifications() {
        const organizerId = this.currentOrganizer.uid;
        
        try {
            const snapshot = await db.collection('organizerNotifications')  // ✅ NEW COLLECTION
                .where('organizerId', '==', organizerId)
                .orderBy('createdAt', 'desc')
                .get();

            this.allNotifications = [];
            snapshot.forEach(doc => {
                this.allNotifications.push({ id: doc.id, ...doc.data() });
            });

            // Update notification count
            this.updateNotificationCount(this.allNotifications);
            
        } catch (error) {
            console.error('Error loading all notifications:', error);
        }
    }

    updateNotificationCount(notifications) {
        const unreadCount = notifications.filter(n => !n.read).length;
        const notificationCount = document.getElementById('notificationCount');
        
        if (unreadCount > 0) {
            notificationCount.textContent = unreadCount;
            notificationCount.classList.remove('hidden');
        } else {
            notificationCount.classList.add('hidden');
        }
    }

    createNotificationItem(notification) {
        const { icon, color, actionText } = this.getNotificationTypeInfo(notification.type);
        const timeAgo = this.formatTimeAgo(notification.createdAt?.toDate ? notification.createdAt.toDate() : new Date());

        return `
            <div class="border-b border-gray-200 py-3 last:border-b-0 hover:bg-gray-50 transition-colors">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i data-feather="${icon}" class="w-4 h-4 text-${color}-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">${notification.title || 'Notification'}</p>
                        <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                        <div class="flex justify-between items-center mt-2">
                            <p class="text-xs text-gray-500">${timeAgo}</p>
                            ${actionText ? `
                                <button onclick="window.dashboardManager.handleNotificationAction('${notification.id}', '${notification.type}')" 
                                        class="text-xs text-primary hover:text-secondary font-medium">
                                    ${actionText}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    ${!notification.read ? `
                        <div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getNotificationTypeInfo(type) {
        const types = {
            'request_approved': { icon: 'user-check', color: 'green', actionText: 'View Event', category: 'volunteers' },
            'request_rejected': { icon: 'user-x', color: 'red', actionText: 'View Requests', category: 'volunteers' },
            'volunteer_left': { icon: 'log-out', color: 'orange', actionText: 'View Event', category: 'volunteers' },
            'removed_from_event': { icon: 'user-minus', color: 'red', actionText: 'Manage Volunteers', category: 'volunteers' },
            'volunteer_joined': { icon: 'user-plus', color: 'green', actionText: 'View Participants', category: 'volunteers' },
            'new_join_request': { icon: 'user-plus', color: 'blue', actionText: 'Review Request', category: 'volunteers' },
            'join_request': { icon: 'user-plus', color: 'blue', actionText: 'Review Request', category: 'volunteers' },
            'event_approved': { icon: 'check-circle', color: 'green', actionText: 'View Event', category: 'events' },
            'event_rejected': { icon: 'x-circle', color: 'red', actionText: 'View Event', category: 'events' },
            'event_reminder': { icon: 'clock', color: 'blue', actionText: 'View Event', category: 'events' },
            'event_cancelled': { icon: 'alert-triangle', color: 'orange', actionText: 'View Details', category: 'events' },
            'profile_approved': { icon: 'check-circle', color: 'green', actionText: 'View Profile', category: 'profile' },
            'profile_rejected': { icon: 'x-circle', color: 'red', actionText: 'Edit Profile', category: 'profile' }
        };
        
        return types[type] || { icon: 'bell', color: 'blue', actionText: '', category: 'other' };
    }

    formatTimeAgo(date) {
        if (!date) return 'Just now';
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return DashboardUtils.formatDate(date);
    }

    async handleNotificationAction(notificationId, type) {
        try {
            // Mark notification as read
            await db.collection('organizerNotifications').doc(notificationId).update({
                read: true
            });

            // Handle different actions based on notification type
            switch(type) {
                case 'volunteer_left':
                case 'request_approved':
                case 'volunteer_joined':
                case 'event_approved':
                case 'event_rejected':
                case 'event_reminder':
                case 'event_cancelled':
                    // Navigate to events tab
                    if (window.organizerDashboard) {
                        window.organizerDashboard.switchTab('events');
                    }
                    break;
                case 'new_join_request':
                case 'request_rejected':
                case 'removed_from_event':
                    // Navigate to volunteers tab
                    if (window.organizerDashboard) {
                        window.organizerDashboard.switchTab('volunteers');
                    }
                    break;
                case 'profile_approved':
                case 'profile_rejected':
                    // Navigate to profile tab
                    if (window.organizerDashboard) {
                        window.organizerDashboard.switchTab('profile');
                    }
                    break;
            }

            // Close notifications center if open
            DashboardUtils.closeModal('notificationsCenterModal');

            // Reload notifications
            await this.loadNotifications();
            await this.loadAllNotifications();

        } catch (error) {
            console.error('Error handling notification action:', error);
        }
    }

    showNotificationsCenter() {
        this.loadAllNotifications().then(() => {
            this.displayFilteredNotifications();
            DashboardUtils.openModal('notificationsCenterModal');
        });
    }

    displayFilteredNotifications() {
        const content = document.getElementById('notificationsCenterContent');
        const summary = document.getElementById('notificationsSummary');
        
        let filteredNotifications = this.allNotifications;
        
        // Apply filters
        switch(this.notificationFilter) {
            case 'unread':
                filteredNotifications = this.allNotifications.filter(n => !n.read);
                break;
            case 'events':
                filteredNotifications = this.allNotifications.filter(n => 
                    this.getNotificationTypeInfo(n.type).category === 'events'
                );
                break;
            case 'volunteers':
                filteredNotifications = this.allNotifications.filter(n => 
                    this.getNotificationTypeInfo(n.type).category === 'volunteers'
                );
                break;
        }
        
        // Update summary
        const total = this.allNotifications.length;
        const unread = this.allNotifications.filter(n => !n.read).length;
        const filteredCount = filteredNotifications.length;
        summary.textContent = `${filteredCount} notifications (${unread} unread)`;
        
        if (filteredNotifications.length === 0) {
            content.innerHTML = this.getEmptyNotificationsState();
        } else {
            content.innerHTML = filteredNotifications.map(notification => 
                this.createNotificationCenterItem(notification)
            ).join('');
        }
        
        feather.replace();
    }

    createNotificationCenterItem(notification) {
        const { icon, color, actionText } = this.getNotificationTypeInfo(notification.type);
        const timeAgo = this.formatTimeAgo(notification.createdAt?.toDate ? notification.createdAt.toDate() : new Date());
        const isUnread = !notification.read;

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow ${isUnread ? 'bg-blue-50 border-blue-200' : ''}">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i data-feather="${icon}" class="w-5 h-5 text-${color}-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <h4 class="font-semibold text-gray-800">${notification.title || 'Notification'}</h4>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                        </div>
                        <p class="text-gray-600 mt-1">${notification.message}</p>
                        ${actionText ? `
                            <div class="flex justify-between items-center mt-3">
                                <button onclick="window.dashboardManager.handleNotificationAction('${notification.id}', '${notification.type}')" 
                                        class="text-sm text-primary hover:text-secondary font-medium">
                                    ${actionText}
                                </button>
                                ${isUnread ? `
                                    <button onclick="window.dashboardManager.markAsRead('${notification.id}')" 
                                            class="text-xs text-gray-500 hover:text-gray-700">
                                        Mark as read
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getEmptyNotificationsState() {
        const messages = {
            'all': 'No notifications yet',
            'unread': 'No unread notifications',
            'events': 'No event notifications',
            'volunteers': 'No volunteer notifications'
        };
        
        const message = messages[this.notificationFilter] || 'No notifications';
        
        return `
            <div class="text-center py-12 text-gray-500">
                <i data-feather="bell-off" class="w-16 h-16 mx-auto mb-4 text-gray-400"></i>
                <p class="text-lg">${message}</p>
                <p class="text-sm mt-2">You're all caught up!</p>
            </div>
        `;
    }

    async markAsRead(notificationId) {
        try {
            await db.collection('organizerNotifications').doc(notificationId).update({
                read: true
            });

            // Reload notifications — await so the re-render sees fresh data
            await this.loadNotifications();
            await this.loadAllNotifications();
            this.displayFilteredNotifications();

        } catch (error) {
            console.error('Error marking notification as read:', error);
            DashboardUtils.showToast('Error marking notification as read', 'error');
        }
    }

    async markAllAsRead() {
        try {
            const unreadNotifications = this.allNotifications.filter(n => !n.read);
            
            if (unreadNotifications.length === 0) {
                DashboardUtils.showToast('All notifications are already read', 'info');
                return;
            }
            
            const batch = db.batch();
            unreadNotifications.forEach(notification => {
                const notificationRef = db.collection('organizerNotifications').doc(notification.id);
                batch.update(notificationRef, { read: true });
            });
            
            await batch.commit();
            DashboardUtils.showToast(`Marked ${unreadNotifications.length} notifications as read`, 'success');

            // Reload notifications — await so the re-render sees fresh data
            await this.loadNotifications();
            await this.loadAllNotifications();
            this.displayFilteredNotifications();

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            DashboardUtils.showToast('Error marking notifications as read', 'error');
        }
    }

    async clearAllNotifications() {
        if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            try {
                const batch = db.batch();
                this.allNotifications.forEach(notification => {
                    const notificationRef = db.collection('organizerNotifications').doc(notification.id);
                    batch.delete(notificationRef);
                });
                
                await batch.commit();
                DashboardUtils.showToast('All notifications cleared', 'success');

                // Reload notifications
                await this.loadNotifications();
                await this.loadAllNotifications();
                if (document.getElementById('notificationsCenterModal').classList.contains('hidden') === false) {
                    this.displayFilteredNotifications();
                }
                
            } catch (error) {
                console.error('Error clearing notifications:', error);
                DashboardUtils.showToast('Error clearing notifications', 'error');
            }
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

    getErrorStateHTML(message) {
        return `
            <div class="text-center py-8 text-red-500">
                <i data-feather="alert-triangle" class="w-12 h-12 mx-auto mb-4"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Make globally accessible
window.dashboardManager = new DashboardManager();