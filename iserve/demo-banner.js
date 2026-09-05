/**
 * demo-banner.js
 * Adds a small fixed banner so anyone viewing this portfolio build
 * knows it's running on local mock data, with a one-click reset.
 */
document.addEventListener('DOMContentLoaded', function () {
  const bar = document.createElement('div');
  bar.id = 'iserveDemoBanner';
  bar.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:99999',
    'background:#111827', 'color:#f3f4f6', 'font-family:system-ui,sans-serif',
    'font-size:13px', 'padding:8px 14px', 'display:flex', 'align-items:center',
    'justify-content:center', 'gap:14px', 'flex-wrap:wrap', 'box-shadow:0 -2px 8px rgba(0,0,0,0.25)'
  ].join(';');

  // Figure out how deep we are so the admin login link always resolves.
  const KNOWN_SUBFOLDERS = [
    'organizer-login', 'organizer-signup', 'organizer-dashboard',
    'volunteer-login', 'volunteer-signup', 'volunteer-dashboard',
    'admin-login', 'admin-dashboard'
  ];
  const segments = window.location.pathname.split('/').filter(Boolean);
  const parentSegment = segments.length >= 2 ? segments[segments.length - 2] : '';
  const isInSubfolder = KNOWN_SUBFOLDERS.includes(parentSegment);
  // Admin login is reachable from the welcome page only — the same rule the
  // logo's hidden Left Alt + Right Click shortcut follows (components/header.js).
  const currentPage = segments[segments.length - 1] || '';
  const isWelcomePage = !isInSubfolder &&
    (currentPage === 'index.html' || currentPage === '' || window.location.pathname.endsWith('/'));
  const adminLoginHref = 'admin-login/admin-login.html';

  bar.innerHTML = `
    <span>🧪 Portfolio demo — running on local mock data, no live backend.</span>
    <span style="opacity:0.8">Demo logins: <code>juan.delacruz@example.com</code> / <code>greenearth</code> / <code>readforward</code> / <code>admin@admin.iserve.demo</code> — password <code>demo1234</code></span>
    ${isWelcomePage ? `<a href="${adminLoginHref}" style="color:#93c5fd;text-decoration:underline;">Admin Login</a><span style="opacity:0.8">(or hold Left Alt + right-click the iServe logo)</span>` : ''}
    <button id="iserveResetDemoBtn" style="background:#2563eb;color:white;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">Reset Demo Data</button>
  `;
  document.body.appendChild(bar);

  // The site footer (<custom-footer>) is also position:fixed at bottom:0, so
  // it would sit underneath this banner. Lift the footer above the banner and
  // reserve room at the bottom of the page for both.
  function layoutForBanner() {
    const bannerH = bar.offsetHeight || 40;
    const footerEl = document.querySelector('custom-footer');
    let footerH = 0;
    if (footerEl) {
      footerEl.style.bottom = bannerH + 'px';
      footerH = footerEl.offsetHeight || 0;
    }
    document.body.style.paddingBottom = (bannerH + footerH + 8) + 'px';
  }
  layoutForBanner();
  // Re-run once the footer web component has finished upgrading, and on resize
  // (the banner wraps to multiple lines on narrow screens).
  setTimeout(layoutForBanner, 0);
  window.addEventListener('resize', layoutForBanner);

  document.getElementById('iserveResetDemoBtn').addEventListener('click', function () {
    if (confirm('Reset all demo data and log out? This clears anything you added or changed while browsing.')) {
      window.resetIServeDemoData();
      const rootHref = isInSubfolder ? '../index.html' : 'index.html';
      window.location.href = rootHref;
    }
  });
});
