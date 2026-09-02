// This portfolio build runs entirely on local mock data (see mock-firebase.js
// and mock-seed-data.js) — there is no live backend. This config object is a
// placeholder only, kept so the app's initialization code runs unchanged.
const firebaseConfig = {
    apiKey: "demo-mode-no-live-backend",
    authDomain: "iserve-demo.local",
    projectId: "iserve-demo",
    storageBucket: "iserve-demo.local",
    messagingSenderId: "000000000000",
    appId: "demo:app"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Dashboard Utilities - GLOBAL UTILITY CLASS
class DashboardUtils {
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    static showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-blue-500';

        toast.className = `custom-toast fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
        toast.textContent = message;
        
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
            toast.classList.add('translate-x-0');
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    static formatDate(date) {
        if (!date) return 'N/A';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getStatusBadgeClass(status) {
        const statusClasses = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
            withdrawn: 'bg-gray-100 text-gray-800',
            completed: 'bg-blue-100 text-blue-800',
            active: 'bg-green-100 text-green-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    static showCustomModal(title, content) {
        // Create or use existing custom modal
        let modal = document.getElementById('customModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'customModal';
            modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
                    <h2 class="text-xl font-bold text-gray-800 mb-4" id="customModalTitle"></h2>
                    <div id="customModalContent" class="mb-6"></div>
                    <div class="flex justify-end">
                        <button onclick="DashboardUtils.closeModal('customModal')" class="bg-primary hover:bg-secondary text-white font-semibold py-2 px-6 rounded-lg transition duration-300">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.getElementById('customModalTitle').textContent = title;
        document.getElementById('customModalContent').innerHTML = content;
        this.openModal('customModal');
    }

    // Form validation
    static validateForm(formData) {
        const errors = [];
        
        // Check required fields
        const requiredFields = ['eventName', 'eventDescription', 'eventCategory', 'eventStart', 'eventEnd', 'eventLocation', 'maxVolunteers'];
        requiredFields.forEach(field => {
            if (!formData.get(field)) {
                errors.push(`${field} is required`);
            }
        });

        // Validate dates
        const startTime = new Date(formData.get('eventStart'));
        const endTime = new Date(formData.get('eventEnd'));
        if (startTime >= endTime) {
            errors.push('End time must be after start time');
        }

        // Validate max volunteers
        const maxVolunteers = parseInt(formData.get('maxVolunteers'));
        if (maxVolunteers < 1) {
            errors.push('Maximum volunteers must be at least 1');
        }

        return errors;
    }
}

// Make DashboardUtils globally available
window.DashboardUtils = DashboardUtils;

// Global modal close function (for the X buttons in your HTML)
function closeModal(modalId) {
    DashboardUtils.closeModal(modalId);
}

// Error modal – centralized, safe
function showModal({ title = "Error", message = "", closeText = "Close", onClose = null }) {
    const overlay = document.getElementById('centeredModalOverlay');
    if (!overlay) return alert(message || title); // fallback if modal missing
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerHTML = message;
    const closeBtn = document.getElementById('modalCloseBtn');
    overlay.classList.remove('hidden');
    closeBtn.textContent = closeText;
    closeBtn.onclick = () => {
        overlay.classList.add('hidden');
        if (onClose) onClose();
    };
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('iServe platform loaded');
    // Animation triggers
    const animateElements = document.querySelectorAll('.animate-fade-in');
    animateElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.2}s`;
    });
});