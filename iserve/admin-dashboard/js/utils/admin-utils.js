class AdminUtils {
    static showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.admin-toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `admin-toast fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 transition-transform duration-300 transform translate-x-full`;
        
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        toast.className += ` ${bgColors[type] || bgColors.info}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
            toast.classList.add('translate-x-0');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('translate-x-0');
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    static setupModalCloseOnOutsideClick() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                // Close the modal when clicking outside the content
                const modal = e.target;
                modal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        });
    }

    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('modal-open');
            
            // Focus management for accessibility
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    // Update closeModal method
    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    }

    static formatDate(date) {
        if (!date) return 'Unknown';
        
        if (date.toDate) {
            date = date.toDate();
        } else if (typeof date === 'string') {
            date = new Date(date);
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatTimeAgo(date) {
        if (!date) return 'Just now';
        
        if (date.toDate) {
            date = date.toDate();
        } else if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return this.formatDate(date);
    }

    static getStatusBadge(status) {
        const statusClasses = {
            'pending': 'status-badge status-pending',
            'approved': 'status-badge status-approved',
            'rejected': 'status-badge status-rejected',
            'suspended': 'status-badge status-suspended',
            'banned': 'status-badge status-banned',
            'active': 'status-badge status-active',
            'completed': 'status-badge status-approved',
            'cancelled': 'status-badge status-cancelled'
        };
        
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        const badgeClass = statusClasses[status] || 'status-badge bg-gray-100 text-gray-800';
        
        return `<span class="${badgeClass}">${statusText}</span>`;
    }

    static showConfirmation(title, message, onConfirm) {
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').textContent = message;
        
        const confirmBtn = document.getElementById('confirmActionBtn');
        confirmBtn.onclick = onConfirm;
        
        this.openModal('confirmationModal');
    }

    static createSkillChips(skills) {
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return '<span class="text-gray-400 text-sm">No skills listed</span>';
        }
        
        return skills.map(skill => 
            `<span class="skill-chip">${skill}</span>`
        ).join('');
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Make available globally
window.AdminUtils = AdminUtils;