// Add this function to check user status
async function checkUserStatus(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return { allowed: false, reason: 'User account not found' };
        }

        const userData = userDoc.data();
        
        // Check if user is banned
        if (userData.status === 'banned') {
            return {
                allowed: false,
                reason: 'banned',
                message: 'Your account has been permanently banned.',
                details: {
                    reason: userData.banReason ? getReasonText(userData.banReason) : 'Not specified',
                    details: userData.banDetails || 'No additional details provided',
                    bannedAt: userData.bannedAt ? new Date(userData.bannedAt.toDate()).toLocaleDateString() : 'Unknown',
                    adminId: userData.bannedBy
                }
            };
        }

        // Check if user is suspended
        if (userData.status === 'suspended') {
            const now = new Date();
            const suspensionEnd = userData.suspensionEndDate ? new Date(userData.suspensionEndDate.toDate()) : null;
            
            // Check if suspension period has ended
            if (suspensionEnd && suspensionEnd > now) {
                return {
                    allowed: false,
                    reason: 'suspended',
                    message: 'Your account has been temporarily suspended.',
                    details: {
                        reason: userData.suspensionReason ? getReasonText(userData.suspensionReason) : 'Not specified',
                        details: userData.suspensionDetails || 'No additional details provided',
                        suspendedUntil: suspensionEnd.toLocaleDateString(),
                        daysRemaining: Math.ceil((suspensionEnd - now) / (1000 * 60 * 60 * 24)),
                        suspendedAt: userData.suspendedAt ? new Date(userData.suspendedAt.toDate()).toLocaleDateString() : 'Unknown',
                        adminId: userData.suspendedBy
                    }
                };
            } else {
                // Suspension period has ended, auto-reactivate account
                await db.collection('users').doc(userId).update({
                    status: 'active',
                    suspensionEndDate: null,
                    suspensionReason: null,
                    suspensionDetails: null,
                    reactivatedAt: new Date()
                });
                return { allowed: true };
            }
        }

        // User is active
        return { allowed: true };
        
    } catch (error) {
        console.error('Error checking user status:', error);
        return { allowed: false, reason: 'error', message: 'Error checking account status' };
    }
}

// Helper function to get reason text
function getReasonText(reasonCode) {
    const reasons = {
        'violation_terms': 'Violation of Terms of Service',
        'inappropriate_behavior': 'Inappropriate Behavior',
        'spam_activity': 'Spam or Suspicious Activity',
        'fake_account': 'Fake Account',
        'harassment': 'Harassment or Abuse',
        'other': 'Other'
    };
    return reasons[reasonCode] || 'Unknown Reason';
}

// Function to show modal for banned/suspended users
function showAccountStatusModal(statusCheck) {
    let title, message, details;
    
    switch (statusCheck.reason) {
        case 'banned':
            title = 'Account Banned';
            message = 'Your account has been permanently banned from iServe.';
            details = `
                <div class="text-left space-y-3">
                    <p><strong>Reason:</strong> ${statusCheck.details.reason}</p>
                    <p><strong>Details:</strong> ${statusCheck.details.details}</p>
                    <p><strong>Banned on:</strong> ${statusCheck.details.bannedAt}</p>
                    <p class="text-red-600 font-medium">This action is permanent and cannot be reversed.</p>
                    <p>If you believe this is a mistake, please contact our support team.</p>
                </div>
            `;
            break;
            
        case 'suspended':
            title = 'Account Suspended';
            message = 'Your account has been temporarily suspended.';
            details = `
                <div class="text-left space-y-3">
                    <p><strong>Reason:</strong> ${statusCheck.details.reason}</p>
                    <p><strong>Details:</strong> ${statusCheck.details.details}</p>
                    <p><strong>Suspended until:</strong> ${statusCheck.details.suspendedUntil}</p>
                    <p><strong>Time remaining:</strong> ${statusCheck.details.daysRemaining} day${statusCheck.details.daysRemaining !== 1 ? 's' : ''}</p>
                    <p class="text-orange-600 font-medium">Your account will be automatically reinstated after this period.</p>
                    <p>For immediate assistance, contact our support team.</p>
                </div>
            `;
            break;
            
        default:
            title = 'Login Failed';
            message = statusCheck.message || 'Unable to login at this time.';
            details = 'Please try again later or contact support.';
    }
    
    showModal({
        title: title,
        message: details,
        showContactButton: true
    });
}

// Updated modal function to support contact button
function showModal({ title, message, showContactButton = false }) {
    const modalOverlay = document.getElementById('centeredModalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    // Clear existing button event listeners
    const newCloseBtn = modalCloseBtn.cloneNode(true);
    modalCloseBtn.parentNode.replaceChild(newCloseBtn, modalCloseBtn);

    // Add contact support button if needed
    if (showContactButton) {
        const contactBtn = document.createElement('button');
        contactBtn.textContent = 'Contact Support';
        contactBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition mr-3';
        contactBtn.onclick = function() {
            window.location.href = 'mailto:support@iserve.com?subject=Account%20Support%20Request';
        };
        
        newCloseBtn.parentNode.insertBefore(contactBtn, newCloseBtn);
    }

    newCloseBtn.onclick = function() {
        modalOverlay.classList.add('hidden');
    };

    modalOverlay.classList.remove('hidden');
}

// Updated login form handler
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    const loginForm = document.getElementById('loginForm');
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        errorElement.classList.add('hidden');
        successElement.classList.add('hidden');

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('opacity-60', 'cursor-not-allowed'); }
        const releaseBtn = () => { if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('opacity-60', 'cursor-not-allowed'); } };

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.reload();
            
            // Check if user is banned or suspended BEFORE email verification check
            const statusCheck = await checkUserStatus(user.uid);
            if (!statusCheck.allowed) {
                // Show ban/suspension modal and sign out
                showAccountStatusModal(statusCheck);
                await auth.signOut();
                releaseBtn();
                return;
            }

            // Block login if not email verified, allow resend
            if (!user.emailVerified) {
                showModal({
                    title: "Email Not Verified",
                    message: `Your email is not yet verified.<br>
                        <button id="resendVerifyBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded mt-2">Resend Verification Email</button>`,
                });
                setTimeout(() => {
                    const btn = document.getElementById('resendVerifyBtn');
                    if (btn) btn.onclick = async function() {
                        await user.sendEmailVerification();
                        showModal({ title: "Sent!", message: "Verification email re-sent. Please check your inbox." });
                    };
                }, 50);
                releaseBtn();
                return;
            }

            // If verified and not banned/suspended, continue
            successElement.textContent = 'Login successful! Redirecting...';
            successElement.classList.remove('hidden');
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userEmail', user.email);

            // 🔥 AUTO-JOIN LOGIC HERE
            // Only runs when the user reached login by clicking "Join" on an
            // event while logged out. Clear the flag up front so a failed or
            // stale value can never trap future logins on index.html.
            const eventToJoin = localStorage.getItem("pendingJoinEventId");
            if (eventToJoin) {
                localStorage.removeItem("pendingJoinEventId");
                try {
                    const already = await db.collection('eventParticipants')
                        .where('userId', '==', user.uid)
                        .where('eventId', '==', eventToJoin)
                        .get();

                    if (already.empty) {
                        await db.collection('eventParticipants').add({
                            userId: user.uid,
                            eventId: eventToJoin,
                            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            status: "approved"
                        });
                        // Fresh join — take them back to the event list to see it.
                        window.location.href = "../index.html";
                        return;
                    }
                    // Already joined (stale flag) — fall through to the dashboard.
                } catch (err) {
                    console.error("Auto-join failed", err);
                }
            }
            // 🔥 END AUTO-JOIN

            setTimeout(() => {
                window.location.href = '../volunteer-dashboard/volunteer-dashboard.html';
            }, 1200);
        } catch (error) {
            errorElement.textContent = 'Login failed: ' + error.message;
            errorElement.classList.remove('hidden');
            releaseBtn();
        }
    });
});