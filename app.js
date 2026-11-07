// Pockvo — website behaviour: reveal on scroll, counters, the live phone, navigation and downloads.
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = (n, frac = 0) => n.toLocaleString('ru-RU', { minimumFractionDigits: frac, maximumFractionDigits: frac });

  // ---------- coins and networks ----------
  const COINS = [
    ['bitcoin', 'Bitcoin', 'BTC'], ['ethereum', 'Ethereum', 'ETH'], ['tether', 'Tether', 'USDT'], ['the-open-network', 'Toncoin', 'TON'],
    ['solana', 'Solana', 'SOL'], ['binancecoin', 'BNB', 'BNB'], ['ripple', 'XRP', 'XRP'], ['cardano', 'Cardano', 'ADA'],
    ['dogecoin', 'Dogecoin', 'DOGE'], ['tron', 'TRON', 'TRX'], ['usd-coin', 'USD Coin', 'USDC'], ['litecoin', 'Litecoin', 'LTC'],
    ['monero', 'Monero', 'XMR'], ['avalanche-2', 'Avalanche', 'AVAX'], ['polygon-ecosystem-token', 'Polygon', 'POL'], ['zcash', 'Zcash', 'ZEC'],
    ['dash', 'Dash', 'DASH'], ['ethereum-classic', 'Ethereum Classic', 'ETC'], ['arbitrum', 'Arbitrum', 'ARB'], ['optimism', 'Optimism', 'OP'],
    ['digibyte', 'DigiByte', 'DGB'], ['ravencoin', 'Ravencoin', 'RVN'],
  ];
  const NETS = [
    ['bitcoin', 'Bitcoin'], ['ethereum', 'Ethereum'], ['tron', 'TRON'], ['solana', 'Solana'], ['the-open-network', 'TON'],
    ['binancecoin', 'BNB Chain'], ['polygon-ecosystem-token', 'Polygon'], ['arbitrum', 'Arbitrum'], ['optimism', 'Optimism'],
    [null, 'Base', '#0052ff', 'B'], ['avalanche-2', 'Avalanche'], ['litecoin', 'Litecoin'], ['dogecoin', 'Dogecoin'], ['ripple', 'XRP Ledger'],
    ['cardano', 'Cardano'], ['zcash', 'Zcash'], ['monero', 'Monero'], ['ethereum-classic', 'Ethereum Classic'], ['dash', 'Dash'],
    ['digibyte', 'DigiByte'], ['ravencoin', 'Ravencoin'],
  ];
  const coinImg = (id) => `assets/coins/${id}.webp`;

  const ticker = $('#ticker');
  if (ticker) {
    const items = COINS.map(([id, name, sym]) => `<span class="tk"><img src="${coinImg(id)}" alt="" loading="lazy" width="26" height="26" />${name}<em>${sym}</em></span>`).join('');
    // two copies: the track moves by half its width and starts over seamlessly
    ticker.innerHTML = items + items.replace(/<span class="tk">/g, '<span class="tk" aria-hidden="true">');
  }
  const nets = $('#nets');
  if (nets) {
    nets.innerHTML = NETS.map(([id, name, color, letter], i) =>
      id
        ? `<span class="net" style="--i: ${i}"><img src="${coinImg(id)}" alt="" loading="lazy" width="30" height="30" />${name}</span>`
        : `<span class="net" style="--i: ${i}"><span class="ndot" style="background: ${color}">${letter}</span>${name}</span>`,
    ).join('');
  }

  // ---------- reveal on scroll ----------
  const counters = $$('[data-count]');
  if (!reduce) for (const c of counters) c.textContent = '0';
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const plus = el.hasAttribute('data-plus') ? '+' : '';
    if (reduce || !target) return void (el.textContent = fmt(target) + plus);
    const t0 = performance.now();
    const dur = 1600;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 4)))) + (k === 1 ? plus : '');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        for (const c of e.target.matches('[data-count]') ? [e.target] : $$('[data-count]', e.target)) countUp(c);
        seen.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  for (const el of $$('.reveal, .nets')) seen.observe(el);

  // ---------- the phone ----------
  const phone = $('#phone');
  const total = $('#appTotal');
  if (phone) {
    requestAnimationFrame(() => phone.classList.add('live'));
    if (total && !reduce) {
      const target = 12480.52;
      const t0 = performance.now() + 500;
      const step = (now) => {
        const k = Math.max(0, Math.min(1, (now - t0) / 1800));
        total.textContent = '$' + fmt(target * (1 - Math.pow(1 - k, 3)), 2);
        if (k < 1) requestAnimationFrame(step);
      };
      total.textContent = '$0,00';
      requestAnimationFrame(step);
    }
    // tilt towards the mouse
    const hero = $('.hero');
    if (hero && finePointer && !reduce) {
      let raf = 0;
      hero.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = phone.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
          const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
          phone.style.setProperty('--ry', `${(dx * 18).toFixed(2)}deg`);
          phone.style.setProperty('--rx', `${(-dy * 14).toFixed(2)}deg`);
        });
      });
      hero.addEventListener('pointerleave', () => {
        phone.style.setProperty('--ry', '0deg');
        phone.style.setProperty('--rx', '0deg');
      });
    }
  }

  // ---------- cards follow the cursor ----------
  if (finePointer && !reduce) {
    for (const el of $$('.spot')) {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  }

  // ---------- navigation ----------
  const nav = $('#nav');
  const burger = $('#burger');
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      nav.classList.toggle('scrolled', scrollY > 10);
      // above the first section no menu item is "current"
      const first = document.getElementById('features');
      if (first && scrollY < first.offsetTop - innerHeight * 0.5) for (const a of $$('#links a.active')) a.classList.remove('active');
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  // in-page links scroll here (the browser's own jump can stall while the phone menu closes)
  for (const a of $$('a[href^="#"]')) {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id === 'top' ? document.body : document.getElementById(id);
      setMenu(false);
      if (!target || a.classList.contains('is-off')) return;
      e.preventDefault();
      if (id === 'top') scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id === 'top' ? location.pathname + location.search : '#' + id);
    });
  }
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false);
  });

  // the menu item of the section on screen
  const links = new Map($$('#links a').map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of links.values()) a.classList.remove('active');
        links.get(e.target.id)?.classList.add('active');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of links.keys()) {
    const s = document.getElementById(id);
    if (s) spy.observe(s);
  }

  // ---------- downloads ----------
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/i.test(ua) ? 'android' : /Windows/i.test(ua) ? 'windows' : /Linux|X11/i.test(ua) ? 'linux' : 'other';
  const yourCard = $(`.dl-card[data-os="${os}"]`);
  if (yourCard) yourCard.classList.add('yours');
  const LABEL = { windows: 'Скачать для Windows', android: 'Скачать для Android', linux: 'Скачать для Linux' };
  const BTN = { windows: 'Скачать для Windows', android: 'Скачать APK', linux: 'Скачать AppImage' };
  const NAME = { windows: 'Windows', android: 'Android', linux: 'Linux' };
  const heroBtn = $('#heroDownload');
  const heroText = $('#heroDownloadText');
  const mb = (b) => fmt(b / 1048576, b < 104857600 ? 1 : 0) + ' МБ';

  // latest.json is published together with the files: version, links, sizes and SHA-256
  fetch('latest.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => {
      if (!m || !m.version) return;
      $('#versionLine').textContent = `Версия ${m.version}. Бесплатно. Обновления приходят прямо в приложение.`;
      const sums = [];
      for (const key of ['windows', 'android', 'linux']) {
        const a = m[key];
        const btn = $(`[data-dl="${key}"]`);
        if (!a || !a.url || !btn) continue;
        btn.href = a.url;
        btn.setAttribute('download', '');
        btn.removeAttribute('aria-disabled');
        btn.classList.remove('is-off');
        btn.textContent = BTN[key];
        const meta = $(`[data-meta="${key}"]`);
        if (meta && a.size) meta.textContent = `${meta.textContent} · ${mb(a.size)}`;
        if (a.sha256) sums.push(`<div class="sum"><b>${NAME[key]} · ${a.url.split('/').pop()}</b><code>${a.sha256}</code></div>`);
        // the .deb sits next to the AppImage (Pockvo-<version>-amd64.deb)
        if (key === 'linux') {
          const deb = $('[data-dl-deb]');
          if (deb) {
            deb.href = a.url.replace(/[^/]+$/, `Pockvo-${m.version}-amd64.deb`);
            deb.setAttribute('download', '');
            deb.hidden = false;
          }
        }
        if (key === os) {
          heroBtn.href = a.url;
          heroBtn.setAttribute('download', '');
          heroText.textContent = LABEL[key];
        }
      }
      if (sums.length) $('#sums').innerHTML = sums.join('');
    })
    .catch(() => {});
  // a button without a file yet does nothing
  for (const b of $$('.dl-btn')) b.addEventListener('click', (e) => b.classList.contains('is-off') && e.preventDefault());

  $('#year').textContent = String(new Date().getFullYear());
})();
