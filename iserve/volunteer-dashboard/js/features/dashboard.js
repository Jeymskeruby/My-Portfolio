// Dashboard feature module for Volunteers
class VolunteerDashboardManager {
    constructor() {
        this.currentUser = null;
        this.events = [];
        this.notifications = [];
        this.allNotifications = [];
        this.notificationFilter = 'all';
    }

    init(currentUser, userData) {
        this.currentUser = currentUser;
        this.setupEventListeners();
        this.setupNotificationsCenter();
        this.loadDashboardData(userData);
    }

    // init() re-runs on every Dashboard-tab visit, so these use assigned
    // handlers (.onclick), not addEventListener, to avoid stacking copies.
    setupEventListeners() {
        const bell = document.getElementById('notificationBell');
        if (bell) bell.onclick = () => this.showNotificationsCenter();

        // Clear notifications button in dashboard
        const clearNotificationsBtn = document.querySelector('[onclick="clearAllNotifications()"]');
        if (clearNotificationsBtn) {
            clearNotificationsBtn.onclick = () => this.clearAllNotifications();
        }
    }

    setupNotificationsCenter() {
        const markAll = document.getElementById('markAllAsRead');
        if (markAll) markAll.onclick = () => this.markAllAsRead();

        // Notification filter tabs
        document.querySelectorAll('.notification-tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                const tabName = e.currentTarget.getAttribute('data-notification-tab');
                this.switchNotificationTab(tabName);
            };
        });
    }

    async loadDashboardData(userData) {
        await this.updateDashboardStats(this.currentUser.uid, userData);
        await this.loadUpcomingEvents(this.currentUser.uid, userData);
        await this.loadNotifications(this.currentUser.uid, userData);
        await this.loadAllNotifications(this.currentUser.uid);
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

    async updateDashboardStats(userId, userData) {
        try {
            console.log('Updating dashboard stats for user:', userId);
            
            let totalEvents = 0;
            let completedEvents = 0;
            let pendingApplications = 0;
            let totalHours = 0;

            // Get stats from collections
            const stats = await this.getVolunteerStats(userId);
            
            totalEvents = stats.totalEvents;
            completedEvents = stats.completedEvents;
            pendingApplications = stats.pendingApplications;
            totalHours = stats.totalHours;

            console.log('Final stats:', { totalEvents, completedEvents, pendingApplications, totalHours });
            
            // Update UI
            this.updateStatsUI(totalEvents, totalHours, completedEvents, pendingApplications);
            
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
            this.updateStatsUI(0, 0, 0, 0);
        }
    }

    async getVolunteerStats(userId) {
        const result = {
            totalEvents: 0,
            completedEvents: 0,
            pendingApplications: 0,
            totalHours: 0
        };

        try {
            // Get approved events count from eventParticipants
            const participantsSnapshot = await db.collection('eventParticipants')
                .where('userId', '==', userId)
                .where('status', '==', 'approved')
                .get();
            
            result.totalEvents = participantsSnapshot.size;

            // Count completed events
            if (result.totalEvents > 0) {
                const completionChecks = participantsSnapshot.docs.map(async (doc) => {
                    const participantData = doc.data();
                    try {
                        const eventDoc = await db.collection('events').doc(participantData.eventId).get();
                        if (eventDoc.exists) {
                            const eventData = eventDoc.data();
                            const eventEndTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
                            return eventEndTime < new Date();
                        }
                    } catch (error) {
                        console.log('Error checking event completion:', error);
                    }
                    return false;
                });
                
                const completionResults = await Promise.all(completionChecks);
                result.completedEvents = completionResults.filter(isCompleted => isCompleted).length;
            }

            // Get pending applications count
            const requestsSnapshot = await db.collection('joinRequests')
                .where('userId', '==', userId)
                .where('status', '==', 'pending')
                .get();
            
            result.pendingApplications = requestsSnapshot.size;

            // Calculate hours (4 hours per completed event as example)
            result.totalHours = result.completedEvents * 4;

        } catch (error) {
            console.log('Error getting volunteer stats:', error);
            // Fallback to user document if collections fail
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                result.totalEvents = userData.joinedEvents?.length || 0;
                result.completedEvents = Math.floor(result.totalEvents * 0.3);
                result.pendingApplications = userData.pendingApplications?.length || 0;
                result.totalHours = result.completedEvents * 4;
            }
        }

        return result;
    }

    updateStatsUI(totalEvents, totalHours, completedEvents, pendingApplications) {
        const totalEventsEl = document.getElementById('totalEvents');
        const totalHoursEl = document.getElementById('totalHours');
        const completedEventsEl = document.getElementById('completedEvents');
        const pendingApplicationsEl = document.getElementById('pendingApplications');
        
        if (totalEventsEl) totalEventsEl.textContent = totalEvents;
        if (totalHoursEl) totalHoursEl.textContent = totalHours;
        if (completedEventsEl) completedEventsEl.textContent = completedEvents;
        if (pendingApplicationsEl) pendingApplicationsEl.textContent = pendingApplications;
    }

    async loadUpcomingEvents(userId, userData) {
        try {
            const events = await this.getUpcomingEvents(userId);
            this.renderUpcomingEvents(events);
        } catch (error) {
            console.error('Error loading upcoming events:', error);
            this.renderUpcomingEvents([]);
        }
    }

    async getUpcomingEvents(userId) {
        const events = [];

        try {
            // Get approved events from eventParticipants
            const participantsSnapshot = await db.collection('eventParticipants')
                .where('userId', '==', userId)
                .where('status', '==', 'approved')
                .get();

            if (!participantsSnapshot.empty) {
                const eventPromises = participantsSnapshot.docs.map(async (doc) => {
                    const participantData = doc.data();
                    try {
                        const eventDoc = await db.collection('events').doc(participantData.eventId).get();
                        if (eventDoc.exists) {
                            const eventData = eventDoc.data();
                            const eventEndTime = eventData.endTime?.toDate ? eventData.endTime.toDate() : new Date(eventData.endTime);
                            
                            if (eventEndTime > new Date() && eventData.status === 'approved') {
                                return {
                                    id: eventDoc.id,
                                    ...eventData
                                };
                            }
                        }
                    } catch (error) {
                        console.log('Error fetching event from participant:', error);
                    }
                    return null;
                });

                const eventResults = await Promise.all(eventPromises);
                const validEvents = eventResults.filter(event => event !== null);
                
                // Sort by start time
                validEvents.sort((a, b) => {
                    const timeA = a.startTime?.toDate ? a.startTime.toDate() : new Date(a.startTime);
                    const timeB = b.startTime?.toDate ? b.startTime.toDate() : new Date(b.startTime);
                    return timeA - timeB;
                });

                events.push(...validEvents.slice(0, 5));
            }

        } catch (error) {
            console.log('Error getting upcoming events:', error);
        }

        return events;
    }

    renderUpcomingEvents(events) {
        const eventsList = document.getElementById('upcomingEventsList');
        if (!eventsList) return;
        
        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-feather="calendar" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
                    <p>No upcoming events</p>
                    <p class="text-sm mt-2">Join events to see them here.</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        eventsList.innerHTML = events.map(event => {
            const startTime = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
            const endTime = event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime);
            const formattedDate = startTime.toLocaleDateString();
            const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="border-b border-gray-200 py-4 last:border-b-0">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 mb-1">${event.name}</h4>
                            <p class="text-sm text-gray-600 mb-1">${formattedDate}</p>
                            <p class="text-sm text-gray-500 mb-1">${formattedStartTime} - ${formattedEndTime}</p>
                            <p class="text-sm text-gray-500">${event.location || 'Location not specified'}</p>
                        </div>
                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap ml-2">
                            Joined
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        feather.replace();
    }

    async loadNotifications(userId, userData) {
        try {
            await this.loadAllNotifications(userId);
            this.renderNotifications(this.allNotifications.slice(0, 5)); // Show only 5 in dashboard
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.renderNotifications([]);
        }
    }

    async loadAllNotifications(userId) {
        try {
            console.log('Loading notifications for user:', userId);
            
            // Change from 'notifications' to 'volunteerNotifications'
            const snapshot = await db.collection('volunteerNotifications')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();

            this.allNotifications = [];
            snapshot.forEach(doc => {
                this.allNotifications.push({ id: doc.id, ...doc.data() });
            });

            console.log('Loaded notifications:', this.allNotifications.length);
            
            // Update notification count
            this.updateNotificationCount(this.allNotifications);
            
        } catch (error) {
            console.error('Error loading all notifications:', error);
            
            // Handle specific permission errors
            if (error.code === 'permission-denied') {
                console.warn('Permission denied for notifications. Check Firestore rules.');
                // Show user-friendly message
                DashboardUtils.showToast('Unable to load notifications due to permissions', 'warning');
            }
            
            this.allNotifications = [];
            
            // Update UI to show empty state
            this.updateNotificationCount([]);
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

    renderNotifications(notifications) {
        const notificationsList = document.getElementById('notificationsList');
        
        if (!notificationsList) return;
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-feather="bell" class="w-12 h-12 mx-auto mb-4 text-gray-400"></i>
                    <p>No new notifications</p>
                    <p class="text-sm mt-2">You're all caught up!</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        notificationsList.innerHTML = notifications.map(notification => 
            this.createNotificationItem(notification)
        ).join('');
        
        feather.replace();
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
                                <button onclick="volunteerDashboard.handleNotificationAction('${notification.id}', '${notification.type}')" 
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
            'request_approved': { icon: 'user-check', color: 'green', actionText: 'View Event', category: 'events' },
            'request_rejected': { icon: 'user-x', color: 'red', actionText: 'View Details', category: 'applications' },
            'removed_from_event': { icon: 'user-minus', color: 'red', actionText: 'View Details', category: 'events' },
            'event_cancelled': { icon: 'alert-triangle', color: 'orange', actionText: 'View Details', category: 'events' },
            'event_reminder': { icon: 'clock', color: 'blue', actionText: 'View Event', category: 'events' },
            'new_event_match': { icon: 'calendar', color: 'green', actionText: 'Browse Events', category: 'events' },
            'application_sent': { icon: 'send', color: 'blue', actionText: 'View Applications', category: 'applications' },
            'profile_updated': { icon: 'user', color: 'green', actionText: 'View Profile', category: 'profile' },
            'welcome': { icon: 'star', color: 'purple', actionText: 'Get Started', category: 'system' }
        };
        
        return types[type] || { icon: 'bell', color: 'blue', actionText: '', category: 'system' };
    }

    formatTimeAgo(date) {
        if (!date) return 'Just now';
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    async handleNotificationAction(notificationId, type) {
        try {
            // Mark notification as read
            await db.collection('volunteerNotifications').doc(notificationId).update({
                read: true
            });

            // Navigate to the relevant tab. The global switchTab() is defined
            // in volunteer-dashboard.js (window.volunteerDashboard is the
            // feature manager and has no switchTab of its own).
            const go = (tab) => { if (typeof window.switchTab === 'function') window.switchTab(tab); };
            switch(type) {
                case 'request_approved':
                case 'event_reminder':
                case 'event_cancelled':
                case 'new_event_match':
                case 'request_rejected':
                case 'application_sent':
                    go('events');
                    break;
                case 'profile_updated':
                    go('profile');
                    break;
                case 'welcome':
                    go('opportunities');
                    break;
            }

            // Close notifications center if open
            DashboardUtils.closeModal('notificationsCenterModal');

            // Reload notifications
            await this.loadNotifications(this.currentUser.uid);
            await this.loadAllNotifications(this.currentUser.uid);

        } catch (error) {
            console.error('Error handling notification action:', error);
        }
    }

    showNotificationsCenter() {
        this.displayFilteredNotifications();
        DashboardUtils.openModal('notificationsCenterModal');
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
            case 'applications':
                filteredNotifications = this.allNotifications.filter(n => 
                    this.getNotificationTypeInfo(n.type).category === 'applications'
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
                                <button onclick="volunteerDashboard.handleNotificationAction('${notification.id}', '${notification.type}')" 
                                        class="text-sm text-primary hover:text-secondary font-medium">
                                    ${actionText}
                                </button>
                                ${isUnread ? `
                                    <button onclick="volunteerDashboard.markAsRead('${notification.id}')" 
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
            'applications': 'No application notifications'
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
            await db.collection('volunteerNotifications').doc(notificationId).update({
                read: true
            });

            // Reload notifications — await so the re-render below sees fresh data
            await this.loadNotifications(this.currentUser.uid);
            await this.loadAllNotifications(this.currentUser.uid);
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
                const notificationRef = db.collection('volunteerNotifications').doc(notification.id);
                batch.update(notificationRef, { read: true });
            });
            
            await batch.commit();
            DashboardUtils.showToast(`Marked ${unreadNotifications.length} notifications as read`, 'success');

            // Reload notifications — await so the re-render below sees fresh data
            await this.loadNotifications(this.currentUser.uid);
            await this.loadAllNotifications(this.currentUser.uid);
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
                    const notificationRef = db.collection('volunteerNotifications').doc(notification.id);
                    batch.delete(notificationRef);
                });
                
                await batch.commit();
                DashboardUtils.showToast('All notifications cleared', 'success');

                // Reload notifications
                await this.loadNotifications(this.currentUser.uid);
                await this.loadAllNotifications(this.currentUser.uid);
                if (document.getElementById('notificationsCenterModal').classList.contains('hidden') === false) {
                    this.displayFilteredNotifications();
                }
                
            } catch (error) {
                console.error('Error clearing notifications:', error);
                DashboardUtils.showToast('Error clearing notifications', 'error');
            }
        }
    }
}

// Make globally accessible
window.volunteerDashboard = new VolunteerDashboardManager();