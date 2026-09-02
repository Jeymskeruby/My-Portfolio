class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        custom-footer {
          display: block;
          width: 100vw;
          /* Ensure element takes full width of viewport */
          position: fixed;
          left: 0;
          bottom: 0;
          z-index: 20;
        }
        footer {
          background: linear-gradient(to right, #2563eb, #3b82f6);
          border-top: 1px solid #000000ff;
          padding: 0.5rem;
          text-align: center;
        }
        .copyright {
          color: #ffffffff;
          font-size: 0.875rem;
        }
      </style>
      <footer>
        <div class="copyright">
          &copy; ${new Date().getFullYear()} iServe. All rights reserved.
        </div>
      </footer>
    `;
  }
}
customElements.define('custom-footer', CustomFooter);

document.addEventListener('DOMContentLoaded', function() {
  document.body.style.paddingBottom = '75px';
});
