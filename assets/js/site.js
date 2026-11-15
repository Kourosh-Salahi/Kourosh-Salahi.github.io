/* Shared behaviour: mobile nav, lightbox, table-of-contents highlight, hero draw-in. */
(function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth < 1024) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Lightbox: any <img class="zoom"> opens full-size on click
  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<img alt=""><figcaption></figcaption>';
  document.body.appendChild(box);
  var boxImg = box.querySelector('img');
  var boxCap = box.querySelector('figcaption');

  function openBox(img) {
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt || '';
    var fig = img.closest('figure');
    var cap = fig ? fig.querySelector('figcaption') : null;
    boxCap.textContent = cap ? cap.textContent : '';
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeBox() {
    box.classList.remove('open');
    boxImg.src = '';
    document.body.style.overflow = '';
  }
  document.addEventListener('click', function (e) {
    var img = e.target.closest('img.zoom');
    if (img) { openBox(img); return; }
    if (e.target.closest('.lightbox')) closeBox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && box.classList.contains('open')) closeBox();
  });
  // Keyboard access for zoomable images
  document.querySelectorAll('img.zoom').forEach(function (img) {
    img.setAttribute('tabindex', '0');
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBox(img); }
    });
  });

  // Highlight the current section in a page table of contents
  var tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (current) current.classList.remove('active');
          current = map[en.target.id];
          if (current) current.classList.add('active');
        }
      });
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // Home page: highlight the section in view in the sidebar
  var navLinks = document.querySelectorAll('.nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var nmap = {};
    navLinks.forEach(function (a) { nmap[a.getAttribute('href').slice(1)] = a; });
    var ncur = null;
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (ncur) ncur.classList.remove('current');
          ncur = nmap[en.target.id];
          if (ncur) ncur.classList.add('current');
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    Object.keys(nmap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) nio.observe(el);
    });
  }

  // Email: the address is never written in order in the HTML. Each email link
  // shows its letters shuffled with an "Unscramble" prompt. The first click
  // slides every letter to its real position and turns the link into a mailto:;
  // the next click opens a mail draft.
  document.querySelectorAll('a.email').forEach(function (a) {
    var holder = a.querySelector('.email-chars');
    if (!holder) return;
    var addr = a.dataset.u + '@' + a.dataset.h + '.' + a.dataset.t;
    var order = addr.split('').map(function (ch, i) { return i; });
    do {
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      }
    } while (order.every(function (v, k) { return v === k; }));
    var spans = [];
    holder.textContent = '';
    order.forEach(function (idx) {
      var sp = document.createElement('span');
      sp.className = 'ch';
      sp.textContent = addr[idx];
      spans[idx] = sp;
      holder.appendChild(sp);
    });
    var hint = document.createElement('span');
    hint.className = 'email-hint';
    hint.textContent = 'Unscramble';
    a.appendChild(hint);
    a.classList.add('scrambled');
    a.setAttribute('aria-label', 'Email address, scrambled. Activate to unscramble.');

    a.addEventListener('click', function (e) {
      if (!a.classList.contains('scrambled')) return; // already solved: behave as a normal mailto link
      e.preventDefault();
      var before = spans.map(function (sp) { return sp.getBoundingClientRect(); });
      spans.forEach(function (sp) { holder.appendChild(sp); }); // real order
      a.classList.remove('scrambled');
      a.classList.add('solved');
      hint.textContent = 'Send email';
      a.href = 'mailto:' + addr;
      a.removeAttribute('aria-label');
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !holder.animate) return;
      spans.forEach(function (sp, k) {
        var now = sp.getBoundingClientRect();
        var dx = before[k].left - now.left, dy = before[k].top - now.top;
        var hop = (k % 2 ? -1 : 1) * (8 + Math.abs(dx) * 0.12);
        sp.animate([
          { transform: 'translate(' + dx + 'px,' + dy + 'px)', color: 'var(--signal)' },
          { transform: 'translate(' + dx / 2 + 'px,' + (dy / 2 + hop) + 'px)', color: 'var(--signal)', offset: 0.5 },
          { transform: 'none' }
        ], { duration: 650, delay: k * 28, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' });
      });
    });
  });

  // Theme toggle (dark is the default; the choice is remembered)
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'light') root.setAttribute('data-theme', 'light');
  var foot = document.querySelector('.nav-foot');
  if (foot) {
    var tbtn = document.createElement('button');
    tbtn.className = 'theme-toggle';
    tbtn.type = 'button';
    var label = function () {
      tbtn.textContent = root.getAttribute('data-theme') === 'light' ? 'Dark mode' : 'Light mode';
    };
    label();
    tbtn.addEventListener('click', function () {
      var light = root.getAttribute('data-theme') === 'light';
      if (light) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'light');
      try { localStorage.setItem('theme', light ? 'dark' : 'light'); } catch (e) {}
      label();
    });
    foot.appendChild(tbtn);
  }

  // Reading progress bar on pages with an article body
  if (document.querySelector('.article, .essay')) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var setBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', setBar, { passive: true });
    window.addEventListener('resize', setBar);
    setBar();
  }

  // Home page workcell: a two-link planar arm that follows the pointer.
  // Closed-form inverse kinematics, eased in joint space toward the solution.
  var arm = document.getElementById('arm');
  if (arm) {
    var BX = 160, BY = 246, L1 = 130, L2 = 110, FLOOR = 282;
    var $ = function (id) { return document.getElementById(id); };
    var el = {
      l1: [$('arm-l1o'), $('arm-l1i')], l2: [$('arm-l2o'), $('arm-l2i')],
      j2: [$('arm-j2'), $('arm-p2')], j3: $('arm-j3'), tool: $('arm-tool'),
      target: $('arm-target'), trail: $('arm-trail'),
      t1: $('arm-t1'), t2: $('arm-t2'), x: $('arm-x'), z: $('arm-z')
    };
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var goal = { x: 245, y: 120 };
    var q = null;          // current joint angles [th1, th2], eased toward the IK solution
    var elbow = -1;        // which IK branch is in use: -1 bends the elbow left, +1 right
    var hover = false, trail = [], t0 = performance.now();

    function clampGoal(x, y) {
      y = Math.min(y, FLOOR);
      var dx = x - BX, dy = y - BY, d = Math.hypot(dx, dy) || 1;
      var lo = Math.abs(L1 - L2) + 12, hi = L1 + L2 - 4;
      var c = Math.max(lo, Math.min(hi, d));
      return { x: BX + dx / d * c, y: BY + dy / d * c };
    }
    // Closed-form IK in a frame with z pointing up from the shoulder
    function solve() {
      var px = goal.x - BX, pz = BY - goal.y;
      // Switch elbow branch only once the target is well past the vertical,
      // so the arm does not chatter between the two solutions near x = 0.
      if (px > 30) elbow = -1; else if (px < -30) elbow = 1;
      var c2 = (px * px + pz * pz - L1 * L1 - L2 * L2) / (2 * L1 * L2);
      var th2 = elbow * Math.acos(Math.max(-1, Math.min(1, c2)));
      var th1 = Math.atan2(pz, px) - Math.atan2(L2 * Math.sin(th2), L1 + L2 * Math.cos(th2));
      return [th1, th2];
    }
    function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
    function draw() {
      var th1 = q[0], th2 = q[1];
      var ex = BX + L1 * Math.cos(th1), ey = BY - L1 * Math.sin(th1);
      var tx = ex + L2 * Math.cos(th1 + th2), ty = ey - L2 * Math.sin(th1 + th2);
      el.l1.forEach(function (l) { l.setAttribute('x2', ex); l.setAttribute('y2', ey); });
      el.l2.forEach(function (l) { l.setAttribute('x1', ex); l.setAttribute('y1', ey); l.setAttribute('x2', tx); l.setAttribute('y2', ty); });
      el.j2.forEach(function (c) { c.setAttribute('cx', ex); c.setAttribute('cy', ey); });
      el.j3.setAttribute('cx', tx); el.j3.setAttribute('cy', ty);
      el.tool.setAttribute('transform', 'translate(' + tx + ' ' + ty + ') rotate(' + (-(th1 + th2) * 180 / Math.PI) + ')');
      el.target.setAttribute('transform', 'translate(' + goal.x + ' ' + goal.y + ')');
      trail.push(tx.toFixed(1) + ',' + ty.toFixed(1));
      if (trail.length > 70) trail.shift();
      el.trail.setAttribute('points', trail.join(' '));
      el.t1.textContent = (th1 * 180 / Math.PI).toFixed(1) + '°';
      el.t2.textContent = (th2 * 180 / Math.PI).toFixed(1) + '°';
      el.x.textContent = Math.round(tx - BX);
      el.z.textContent = Math.round(BY - ty);
    }
    function frame(now) {
      if (!hover && !reduce) {
        // Idle: trace a slow figure-eight through the workspace
        var t = (now - t0) / 1000;
        goal = clampGoal(275 + 100 * Math.sin(t * 0.55), 130 + 60 * Math.sin(t * 1.1));
      }
      // Ease in joint space. When the elbow branch changes, the joints swing
      // through the straight pose instead of snapping to the mirrored one.
      var want = solve();
      if (!q) q = want;
      var d1 = wrap(want[0] - q[0]), d2 = want[1] - q[1];
      // Cap joint speed (about 170 degrees per second) so a branch change reads as a deliberate swing
      var lim = function (v) { return Math.max(-0.048, Math.min(0.048, v * 0.13)); };
      q[0] += lim(d1);
      q[1] += lim(d2);
      draw();
      if (!reduce || Math.abs(d1) + Math.abs(d2) > 0.002) requestAnimationFrame(frame);
      else running = false;
    }
    var running = true;
    function point(e) {
      var r = arm.getBoundingClientRect();
      goal = clampGoal((e.clientX - r.left) / r.width * 480, (e.clientY - r.top) / r.height * 340);
      hover = true;
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    arm.addEventListener('pointermove', point);
    arm.addEventListener('pointerdown', point);
    arm.addEventListener('pointerleave', function () { hover = false; });
    requestAnimationFrame(frame);
  }
})();
