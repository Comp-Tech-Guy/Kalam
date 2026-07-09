(function () {
  'use strict';

  var appContent = document.getElementById('app-content');
  var overlay = document.getElementById('mobileOverlay');
  var nav = document.querySelector('.nav');
  var isTransitioning = false;

  function toggleMenu() {
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
    if (overlay) overlay.classList.toggle('mobile-overlay--open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  }

  function closeMenu() {
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    if (overlay) overlay.classList.remove('mobile-overlay--open');
    document.body.style.overflow = '';
  }

  function initMobileMenu() {
    var hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.removeEventListener('click', toggleMenu);
      hamburger.addEventListener('click', toggleMenu);
    }
    if (overlay) {
      overlay.removeEventListener('click', closeMenu);
      overlay.addEventListener('click', closeMenu);
    }
    document.querySelectorAll('.nav__link, .nav__link--icon, .nav__cta').forEach(function (link) {
      link.removeEventListener('click', closeMenu);
      link.addEventListener('click', closeMenu);
    });
  }

  function initNavScroll() {
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    };
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initSidebarActive() {
    var currentPath = window.location.pathname;
    document.querySelectorAll('.docs-sidebar__link').forEach(function (link) {
      link.classList.remove('docs-sidebar__link--active');
      var href = link.getAttribute('href');
      if (currentPath.endsWith(href)) {
        link.classList.add('docs-sidebar__link--active');
      }
    });
  }

  function initScrollReveal() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate--visible');
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.animate').forEach(function (el) {
      observer.observe(el);
    });
  }

  function initPrism() {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }

  function getArch() {
    var ua = navigator.userAgent || '';
    var plat = navigator.platform || '';
    if (/aarch64|arm64|arm/i.test(ua) || /arm|win32|win64/i.test(plat)) {
      if (/windows\s+arm|wow64/i.test(ua) || /arm/i.test(plat)) return 'aarch64';
    }
    return 'x64';
  }

  function initDownloadLinks() {
    var arch = getArch();

    fetch('https://api.github.com/repos/Comp-Tech-Guy/Kalam/releases/latest')
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API error');
        return res.json();
      })
      .then(function (release) {
        var assets = (release.assets || []).filter(function (a) {
          return a.name && a.name.endsWith('.msi');
        });
        if (!assets.length) return;

        var msi = assets.find(function (a) {
          return a.name.indexOf(arch) !== -1;
        }) || assets[0];

        var url = msi.browser_download_url;
        var version = (release.tag_name || '').replace(/^v/, '');

        document.querySelectorAll('[data-download]').forEach(function (btn) {
          btn.href = url;
          if (version && btn.classList.contains('btn')) {
            btn.textContent = 'Download v' + version;
          }
        });

        if (arch === 'aarch64') {
          var info = document.querySelector('.download__info');
          if (info) {
            info.textContent = 'Windows 10/11 ARM64 \u00B7 Using x64 installer (compatible via emulation)';
          }
        }
      })
      .catch(function () {});
  }

  function reinitialize() {
    var newAppContent = document.getElementById('app-content');
    if (newAppContent) appContent = newAppContent;
    initMobileMenu();
    initSidebarActive();
    initScrollReveal();
    initPrism();
  }

  function navigate(url) {
    if (isTransitioning) return;
    isTransitioning = true;

    closeMenu();

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Fetch failed');
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newContent = doc.getElementById('app-content');

        if (!newContent) {
          window.location.href = url;
          return;
        }

        history.pushState({ url: url }, '', url);
        document.title = doc.title;

        var exiting = appContent;
        if (exiting) {
          exiting.classList.add('page-exit');
        }

        setTimeout(function () {
          if (exiting && exiting.parentNode) {
            exiting.innerHTML = newContent.innerHTML;
            exiting.className = 'page-enter';
            appContent = exiting;

            requestAnimationFrame(function () {
              appContent.classList.add('page-enter');
              requestAnimationFrame(function () {
                appContent.classList.remove('page-enter');
                isTransitioning = false;
                reinitialize();
              });
            });
          }
        }, 200);
      })
      .catch(function () {
        window.location.href = url;
      });
  }

  function initRouter() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      if (link.getAttribute('target') === '_blank') return;
      if (link.hasAttribute('download')) return;

      var href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('http') || href.startsWith('//')) return;
      if (href.startsWith('#')) {
        e.preventDefault();
        var target = document.getElementById(href.substring(1));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          history.pushState(null, '', href);
        }
        return;
      }
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      e.preventDefault();
      var fullUrl = new URL(href, window.location.href).pathname;
      if (fullUrl === window.location.pathname) return;
      navigate(fullUrl);
    });

    window.addEventListener('popstate', function () {
      var url = window.location.pathname;
      fetch(url)
        .then(function (res) { return res.ok ? res.text() : Promise.reject(); })
        .then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newContent = doc.getElementById('app-content');
          if (!newContent) { window.location.reload(); return; }
          document.title = doc.title;
          appContent.innerHTML = newContent.innerHTML;
          isTransitioning = false;
          reinitialize();
        })
        .catch(function () { window.location.reload(); });
    });
  }

  function init() {
    closeMenu();
    initMobileMenu();
    initNavScroll();
    initSidebarActive();
    initScrollReveal();
    initPrism();
    initDownloadLinks();
    initRouter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
