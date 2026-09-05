/**
 * demo-banner.js — portfolio build only.
 *
 * Fixed bottom banner: flags the app as local mock data, points at the
 * one-click logins, and offers "Reset Demo Data". Appended to <body> as a
 * sibling of #app, so render() / the ~6s poll (which only touch
 * #app.innerHTML) never remove it. Styling lives in css/app.css
 * (.relay-demo-banner).
 */
(function () {
  function mountBanner() {
    if (document.getElementById('relayDemoBanner')) return;

    var bar = document.createElement('div');
    bar.id = 'relayDemoBanner';
    bar.className = 'relay-demo-banner';
    bar.innerHTML =
      '<span>🧪 Portfolio demo — running on local mock data in your browser, no backend.</span>' +
      '<span class="rdb-creds">Pick any one-click account on the sign-in screen — e.g. ' +
      'Super Admin <code>superadmin@relay.io</code>, Admin <code>admin@relay.io</code>, ' +
      'Agent <code>alice@relay.io</code>, Client <code>john@acmecorp.com</code> ' +
      '(this build has no passwords).</span>' +
      '<button type="button" id="relayResetDemoBtn" class="rdb-btn">Reset Demo Data</button>';
    document.body.appendChild(bar);

    // The banner's text wraps to a different number of lines depending on
    // viewport width, so its rendered height doesn't match the fixed
    // --demo-banner-h guess in app.css — that mismatch let the banner
    // overlap (and swallow clicks on) whatever sits at the bottom of the
    // sidebar, e.g. the Sign out button. Measure the real height instead.
    function syncBannerHeight() {
      document.documentElement.style.setProperty('--demo-banner-h', bar.offsetHeight + 'px');
    }
    syncBannerHeight();
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(syncBannerHeight).observe(bar);
    } else {
      window.addEventListener('resize', syncBannerHeight);
    }

    document.getElementById('relayResetDemoBtn').addEventListener('click', function () {
      if (typeof window.resetRelayDemoData === 'function') {
        window.resetRelayDemoData();               // its own confirm modal + reload
      } else {
        try { localStorage.removeItem('relay_demo_db_v1'); } catch (e) {}
        location.reload();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBanner);
  } else {
    mountBanner();
  }
})();
