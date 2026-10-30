/*
 * layout.js — injects the shared header (nav + dark-mode toggle) and footer.
 * Loaded with `defer`. No JSON / user data flows through this file.
 *
 * Shared contract with theme.js:
 *   - The dark-mode toggle button is CREATED here with id "theme-toggle".
 *   - theme.js finds it by that id (#theme-toggle) and wires the click behavior.
 *   Keep the id consistent between the two files.
 */
(function () {
  'use strict';

  // Nav links in required order.
  var NAV_LINKS = [
    { page: 'home', href: 'index.html', label: 'Home' },
    { page: 'about', href: 'about.html', label: 'About' },
    { page: 'schedule', href: 'schedule.html', label: 'Schedule & Subjects' },
    { page: 'estimator', href: 'estimator.html', label: 'Grade Estimator' },
    { page: 'tutors', href: 'tutors.html', label: 'Meet the Tutors' },
    { page: 'signup', href: 'signup.html', label: 'Sign Up' },
    { page: 'news', href: 'news.html', label: 'News' },
    { page: 'faq', href: 'faq.html', label: 'FAQ & Contact' }
  ];

  var CLUB_EMAIL = 'wheelytutoringclub@gmail.com';

  function buildHeader() {
    var currentPage = document.body.dataset.page || '';

    var header = document.createElement('div');
    header.className = 'site-header';

    var inner = document.createElement('div');
    inner.className = 'container header-inner';

    // Brand / home link
    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    brand.textContent = 'Wheely Good Tutoring';

    // Nav wrapper
    var nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('aria-label', 'Primary');

    // Hamburger toggle (mobile)
    var navToggle = document.createElement('button');
    navToggle.type = 'button';
    navToggle.className = 'nav-toggle';
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'primary-nav');
    navToggle.setAttribute('aria-label', 'Menu');
    navToggle.textContent = '\u2630'; // hamburger glyph

    // Nav list
    var list = document.createElement('ul');
    list.className = 'nav-list';
    list.id = 'primary-nav';

    NAV_LINKS.forEach(function (link) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      if (link.page === currentPage) {
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      list.appendChild(li);
    });

    // Dark-mode toggle button (wired by theme.js via #theme-toggle)
    var themeToggle = document.createElement('button');
    themeToggle.type = 'button';
    themeToggle.id = 'theme-toggle';
    themeToggle.className = 'theme-toggle';

    nav.appendChild(navToggle);
    nav.appendChild(list);
    nav.appendChild(themeToggle);

    inner.appendChild(brand);
    inner.appendChild(nav);
    header.appendChild(inner);

    // Wire the hamburger: toggle the nav open/closed (click + keyboard).
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    return header;
  }

  function buildFooter() {
    var footer = document.createElement('div');
    footer.className = 'site-footer';

    // Prominent Sign Up call-to-action, present on every page via the footer.
    var ctaWrap = document.createElement('div');
    ctaWrap.className = 'container footer-cta';

    var ctaText = document.createElement('p');
    ctaText.textContent = 'Ready to get started? Join us for a free Wednesday session.';

    var ctaBtn = document.createElement('a');
    ctaBtn.className = 'btn btn-primary';
    ctaBtn.href = 'signup.html';
    ctaBtn.textContent = 'Sign Up';

    ctaWrap.appendChild(ctaText);
    ctaWrap.appendChild(ctaBtn);

    var inner = document.createElement('div');
    inner.className = 'container footer-inner';

    var copy = document.createElement('p');
    copy.style.margin = '0';
    copy.textContent = '\u00A9 Wheely Good Tutoring — free peer tutoring at Wheeler.';

    var links = document.createElement('p');
    links.style.margin = '0';

    // Club email address.
    var email = document.createElement('a');
    email.href = 'mailto:' + CLUB_EMAIL;
    email.textContent = CLUB_EMAIL;

    var sep = document.createTextNode(' \u00B7 ');

    var signup = document.createElement('a');
    signup.href = 'signup.html';
    signup.textContent = 'Sign Up';

    links.appendChild(email);
    links.appendChild(sep);
    links.appendChild(signup);

    inner.appendChild(copy);
    inner.appendChild(links);
    footer.appendChild(ctaWrap);
    footer.appendChild(inner);

    return footer;
  }

  function init() {
    var headerMount = document.getElementById('site-header');
    if (headerMount) {
      headerMount.appendChild(buildHeader());
    }
    var footerMount = document.getElementById('site-footer');
    if (footerMount) {
      footerMount.appendChild(buildFooter());
    }

    // Signal that layout is ready so theme.js can wire the toggle button.
    document.dispatchEvent(new CustomEvent('layout:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
