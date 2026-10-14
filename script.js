(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- scroll reveal ---------- */
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('vis'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 80}ms`; io.observe(el); });
  } else {
    items.forEach((el) => el.classList.add('vis'));
  }

  /* ---------- particle network (gold) ---------- */
  const canvas = document.getElementById('net-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, pts = [], raf;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * DPR; canvas.height = h * DPR;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.min(80, Math.floor((w * h) / 24000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    }));
    if (reduce) draw(false);
  };
  function draw(step = true) {
    ctx.clearRect(0, 0, w, h);
    if (step) for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d2 = dx * dx + dy * dy;
        if (d2 < 15000) {
          ctx.strokeStyle = `rgba(255,181,0,${(1 - d2 / 15000) * 0.15})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(255,200,60,0.5)';
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2); ctx.fill(); }
    if (step) raf = requestAnimationFrame(() => draw(true));
  }
  window.addEventListener('resize', resize);
  resize();
  if (!reduce) {
    draw(true);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) draw(true);
    });
  }

  /* ---------- contact form ---------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const setErr = (id, msg) => {
    const input = document.getElementById(id);
    document.getElementById(id + '-err').textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const okName = setErr('name', name ? '' : 'Please enter your name.');
    const okEmail = setErr('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email.');
    if (!okName || !okEmail) { status.textContent = ''; (okName ? form.email : form.name).focus(); return; }

    // Free form backend: FormSubmit.co forwards submissions to this inbox.
    // First-ever submission triggers an activation email — click it once.
    const ENDPOINT = 'https://formsubmit.co/ajax/gino@streamenginestudios.com';
    const btn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    data._subject = `New BYG consultation request from ${name}`;
    data._template = 'table';
    data._replyto = email;
    btn.disabled = true;
    status.textContent = 'Sending…';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(() => {
        status.textContent = 'Thanks! We got your request and will be in touch within one business day.';
        form.reset();
      })
      .catch(() => {
        status.textContent = 'Something went wrong. Please email gino@streamenginestudios.com directly.';
      })
      .finally(() => { btn.disabled = false; });
  });

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
