class CustomHeader extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        /* Your existing styles remain the same */
        :host {
          display: block;
          position: relative;
          width: 100%;
          height: 80px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .logo-container {
          position: absolute;
          top: 50%;
          left: 40px;
          transform: translateY(-50%);
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-image {
          height: 50px;
          width: auto;
          border-radius: 6px;
          filter: drop-shadow(0 8px 6px rgba(0, 0, 0, 0.2));
          cursor: pointer;
        }
        
        .logo-text {
          color: white;
          user-select: none;
          font-weight: 800;
          font-size: 24px;
          filter: drop-shadow(0 8px 6px rgba(0, 0, 0, 0.2));
          font-family: 'Arial Black', Arial, sans-serif;
          cursor: pointer;
        }
        
        /* Login dropdown styles */
        .login-container {
          position: absolute;
          top: 50%;
          right: 40px;
          transform: translateY(-50%);
          z-index: 50;
        }
        
        .login-button {
          background-color: rgba(255, 255, 255, 0.9);
          color: #1e40af;
          padding: 6px 12px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          font-size: 13px;
        }
        
        .login-button:hover {
          background-color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .dropdown-icon {
          width: 16px;
          height: 16px;
        }
        
        .dropdown-menu {
          position: absolute;
          right: 0;
          width: 160px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-top: 6px;
          display: none;
          border: 1px solid #e5e7eb;
        }
        
        .dropdown-menu.show {
          display: block;
        }
        
        .dropdown-link {
          display: block;
          padding: 8px 12px;
          color: #1e40af;
          text-decoration: none;
          font-size: 13px;
          transition: background-color 0.2s;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .dropdown-link:last-child {
          border-bottom: none;
        }
        
        .dropdown-link:hover {
          background-color: #3b82f6;
          color: white;
        }
        
        /* Hidden utility class */
        .hidden {
          display: none !important;
        }
        
        /* Toast notification */
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          font-size: 14px;
          font-weight: 500;
          transform: translateX(150%);
          transition: transform 0.3s ease;
        }
        
        .toast.show {
          transform: translateX(0);
        }
        
        .toast.error {
          background: #ef4444;
        }
        
        .toast.info {
          background: #3b82f6;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          :host {
            height: 70px;
          }
          
          .logo-container {
            left: 20px;
            gap: 8px;
          }
          
          .logo-image {
            height: 40px;
          }
          
          .logo-text {
            font-size: 20px;
          }
          
          .login-container {
            right: 20px;
          }
          
          .login-button {
            padding: 5px 10px;
            font-size: 12px;
          }
          
          .dropdown-menu {
            width: 140px;
          }
        }

        @media (max-width: 480px) {
          .logo-text {
            font-size: 18px;
          }
          
          .logo-image {
            height: 35px;
          }
        }
      </style>
      
      <!-- Logo Section -->
      <div class="logo-container">
        <a id="logoLink" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">
          <!-- src is set correctly for the current page depth by updateLogoImage() -->
          <img src="./assets/images/iservealogo.jpg" alt="iServe logo" class="logo-image" />
          <span class="logo-text">iServe</span>
        </a>
      </div>

      <!-- Login Dropdown -->
      <div class="login-container" id="loginDropdown">
        <button class="login-button" id="loginButton">
          Login
          <svg xmlns="http://www.w3.org/2000/svg" class="dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div class="dropdown-menu" id="dropdownMenu">
          <a href="#" id="volunteerLoginLink" class="dropdown-link">As Volunteer</a>
          <a href="#" id="organizerLoginLink" class="dropdown-link">As Organizer</a>
        </div>
      </div>
    `;

    // Initialize after DOM is rendered
    setTimeout(() => this.initializeHeader(), 0);
  }

  initializeHeader() {
      this.setupDropdown();
      this.setupAdminAccess();
      this.setupLogoutListener(); // ADD THIS LINE
      this.updateLogoImage();
      this.updateLogoLink();
      this.updateLoginLinks();
      this.updateLoginVisibility();
      
      // Initialize Feather icons if they exist
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
  }

  setupLogoutListener() {
      // Listen for storage events (when localStorage changes in other tabs/windows)
      window.addEventListener('storage', (e) => {
          if (e.key === 'isAdmin' || e.key === 'organizerUser') {
              this.updateLoginVisibility();
              this.updateLogoLink();
          }
      });
      
      // Listen for custom logout event
      window.addEventListener('userLoggedOut', () => {
          this.updateLoginVisibility();
          this.updateLogoLink();
      });

      // Re-check auth state when the tab regains focus (covers the mock's
      // localStorage-backed session changing on another page). Cheaper and
      // quieter than the old 2s polling interval.
      window.addEventListener('focus', () => {
          this.updateLoginVisibility();
          this.updateLogoLink();
      });
  }

  setupDropdown() {
    const loginButton = this.shadowRoot.getElementById('loginButton');
    const dropdownMenu = this.shadowRoot.getElementById('dropdownMenu');
    
    if (loginButton && dropdownMenu) {
      let isOpen = false;
      
      const toggleDropdown = () => {
        isOpen = !isOpen;
        if (isOpen) {
          dropdownMenu.classList.add('show');
        } else {
          dropdownMenu.classList.remove('show');
        }
      };
      
      const closeDropdown = () => {
        isOpen = false;
        dropdownMenu.classList.remove('show');
      };
      
      // Toggle on button click
      loginButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
      
      // Close when clicking outside
      document.addEventListener('click', closeDropdown);
      
      // Close when clicking on dropdown links
      dropdownMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          closeDropdown();
        }
      });
    }
  }

  // Hidden admin entrance: LEFT ALT + RIGHT CLICK on the logo, and only on
  // the welcome page. Every other page (dashboards, login/signup) is left
  // alone — the old alt + left-click handler fired there too and sent people
  // to a relative admin-login path that doesn't resolve from a subfolder.
  setupAdminAccess() {
      const logoLink = this.shadowRoot.getElementById('logoLink');
      if (!logoLink) return;

      // Right Alt (AltGr on some layouts) shouldn't count, so track the
      // physical key instead of relying on the generic altKey flag alone.
      let leftAltDown = false;

      let hoveringLogo = false;

      document.addEventListener('keydown', (e) => {
          if (e.code !== 'AltLeft') return;
          leftAltDown = true;
          // Pressing Alt while already hovering should reveal the hint too,
          // not just hovering while Alt is already down.
          if (hoveringLogo && isAdminShortcutAllowed()) this.showAdminAccessHint();
      });

      document.addEventListener('keyup', (e) => {
          if (e.code !== 'AltLeft') return;
          leftAltDown = false;
          this.hideAdminAccessHint();
      });

      // Holding Alt can hand focus to the browser menu bar, which swallows the
      // keyup — clear the flag when the page loses focus so it can't stick on.
      window.addEventListener('blur', () => {
          leftAltDown = false;
          this.hideAdminAccessHint();
      });

      const isAdminShortcutAllowed = () => {
          if (!this.isWelcomePage()) return false;          // welcome page only
          if (localStorage.getItem('isAdmin') === 'true') return false; // already signed in
          return true;
      };

      // altKey confirms Alt is still physically held for this event;
      // leftAltDown narrows it to the LEFT Alt key specifically.
      const isLeftAltHeld = (e) => leftAltDown && !!e.altKey && !e.ctrlKey;

      logoLink.addEventListener('contextmenu', (e) => {
          // Anywhere else, or without the chord, the normal context menu opens.
          if (!isLeftAltHeld(e) || !isAdminShortcutAllowed()) return;

          e.preventDefault();
          e.stopPropagation();

          this.hideAdminAccessHint();
          this.showToast('Redirecting to Admin Login...', 'info');

          // The welcome page is at the site root, so this is always './'.
          const adminLoginPath = this.getRootPrefix() + 'admin-login/admin-login.html';
          setTimeout(() => {
              window.location.href = adminLoginPath;
          }, 800);
      });

      // Alt + LEFT click used to be the shortcut. Swallow it on the welcome
      // page (the browser would otherwise treat it as "save link") and point
      // the user at the real chord instead.
      logoLink.addEventListener('click', (e) => {
          if (isLeftAltHeld(e) && isAdminShortcutAllowed()) {
              e.preventDefault();
              e.stopPropagation();
              this.showToast('Hold left Alt and RIGHT-click the logo for admin access.', 'info');
          }
      });

      // Visual feedback, welcome page only
      logoLink.addEventListener('mouseenter', () => {
          hoveringLogo = true;
          if (leftAltDown && isAdminShortcutAllowed()) {
              logoLink.style.opacity = '0.8';
              logoLink.style.cursor = 'pointer';
              this.showAdminAccessHint();
          }
      });

      logoLink.addEventListener('mouseleave', () => {
          hoveringLogo = false;
          logoLink.style.opacity = '1';
          this.hideAdminAccessHint();
      });
  }

  // True only on the site's welcome page (index.html at the iServe root), not
  // on any of the one-level-deep dashboard / login / signup pages.
  isWelcomePage() {
      const currentPath = window.location.pathname;
      const currentPage = currentPath.split('/').pop();
      const isRootLevel = this.getRootPrefix() === './';
      const isIndex = currentPage === 'index.html' || currentPage === '' || currentPath.endsWith('/');
      return isRootLevel && isIndex;
  }

  showAdminAccessHint() {
      // Remove existing hint if any
      this.hideAdminAccessHint();
      
      // Create hint element
      const hint = document.createElement('div');
      hint.className = 'admin-access-hint';
      hint.innerHTML = `
          <style>
              .admin-access-hint {
                  position: fixed;
                  top: 100px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(0, 0, 0, 0.8);
                  color: white;
                  padding: 8px 16px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 500;
                  z-index: 10000;
                  pointer-events: none;
                  white-space: nowrap;
              }
          </style>
          Left Alt + Right Click to access Admin Login
      `;
      
      document.body.appendChild(hint);
  }

  hideAdminAccessHint() {
      const existingHint = document.querySelector('.admin-access-hint');
      if (existingHint) {
          existingHint.remove();
      }
  }

  updateLoginLinks() {
    const volunteerLink = this.shadowRoot.getElementById('volunteerLoginLink');
    const organizerLink = this.shadowRoot.getElementById('organizerLoginLink');
    
    if (!volunteerLink || !organizerLink) return;

    // Calculate paths based on current location
    const volunteerPath = this.calculatePath('volunteer-login/volunteer-login.html');
    const organizerPath = this.calculatePath('organizer-login/organizer-login.html');

    volunteerLink.href = volunteerPath;
    organizerLink.href = organizerPath;
  }

  calculatePath(targetPath) {
    const currentPath = window.location.pathname;
    const currentFullPath = window.location.href;
    
    // Extract the current directory name
    const pathParts = currentPath.split('/').filter(part => part);
    const currentDir = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';
    const currentFileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
    
    // Extract target directory and file
    const targetParts = targetPath.split('/');
    const targetDir = targetParts[0];
    const targetFile = targetParts[1];

    // Define directory relationships - which directories are siblings
    const siblingDirectories = [
        'volunteer-login',
        'organizer-login', 
        'volunteer-signup',
        'organizer-signup',
        'login',
        'signup'
    ];

    // If we're in a directory that has sibling directories
    if (siblingDirectories.includes(currentDir)) {
        // If target is a different sibling directory, go up one level then into target
        if (targetDir !== currentDir && siblingDirectories.includes(targetDir)) {
            return `../${targetPath}`;
        }
        // If target is the same directory, use relative path
        else if (targetDir === currentDir) {
            return `./${targetFile}`;
        }
    }

    // For all other cases (root level, unknown directories), use the target path as-is
    return targetPath;
  }

  showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = this.shadowRoot.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.shadowRoot.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }

  // "./" when the current page is at the site root (index.html), "../" when
  // it's one of the known one-level-deep subfolders. Used for both the logo
  // link target and the logo <img> src so neither breaks on a sub-path deploy.
  getRootPrefix() {
    const KNOWN_SUBFOLDERS = [
      'organizer-login', 'organizer-signup', 'organizer-dashboard',
      'volunteer-login', 'volunteer-signup', 'volunteer-dashboard',
      'admin-login', 'admin-dashboard'
    ];
    const segments = window.location.pathname.split('/').filter(Boolean);
    const parentSegment = segments.length >= 2 ? segments[segments.length - 2] : '';
    return KNOWN_SUBFOLDERS.includes(parentSegment) ? '../' : './';
  }

  updateLogoImage() {
    const img = this.shadowRoot.querySelector('.logo-image');
    if (img) img.setAttribute('src', this.getRootPrefix() + 'assets/images/iservealogo.jpg');
  }

  updateLogoLink() {
    const logoLink = this.shadowRoot.getElementById('logoLink');
    if (!logoLink) return;

    const currentPath = window.location.pathname;
    const currentPage = window.location.pathname.split('/').pop();

    const rootPrefix = this.getRootPrefix();

    // Check if we're on admin dashboard
    const isAdminDashboard = currentPath.includes('admin-dashboard') || currentPage === 'admin-dashboard.html';

    // Check if we're on index/landing page
    const isIndexPage = currentPage === 'index.html' || currentPage === '' || currentPath.endsWith('/');

    // Check if user is admin (from localStorage)
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // Check if organizer is logged in
    const organizerUser = localStorage.getItem('organizerUser');
    const isOrganizerLoggedIn = organizerUser && JSON.parse(organizerUser).status === 'approved';

    // Check if regular user is logged in
    let isUserLoggedIn = false;
    try {
      // Check if Firebase auth is available and has a current user
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        isUserLoggedIn = true;
      }
    } catch (error) {
      console.log('Firebase auth not available or error checking auth state:', error);
      isUserLoggedIn = false;
    }

    if (isAdminDashboard) {
      // Already inside admin-dashboard/ - link within the same folder
      logoLink.href = './admin-dashboard.html';
    } else if (isAdmin) {
      logoLink.href = rootPrefix + 'admin-dashboard/admin-dashboard.html';
    } else if (currentPath.includes('organizer-dashboard')) {
      // Already inside organizer-dashboard/
      logoLink.href = './organizer-dashboard.html';
    } else if (isOrganizerLoggedIn) {
      logoLink.href = rootPrefix + 'organizer-dashboard/organizer-dashboard.html';
    } else if (currentPath.includes('volunteer-dashboard')) {
      // Already inside volunteer-dashboard/
      logoLink.href = './volunteer-dashboard.html';
    } else if (isUserLoggedIn) {
      logoLink.href = rootPrefix + 'volunteer-dashboard/volunteer-dashboard.html';
    } else if (isIndexPage) {
      // On index page - stay on index
      logoLink.href = './index.html';
    } else {
      // Logged out, anywhere else (login/signup pages, etc.) - back to homepage
      logoLink.href = rootPrefix + 'index.html';
    }
  }

  updateLoginVisibility() {
      const loginDropdown = this.shadowRoot.getElementById('loginDropdown');
      
      if (!loginDropdown) return;

      const currentPath = window.location.pathname;
      const currentPage = window.location.pathname.split('/').pop();
      
      // Check if we're on index page or root
      const isIndexPage = currentPage === 'index.html' || currentPage === '' || currentPath.endsWith('/');
      
      // Check if we're already on admin pages
      const isAdminPage = currentPath.includes('admin-') || currentPath.includes('admin/');
      
      // More aggressive checks for auth states
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      const organizerUser = localStorage.getItem('organizerUser');
      const isOrganizerLoggedIn = organizerUser && JSON.parse(organizerUser).status === 'approved';
      
      // Check Firebase auth more carefully
      let isUserLoggedIn = false;
      try {
          if (typeof firebase !== 'undefined' && firebase.auth) {
              isUserLoggedIn = !!firebase.auth().currentUser;
          }
      } catch (error) {
          isUserLoggedIn = false;
      }

      // Hide login dropdown on admin pages or when any user is logged in
      if (isAdminPage || isAdmin || isOrganizerLoggedIn || isUserLoggedIn) {
          loginDropdown.classList.add('hidden');
      } else {
          loginDropdown.classList.remove('hidden');
      }
  }
}

customElements.define('custom-header', CustomHeader);

// Global function to update header state (call this when auth state changes)
function updateHeaderAuthState() {
  const customHeader = document.querySelector('custom-header');
  if (customHeader) {
    customHeader.updateLogoLink();
    customHeader.updateLoginLinks();
    customHeader.updateLoginVisibility();
  }
}

// Clear any stuck auth states (add this for debugging)
function clearStuckAuthStates() {
  // Check if we're on login pages but have auth states
  const currentPath = window.location.pathname;
  const isOnLoginPage = currentPath.includes('login') || currentPath.includes('organizer-login');
  
  if (isOnLoginPage) {
    // Check if we have organizer user but no actual Firebase auth
    const organizerUser = localStorage.getItem('organizerUser');
    let hasFirebaseAuth = false;
    
    try {
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        hasFirebaseAuth = true;
      }
    } catch (error) {
      hasFirebaseAuth = false;
    }
    
    // If we have organizer user but no Firebase auth, clear the organizer user
    if (organizerUser && !hasFirebaseAuth) {
      localStorage.removeItem('organizerUser');
    }
  }
}



// Listen for auth state changes
document.addEventListener('DOMContentLoaded', function() {
  // Clear any stuck auth states first
  clearStuckAuthStates();
  
  // Update header when auth state changes
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(() => {
      updateHeaderAuthState();
    });
  }
  
  // Also update header immediately
  setTimeout(updateHeaderAuthState, 100);
});

// Update header when navigating (for single page app behavior)
window.addEventListener('popstate', updateHeaderAuthState);