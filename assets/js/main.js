/* Stéphanie Ongles · mise en scène : rideau d'accueil, film du héros en boucle, révélations, ardoise qui s'écrit, inspirations en défilement horizontal,
   avis, composeur de SMS (contact d'abord, aucun envoi automatique). Réglages : assets/js/config.js. */
(() => {
  'use strict';

  const CFG = window.STEPH || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const html = document.documentElement;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const api = (window.CSX = window.STEPHX = window.STEPHX || {});   /* CSX : alias lu par outils-qa/qa-chrome.mjs */

  /* ------------------------------------------------------------------ questions fréquentes */
  function setupFaq() {
    const host = $('#faqList');
    if (!host) return;
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.qa__q'); if (!b) return;
      const qa = b.parentElement, open = !qa.classList.contains('is-open');
      $$('.qa.is-open', host).forEach((x) => { x.classList.remove('is-open'); $('.qa__q', x).setAttribute('aria-expanded', 'false'); });
      qa.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
    });
  }

  /* ------------------------------------------------------------------ composeur de message (SMS) */
  const EXTRA = { autre: { name: 'Autre chose', phrase: 'quelque chose qui n’est pas dans la liste' } };
  function setupCompose() {
    const form = $('#compose');
    if (!form) return;
    const rows = $$('.ligne').map((li) => ({ id: li.dataset.id, name: li.dataset.name, phrase: li.dataset.phrase, li }));
    rows.push({ id: 'autre', name: EXTRA.autre.name, phrase: EXTRA.autre.phrase, li: null });
    const chipsSoin = $('#chipsSoin'), chipsQuand = $('#chipsQuand');
    const msg = $('#cMsg'), prenom = $('#cPrenom'), dispo = $('#cDispo'), go = $('#smsGo'), hint = $('#composeHint'), copyBtn = $('#copyMsg');
    const state = { soins: new Set(), quand: new Set(), style: '' };
    let dirty = false;
    const defaultHint = hint ? hint.textContent : '';

    chipsSoin.innerHTML = rows.map((r) => '<button type="button" class="chip" data-id="' + r.id + '" aria-pressed="false">' + r.name + '</button>').join('');

    const join = (arr) => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' et ' + arr[arr.length - 1];
    const sentence = () => {
      const pr = prenom.value.trim(), di = dispo.value.trim();
      const hello = 'Bonjour Stéphanie' + (pr ? ', c’est ' + pr : '') + '. ';
      const choisis = rows.filter((r) => state.soins.has(r.id)).map((r) => r.phrase);
      let want = 'Je souhaiterais prendre rendez-vous';
      if (state.style) want += ' pour des ongles dans le style « ' + state.style + ' » (j’ai vu l’idée sur votre site)' + (choisis.length ? ', avec ' + join(choisis) : '');
      else if (choisis.length) want += ' pour ' + join(choisis);
      want += '.';
      const quand = [...state.quand];
      let when = '';
      if (quand.length || di) {
        when = ' Mes disponibilités : ' + [quand.length ? join(quand) : '', di.replace(/[.\s]+$/, '')].filter(Boolean).join(', ') + '.';
      }
      return hello + want + when + ' Pourriez-vous me proposer un créneau ? Merci beaucoup !';
    };
    const sync = (regen) => {
      if (regen && !dirty) msg.value = sentence();
      go.href = 'sms:' + (CFG.TEL_INTL || '') + '?body=' + encodeURIComponent(msg.value);
    };
    const paint = () => {
      $$('.chip', chipsSoin).forEach((c) => c.setAttribute('aria-pressed', String(state.soins.has(c.dataset.id))));
      $$('.chip', chipsQuand).forEach((c) => c.setAttribute('aria-pressed', String(state.quand.has(c.dataset.q))));
      rows.forEach((r) => r.li && r.li.classList.toggle('is-picked', state.soins.has(r.id)));
    };
    const pick = (id, opts = {}) => {
      if (opts.exclusive) state.soins.clear();
      if (opts.toggle) { state.soins.has(id) ? state.soins.delete(id) : state.soins.add(id); } else state.soins.add(id);
      if (opts.style !== undefined) state.style = opts.style;
      dirty = false; paint(); sync(true);
    };
    api.pick = pick;

    chipsSoin.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) pick(c.dataset.id, { toggle: true }); });
    chipsQuand.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      state.quand.has(c.dataset.q) ? state.quand.delete(c.dataset.q) : state.quand.add(c.dataset.q);
      dirty = false; paint(); sync(true);
    });
    [prenom, dispo].forEach((el) => el.addEventListener('input', () => sync(true)));
    msg.addEventListener('input', () => { dirty = true; sync(false); });
    form.addEventListener('submit', (e) => e.preventDefault());

    /* un bouton de la carte, ou « autre chose » : on coche le soin puis l'ancre #rdv fait descendre */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      pick(b.dataset.pick);
      if (!b.getAttribute('href')) (api.scrollTo ? api.scrollTo('#rdv', {}) : $('#rdv').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
    });
    /* depuis la visionneuse d'inspiration */
    api.pickStyle = (name) => { state.style = name; dirty = false; paint(); sync(true); };

    copyBtn.addEventListener('click', async () => {
      const text = msg.value;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
        try { msg.select(); ok = document.execCommand('copy'); msg.setSelectionRange(0, 0); } catch (e2) { ok = false; }
      }
      const lab = $('span', copyBtn);
      lab.textContent = ok ? 'Message copié' : 'Copie impossible';
      if (hint) hint.textContent = ok ? 'Message copié : collez-le dans un SMS, WhatsApp ou un e-mail.' : 'Sélectionnez le texte du message pour le copier à la main.';
      setTimeout(() => { lab.textContent = 'Copier le message'; if (hint) hint.textContent = defaultHint; }, 2600);
    });
    sync(true);
  }

  /* ------------------------------------------------------------------ défilement fluide */
  function closeMenu() {
    const menu = $('#menu'), head = $('#head'), burger = $('#burger');
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open'); head.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.classList.remove('is-locked'); if (api.lenis) api.lenis.start();
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900);
  }
  function setupScroll() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis !== 'undefined' && !reduce) {
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
      api.lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }
    const headH = () => parseInt(getComputedStyle(html).getPropertyValue('--head-h')) || 76;
    api.scrollTo = (target, opt = {}) => {
      const el = typeof target === 'string' ? $(target) : target;
      if (!el && target !== 0) return;
      const off = opt.offset != null ? opt.offset : -headH() + 6;
      if (api.lenis) api.lenis.scrollTo(target === 0 ? 0 : el, { offset: off, duration: opt.duration || 1.7, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else if (target === 0) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
    };
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      if (id === '#top') api.scrollTo(0); else api.scrollTo(el, {});
    });
  }
  function fallbackAnchors() { document.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) closeMenu(); }); }

  /* ------------------------------------------------------------------ en-tête, menu, progression, barre mobile */
  function setupChrome() {
    const head = $('#head'), burger = $('#burger'), menu = $('#menu'), fab = $('#fab'), rdv = $('#rdv');
    if (burger) burger.addEventListener('click', () => {
      if (menu.hidden) { menu.hidden = false; void menu.offsetWidth; }
      const open = !menu.classList.contains('is-open');
      head.classList.toggle('menu-open', open);
      if (open) { menu.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fermer le menu'); document.body.classList.add('is-locked'); if (api.lenis) api.lenis.stop(); }
      else closeMenu();
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    const bar = $('#progress i');
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      head.classList.toggle('is-solid', y > innerHeight * 0.6);
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
      if (fab) {
        const r = rdv ? rdv.getBoundingClientRect() : { top: 9999, bottom: -9999 };
        const onRdv = r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;   /* la barre ne masque pas le formulaire */
        fab.classList.toggle('is-on', y > innerHeight * 0.9 && !onRdv);
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* lueur de bougie qui suit le curseur sur les fonds sombres */
  function setupGlow() {
    const g = $('#glow');
    if (!g || !fine || reduce || !hasGsap) return;
    const qx = gsap.quickTo(g, 'x', { duration: .9, ease: 'power3' }), qy = gsap.quickTo(g, 'y', { duration: .9, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      qx(e.clientX); qy(e.clientY);
      g.classList.toggle('is-on', !!e.target.closest('.hero, .slate, .objets, .rdv, .come, .foot, .menu'));
    }, { passive: true });
    document.addEventListener('mouseleave', () => g.classList.remove('is-on'));
  }
  function setupMagnetic() {
    if (!fine || reduce || !hasGsap) return;
    $$('[data-magnetic]').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.45)' });
      const qy = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.45)' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * .22); qy((e.clientY - (r.top + r.height / 2)) * .3); });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }
  function setupTilt() {
    if (!fine || reduce || !hasGsap) return;
    $$('[data-tilt]').forEach((el) => {
      const host = el.closest('[data-tilt-host]') || el.parentElement;
      const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      host.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 14); rx(-((e.clientY - r.top) / r.height - .5) * 14); });
      host.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ------------------------------------------------------------------ découpage de texte */
  function splitWords(el, mask) {
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            if (mask) {
              const w = document.createElement('span'); w.className = 'sw';
              const i = document.createElement('span'); i.className = 'swi'; i.textContent = p; w.appendChild(i); frag.appendChild(w); words.push(i);
            } else {
              const w = document.createElement('span'); w.className = 'w'; w.textContent = p; frag.appendChild(w); words.push(w);
            }
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
    return words;
  }

  /* ------------------------------------------------------------------ héros : le film tourne tout seul, en boucle */
  const MOBILE_Q = '(max-width: 820px), (orientation: portrait)';
  const FILM_T = CFG.REPERES || [0, 5.05, 8.95, 13.05];
  function setupHero() {
    const stage = $('#heroStage'), video = $('#heroVideo'), pauseBtn = $('#heroPause');
    if (!stage || !video) return Promise.resolve();
    const caps = $$('.cap', stage), steps = $$('.hero__steps li', stage);
    const live = CFG.HERO_VIDEO !== false;
    const label = pauseBtn && $('span', pauseBtn);
    const icon = pauseBtn && $('use', pauseBtn);
    /* « réduire les animations » : on ne charge rien et on attend que la visiteuse lance le film elle-même */
    let cur = 0, userPaused = reduce, blocked = false, started = false, src = '', inView = true;

    const setCap = (n) => {
      cur = n;
      caps.forEach((c, i) => c.classList.toggle('is-on', i === n));
      steps.forEach((li, i) => li.classList.toggle('is-on', i === n));
      stage.dataset.cap = String(n + 1);
    };
    const capAt = (t) => { let n = 0; FILM_T.forEach((x, i) => { if (t >= x) n = i; }); return n; };
    const syncBtn = () => {
      if (!pauseBtn) return;
      const off = userPaused || blocked;
      pauseBtn.setAttribute('aria-pressed', String(off));
      pauseBtn.setAttribute('aria-label', off ? 'Lancer le film' : 'Mettre le film en pause');
      pauseBtn.classList.toggle('is-blocked', blocked || (reduce && userPaused));
      if (label) label.textContent = off ? 'Lancer le film' : 'Pause';
      if (icon) icon.setAttribute('href', off ? '#i-play' : '#i-pause');
    };

    const mq = matchMedia(MOBILE_Q);
    const setSrc = () => {
      const next = 'assets/video/' + (mq.matches ? 'film-mobile.mp4' : 'film-bureau.mp4');
      if (next === src) return;
      const t = src ? video.currentTime : 0;
      src = next; video.src = next; video.load();
      if (t) video.addEventListener('loadedmetadata', () => { try { video.currentTime = t; } catch (e) { /* ignoré */ } lireFilm(); }, { once: true });
    };

    /* une seule règle d'état : le film joue si l'accueil est terminé, que la visiteuse ne l'a pas mis en pause, que le héros est visible et l'onglet affiché */
    const want = () => live && started && !userPaused && inView && !document.hidden;
    const start = () => {
      if (!src) setSrc();
      const p = video.play();
      /* lecture automatique refusée (Safari, économie d'énergie) : le bouton clignote ; un premier geste de la visiteuse relance le film */
      if (p && p.then) p.then(() => { if (blocked) { blocked = false; syncBtn(); } }, (err) => { if (err && err.name === 'NotAllowedError') { blocked = true; syncBtn(); } });
    };
    const lireFilm = () => { if (want()) { if (video.paused) start(); } else if (!video.paused) video.pause(); };

    if (!live) { if (pauseBtn) pauseBtn.hidden = true; const st = $('.hero__steps'); if (st) st.style.display = 'none'; return Promise.resolve(); }

    const ready = reduce ? Promise.resolve() : new Promise((res) => { video.addEventListener('canplay', res, { once: true }); video.addEventListener('error', res, { once: true }); });
    if (!reduce) setSrc();
    if (mq.addEventListener) mq.addEventListener('change', () => { if (src) setSrc(); });
    syncBtn();

    video.addEventListener('playing', () => video.classList.add('is-on'));
    video.addEventListener('timeupdate', () => { const n = capAt(video.currentTime); if (n !== cur) setCap(n); });
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
      if (blocked || (reduce && userPaused)) { userPaused = false; blocked = false; syncBtn(); start(); return; }
      userPaused = !userPaused; syncBtn(); lireFilm();
    });
    /* relances : visibilité, retour sur l'onglet, premier geste (sauf sur le bouton lui-même), entrée dans l'écran, et un contrôle toutes les 1,5 s */
    new IntersectionObserver((es) => { inView = es[es.length - 1].isIntersecting; lireFilm(); }, { threshold: 0.05 }).observe(stage);
    document.addEventListener('visibilitychange', lireFilm);
    addEventListener('focus', lireFilm);
    addEventListener('pageshow', lireFilm);
    ['pointerdown', 'touchend', 'keydown', 'wheel'].forEach((ev) => addEventListener(ev, (e) => {
      if (e.target && e.target.closest && e.target.closest('#heroPause')) return;
      if (blocked && !userPaused) start(); else lireFilm();
    }, { passive: true }));
    setInterval(lireFilm, 1500);

    api.startHero = () => { started = true; lireFilm(); };
    api.cap = () => cur;
    api.film = () => ({ paused: video.paused, t: video.currentTime, blocked, userPaused, src });

    if (hasGsap) {
      const tw = gsap.to('#heroMedia', { yPercent: 9, scale: 1.07, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__copy', { opacity: 0, y: -50, ease: 'none', scrollTrigger: { trigger: '#top', start: '35% top', end: 'bottom 30%', scrub: true } });
      api.heroST = tw.scrollTrigger;
    }
    return ready;
  }

  function heroIntro() {
    if (!hasGsap) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('.hero__poster, .hero__video', { scale: 1.12 }, { scale: 1, duration: 2.8, ease: 'power3.out' }, 0)
      .fromTo('.hero__title .ln > span', { yPercent: 118 }, { yPercent: 0, duration: 1.6 }, 0.1)
      .fromTo('.hero__eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 0.5)
      .fromTo('.hero__lead', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1 }, 0.9)
      .fromTo('.hero__cta .btn', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 1.1)
      .fromTo('.hero__rate, .hero__caps, .hero__steps, .hero__cue, .hero__pause', { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: 0.1 }, 1.4);
  }

  /* ------------------------------------------------------------------ révélations au défilement */
  function setupReveals() {
    if (!hasGsap || reduce) return;
    /* titres : les mots montent un à un */
    $$('[data-split-title]').forEach((h) => {
      const words = splitWords(h, true);
      gsap.set(words, { yPercent: 118 });
      ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.07 }) });
    });
    /* texte d'accueil : les mots s'allument */
    const mt = $('#manifestoText');
    if (mt) {
      const words = splitWords(mt, false);
      gsap.fromTo(words, { opacity: 0.18 }, { opacity: 1, ease: 'none', stagger: 0.5, scrollTrigger: { trigger: mt, start: 'top 82%', end: 'bottom 52%', scrub: 0.6 } });
    }
    /* fondus */
    $$('.traits li, .stats p, .qa, .compose__f, .how li, .mini-avis li, .social__c, .score, .come__line, .objets__text .btn').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 93%', once: true } });
    });
    /* photos : rideau qui s'ouvre, image qui se pose */
    $$('[data-reveal="mask"]').forEach((fig) => {
      const img = $('img', fig);
      gsap.fromTo(fig, { clipPath: 'inset(10% 10% 10% 10% round 36px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.5, ease: 'power4.out', scrollTrigger: { trigger: fig, start: 'top 90%', once: true }, onComplete: () => gsap.set(fig, { clearProps: 'clipPath' }) });
      if (img && !img.hasAttribute('data-parallax')) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: fig, start: 'top 90%', once: true } });
    });
    /* compteurs */
    $$('[data-count]').forEach((el) => {
      const to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); } }) });
    });
    /* parallaxe douce des grandes images */
    $$('[data-parallax]').forEach((el) => {
      const f = parseFloat(el.dataset.parallax) || 0.1, dir = f < 0 ? -1 : 1;
      gsap.fromTo(el, { yPercent: -5 * dir, scale: 1.1 }, { yPercent: 5 * dir, scale: 1.1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });
    /* l'ardoise : le trait de craie se dessine, puis chaque ligne s'écrit */
    const cl = $('#chalkLine path');
    if (cl) {
      const len = cl.getTotalLength();
      gsap.set(cl, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(cl, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: '#chalkLine', start: 'top 90%', once: true } });
    }
    $$('.ligne').forEach((li) => {
      const t = $('h3', li), p = $('.ligne__t p', li), n = $('.ligne__n', li), b = $('.ligne__b', li);
      gsap.set(t, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set([p, n, b], { opacity: 0, y: 10 });
      ScrollTrigger.create({ trigger: li, start: 'top 90%', once: true, onEnter: () => {
        const tl = gsap.timeline();
        tl.to(n, { opacity: 1, y: 0, duration: .5 }, 0)
          .to(t, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.out' }, 0.05)
          .to([p, b], { opacity: 1, y: 0, duration: .8, stagger: .1, ease: 'power3.out' }, 0.5)
          .add(() => gsap.set(t, { clearProps: 'clipPath' }));
      } });
    });
    /* notes en barres : elles se remplissent à l'arrivée */
    $$('.bars i').forEach((b) => {
      gsap.set(b, { '--s': 0 });
      ScrollTrigger.create({ trigger: b, start: 'top 95%', once: true, onEnter: () => gsap.to(b, { '--s': 1, duration: 1.4, ease: 'power3.out' }) });
    });
    /* mot géant du pied de page */
    const word = $('.foot__word span');
    if (word) gsap.fromTo(word, { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#foot', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });
  }

  /* bandeau qui défile (vitesse liée au défilement) */
  function setupTickers() {
    $$('.marquee__track').forEach((t) => {
      Array.from(t.children).forEach((c) => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); t.appendChild(k); });
    });
    if (!hasGsap || reduce) return;
    let vel = 0;
    if (api.lenis) api.lenis.on('scroll', (e) => { vel = e.velocity || 0; });
    else addEventListener('scroll', (() => { let y = scrollY; return () => { vel = (scrollY - y) * 0.6; y = scrollY; }; })(), { passive: true });
    const items = $$('.marquee__track').map((el) => ({ el, x: 0, half: 0, vis: false }));
    items.forEach((m) => new IntersectionObserver(([e]) => { m.vis = e.isIntersecting; }, { rootMargin: '200px' }).observe(m.el.parentElement));
    const measure = () => { items.forEach((m) => { m.half = m.el.scrollWidth / 2; }); };
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    gsap.ticker.add((t, dt) => {
      const d = Math.min(dt, 50) / 1000;
      items.forEach((m) => {
        if (!m.vis || !m.half) return;
        m.x -= (46 + Math.abs(vel) * 16) * d;
        if (m.x <= -m.half) m.x += m.half;
        gsap.set(m.el, { x: m.x });
      });
    });
  }

  /* inspirations : défilement horizontal épinglé (ordinateur) ; sur mobile, glissement tactile natif.
     Chaque carte montre sa photo ENTIÈRE ; l'étiquette (numéro + nom) reste dans la partie visible de la carte quand elle est coupée par le bord de l'écran ;
     quand on arrête de défiler, le défilement se cale doucement sur la carte la plus proche (elle apparaît alors en entier, avec son nom). */
  function setupRail() {
    if (!hasGsap) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const pin = $('#railPin'), track = $('#railTrack');
      if (!pin || !track) return;
      const cards = $$('.rc', track);
      const dist = () => Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingInline) * 1.3);
      const labels = () => {
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const els = c._lab || (c._lab = $$('.rc__n, .rc__t', c));
          const shift = clamp(16 - r.left, 0, Math.max(0, r.width - 250));
          els.forEach((e) => { e.style.transform = shift > 0.5 ? 'translateX(' + shift.toFixed(1) + 'px)' : ''; });
        });
      };
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: labels, onRefresh: labels } });
      const st = tween.scrollTrigger;
      /* positions de calage : progression du défilement qui centre chaque carte (la première et la dernière butent aux extrémités) */
      const targets = () => {
        const x0 = gsap.getProperty(track, 'x');
        return cards.map((c) => { const r = c.getBoundingClientRect(); const centre = r.left - x0 + r.width / 2; return clamp((centre - innerWidth / 2) / (dist() || 1), 0, 1); });
      };
      let idle = 0;
      api.rail = { st, targets };
      const snap = () => {
        if (!api.lenis || !st.isActive) return;
        const span = st.end - st.start; if (span <= 0) return;
        const p = clamp((scrollY - st.start) / span, 0, 1);
        const best = targets().reduce((a, b) => (Math.abs(b - p) < Math.abs(a - p) ? b : a));
        if (Math.abs(best - p) * span < 6) return;
        api.lenis.scrollTo(st.start + best * span, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3) });
      };
      if (api.lenis) api.lenis.on('scroll', () => { clearTimeout(idle); if (st.isActive) idle = setTimeout(snap, 280); });
      labels();
      return () => { clearTimeout(idle); cards.forEach((c) => (c._lab || []).forEach((e) => { e.style.transform = ''; })); };
    });
  }

  /* visionneuse d'une inspiration */
  function setupLightbox() {
    const dlg = $('#lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const img = $('#lbImg'), cap = $('#lbCap'), go = $('#lbGo');
    let last = null;
    const close = () => { if (dlg.open) dlg.close(); };
    $('#railTrack').addEventListener('click', (e) => {
      const b = e.target.closest('.rc'); if (!b) return;
      last = b;
      const im = $('img', b);
      img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = b.dataset.style;
      go.dataset.style = b.dataset.style;
      dlg.showModal();
      if (api.lenis) api.lenis.stop();
    });
    $('#lbClose').addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { if (api.lenis && !document.body.classList.contains('is-locked')) api.lenis.start(); if (last) last.focus(); });
    go.addEventListener('click', (e) => {
      e.preventDefault();
      api.pickStyle && api.pickStyle(go.dataset.style || '');
      close();
      setTimeout(() => api.scrollTo ? api.scrollTo('#rdv', {}) : $('#rdv').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 80);
    });
  }

  /* avis : un grand extrait à la fois, défilement automatique (en pause au survol et hors écran) */
  function setupAvis() {
    const host = $('#bigq');
    if (!host) return;
    const items = $$('.bigq__item', host), dots = $('#bigqDots');
    let i = 0, timer = 0, paused = false, vis = true;
    dots.innerHTML = items.map(() => '<li></li>').join('');
    const dotEls = $$('li', dots);
    const show = (n) => {
      i = (n + items.length) % items.length;
      items.forEach((x, k) => x.classList.toggle('is-on', k === i));
      dotEls.forEach((d, k) => { d.classList.remove('is-on'); if (k === i) { void d.offsetWidth; d.classList.add('is-on'); } });
      arm();
    };
    const arm = () => { clearTimeout(timer); if (!reduce) timer = setTimeout(() => { if (!paused && vis && !document.hidden) show(i + 1); else arm(); }, 7000); };
    $('#bigqPrev').addEventListener('click', () => show(i - 1));
    $('#bigqNext').addEventListener('click', () => show(i + 1));
    host.addEventListener('pointerenter', () => { paused = true; });
    host.addEventListener('pointerleave', () => { paused = false; });
    host.addEventListener('focusin', () => { paused = true; });
    host.addEventListener('focusout', () => { paused = false; });
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }, { threshold: 0.2 }).observe(host);
    show(0);
  }

  /* carte OpenStreetMap : chargée seulement à la demande */
  function setupMap() {
    const btn = $('#mapGo'), box = $('#mapBox');
    if (!btn || !box) return;
    btn.addEventListener('click', () => {
      const [lat, lon] = CFG.GPS || [43.9161987, 5.9191943], d = 0.004;
      const f = document.createElement('iframe');
      f.title = 'Carte : boutique de Stéphanie, Oraison';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer';
      f.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + [lon - d * 1.6, lat - d, lon + d * 1.6, lat + d].join('%2C') + '&layer=mapnik&marker=' + lat + '%2C' + lon;
      box.appendChild(f);
      $('.map__card', box).remove();
    });
  }

  /* ------------------------------------------------------------------ écran d'accueil : le rideau s'ouvre */
  async function runLoader(heroReady) {
    const loader = $('#loader');
    if (!loader) { api.ready = true; if (api.startHero) api.startHero(); return; }
    if (reduce || !hasGsap) { loader.remove(); document.body.classList.remove('is-locked'); api.ready = true; if (api.lenis) api.lenis.start(); if (api.startHero) api.startHero(); return; }
    document.body.classList.add('is-locked');
    const bar = $('#loaderBar');
    gsap.to(bar, { scaleX: 0.9, duration: 1.9, ease: 'power2.out' });
    const poster = $('#heroPoster img');
    const imgReady = poster && !poster.complete ? new Promise((r) => { poster.addEventListener('load', r, { once: true }); poster.addEventListener('error', r, { once: true }); }) : Promise.resolve();
    await Promise.race([Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), imgReady, heroReady, sleep(2300)]), sleep(5200)]);
    gsap.to(bar, { scaleX: 1, duration: 0.3, ease: 'none' });
    await sleep(320);
    const tl = gsap.timeline();
    tl.to('.loader__mid', { opacity: 0, scale: 1.04, duration: 0.6, ease: 'power2.in' })
      .to('.loader__panel--l', { xPercent: -101, duration: 1.4, ease: 'power4.inOut' }, '>-0.05')
      .to('.loader__panel--r', { xPercent: 101, duration: 1.4, ease: 'power4.inOut' }, '<')
      .add(() => { heroIntro(); if (api.startHero) api.startHero(); document.body.classList.remove('is-locked'); if (api.lenis) api.lenis.start(); api.ready = true; }, '<0.45')
      .add(() => loader.remove());
  }

  /* ------------------------------------------------------------------ démarrage */
  function safe(fn) { try { fn(); } catch (err) { console.error('Erreur évitée dans ' + (fn.name || 'une fonction') + ' :', err); } }
  function init() {
    [setupFaq, setupCompose, setupAvis, setupMap, setupLightbox].forEach(safe);
    safe(setupChrome);
    if (hasGsap) safe(setupScroll); else safe(fallbackAnchors);
    if (hasGsap && !reduce) {
      gsap.set('.hero__title .ln > span', { yPercent: 118 });
      gsap.set('.hero__eyebrow, .hero__lead, .hero__cta .btn, .hero__rate, .hero__caps, .hero__steps, .hero__cue, .hero__pause', { opacity: 0 });
    }
    let heroReady = Promise.resolve();
    safe(() => { heroReady = setupHero(); });
    [setupReveals, setupTickers, setupRail, setupGlow, setupMagnetic, setupTilt].forEach(safe);
    runLoader(heroReady);
    const refresh = () => hasGsap && ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(refresh, 100));
    addEventListener('load', () => setTimeout(refresh, 500));
    /* le contenu change de hauteur (questions dépliées) : on recalcule les repères du défilement */
    if (hasGsap && 'ResizeObserver' in window) {
      const main = $('#main');
      let last = main.offsetHeight, t = 0;
      new ResizeObserver(() => {
        clearTimeout(t);
        t = setTimeout(() => { const h = main.offsetHeight; if (Math.abs(h - last) > 3) { last = h; refresh(); last = main.offsetHeight; } }, 260);
      }).observe(main);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
