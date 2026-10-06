/* =============================================================
   DELTACOMS — deltacoms.ca
   ============================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1. BOOT SCREEN
     --------------------------------------------------------- */
  // Deferred until the loader lifts, so the hero entrance isn't spent behind it.
  var afterBoot = [];
  var booted = false;

  function dismissBoot() {
    var boot = $('#boot');
    if (booted) return;
    booted = true;

    if (boot) {
      boot.classList.add('done');
      setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 700);
    }
    document.body.classList.remove('is-locked');

    afterBoot.forEach(function (fn) { fn(); });
    afterBoot.length = 0;
  }

  document.body.classList.add('is-locked');
  var bootDelay = reduced ? 0 : 1150;
  window.addEventListener('load', function () { setTimeout(dismissBoot, bootDelay); });
  // Failsafe: never trap the visitor behind the loader.
  setTimeout(dismissBoot, 3800);

  /* ---------------------------------------------------------
     2. YEAR
     --------------------------------------------------------- */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     3. STICKY NAV + FAB
     --------------------------------------------------------- */
  var nav = $('#nav');
  var fab = $('#fab');
  var contactSec = $('#contact');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('stuck', y > 24);

    if (fab) {
      var past = y > window.innerHeight * 0.85;
      var atContact = false;
      if (contactSec) {
        var r = contactSec.getBoundingClientRect();
        atContact = r.top < window.innerHeight * 0.85;
      }
      fab.classList.toggle('show', past && !atContact);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     4. MOBILE DRAWER
     --------------------------------------------------------- */
  var burger = $('#burger');
  var drawer = $('#drawer');

  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setDrawer(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (drawer) {
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1080) setDrawer(false);
  });

  /* ---------------------------------------------------------
     5. SCROLL REVEALS
     --------------------------------------------------------- */
  var reveals = $$('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    afterBoot.push(function () {
      reveals.forEach(function (el) { revObs.observe(el); });
    });
  }

  /* ---------------------------------------------------------
     6. COUNT-UP STATS
     --------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-to'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;

    if (reduced) { el.textContent = target + suffix; return; }

    var dur = 1400, t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = $$('.count');
  if (counters.length && 'IntersectionObserver' in window && !reduced) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (en.target.getAttribute('data-to') !== '0') countUp(en.target);
          cObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    afterBoot.push(function () {
      counters.forEach(function (el) { cObs.observe(el); });
    });
  } else {
    counters.forEach(function (el) {
      if (el.getAttribute('data-to') !== '0') countUp(el);
    });
  }

  /* ---------------------------------------------------------
     7. ACTIVE NAV LINK
     --------------------------------------------------------- */
  var navLinks = $$('.nav__links a');
  var sections = navLinks
    .map(function (a) {
      var id = a.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { secObs.observe(s); });
  }

  /* ---------------------------------------------------------
     8. CARD SPOTLIGHT (pointer-tracked glow)
     --------------------------------------------------------- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---------------------------------------------------------
     9. HERO NETWORK CANVAS
        Nodes + links + data pulses travelling the links.
        Deliberately on-theme: this is what we install.
     --------------------------------------------------------- */
  (function heroNet() {
    var cv = $('#netCanvas');
    if (!cv || reduced) return;

    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var nodes = [];
    var links = [];
    var pulses = [];
    var pointer = { x: -9999, y: -9999 };
    var raf = null;
    var LINK_DIST = 168;

    function sizeCanvas() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.floor(W * dpr);
      cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function build() {
      nodes = [];
      var density = Math.round((W * H) / 26000);
      var count = Math.max(22, Math.min(72, density));
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.5 + 0.9,
          ph: Math.random() * Math.PI * 2
        });
      }
      pulses = [];
    }

    function spawnPulse() {
      if (!links.length || pulses.length > 9) return;
      var L = links[(Math.random() * links.length) | 0];
      pulses.push({ a: L.a, b: L.b, t: 0, sp: 0.006 + Math.random() * 0.009 });
    }

    var lastSpawn = 0;

    function draw(ts) {
      ctx.clearRect(0, 0, W, H);
      links.length = 0;

      var i, j, n;

      // move
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      }

      // links
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            var d = Math.sqrt(d2);
            var alpha = (1 - d / LINK_DIST) * 0.3;
            links.push({ a: a, b: b });
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(90,170,240,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // pointer tether
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var pdx = n.x - pointer.x, pdy = n.y - pointer.y;
        var pd = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pd < 220) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.strokeStyle = 'rgba(124,198,255,' + ((1 - pd / 220) * 0.32).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // nodes
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var tw = 0.55 + 0.45 * Math.sin(ts / 900 + n.ph);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(160,215,255,' + (0.32 * tw + 0.2).toFixed(3) + ')';
        ctx.fill();
      }

      // data pulses
      if (ts - lastSpawn > 620) { spawnPulse(); lastSpawn = ts; }
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += p.sp;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        var px = p.a.x + (p.b.x - p.a.x) * p.t;
        var py = p.a.y + (p.b.y - p.a.y) * p.t;
        var fade = Math.sin(p.t * Math.PI);
        var g = ctx.createRadialGradient(px, py, 0, px, py, 9);
        g.addColorStop(0, 'rgba(190,232,255,' + (0.95 * fade).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(46,156,255,0)');
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function start() { if (!raf) raf = requestAnimationFrame(draw); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    sizeCanvas(); build(); start();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sizeCanvas(); build(); }, 180);
    });

    window.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }, { passive: true });

    window.addEventListener('pointerleave', function () {
      pointer.x = pointer.y = -9999;
    });

    // Stop painting when the hero is offscreen or the tab is hidden.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(cv);
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
  })();

  /* ---------------------------------------------------------
     10. QUOTE FORM  →  Web3Forms  →  scott@deltacoms.ca
     --------------------------------------------------------- */
  (function quoteForm() {
    var form   = $('#quoteForm');
    var status = $('#formStatus');
    var thanks = $('#thanks');
    var again  = $('#againBtn');
    if (!form) return;

    var ENDPOINT = 'https://api.web3forms.com/submit';

    function fail(msg) {
      if (status) status.textContent = msg;
    }

    function markField(el, bad) {
      var f = el.closest('.field');
      if (f) f.classList.toggle('invalid', bad);
    }

    // Clear the invalid state as soon as the visitor starts fixing it.
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { markField(el, false); });
      el.addEventListener('change', function () { markField(el, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      fail('');

      var required = $$('[required]', form);
      var firstBad = null;

      required.forEach(function (el) {
        var bad = !el.checkValidity();
        markField(el, bad);
        if (bad && !firstBad) firstBad = el;
      });

      if (firstBad) {
        fail('Please fill in the highlighted fields.');
        firstBad.focus();
        return;
      }

      var key = form.elements['access_key'] ? form.elements['access_key'].value : '';
      if (!key || key.indexOf('YOUR_WEB3FORMS') === 0) {
        fail('Form is not connected yet — email scott@deltacoms.ca directly, or add your Web3Forms access key.');
        return;
      }

      // Roll the service checkboxes into one readable line for the email.
      var picked = $$('input[name="services"]:checked', form).map(function (c) { return c.value; });
      var fd = new FormData(form);
      fd.delete('services');
      fd.append('services', picked.length ? picked.join(', ') : 'Not specified');

      form.classList.add('sending');

      fetch(ENDPOINT, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' }
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          form.classList.remove('sending');
          if (res.ok && res.d && res.d.success) {
            form.hidden = true;
            if (thanks) {
              thanks.hidden = false;
              thanks.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
            }
          } else {
            fail((res.d && res.d.message) || 'Something went wrong. Please email scott@deltacoms.ca.');
          }
        })
        .catch(function () {
          form.classList.remove('sending');
          fail('Network error. Please email scott@deltacoms.ca instead.');
        });
    });

    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        $$('.field.invalid', form).forEach(function (f) { f.classList.remove('invalid'); });
        fail('');
        if (thanks) thanks.hidden = true;
        form.hidden = false;
        form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      });
    }
  })();

})();
