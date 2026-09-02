document.addEventListener('DOMContentLoaded', function() {
    feather.replace();

    document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (!email || !password) {
            showModal({
                title: "Missing Fields",
                message: "Please enter both email and password."
            });
            return;
        }

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (email.includes('@admin.')) {
                localStorage.setItem('isAdmin', 'true');
                window.location.href = '../admin-dashboard/admin-dashboard.html';
            } else {
                await auth.signOut();
                showModal({
                    title: "Access Denied",
                    message: "Admin privileges required to access this dashboard."
                });
            }
        } catch (error) {
            showModal({
                title: "Login Failed",
                message: error.message || "Unable to login. Please check your credentials."
            });
        }
    });
});
