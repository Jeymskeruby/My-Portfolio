class AdminDashboardManager {
    constructor() {
        this.currentAdmin = null;
        this.notifications = [];
        this.allNotifications = [];
        this.notificationFilter = 'all';
    }

    init(currentAdmin) {
        this.currentAdmin = currentAdmin;
        this.setupEventListeners();
        this.setupNotificationsCenter();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Notification bell
        document.getElementById('notificationBell').addEventListener('click', () => this.showNotificationsCenter());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    setupNotificationsCenter() {
        // Notification filter tabs
        document.querySelectorAll('.notification-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-notification-tab');
                this.switchNotificationTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab styling
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-transparent', 'text-gray-600');
        });
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show active tab
        const activeTab = document.getElementById(`${tabName}-tab`);
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary', 'text-primary');
            activeBtn.classList.remove('border-transparent', 'text-gray-600');
        }
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
        await this.loadDashboardStats();
        await this.loadRecentActivity();
        await this.loadNotifications();
        await this.loadAllNotifications();
    }

    async loadDashboardStats() {
        try {
            // Load volunteers count
            const volunteersSnapshot = await db.collection('users').get();
            document.getElementById('totalVolunteers').textContent = volunteersSnapshot.size;

            // Load organizers count
            const organizersSnapshot = await db.collection('organizers').get();
            document.getElementById('totalOrganizers').textContent = organizersSnapshot.size;

            // Load events count
            const eventsSnapshot = await db.collection('events').get();
            document.getElementById('totalEvents').textContent = eventsSnapshot.size;

            // Calculate pending approvals (pending organizers + pending events)
            const pendingOrganizers = organizersSnapshot.docs.filter(doc => 
                doc.data().status === 'pending'
            ).length;
            
            const pendingEvents = eventsSnapshot.docs.filter(doc => 
                doc.data().status === 'pending'
            ).length;
            
            document.getElementById('pendingApprovals').textContent = pendingOrganizers + pendingEvents;

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            AdminUtils.showToast('Error loading dashboard data', 'error');
        }
    }

    async loadRecentActivity() {
        const activityList = document.getElementById('recentActivityList');
        
        try {
            // Get recent events, organizers, and users
            const [eventsSnapshot, organizersSnapshot, usersSnapshot] = await Promise.all([
                db.collection('events').orderBy('createdAt', 'desc').limit(5).get(),
                db.collection('organizers').orderBy('createdAt', 'desc').limit(3).get(),
                db.collection('users').orderBy('createdAt', 'desc').limit(3).get()
            ]);

            const activities = [];

            // Process events
            eventsSnapshot.forEach(doc => {
                const event = doc.data();
                activities.push({
                    type: 'event',
                    title: `New Event: ${event.name}`,
                    description: `Created by ${event.organizerName}`,
                    timestamp: event.createdAt,
                    status: event.status
                });
            });

            // Process organizers
            organizersSnapshot.forEach(doc => {
                const organizer = doc.data();
                activities.push({
                    type: 'organizer',
                    title: `New Organizer: ${organizer.organizationName}`,
                    description: `Status: ${organizer.status}`,
                    timestamp: organizer.createdAt,
                    status: organizer.status
                });
            });

            // Process users
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                activities.push({
                    type: 'user',
                    title: `New Volunteer: ${user.firstName} ${user.lastName}`,
                    description: `Joined the platform`,
                    timestamp: user.createdAt,
                    status: 'active'
                });
            });

            // Sort by timestamp (newest first) and take the 5 most recent
            const recentActivities = activities.sort((a, b) => {
                const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return timeB - timeA;
            }).slice(0, 5);

            if (recentActivities.length === 0) {
                activityList.innerHTML = this.getEmptyStateHTML('activity', 'No recent activity');
            } else {
                activityList.innerHTML = recentActivities.map(activity =>
                    this.createActivityItem(activity)
                ).join('');
            }
            feather.replace();
        } catch (error) {
            console.error('Error loading recent activity:', error);
            activityList.innerHTML = this.getErrorStateHTML('Error loading activity');
        }
    }

    createActivityItem(activity) {
        const timeAgo = AdminUtils.formatTimeAgo(activity.timestamp);
        const icon = this.getActivityIcon(activity.type);
        const color = this.getActivityColor(activity.type);

        return `
            <div class="border-b border-gray-200 py-3 last:border-b-0">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i data-feather="${icon}" class="w-4 h-4 text-${color}-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">${activity.title}</p>
                        <p class="text-sm text-gray-600 mt-1">${activity.description}</p>
                        <p class="text-xs text-gray-500 mt-2">${timeAgo}</p>
                    </div>
                    ${activity.status ? AdminUtils.getStatusBadge(activity.status) : ''}
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'event': 'calendar',
            'organizer': 'briefcase',
            'user': 'user'
        };
        return icons[type] || 'activity';
    }

    getActivityColor(type) {
        const colors = {
            'event': 'blue',
            'organizer': 'green',
            'user': 'purple'
        };
        return colors[type] || 'gray';
    }

    async loadNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        
        try {
            const snapshot = await db.collection('adminNotifications')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();

            this.notifications = [];
            snapshot.forEach(doc => {
                this.notifications.push({ id: doc.id, ...doc.data() });
            });

            if (this.notifications.length === 0) {
                notificationsList.innerHTML = this.getEmptyStateHTML('bell', 'No new notifications');
            } else {
                notificationsList.innerHTML = this.notifications.map(notification => 
                    this.createNotificationItem(notification)
                ).join('');
            }
            feather.replace();
            
            // Update notification count
            this.updateNotificationCount(this.notifications);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            notificationsList.innerHTML = this.getErrorStateHTML('Error loading notifications');
        }
    }

    async loadAllNotifications() {
        try {
            const snapshot = await db.collection('adminNotifications')
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
        const { icon, color } = this.getNotificationTypeInfo(notification.type);
        const timeAgo = AdminUtils.formatTimeAgo(notification.createdAt);

        return `
            <div class="border-b border-gray-200 py-3 last:border-b-0 hover:bg-gray-50 transition-colors">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i data-feather="${icon}" class="w-4 h-4 text-${color}-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">${notification.title || 'Notification'}</p>
                        <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                        <p class="text-xs text-gray-500 mt-2">${timeAgo}</p>
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
            'new_organizer': { icon: 'briefcase', color: 'green', category: 'organizers' },
            'new_event': { icon: 'calendar', color: 'blue', category: 'events' },
            'organizer_approved': { icon: 'check-circle', color: 'green', category: 'organizers' },
            'organizer_rejected': { icon: 'x-circle', color: 'red', category: 'organizers' },
            'event_approved': { icon: 'check-circle', color: 'green', category: 'events' },
            'event_rejected': { icon: 'x-circle', color: 'red', category: 'events' },
            'new_volunteer': { icon: 'user-plus', color: 'purple', category: 'users' },
            'join_request': { icon: 'user-plus', color: 'blue', category: 'events' },
            'user_suspended': { icon: 'user-x', color: 'orange', category: 'users' },
            'user_banned': { icon: 'user-x', color: 'red', category: 'users' },
            'system_alert': { icon: 'alert-triangle', color: 'orange', category: 'system' }
        };
        
        return types[type] || { icon: 'bell', color: 'blue', category: 'system' };
    }

    showNotificationsCenter() {
        this.displayFilteredNotifications();
        AdminUtils.openModal('notificationsCenterModal');
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
            case 'system':
                filteredNotifications = this.allNotifications.filter(n => 
                    this.getNotificationTypeInfo(n.type).category === 'system'
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
        const { icon, color } = this.getNotificationTypeInfo(notification.type);
        const timeAgo = AdminUtils.formatTimeAgo(notification.createdAt);
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
                        ${isUnread ? `
                            <div class="flex justify-end items-center mt-3">
                                <button onclick="adminDashboard.markAsRead('${notification.id}')" 
                                        class="text-xs text-gray-500 hover:text-gray-700">
                                    Mark as read
                                </button>
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
            'system': 'No system notifications'
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
            await db.collection('adminNotifications').doc(notificationId).update({
                read: true
            });
            
            // Reload notifications
            this.loadNotifications();
            this.loadAllNotifications();
            this.displayFilteredNotifications();
            
        } catch (error) {
            console.error('Error marking notification as read:', error);
            AdminUtils.showToast('Error marking notification as read', 'error');
        }
    }

    async markAllAsRead() {
        try {
            const unreadNotifications = this.allNotifications.filter(n => !n.read);
            
            if (unreadNotifications.length === 0) {
                AdminUtils.showToast('All notifications are already read', 'info');
                return;
            }
            
            const batch = db.batch();
            unreadNotifications.forEach(notification => {
                const notificationRef = db.collection('adminNotifications').doc(notification.id);
                batch.update(notificationRef, { read: true });
            });
            
            await batch.commit();
            AdminUtils.showToast(`Marked ${unreadNotifications.length} notifications as read`, 'success');
            
            // Reload notifications
            this.loadNotifications();
            this.loadAllNotifications();
            this.displayFilteredNotifications();
            
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            AdminUtils.showToast('Error marking notifications as read', 'error');
        }
    }

    async clearAllNotifications() {
        if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            try {
                const batch = db.batch();
                this.allNotifications.forEach(notification => {
                    const notificationRef = db.collection('adminNotifications').doc(notification.id);
                    batch.delete(notificationRef);
                });
                
                await batch.commit();
                AdminUtils.showToast('All notifications cleared', 'success');
                
                // Reload notifications
                this.loadNotifications();
                this.loadAllNotifications();
                if (document.getElementById('notificationsCenterModal').classList.contains('hidden') === false) {
                    this.displayFilteredNotifications();
                }
                
            } catch (error) {
                console.error('Error clearing notifications:', error);
                AdminUtils.showToast('Error clearing notifications', 'error');
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
window.adminDashboard = new AdminDashboardManager();