/*
  TOWBAM – structure de base de l’application
  Les sections suivantes regroupent les fonctionnalités du site par responsabilité.
*/

const $ = (selector) => document.querySelector(selector);
const app = $('#app');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

// ===================================================
// État global
// ===================================================
let S = {
  u: null,
  cart: [],
  lib: [],
  fol: [],
  rev: [],
  sub: [],
  sales: [],
  pay: [],
  rep: [],
  read: {},
  users: [],
  last: null,
  feat: []
};

try {
  Object.assign(S, JSON.parse(localStorage.getItem('towbam') || '{}'));
} catch (error) {
  console.warn('No state to restore:', error);
}

const save = () => {
  try {
    localStorage.setItem('towbam', JSON.stringify(S));
  } catch (error) {
    console.warn('Unable to save state:', error);
  }
};

const normalizeRole = (value) => {
  const role = String(value ?? '').trim().toLowerCase();
  const map = {
    lecteur: 'reader',
    reader: 'reader',
    auteur: 'author',
    author: 'author',
    mod: 'moderator',
    moderator: 'moderator',
    admin: 'admin'
  };
  return map[role] || role || 'reader';
};

const displayRole = (value) => {
  const role = normalizeRole(value);
  const map = {
    reader: 'Lecteur',
    author: 'Auteur',
    moderator: 'Modérateur',
    admin: 'Admin'
  };
  return map[role] || role;
};

const getApiBase = () => localStorage.getItem('towbam_api') || 'http://127.0.0.1:8000/api';

const demoUsers = [
  { id: 'demo-admin', name: 'Administrateur TOWBAM', email: 'admin@towbam.test', password: 'Admin123!', role: 'admin', country: 'Sénégal' },
  { id: 'demo-moderator', name: 'Modérateur TOWBAM', email: 'modo@towbam.test', password: 'Admin123!', role: 'moderator', country: 'Cameroun' },
  { id: 'demo-author', name: 'Auteur TOWBAM', email: 'auteur@towbam.test', password: 'Author123!', role: 'author', country: 'Maroc' },
  { id: 'demo-reader', name: 'Lecteur TOWBAM', email: 'lecteur@towbam.test', password: 'Reader123!', role: 'reader', country: 'Côte d’Ivoire' }
];

const ensureDemoUsers = () => {
  const saved = JSON.parse(localStorage.getItem('towbam_demo_users') || '[]');
  if (!saved.length) {
    localStorage.setItem('towbam_demo_users', JSON.stringify(demoUsers));
  }
};

const genericFetch = async (path, { method = 'GET', body = null, token = null } = {}) => {
  const base = getApiBase();
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : null
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Erreur ${response.status}`);
  }

  return data;
};

const toast = (message) => {
  const target = $('#toast');
  target.textContent = message;
  target.style.display = 'block';
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    target.style.display = 'none';
  }, 2600);
};

// ===================================================
// Données statiques
// ===================================================
const AF = [
  'Sénégal', 'RDC', 'Côte d’Ivoire', 'Cameroun', 'Nigeria', 'Kenya', 'Ghana', 'Maroc',
  'Algérie', 'Tunisie', 'Rwanda', 'Bénin', 'Mali', 'Gabon', 'Congo', 'Éthiopie',
  'Afrique du Sud', 'Madagascar'
];

const A = [
  { id: 1, n: 'Amina Diallo', c: 'Sénégal', b: 'Romancière, elle écrit les fleuves, la mémoire et l’exil.', f: 312 },
  { id: 2, n: 'Joël Mbuyi', c: 'RDC', b: 'Poète et nouvelliste, voix de la jeune littérature congolaise.', f: 204 },
  { id: 3, n: 'Ngozi Eze', c: 'Nigeria', b: 'Autrice de fiction spéculative et de contes urbains.', f: 487 },
  { id: 4, n: 'Kofi Mensah', c: 'Ghana', b: 'Essayiste sur les villes africaines et leurs diasporas.', f: 96 },
  { id: 5, n: 'Salma Benali', c: 'Maroc', b: 'Romancière du quotidien, entre deux rives.', f: 158 }
];

const T = [
  'Le jour se levait sur le fleuve et chacun savait que rien ne serait plus comme avant.',
  'Elle porta la lampe jusqu’au seuil, hésita, puis laissa la lumière raconter à sa place.',
  'Dans la cour, les enfants comptaient les étoiles ; leur grand-père comptait les absents.',
  'On disait que la ville avait mille portes, mais une seule s’ouvrait de l’intérieur.',
  'Il écrivit son nom dans la poussière, puis le regarda disparaître avec le vent du soir.',
  'Les marchandes se turent d’un seul coup : quelqu’un venait de prononcer le nom interdit.',
  'La lettre était arrivée avec dix ans de retard, et pourtant elle arrivait à temps.',
  'Au bout du chemin, un baobab attendait, patient comme ceux qui ont déjà tout vu.',
  'Elle apprit que partir est une manière de rester, si l’on emporte les bons mots.',
  'Le soir, la radio grésillait une chanson que personne n’osait plus fredonner.',
  'Ils se retrouvèrent là où commencent les histoires : sous un toit de tôle, au bruit de la pluie.',
  'Et c’est ainsi que la première page devint la dernière, et la dernière, une promesse.'
];

const B = [
  [1, 'Le Fleuve et la Lampe', 1, 'Roman', 'Français', 9.9, 12, 'Une famille, un fleuve et un secret transmis de nuit en nuit.'],
  [2, 'Les Portes de la ville', 2, 'Nouvelles', 'Français', 6.5, 5, 'Neuf nouvelles dans une capitale qui ne dort jamais.'],
  [3, 'Neon Savanna', 3, 'Science-fiction', 'Anglais', 8.5, 3, 'Lagos, 2150 : une intelligence née des marchés.'],
  [4, 'Cités et mémoires', 4, 'Essai', 'Anglais', 11, 40, 'Comment les villes africaines se racontent à l’étranger.'],
  [5, 'Entre deux rives', 5, 'Roman', 'Français', 7.9, 20, 'Deux sœurs, Casablanca et Marseille, une maison à vendre.'],
  [6, 'Poussière de mots', 2, 'Poésie', 'Français', 4.5, 2, 'Poèmes courts pour les jours longs.'],
  [7, 'Le Baobab muet', 1, 'Conte', 'Français', 5.5, 60, 'Un conte pour les enfants et ceux qui l’ont été.'],
  [8, 'Mother Tongue', 3, 'Roman', 'Anglais', 9, 90, 'Une traductrice retrouve la langue de sa grand-mère.']
].map((book) => ({
  id: book[0],
  t: book[1],
  a: book[2],
  g: book[3],
  l: book[4],
  p: book[5],
  d: book[6],
  s: book[7],
  x: 10
}));

// ===================================================
// Helpers
// ===================================================
const au = (book) => book.an || (A.find((author) => author.id == book.a) || {}).n;
const cn = (book) => book.ac || (A.find((author) => author.id == book.a) || {}).c;
const books = () => B.concat(S.sub.filter((book) => book.st === 'approuvé'));
const bk = (id) => books().find((book) => book.id == id);
const own = (id) => S.lib.includes(+id);
const role = () => (S.u ? normalizeRole(S.u.role) : null);
const stars = (value) => '★'.repeat(Math.round(value)) + '☆'.repeat(5 - Math.round(value));

const cov = (book) => `
  <div class="cov" style="--h:${(book.id * 47) % 360}">
    <span>${esc(book.t)}</span>
    <i>${esc(au(book))}</i>
  </div>
`;

const card = (book) => `
  <a class="bk" href="#/livre/${book.id}">
    ${cov(book)}
    <b>${esc(book.t)}</b>
    <small>${esc(au(book))} · ${book.p} $</small>
  </a>
`;

const need = (roles) => {
  if (!S.u) {
    location.hash = '#/connexion';
    toast('Connectez-vous pour continuer');
    return 1;
  }

  if (roles && !roles.includes(role())) {
    location.hash = '#/';
    toast('Accès réservé');
    return 1;
  }

  return 0;
};

const nz = (value) => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

// ===================================================
// Navigation / rendu
// ===================================================
const V = {};

function createShelfBackground() {
  const width = 1800;
  const height = 1000;
  const shelfCount = window.innerWidth < 700 ? 4 : 6;
  const seeded = (seed) => {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };
  const random = seeded(42);
  const palette = ['#c0392b', '#f0c987', '#5d7a66', '#313746', '#d9b57f', '#f6f2ea', '#b05d50'];

  let shelves = '';

  for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex += 1) {
    const shelfY = 80 + shelfIndex * 155;
    shelves += `<rect x="0" y="${shelfY + 8}" width="${width}" height="5" fill="#8c6a43" opacity="0.7" rx="2" />`;
    shelves += `<rect x="0" y="${shelfY}" width="${width}" height="8" fill="#a67c4d" opacity="0.5" rx="3" />`;

    let x = 40;
    while (x < width - 50) {
      const bookWidth = 18 + random() * 28;
      const bookHeight = 90 + random() * 60;
      const bookColor = palette[Math.floor(random() * palette.length)];
      const titleX = x + 5;
      const titleY = shelfY + 18;
      const tilt = random() > 0.7 ? (random() > 0.5 ? 10 : -12) : 0;
      const groupTransform = `translate(${x} ${shelfY + 22}) rotate(${tilt} ${bookWidth / 2} ${bookHeight / 2})`;
      const spine = 5 + random() * 5;
      shelves += `
        <g transform="${groupTransform}">
          <rect x="0" y="0" width="${bookWidth}" height="${bookHeight}" rx="4" fill="${bookColor}" opacity="0.96" />
          <rect x="${bookWidth - spine}" y="0" width="${spine}" height="${bookHeight}" fill="rgba(27, 24, 18, 0.18)" />
          <rect x="${Math.min(7, bookWidth * 0.2)}" y="8" width="${Math.max(6, bookWidth * 0.35)}" height="${Math.max(18, bookHeight * 0.18)}" fill="rgba(255,255,255,0.18)" rx="2" />
          <text x="${titleX}" y="${titleY}" fill="rgba(9, 12, 18, 0.55)" font-size="10" font-family="Arial, sans-serif" transform="rotate(-90 ${titleX} ${titleY})">${Math.round(random() * 9) + 1}</text>
        </g>
      `;
      x += bookWidth + 10 + random() * 12;
    }
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="shelfFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(246,242,234,0.8)" />
          <stop offset="100%" stop-color="rgba(246,242,234,0.1)" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="transparent" />
      ${shelves}
    </svg>
  `;
}

if (document.querySelector('.shelf-bg')) {
  document.querySelector('.shelf-bg').innerHTML = createShelfBackground();
}

function nav() {
  const initials = S.u ? (S.u.name || 'U').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U' : 'U';
  const authorLink = S.u && ['author', 'admin'].includes(role()) ? '<a href="#/auteur-espace">Espace auteur</a>' : '';
  const isConnected = Boolean(S.u);

  $('#nav').innerHTML = `
    <button class="nav-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav-panel">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div class="nav-panel" id="nav-panel">
      <div class="nav-main">
        <a href="#/catalogue">Catalogue</a>
        <a href="#/auteurs">Auteurs</a>
        <a href="#/#approche">Notre approche</a>
        <a href="#/panier">Panier (${S.cart.length})</a>
      </div>
      <div class="nav-user">
        ${isConnected ? `
          <div class="nav-user-wrap" id="account-menu-wrap">
            <button class="user-avatar-button" type="button" id="account-menu-button" aria-label="Ouvrir le menu du compte" aria-expanded="false">${esc(initials)}</button>
            <div class="user-menu" id="account-menu" role="menu" aria-label="Menu du compte">
              <a href="#/compte" role="menuitem">Mon compte</a>
              <a href="#/bibliotheque" role="menuitem">Ma bibliothèque</a>
              ${authorLink}
              <button type="button" id="logout-trigger" role="menuitem">Déconnexion</button>
            </div>
          </div>
        ` : `
          <a href="#/connexion" class="nav-user-link">Connexion</a>
          <a class="btn s nav-user-button" href="#/inscription">Créer un compte →</a>
        `}
      </div>
    </div>
  `;

  const navRoot = document.getElementById('nav');
  const navToggle = navRoot && navRoot.querySelector('.nav-toggle');
  const navPanel = navRoot && navRoot.querySelector('.nav-panel');

  if (navToggle && navPanel) {
    const closeMobileNav = () => {
      navRoot.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = navRoot.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navPanel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMobileNav());
    });

    document.addEventListener('click', (event) => {
      if (!navRoot.contains(event.target)) {
        closeMobileNav();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMobileNav();
      }
    });
  }

  if (!isConnected) return;

  const menuWrap = document.getElementById('account-menu-wrap');
  const menuButton = document.getElementById('account-menu-button');
  const menu = document.getElementById('account-menu');
  const logoutTrigger = document.getElementById('logout-trigger');

  const closeMenu = () => {
    if (!menuWrap || !menuButton || !menu) return;
    menuWrap.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  };

  if (menuButton) {
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = menuWrap.classList.contains('open');
      menuWrap.classList.toggle('open', !isOpen);
      menuButton.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  document.addEventListener('click', (event) => {
    if (!menuWrap || !menu.contains(event.target) && !menuButton.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  if (logoutTrigger) {
    logoutTrigger.addEventListener('click', () => {
      S.u = null;
      S.lib = [];
      save();
      location.hash = '#/';
      nav();
      toast('Déconnexion réussie');
    });
  }
}

function initSplashScreen() {
  if (window.TowbamBook3D && typeof window.TowbamBook3D.initSplashScreen === 'function') {
    window.TowbamBook3D.initSplashScreen();
    return;
  }
}

function talents() {
  const day = Math.floor(Date.now() / 86400000);
  return books()
    .slice()
    .sort((a, b) => a.d - b.d)
    .slice(0, 8)
    .map((book, index, items) => items[(index + day) % items.length]);
}

let F = { q: '', g: '', l: '', c: '', pm: '', s: 'new' };

V[''] = () => `
  <div class="w">
    <section class="hero">
      <div class="hero-copy">
        <span class="pill">● Une nouvelle maison pour les histoires</span>
        <h1>Des histoires <em>qui méritent d’être lues</em></h1>
        <p class="lead">TOWBAM réunit les lecteurs et les auteurs africains autour d’une plateforme claire, crédible et visuellement premium pour découvrir, soutenir et faire grandir les talents.</p>
        <div class="hero-cta">
          <a class="btn" href="#/inscription">Rejoindre TOWBAM</a>
          <a class="btn g" href="#/#approche">Découvrir notre démarche</a>
        </div>
        <div class="stat-strip">
          <div>
            <strong>350+</strong>
            <span>Auteurs</span>
          </div>
          <div>
            <strong>18K</strong>
            <span>Lecteurs</span>
          </div>
          <div>
            <strong>95%</strong>
            <span>Contenu validé</span>
          </div>
        </div>
      </div>

      ${window.TowbamBook3D && typeof window.TowbamBook3D.getHeroBookHTML === 'function'
        ? window.TowbamBook3D.getHeroBookHTML()
        : `
          <div class="book-stage" aria-label="Livre littéraire animé">
            <div class="book-cover">
              <span class="cover-label">TOWBAM</span>
              <span class="cover-title">Des histoires<br>qui méritent<br>d’être lues</span>
            </div>
          </div>
        `}
    </section>
  </div>

  <section class="sec soft-panel">
    <div class="w">
      <div class="section-head">
        <div>
          <span class="eyebrow">Pourquoi TOWBAM</span>
          <h2>Une expérience littéraire pensée pour durer.</h2>
        </div>
      </div>
      <div class="mini-grid">
        <article class="mini-card">
          <span class="mini-emoji">✦</span>
          <h3>Découverte qualitative</h3>
          <p>Chaque titre est pensé pour être trouvé, compris et recommandé avec clarté.</p>
        </article>
        <article class="mini-card">
          <span class="mini-emoji">◎</span>
          <h3>Équipe de modération</h3>
          <p>Des décisions transparentes et une qualité éditoriale forte pour chaque publication.</p>
        </article>
        <article class="mini-card">
          <span class="mini-emoji">↗</span>
          <h3>Monétisation juste</h3>
          <p>Les auteurs sont valorisés, avec une logique de rémunération lisible et équilibrée.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="w section-head">
      <div>
        <span class="eyebrow">Nouveaux talents</span>
        <h2>Des voix qui prennent de la hauteur.</h2>
      </div>
      <p class="lead">Une rotation équitable met chaque auteur en avant, pour faire place à des histoires fortes et diverses.</p>
    </div>
    <div class="w">
      <div class="grid">${talents().slice(0, 6).map(card).join('')}</div>
      <div class="section-actions"><a class="btn g" href="#/catalogue">Voir tout le catalogue</a></div>
    </div>
  </section>

  <section class="sec soft-panel" id="approche">
    <div class="w two">
      <div>
        <span class="eyebrow">Notre approche</span>
        <h2>La confiance avant le catalogue.</h2>
        <p class="lead">TOWBAM bâtit une communauté où les lecteurs découvrent des œuvres avec clarté, et où les auteurs sont accompagnés sans confusion ni bruit.</p>
        <a class="text-link" href="#/inscription">Créer mon compte →</a>
      </div>

      <div class="feature-stack">
        ${[
          ['Des voix à rencontrer', 'Une plateforme conçue pour faire émerger des écrits qui sortent des sentiers battus.'],
          ['Des auteurs reconnus', 'Chaque candidature suit une procédure simple et transparente, avec une modération sérieuse.'],
          ['Un compte de confiance', 'Vos préférences, votre identité et votre bibliothèque restent au cœur d’une expérience pensée pour durer.']
        ].map((item, index) => `
          <div class="feature-row">
            <span class="feature-number">0${index + 1}</span>
            <div>
              <h3>${item[0]}</h3>
              <p>${item[1]}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="w">
      <div class="section-head">
        <div>
          <span class="eyebrow">Temoignages</span>
          <h2>Ce que racontent nos lecteurs et auteurs.</h2>
        </div>
      </div>
      <div class="quote-grid">
        <article class="quote-card">
          <p>“TOWBAM a l’air d’une vraie maison d’édition, mais en ligne. J’y ai découvert des voix que je n’aurais jamais trouvées ailleurs.”</p>
          <div class="quote-author">
            <strong>Amine D.</strong>
            <span>Lecteur</span>
          </div>
        </article>
        <article class="quote-card">
          <p>“Le parcours est lisible, le processus de soumission est crédible et l’espace de publication donne envie d’écrire plus fort.”</p>
          <div class="quote-author">
            <strong>Salma B.</strong>
            <span>Auteure</span>
          </div>
        </article>
        <article class="quote-card">
          <p>“Le produit a une vraie identité. Il inspire confiance, et c’est crucial dans la littérature émergente.”</p>
          <div class="quote-author">
            <strong>Karim M.</strong>
            <span>Modérateur</span>
          </div>
        </article>
      </div>
    </div>
  </section>

  <div class="w">
    <section class="navy">
      <div class="navy-inner">
        <div>
          <span class="eyebrow light">Rejoindre TOWBAM</span>
          <h2>Votre écriture a sa place dans la conversation.</h2>
        </div>
        <div class="navy-copy">
          <p>Créez un compte lecteur, puis déposez une demande pour rejoindre l’espace des auteurs. Chaque demande est examinée avec attention.</p>
          <p class="navy-bullets">✓ Vous restez lecteur pendant l’examen &nbsp; ✓ Aucune publication automatique &nbsp; ✓ Rémunération transparente (70 % auteur)</p>
          <p><a class="btn y" href="#/inscription">Commencer mon inscription</a></p>
        </div>
      </div>
    </section>
  </div>
`;

function listFilters() {
  const options = (getValue) => [...new Set(books().map(getValue))].map((value) => `<option>${esc(value)}</option>`).join('');

  return `
    <div class="w sec">
      <h2>Catalogue</h2>
      <div class="f" style="margin-top:20px">
        <input placeholder="Titre, auteur, résumé…" value="${esc(F.q)}" oninput="F.q=this.value;lst()" aria-label="Recherche" />
        <select onchange="F.g=this.value;lst()">
          <option value="">Tous genres</option>
          ${options((book) => book.g)}
        </select>
        <select onchange="F.l=this.value;lst()">
          <option value="">Toutes langues</option>
          ${options((book) => book.l)}
        </select>
        <select onchange="F.c=this.value;lst()">
          <option value="">Tous pays</option>
          ${options(cn)}
        </select>
        <input type="number" placeholder="Prix max $" min="0" oninput="F.pm=this.value;lst()" />
        <select onchange="F.s=this.value;lst()">
          <option value="new">Nouveautés</option>
          <option value="pa">Prix ↑</option>
          <option value="pd">Prix ↓</option>
        </select>
      </div>
      <div class="grid" id="lst"></div>
    </div>
  `;
}

V.catalogue = (route) => {
  if (route === 'nouveaux') F.s = 'new';
  return listFilters();
};

function lst() {
  let results = books().filter((book) => {
    const matchesQuery = nz(book.t + au(book) + book.s).includes(nz(F.q));
    const matchesGenre = !F.g || book.g === F.g;
    const matchesLanguage = !F.l || book.l === F.l;
    const matchesCountry = !F.c || cn(book) === F.c;
    const matchesPrice = !F.pm || book.p <= +F.pm;

    return matchesQuery && matchesGenre && matchesLanguage && matchesCountry && matchesPrice;
  });

  results.sort((a, b) => {
    if (F.s === 'pa') return a.p - b.p;
    if (F.s === 'pd') return b.p - a.p;
    return a.d - b.d;
  });

  $('#lst').innerHTML = results.map(card).join('') || '<p class="lead">Aucun livre ne correspond. Essayez moins de filtres.</p>';
}

// ===================================================
// Livres / auteurs / panier
// ===================================================
V.livre = (id) => {
  const book = bk(id);

  if (!book) {
    return '<div class="w sec"><h2>Livre introuvable</h2></div>';
  }

  const reviews = S.rev.filter((item) => item.b == book.id);
  const average = reviews.length ? reviews.reduce((sum, item) => sum + item.n, 0) / reviews.length : 0;
  const excerptLength = Math.ceil(T.length * book.x / 100);
  const followed = S.fol.includes(String(book.a));

  return `
    <div class="w det">
      <div>${cov(book)}</div>
      <div>
        <span class="tag">${esc(book.g)}</span>
        <span class="tag">${esc(book.l)}</span>
        <h1 style="font-size:3rem;margin:10px 0">${esc(book.t)}</h1>
        <p>
          par <a href="#/auteur/${book.a}" style="color:var(--red);font-weight:700">${esc(au(book))}</a>
          · ${esc(cn(book))} ${reviews.length ? ` · ${stars(average)} (${reviews.length})` : ''}
        </p>
        <p class="lead">${esc(book.s)}</p>
        <p style="font:2rem var(--serif)">${book.p} $</p>
        <p>
          ${own(book.id)
            ? `<a class="btn" href="#/lire/${book.id}">Lire le livre</a>`
            : `<button class="btn" onclick="add(${book.id})">Ajouter au panier</button>`}
          <button class="btn g" onclick="fol('${book.a}')">${followed ? 'Ne plus suivre' : 'Suivre'} l’auteur</button>
          <a href="#/page/signaler" style="font-size:.85rem;color:var(--mut)">Signaler</a>
        </p>

        <div class="card" style="margin-top:20px">
          <h3>Extrait (${book.x} %)</h3>
          <div class="read" style="font-size:17px">
            ${T.slice(0, excerptLength).map((paragraph) => `<p>${paragraph}</p>`).join('')}
          </div>
          <div class="lock">La suite est réservée aux lecteurs. Le livre complet n’est jamais accessible sans achat.</div>
        </div>

        <h3 style="margin-top:28px">Avis des lecteurs</h3>
        ${reviews.map((review) => `
          <p>
            <b>${esc(review.u)}</b> ${stars(review.n)}<br>
            ${esc(review.t)}
          </p>
        `).join('') || '<p class="lead">Pas encore d’avis.</p>'}

        ${own(book.id)
          ? `
            <form onsubmit="return rev(event,${book.id})" class="card">
              <label>Note</label>
              <select name="n">
                <option>5</option><option>4</option><option>3</option><option>2</option><option>1</option>
              </select>
              <label>Votre avis</label>
              <textarea name="t" required></textarea>
              <p><button class="btn s">Publier mon avis</button></p>
            </form>
          `
          : '<p class="lead">Les avis sont ouverts après achat.</p>'}
      </div>
    </div>
  `;
};

const add = (id) => {
  if (own(id)) return toast('Déjà dans votre bibliothèque');
  if (!S.cart.includes(id)) S.cart.push(id);
  save();
  nav();
  toast('Ajouté au panier');
};

const fol = (authorId) => {
  if (need()) return;

  const index = S.fol.indexOf(authorId);

  if (index < 0) {
    S.fol.push(authorId);
    toast('Auteur suivi. Vous serez prévenu par email à chaque publication.');
  } else {
    S.fol.splice(index, 1);
    toast('Vous ne suivez plus cet auteur');
  }

  save();
  go();
};

function rev(event, id) {
  event.preventDefault();
  const form = event.target;

  S.rev.push({
    b: id,
    u: S.u.name,
    n: +form.n.value,
    t: form.t.value
  });

  save();
  toast('Avis publié');
  go();
  return false;
}

const authors = () => A.concat(
  S.users.filter((user) => normalizeRole(user.role) === 'author' && !user.sus)
    .map((user) => ({
      id: user.id,
      n: user.name,
      c: user.country,
      b: user.bio || 'Nouvel auteur sur TOWBAM.',
      f: 0
    }))
);

V.auteurs = () => `
  <div class="w sec">
    <h2>Auteurs</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
      ${authors().map((author) => `
        <a class="card" href="#/auteur/${author.id}">
          <h3>${esc(author.n)}</h3>
          <small>${esc(author.c)} · ${author.f + (S.fol.includes(String(author.id)) ? 1 : 0)} abonnés</small>
          <p>${esc(author.b)}</p>
        </a>
      `).join('')}
    </div>
  </div>
`;

V.auteur = (id) => {
  const author = authors().find((entry) => entry.id == id);

  if (!author) return '<div class="w sec"><h2>Auteur introuvable</h2></div>';

  return `
    <div class="w sec">
      <h1 style="font-size:3.4rem">${esc(author.n)}</h1>
      <p>${esc(author.c)} · ${author.f + (S.fol.includes(String(author.id)) ? 1 : 0)} abonnés</p>
      <p class="lead">${esc(author.b)}</p>
      <p>
        <button class="btn" onclick="fol('${author.id}')">${S.fol.includes(String(author.id)) ? 'Ne plus suivre' : 'Suivre'}</button>
      </p>
      <div class="grid">
        ${books().filter((book) => book.a == author.id).map(card).join('') || '<p class="lead">Aucune œuvre publiée pour l’instant.</p>'}
      </div>
    </div>
  `;
};

V.panier = () => {
  const items = S.cart.map(bk).filter(Boolean);
  const total = items.reduce((sum, book) => sum + book.p, 0);

  return `
    <div class="w sec">
      <h2>Panier</h2>
      ${items.length
        ? `
          <div class="x">
            <table>
              ${items.map((book) => `
                <tr>
                  <td>${esc(book.t)}<br><small>${esc(au(book))}</small></td>
                  <td>${book.p} $</td>
                  <td>
                    <button class="btn g s" onclick="S.cart=S.cart.filter(i=>i!=${book.id});save();nav();go()">Retirer</button>
                  </td>
                </tr>
              `).join('')}
            </table>
          </div>
          <p style="font:2rem var(--serif)">Total : ${total.toFixed(2)} $</p>

          <form class="card" onsubmit="return pay(event,${total})">
            <label>Moyen de paiement</label>
            <select name="m" onchange="$('#pf').innerHTML=pfm(this.value)">
              <option>Carte bancaire (Stripe / PayPal)</option>
              <option>M-Pesa</option>
              <option>Orange Money</option>
              <option>Airtel Money</option>
              <option>MTN Mobile Money</option>
            </select>
            <div id="pf">${pfm('Carte')}</div>
            <p><button class="btn">Payer ${total.toFixed(2)} $</button></p>
            <small>Paiement simulé : aucune donnée bancaire n’est envoyée ni conservée.</small>
          </form>
        `
        : '<p class="lead">Votre panier est vide. <a href="#/catalogue" style="color:var(--red)">Explorer le catalogue</a></p>'}
    </div>
  `;
};

const pfm = (method) => /Carte/.test(method)
  ? '<label>Numéro de carte</label><input required inputmode="numeric" placeholder="4242 4242 4242 4242"><div class="f"><input required placeholder="MM/AA"><input required placeholder="CVC"></div>'
  : '<label>Numéro de téléphone mobile money</label><input required type="tel" placeholder="+243 …">';

function pay(event, total) {
  event.preventDefault();

  if (need()) return false;

  const items = S.cart.map(bk).filter(Boolean);
  const date = new Date().toLocaleDateString('fr-FR');

  items.forEach((book) => {
    S.lib.push(book.id);
    if (book.u) S.sales.push({ b: book.id, u: book.u, amt: book.p, d: date });
  });

  S.last = {
    n: 'TW-' + Date.now().toString().slice(-7),
    d: date,
    m: event.target.m.value,
    it: items.map((book) => [book.t, book.p]),
    t: total,
    e: S.u.email
  };

  S.cart = [];
  save();
  nav();
  location.hash = '#/recu';
  toast('Paiement confirmé');
  return false;
}

V.recu = () => {
  const receipt = S.last;

  if (!receipt) return V['']();

  return `
    <div class="w sec">
      <div class="card" style="max-width:560px">
        <h2>Reçu ${receipt.n}</h2>
        <p>${receipt.d} · ${esc(receipt.m)}<br>Envoyé à ${esc(receipt.e)}</p>
        ${receipt.it.map((item) => `<p>${esc(item[0])} — ${item[1]} $</p>`).join('')}
        <p><b>Total ${(+receipt.t).toFixed(2)} $</b></p>
        <p>
          <a class="btn" href="#/bibliotheque">Ouvrir ma bibliothèque</a>
          <button class="btn g" onclick="print()">Imprimer</button>
        </p>
      </div>
    </div>
  `;
};

V.bibliotheque = () => need() ? '' : `
  <div class="w sec">
    <h2>Ma bibliothèque</h2>
    <div class="grid">
      ${S.lib.map(bk).filter(Boolean).map((book) => `
        <div>
          ${cov(book)}
          <p><a class="btn s" href="#/lire/${book.id}">${S.read[book.id] ? 'Reprendre (' + S.read[book.id] + ' %)' : 'Lire'}</a></p>
        </div>
      `).join('') || '<p class="lead">Aucun livre pour l’instant.</p>'}
    </div>
  </div>
`;

// ===================================================
// Lecture / compte / authentification
// ===================================================
let FS = 19;
let NT = false;

V.lire = (id) => {
  if (need()) return '';

  const book = bk(id);
  if (!book || !own(id)) {
    location.hash = '#/livre/' + id;
    return '';
  }

  return `
    <div class="w sec">
      <p>
        <a href="#/bibliotheque">← Bibliothèque</a>
        · <button class="btn g s" onclick="FS-=2;rd()">A−</button>
        <button class="btn g s" onclick="FS+=2;rd()">A+</button>
        <button class="btn g s" onclick="NT=!NT;rd()">Mode nuit</button>
      </p>
      <h2 style="text-align:center;margin-bottom:20px">${esc(book.t)}</h2>
      <div class="read" id="rd">
        ${T.concat(T).map((paragraph) => `<p>${paragraph}</p>`).join('')}
        <p style="font:italic .8rem var(--sans);opacity:.6">Édition personnelle de ${esc(S.u.name)} — ${esc(S.u.email)}</p>
      </div>
    </div>
  `;
};

const rd = () => {
  const element = $('#rd');
  element.style.setProperty('--fs', FS + 'px');
  element.classList.toggle('night', NT);
};

const post = {
  lire: (id) => {
    if (!$('#rd')) return;
    rd();

    const root = document.documentElement;
    const progress = S.read[id] || 0;
    scrollTo(0, (root.scrollHeight - innerHeight) * progress / 100);

    onscroll = () => {
      S.read[id] = Math.round(scrollY / Math.max(1, root.scrollHeight - innerHeight) * 100);
      save();
    };
  },
  catalogue: () => lst()
};

window.fillDemoAccount = (email, password) => {
  const form = document.querySelector('#auth-form');
  if (!form) return;
  form.e.value = email;
  form.p.value = password;
  toast(`Identifiants chargés pour ${email}`);
};

const sign = (mode) => `
  <div class="w sec">
    <form id="auth-form" class="card auth-card" style="max-width:480px" onsubmit="return ${mode === 'in' ? 'login' : 'reg'}(event)">
      <h2>${mode === 'in' ? 'Connexion' : 'Créer un compte'}</h2>
      ${mode === 'up' ? '<label>Nom ou pseudonyme</label><input name="n" required>' : ''}
      <label>Email</label>
      <input name="e" type="email" required>
      <label>Mot de passe</label>
      <input name="p" type="password" minlength="6" required>
      ${mode === 'up' ? `
        <label>Je suis</label>
        <select name="r">
          <option value="reader">Lecteur (partout dans le monde)</option>
          <option value="author">Auteur africain</option>
        </select>
        <label>Pays</label>
        <input name="c" list="cl" required>
        <datalist id="cl">
          ${AF.map((country) => `<option>${country}</option>`).join('')}
          <option>France</option>
          <option>Belgique</option>
          <option>Canada</option>
        </datalist>
        <label style="font-weight:400">
          <input type="checkbox" required style="width:auto"> J’accepte les <a href="#/page/cgu" style="color:var(--red)">conditions</a> et, pour les auteurs, la <a href="#/page/charte" style="color:var(--red)">charte de contenu</a>.
        </label>
      ` : ''}
      <p>
        <button class="btn">${mode === 'in' ? 'Se connecter' : 'Créer mon compte'}</button>
        <button type="button" class="btn g" onclick="toast('Connexion Google disponible avec le backend')">Google</button>
      </p>
      <p>
        ${mode === 'in'
          ? '<a href="#/mdp">Mot de passe oublié ?</a> · <a href="#/inscription">Créer un compte</a>'
          : '<a href="#/connexion">J’ai déjà un compte</a>'}
      </p>
    </form>
  </div>
`;

V.connexion = () => sign('in');
V.inscription = () => sign('up');

V.mdp = () => `
  <div class="w sec">
    <form class="card" style="max-width:480px" onsubmit="event.preventDefault();toast('Lien de réinitialisation envoyé');return false">
      <h2>Mot de passe oublié</h2>
      <label>Email</label>
      <input type="email" required>
      <p><button class="btn">Envoyer le lien</button></p>
    </form>
  </div>
`;

function mk(name, email, roleName, country) {
  const normalizedRole = normalizeRole(/admin/.test(email) ? 'admin' : /modo/.test(email) ? 'moderator' : roleName);
  const user = {
    id: 'u' + Date.now() + Math.floor(Math.random() * 99),
    name,
    email,
    role: normalizedRole,
    country,
    bio: ''
  };

  S.users.push(user);
  return user;
}

async function login(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.e.value.trim();
  const password = form.p.value;

  try {
    const response = await genericFetch('/login', { method: 'POST', body: { email, password } }).catch(() => null);
    if (response && response.user) {
      const user = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: normalizeRole(response.user.role),
        country: response.user.country || '—',
        bio: response.user.bio || ''
      };
      S.u = user;
      S.users = [...S.users.filter((entry) => entry.email !== email), user];
      localStorage.setItem('towbam_token', response.token || '');
      save();
      nav();
      location.hash = '#/';
      toast('Bienvenue ' + user.name);
      return false;
    }

    ensureDemoUsers();
    const localUsers = JSON.parse(localStorage.getItem('towbam_demo_users') || '[]');
    const user = localUsers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      toast('Identifiants invalides');
      return false;
    }

    S.u = { ...user, role: normalizeRole(user.role), bio: '' };
    S.users = [...S.users.filter((entry) => entry.email !== email), S.u];
    save();
    nav();
    location.hash = '#/';
    toast('Bienvenue ' + S.u.name);
    return false;
  } catch (error) {
    toast(error.message || 'Erreur d’authentification');
    return false;
  }
}

function reg(event) {
  event.preventDefault();
  const form = event.target;

  if (form.r.value === 'author' && !AF.includes(form.c.value)) {
    toast('Le statut d’auteur est ouvert aux auteurs africains. Choisissez un pays africain ou le rôle lecteur.');
    return false;
  }

  if (S.users.find((user) => user.email === form.e.value)) {
    toast('Cet email a déjà un compte');
    return false;
  }

  const nextUser = mk(form.n.value, form.e.value, form.r.value, form.c.value);
  S.u = nextUser;
  save();
  nav();
  location.hash = '#/';
  toast('Compte créé. Vous êtes connecté.');
  return false;
}

V.compte = () => {
  if (need()) return '';

  const user = S.u;

  return `
    <div class="w sec">
      <form class="card" style="max-width:560px" onsubmit="return prof(event)">
        <h2>Mon compte</h2>
        <span class="tag">${esc(displayRole(user.role))}</span>
        <label>Nom / pseudonyme</label>
        <input name="n" value="${esc(user.name)}">
        <label>Pays</label>
        <input name="c" value="${esc(user.country)}">
        <label>Biographie</label>
        <textarea name="b">${esc(user.bio || '')}</textarea>
        <label>Lien (site, réseau)</label>
        <input name="l" value="${esc(user.link || '')}">
        ${normalizeRole(user.role) === 'author' ? `
          <label>Pièce d’identité (stockage sécurisé côté serveur)</label>
          <input type="file">
          <label>Moyen de retrait (mobile money ou IBAN)</label>
          <input name="w" value="${esc(user.w || '')}">
        ` : ''}
        <p>
          <button class="btn">Enregistrer</button>
          <button type="button" class="btn g" onclick="S.u=null;save();nav();location.hash='#/'">Se déconnecter</button>
        </p>
      </form>
    </div>
  `;
};

function prof(event) {
  event.preventDefault();
  const form = event.target;
  const user = S.u;

  user.name = form.n.value;
  user.country = form.c.value;
  user.bio = form.b.value;
  user.link = form.l.value;

  if (form.w) user.w = form.w.value;

  S.users = S.users.map((entry) => entry.id === user.id ? user : entry);
  save();
  nav();
  toast('Profil enregistré');
  return false;
}

// ===================================================
// Espace auteur / back-office
// ===================================================
let AT = 'o';
const sel = (key, label) => `<button class="btn ${AT === key ? 'on' : ''}" onclick="AT='${key}';go()">${label}</button>`;

const bal = () => {
  const revenue = S.sales.filter((sale) => sale.u == S.u.id).reduce((sum, sale) => sum + sale.amt * 0.7, 0);
  const payouts = S.pay.filter((item) => item.u == S.u.id).reduce((sum, item) => sum + item.amt, 0);
  return [revenue, payouts, revenue - payouts];
};

V['auteur-espace'] = () => {
  if (need(['author', 'admin'])) return '';

  const myWorks = S.sub.filter((work) => work.u === S.u.id);
  const [revenue, payouts, balance] = bal();
  const statusClass = (status) => ({
    brouillon: '',
    'en attente': 'wait',
    approuvé: 'ok',
    refusé: 'no',
    'à corriger': 'wait'
  }[status]);

  let content = '';

  if (AT === 'o') {
    content = `
      <div class="stat">
        <div><b>${S.sales.filter((sale) => sale.u == S.u.id).length}</b>ventes</div>
        <div><b>${revenue.toFixed(2)} $</b>revenus (70 %)</div>
        <div><b>${balance.toFixed(2)} $</b>solde disponible</div>
        <div><b>${myWorks.filter((work) => work.st === 'approuvé').length}</b>œuvres publiées</div>
      </div>
      <p class="lead">TOWBAM conserve 30 % (frais de paiement de 2,5 à 4 % inclus). Les taux définitifs restent à valider.</p>
    `;
  }

  if (AT === 'w') {
    content = `
      <div class="x">
        <table>
          <tr><th>Titre</th><th>Statut</th><th>Motif</th><th></th></tr>
          ${myWorks.map((work) => `
            <tr>
              <td>${esc(work.t)}</td>
              <td><span class="tag ${statusClass(work.st)}">${work.st}</span></td>
              <td>${esc(work.m || '')}</td>
              <td>${['brouillon', 'à corriger'].includes(work.st) ? `<button class="btn s" onclick="st(${work.id},'en attente')">Envoyer</button>` : ''}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">Aucune œuvre.</td></tr>'}
        </table>
      </div>
    `;
  }

  if (AT === 'n') {
    content = `
      <form class="card" onsubmit="return subm(event)">
        <label>Titre</label>
        <input name="t" required>
        <div class="f">
          <div>
            <label>Genre</label>
            <select name="g">
              <option>Roman</option>
              <option>Nouvelles</option>
              <option>Poésie</option>
              <option>Essai</option>
              <option>Conte</option>
              <option>Science-fiction</option>
            </select>
          </div>
          <div>
            <label>Langue</label>
            <select name="l">
              <option>Français</option>
              <option>Anglais</option>
            </select>
          </div>
          <div>
            <label>Prix ($)</label>
            <input name="p" type="number" step=".5" min="1" max="50" value="6" required>
          </div>
          <div>
            <label>Extrait gratuit (%)</label>
            <input name="x" type="number" min="5" max="30" value="10">
          </div>
        </div>
        <label>Résumé</label>
        <textarea name="s" required></textarea>
        <label>Fichier (PDF ou EPUB, 20 Mo max)</label>
        <input name="f" type="file" accept=".pdf,.epub" required>
        <label style="font-weight:400">
          <input type="checkbox" required style="width:auto"> J’accepte la charte de contenu et le contrat d’auteur.
        </label>
        <p>
          <button class="btn" name="go" value="en attente">Envoyer à la modération</button>
          <button class="btn g" name="go" value="brouillon" onclick="this.form.dr=1">Enregistrer le brouillon</button>
        </p>
      </form>
    `;
  }

  if (AT === 'r') {
    content = `
      <p>Solde disponible : <b>${balance.toFixed(2)} $</b> (minimum de retrait : 10 $)</p>
      <p><button class="btn" onclick="payout()">Demander un retrait</button></p>
      <div class="x">
        <table>
          ${S.pay.filter((item) => item.u == S.u.id).map((item) => `
            <tr>
              <td>${item.d}</td>
              <td>${item.amt.toFixed(2)} $</td>
              <td>${item.st}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      <p><button class="btn g s" onclick="csv()">Exporter l’historique (CSV)</button></p>
    `;
  }

  return `
    <div class="w sec">
      <h2>Espace auteur</h2>
      <div class="tabs">
        ${sel('o', 'Tableau de bord')}
        ${sel('w', 'Mes œuvres')}
        ${sel('n', 'Soumettre')}
        ${sel('r', 'Revenus et retraits')}
      </div>
      ${content}
    </div>
  `;
};

function subm(event) {
  event.preventDefault();
  const form = event.target;
  const file = form.f.files[0];

  if (!/\.(pdf|epub)$/i.test(file.name)) {
    toast('Format accepté : PDF ou EPUB');
    return false;
  }

  if (file.size > 2e7) {
    toast('Fichier trop lourd (20 Mo max)');
    return false;
  }

  if (books().concat(S.sub).some((book) => nz(book.t) === nz(form.t.value))) {
    toast('Doublon détecté : ce titre existe déjà');
    return false;
  }

  const status = (event.submitter && event.submitter.value) || 'en attente';
  S.sub.push({
    id: 100 + S.sub.length + Math.floor(Math.random() * 10000),
    t: form.t.value,
    g: form.g.value,
    l: form.l.value,
    p: +form.p.value,
    s: form.s.value,
    x: +form.x.value || 10,
    d: 0,
    u: S.u.id,
    a: S.u.id,
    an: S.u.name,
    ac: S.u.country,
    st: status
  });

  save();
  AT = 'w';
  go2();
  toast(status === 'brouillon' ? 'Brouillon enregistré' : 'Œuvre envoyée à la modération');
  return false;
}

const go2 = () => go();
const st = (id, state, message) => {
  const item = S.sub.find((entry) => entry.id == id);
  if (!item) return;
  item.st = state;
  if (message) item.m = message;
  save();
  go();
};

function payout() {
  const available = bal()[2];
  if (available < 10) {
    toast('Solde insuffisant : minimum 10 $');
    return;
  }

  S.pay.push({
    u: S.u.id,
    amt: available,
    d: new Date().toLocaleDateString('fr-FR'),
    st: 'en attente',
    n: S.u.name
  });

  save();
  toast('Demande de retrait envoyée');
  go();
}

function csv() {
  const rows = S.pay.filter((item) => item.u == S.u.id);
  const csvText = 'date;montant;statut\n' + rows.map((item) => [item.d, item.amt.toFixed(2), item.st].join(';')).join('\n');
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvText);
  link.download = 'transactions.csv';
  link.click();
}

let MT = 's';

V.admin = () => {
  if (need(['moderator', 'admin'])) return '';

  const mt = (key, label) => `<button class="btn ${MT === key ? 'on' : ''}" onclick="MT='${key}';go()">${label}</button>`;
  const isAdmin = role() === 'admin';
  const isModerator = role() === 'moderator';
  let content = '';

  if (MT === 'd') {
    content = `
      <div class="stat">
        <div><b>${S.users.length}</b>utilisateurs</div>
        <div><b>${S.sales.length}</b>ventes</div>
        <div><b>${S.sub.filter((item) => item.st === 'en attente').length}</b>soumissions en attente</div>
        <div><b>${S.rep.filter((item) => !item.ok).length}</b>signalements</div>
      </div>
    `;
  }

  if (MT === 's') {
    content = `
      <div class="x">
        <table>
          ${S.sub.filter((item) => item.st === 'en attente').map((item) => `
            <tr>
              <td><b>${esc(item.t)}</b><br><small>${esc(item.an)} · ${esc(item.g)} · ${item.p} $</small></td>
              <td>
                <button class="btn s" onclick="st(${item.id},'approuvé')">Approuver</button>
                <button class="btn g s" onclick="mod(${item.id},'à corriger')">À corriger</button>
                <button class="btn g s" onclick="mod(${item.id},'refusé')">Refuser</button>
              </td>
            </tr>
          `).join('') || '<tr><td>Aucune soumission en attente.</td></tr>'}
        </table>
      </div>
    `;
  }

  if (MT === 'r') {
    content = `
      <div class="x">
        <table>
          ${S.rep.map((item, index) => `
            <tr>
              <td>${esc(item.t)}</td>
              <td>${esc(item.m)}</td>
              <td>${item.ok ? 'Traité' : `<button class="btn s" onclick="S.rep[${index}].ok=1;save();go()">Marquer traité</button>`}</td>
            </tr>
          `).join('') || '<tr><td>Aucun signalement.</td></tr>'}
        </table>
      </div>
    `;
  }

  if (isAdmin && MT === 'u') {
    content = `
      <div class="x">
        <table>
          ${S.users.map((user) => `
            <tr>
              <td>${esc(user.name)}<br><small>${esc(user.email)}</small></td>
              <td>${displayRole(user.role)}</td>
              <td>
                <button class="btn g s" onclick="sus('${user.id}')">${user.sus ? 'Réactiver' : 'Suspendre'}</button>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (isAdmin && MT === 'c') {
    content = `
      <div class="x">
        <table>
          ${books().map((book) => `
            <tr>
              <td>${esc(book.t)}</td>
              <td>
                <button class="btn g s" onclick="ft(${book.id})">${S.feat.includes(book.id) ? 'Retirer de la une' : 'Mettre en avant'}</button>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  if (isAdmin && MT === 'p') {
    content = `
      <div class="x">
        <table>
          ${S.pay.map((item, index) => `
            <tr>
              <td>${esc(item.n)}</td>
              <td>${item.amt.toFixed(2)} $</td>
              <td>${item.st === 'payé' ? 'Payé' : `<button class="btn s" onclick="S.pay[${index}].st='payé';save();go()">Marquer payé</button>`}</td>
            </tr>
          `).join('') || '<tr><td>Aucun retrait.</td></tr>'}
        </table>
      </div>
    `;
  }

  return `
    <div class="w sec">
      <h2>Back-office</h2>
      <div class="tabs">
        ${mt('d', 'Tableau de bord')}
        ${mt('s', 'Soumissions')}
        ${mt('r', 'Signalements')}
        ${isAdmin ? mt('u', 'Utilisateurs') + mt('c', 'Catalogue') + mt('p', 'Retraits') : ''}
      </div>
      ${content}
    </div>
  `;
};

const mod = (id, state) => {
  const message = prompt('Motif envoyé à l’auteur :');
  if (message) st(id, state, message);
};

const sus = (id) => {
  const user = S.users.find((entry) => entry.id === id);
  if (!user) return;
  user.sus = !user.sus;
  save();
  go();
};

const ft = (id) => {
  const index = S.feat.indexOf(id);
  if (index < 0) S.feat.push(id);
  else S.feat.splice(index, 1);
  save();
  go();
};

// ===================================================
// Pages statiques et formulaire
// ===================================================
const P = {
  charte: ['Charte de contenu', 'Les œuvres doivent être originales, respecter la dignité des personnes et ne contenir ni incitation à la haine, ni contenu illégal. Toute œuvre est examinée par un modérateur humain avant publication.'],
  contrat: ['Contrat d’auteur', 'L’auteur reste titulaire de ses droits et accorde à TOWBAM une licence non exclusive de diffusion. Modèle à valider avec un conseil juridique.'],
  remuneration: ['Rémunération', 'Taux indicatif : 70 % pour l’auteur, 30 % pour TOWBAM (frais de paiement de 2,5 à 4 % inclus). Retrait à partir d’un seuil minimum, par mobile money ou virement.'],
  faq: ['FAQ', 'Tout le monde peut lire et acheter. Le statut d’auteur est ouvert aux auteurs africains après examen. Vos achats restent accessibles en permanence dans votre bibliothèque.'],
  paiements: ['Moyens de paiement', 'Carte bancaire (Stripe, PayPal) et mobile money (M-Pesa, Orange Money, Airtel Money, MTN) via un agrégateur panafricain.'],
  cgu: ['Conditions d’utilisation', 'Texte à rédiger et valider juridiquement avant lancement : conditions de vente, partage des livres interdit, suspension de compte.'],
  confidentialite: ['Confidentialité (RGPD)', 'Nous collectons le minimum de données nécessaires. Vous pouvez demander l’accès, la correction ou la suppression de vos données.'],
  droits: ['Droit d’auteur', 'Les livres sont protégés : lecture via la liseuse, URL signées et filigrane au nom de l’acheteur.'],
  cookies: ['Cookies', 'Seuls les cookies indispensables au fonctionnement du site sont utilisés.']
};

V.page = (pageName) => {
  if (pageName === 'contact' || pageName === 'signaler') {
    const isReport = pageName === 'signaler';

    return `
      <div class="w sec">
        <form class="card" style="max-width:520px" onsubmit="return msg(event,${isReport})">
          <h2>${isReport ? 'Signaler un contenu' : 'Nous contacter'}</h2>
          ${isReport ? '' : '<p class="lead" style="margin:0 0 18px"><a href="mailto:contact@towbam.africa" style="color:var(--red)">contact@towbam.africa</a></p>'}
          <label>${isReport ? 'Titre ou lien du contenu' : 'Email'}</label>
          <input name="a" required>
          <label>Message</label>
          <textarea name="m" required></textarea>
          <p><button class="btn">Envoyer</button></p>
        </form>
      </div>
    `;
  }

  const content = P[pageName] || ['Page', 'Contenu à venir.'];
  return `
    <div class="w sec">
      <h2>${content[0]}</h2>
      <p class="lead" style="margin-top:20px">${content[1]}</p>
    </div>
  `;
};

function msg(event, isReport) {
  event.preventDefault();
  const form = event.target;

  if (isReport) {
    S.rep.push({ t: form.a.value, m: form.m.value });
    save();
  }

  toast(isReport ? 'Signalement transmis aux modérateurs' : 'Message envoyé');
  form.reset();
  return false;
}

const nl = (event) => {
  event.preventDefault();
  toast('Merci, vous êtes inscrit');
  event.target.reset();
  return false;
};

function go() {
  const hash = location.hash.slice(2);
  const [route, param] = hash.split('/');

  if (route && route.startsWith('#')) return;
  if (hash === '#approche' || (route === '' && param === '#approche')) return;

  const render = V[route] || V[''];
  app.innerHTML = render(param);
  nav();

  if (!go.k) scrollTo(0, 0);
  if (post[route]) post[route](param);
  else onscroll = null;
}

addEventListener('hashchange', go);
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href="#/#approche"]');
  if (!link) return;

  event.preventDefault();
  if (location.hash.length > 2 && location.hash !== '#/') location.hash = '#/';

  setTimeout(() => {
    const target = $('#approche');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }, 50);
});

go();
initSplashScreen();

