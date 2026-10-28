const state = {
  apiBase: localStorage.getItem('towbam_api') || 'http://127.0.0.1:8000/api',
  token: sessionStorage.getItem('towbam_admin_token') || '',
  user: null,
  theme: localStorage.getItem('towbam_admin_theme') || 'light',
  activeSection: 'administration',
  cache: {
    stats: null,
    submissions: [],
    users: [],
    reports: [],
    payouts: [],
    books: [],
    audit: [],
    commission: null
  }
};

const sectionMeta = [
  { id: 'administration', label: 'Administration', icon: 'home' },
  { id: 'submissions', label: 'Soumissions', icon: 'checklist' },
  { id: 'catalog', label: 'Catalogue', icon: 'book' },
  { id: 'users', label: 'Utilisateurs', icon: 'users' },
  { id: 'reports', label: 'Signalements', icon: 'alert' },
  { id: 'commission', label: 'Commission', icon: 'wallet' },
  { id: 'payouts', label: 'Retraits', icon: 'bank' },
  { id: 'audit', label: 'Journal d’audit', icon: 'history' }
];

const adminIcons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9 20v-6h6v6"/></svg>',
  checklist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v17H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 5.5V20"/></svg>',
  users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7" r="3.5"/><path d="M20 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 4.13a4 4 0 0 1 0 7.74"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 19h19L12 3z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z"/><path d="M4 9.5h15"/><path d="M15 13h4"/></svg>',
  bank: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10 12 4l9 6"/><path d="M5 10v8h14v-8"/><path d="M9 18v-6h6v6"/></svg>',
  history: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l4 2"/></svg>'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const showToast = (message) => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
};

const getVisibleSections = () => {
  const role = state.user?.role || 'admin';
  if (role === 'moderator') {
    return ['administration', 'submissions', 'reports', 'audit'];
  }
  return sectionMeta.map((item) => item.id);
};

const ensureTheme = () => {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('towbam_admin_theme', state.theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = state.theme === 'dark' ? '☀' : '☾';
  }
};

const getActiveSection = () => {
  const fromHash = (location.hash || '#administration').replace('#', '');
  const allowed = getVisibleSections();
  if (allowed.includes(fromHash)) return fromHash;
  return allowed[0];
};

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${state.apiBase}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : null
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Erreur ${response.status}`);
  }

  return payload;
};

const renderDashboard = async () => {
  const stats = state.cache.stats || await apiRequest('/admin/stats').catch(() => ({}));
  state.cache.stats = stats;

  const cards = [
    { label: 'Soumissions en attente', value: stats.pending ?? 0 },
    { label: 'Livres publiés', value: stats.books ?? 0 },
    { label: 'Utilisateurs', value: stats.users ?? 0 },
    { label: 'Signalements ouverts', value: stats.open_reports ?? 0 },
    { label: 'Retraits à traiter', value: stats.pending_payouts ?? 0 }
  ];

  const modules = sectionMeta.filter((item) => getVisibleSections().includes(item.id)).filter((item) => item.id !== 'administration');

  return `
    <div class="page-shell">
      <div class="page-head">
        <div>
          <p class="page-kicker">Paramètres plateforme</p>
          <h1>Administration</h1>
          <p class="page-subtitle">Gérez les accès, les profils et le bon fonctionnement de TOWBAM.</p>
        </div>
      </div>

      <div class="stats-grid">
        ${cards.map((card) => `
          <div class="stat-card">
            <div class="stat-icon">${adminIcons.home}</div>
            <div class="stat-label">${escapeHtml(card.label)}</div>
            <div class="stat-value">${escapeHtml(card.value)}</div>
          </div>
        `).join('')}
      </div>

      <div class="module-grid">
        ${modules.map((module) => `
          <article class="module-card" data-section="${module.id}">
            <div class="module-card-header">
              <div class="module-icon">${adminIcons[module.icon]}</div>
              <div>
                <h3>${escapeHtml(module.label)}</h3>
              </div>
            </div>
            <p>${escapeHtml(getModuleDescription(module.id))}</p>
            <div class="module-card-footer">
              <a href="#${module.id}" class="module-link">Ouvrir →</a>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;
};

const getModuleDescription = (id) => {
  const map = {
    submissions: 'Examiner les soumissions, valider ou demander des corrections.',
    catalog: 'Mettre en avant les livres et surveiller le catalogue public.',
    users: 'Gérer les comptes, statuts et accès de la plateforme.',
    reports: 'Suivre les signalements et clôturer les cas traités.',
    commission: 'Ajuster la part de commission appliquée aux auteurs.',
    payouts: 'Valider les retraits et confirmer les paiements.',
    audit: 'Consulter le journal des actions de modération et d’administration.'
  };
  return map[id] || 'Accéder au module associé.';
};

const renderLoading = (message) => `
  <div class="loading-state">${escapeHtml(message)}</div>
`;

const renderError = (message) => `
  <div class="error-state">${escapeHtml(message)}</div>
`;

const renderEmpty = (message) => `
  <div class="empty-state">${escapeHtml(message)}</div>
`;

const renderSubmissions = async () => {
  let rows = state.cache.submissions;
  if (!rows.length) {
    $('#app').innerHTML = renderLoading('Chargement des soumissions…');
    try {
      rows = await apiRequest('/admin/submissions');
      state.cache.submissions = rows;
    } catch (error) {
      $('#app').innerHTML = renderError(error.message);
      return;
    }
  }

  const list = rows.length ? rows.map((item) => `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(item.title || 'Livre sans titre')}</strong>
        <div class="meta">${escapeHtml(item.author?.name || 'Auteur inconnu')} · ${escapeHtml(item.status || 'pending')}</div>
      </div>
      <div class="row-actions">
        <button class="action-btn success small-btn" data-action="approve" data-id="${item.id}">Approuver</button>
        <button class="action-btn warning small-btn" data-action="needs_changes" data-id="${item.id}">À corriger</button>
        <button class="action-btn danger small-btn" data-action="refused" data-id="${item.id}">Refuser</button>
      </div>
    </div>
  `).join('') : renderEmpty('Aucune soumission en attente.');

  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Soumissions</h2>
      </div>
      <div class="list-grid">
        ${list}
      </div>
    </div>
  `;
};

const renderUsers = async () => {
  let rows = state.cache.users;
  if (!rows.length) {
    $('#app').innerHTML = renderLoading('Chargement des utilisateurs…');
    try {
      const payload = await apiRequest('/admin/users');
      rows = Array.isArray(payload.data) ? payload.data : payload;
      state.cache.users = rows;
    } catch (error) {
      $('#app').innerHTML = renderError(error.message);
      return;
    }
  }

  const list = rows.length ? rows.map((user) => `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(user.name || 'Utilisateur')}</strong>
        <div class="meta">${escapeHtml(user.email || '')} · ${escapeHtml(user.role || 'reader')}</div>
      </div>
      <div class="row-actions">
        <span class="status-badge ${user.suspended ? 'suspended' : 'active'}">${user.suspended ? 'Suspendu' : 'Actif'}</span>
        <button class="action-btn ${user.suspended ? 'success' : 'warning'} small-btn" data-action="toggle-user" data-id="${user.id}">
          ${user.suspended ? 'Réactiver' : 'Suspendre'}
        </button>
      </div>
    </div>
  `).join('') : renderEmpty('Aucun utilisateur trouvé.');

  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Utilisateurs</h2>
      </div>
      <div class="list-grid">
        ${list}
      </div>
    </div>
  `;
};

const renderReports = async () => {
  let rows = state.cache.reports;
  if (!rows.length) {
    $('#app').innerHTML = renderLoading('Chargement des signalements…');
    try {
      rows = await apiRequest('/admin/reports');
      state.cache.reports = rows;
    } catch (error) {
      $('#app').innerHTML = renderError(error.message);
      return;
    }
  }

  const list = rows.length ? rows.map((report) => `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(report.target || 'Contenu signalé')}</strong>
        <div class="meta">${escapeHtml((report.message || '').slice(0, 120))}</div>
      </div>
      <div class="row-actions">
        <button class="action-btn success small-btn" data-action="resolve-report" data-id="${report.id}">Marquer traité</button>
      </div>
    </div>
  `).join('') : renderEmpty('Aucun signalement ouvert.');

  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Signalements</h2>
      </div>
      <div class="list-grid">
        ${list}
      </div>
    </div>
  `;
};

const renderPayouts = async () => {
  let rows = state.cache.payouts;
  if (!rows.length) {
    $('#app').innerHTML = renderLoading('Chargement des retraits…');
    try {
      rows = await apiRequest('/admin/payouts');
      state.cache.payouts = rows;
    } catch (error) {
      $('#app').innerHTML = renderError(error.message);
      return;
    }
  }

  const list = rows.length ? rows.map((payout) => `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(payout.name || 'Auteur')}</strong>
        <div class="meta">${escapeHtml((payout.amount ?? 0).toString())} · ${escapeHtml(payout.method || 'Moyen non précisé')}</div>
      </div>
      <div class="row-actions">
        <span class="status-badge ${payout.status === 'paid' ? 'active' : 'pending'}">${payout.status === 'paid' ? 'Payé' : 'En attente'}</span>
        ${payout.status === 'paid' ? '' : `<button class="action-btn success small-btn" data-action="pay-payout" data-id="${payout.id}">Marquer payé</button>`}
      </div>
    </div>
  `).join('') : renderEmpty('Aucun retrait en attente.');

  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Retraits</h2>
      </div>
      <div class="list-grid">
        ${list}
      </div>
    </div>
  `;
};

const renderCatalog = async () => {
  let rows = state.cache.books;
  if (!rows.length) {
    $('#app').innerHTML = renderLoading('Chargement du catalogue…');
    try {
      const payload = await apiRequest('/books');
      rows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      state.cache.books = rows;
    } catch (error) {
      $('#app').innerHTML = renderError(error.message);
      return;
    }
  }

  const list = rows.length ? rows.map((book) => `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(book.title || 'Livre')}</strong>
        <div class="meta">${escapeHtml(book.author?.name || 'Auteur inconnu')} · ${escapeHtml(book.price ?? 0)} $</div>
      </div>
      <div class="row-actions">
        <button class="action-btn ${book.featured ? 'warning' : 'success'} small-btn" data-action="toggle-feature" data-id="${book.id}">${book.featured ? 'Retirer la mise en avant' : 'Mettre en avant'}</button>
      </div>
    </div>
  `).join('') : renderEmpty('Aucun livre disponible pour le moment.');

  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Catalogue</h2>
      </div>
      <div class="list-grid">
        ${list}
      </div>
    </div>
  `;
};

const renderCommission = async () => {
  const payload = await apiRequest('/admin/settings/commission').catch((error) => {
    $('#app').innerHTML = renderError(error.message);
    return null;
  });
  if (!payload) return;

  const value = Number(payload.value ?? 70);
  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Commission</h2>
      </div>
      <div class="settings-panel">
        <div class="field-grid">
          <div class="field-wrap">
            <label for="commission-value">Pourcentage pour l’auteur</label>
            <input id="commission-value" type="number" min="0" max="100" value="${value}">
          </div>
          <button id="save-commission" class="primary-btn">Enregistrer</button>
        </div>
      </div>
    </div>
  `;

  $('#save-commission').addEventListener('click', async () => {
    const rawValue = Number($('#commission-value').value);
    if (Number.isNaN(rawValue) || rawValue < 0 || rawValue > 100) {
      showToast('Valeur invalide');
      return;
    }

    try {
      await apiRequest('/admin/settings/commission', { method: 'PUT', body: { value: rawValue } });
      showToast('Commission enregistrée');
    } catch (error) {
      showToast(error.message);
    }
  });
};

const renderAudit = async () => {
  let rows = state.cache.audit;
  if (!rows.length) {
    $('#app').innerHTML = renderLoading('Chargement du journal…');
    try {
      rows = await apiRequest('/admin/audit');
      state.cache.audit = rows;
    } catch (error) {
      $('#app').innerHTML = renderError(error.message);
      return;
    }
  }

  const list = rows.length ? rows.map((entry) => `
    <div class="list-row">
      <div>
        <strong>${escapeHtml(entry.book_title || 'Livre inconnu')}</strong>
        <div class="meta">${escapeHtml(entry.action || 'Action')} · ${escapeHtml(entry.moderator_name || 'Modérateur inconnu')}</div>
      </div>
      <div class="row-actions">
        <span class="status-badge pending">${escapeHtml(entry.created_at ? new Date(entry.created_at).toLocaleString('fr-FR') : 'Date inconnue')}</span>
      </div>
    </div>
  `).join('') : renderEmpty('Aucun journal d’audit disponible.');

  $('#app').innerHTML = `
    <div class="section-panel">
      <div class="section-header">
        <h2>Journal d’audit</h2>
      </div>
      <div class="list-grid">
        ${list}
      </div>
    </div>
  `;
};

const renderSection = async () => {
  const section = getActiveSection();
  state.activeSection = section;

  if (section === 'administration') {
    $('#app').innerHTML = renderLoading('Chargement du tableau de bord…');
    $('#app').innerHTML = await renderDashboard();
    return;
  }

  if (section === 'submissions') {
    await renderSubmissions();
    return;
  }

  if (section === 'users') {
    await renderUsers();
    return;
  }

  if (section === 'reports') {
    await renderReports();
    return;
  }

  if (section === 'payouts') {
    await renderPayouts();
    return;
  }

  if (section === 'catalog') {
    await renderCatalog();
    return;
  }

  if (section === 'commission') {
    await renderCommission();
    return;
  }

  if (section === 'audit') {
    await renderAudit();
    return;
  }
};

const renderNav = () => {
  const visibleSections = getVisibleSections();
  const nav = $('#admin-nav');
  if (!nav) return;

  nav.innerHTML = sectionMeta.filter((item) => visibleSections.includes(item.id)).map((item) => `
    <button class="nav-item ${state.activeSection === item.id ? 'active' : ''}" data-section="${item.id}" type="button">
      ${adminIcons[item.icon]}
      <span class="nav-item-label">${escapeHtml(item.label)}</span>
      ${item.id === 'submissions' && state.cache.submissions.length ? `<span class="nav-item-count">${state.cache.submissions.length}</span>` : ''}
      ${item.id === 'reports' && state.cache.reports.length ? `<span class="nav-item-count">${state.cache.reports.length}</span>` : ''}
    </button>
  `).join('');
};

const renderShell = () => {
  const role = state.user?.role || 'admin';
  document.body.innerHTML = `
    <div class="admin-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand">
          <div class="logo-mark">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <rect width="48" height="48" rx="13" fill="#c0392b"></rect>
              <circle cx="24" cy="17" r="7.5" fill="#f0c987"></circle>
              <path d="M8 27l16 4v12L8 39zM40 27l-16 4v12l16-4z" fill="#f6f2ea"></path>
              <path d="M24 31v12" stroke="#c0392b" stroke-width="1.5"></path>
            </svg>
          </div>
          <div class="brand-name">TOWBAM</div>
        </div>

        <div class="sidebar-nav" id="admin-nav"></div>

        <div class="sidebar-user">
          <div class="user-meta">
            <div class="user-avatar" id="user-avatar">${escapeHtml(getInitials(state.user?.name || 'A'))}</div>
            <div class="user-meta-text">
              <strong>${escapeHtml(state.user?.name || 'Utilisateur')}</strong>
              <span>${escapeHtml(role)}</span>
            </div>
          </div>
          <button class="secondary-btn" type="button" id="logout-btn">Déconnexion</button>
        </div>
      </aside>

      <main class="main-panel">
        <header class="topbar">
          <div class="topbar-left">
            <button id="sidebar-toggle" class="mobile-menu-btn" type="button" aria-label="Ouvrir le menu">Menu</button>
            <div>
              <p class="page-kicker">Espace de travail</p>
            </div>
          </div>
          <div class="topbar-actions">
            <button id="refresh-btn" class="icon-btn" type="button" aria-label="Actualiser">↻</button>
            <button id="theme-toggle" class="icon-btn" type="button" aria-label="Basculer le thème">${state.theme === 'dark' ? '☀' : '☾'}</button>
            <div class="topbar-user" id="user-menu-wrap">
              <button class="user-menu-button" id="user-menu-button" type="button" aria-label="Menu utilisateur">${escapeHtml(getInitials(state.user?.name || 'A'))}</button>
              <div class="user-dropdown" id="user-menu">
                <a href="#administration">Mon profil</a>
                <button type="button" id="logout-menu-btn">Déconnexion</button>
              </div>
            </div>
          </div>
        </header>

        <div class="app-container">
          <div id="app" class="page-shell"></div>
        </div>
      </main>
    </div>
    <div class="toast" id="toast" aria-live="polite"></div>
  `;

  ensureTheme();
  renderNav();
  renderSection();
  attachShellEvents();
};

const renderLogin = () => {
  document.body.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="brand login-meta">
          <div class="logo-mark">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <rect width="48" height="48" rx="13" fill="#c0392b"></rect>
              <circle cx="24" cy="17" r="7.5" fill="#f0c987"></circle>
              <path d="M8 27l16 4v12L8 39zM40 27l-16 4v12l16-4z" fill="#f6f2ea"></path>
              <path d="M24 31v12" stroke="#c0392b" stroke-width="1.5"></path>
            </svg>
          </div>
          <div class="brand-name">TOWBAM · Admin</div>
        </div>

        <form id="login-form" class="login-form">
          <div class="field-wrap">
            <label for="api-url">URL de l’API</label>
            <input id="api-url" type="url" value="${escapeHtml(state.apiBase)}" required>
          </div>

          <div class="field-wrap">
            <label for="login-email">Email</label>
            <input id="login-email" type="email" required>
          </div>

          <div class="field-wrap">
            <label for="login-password">Mot de passe</label>
            <input id="login-password" type="password" required>
          </div>

          <p class="small-note">Comptes de démonstration : admin@towbam.test / Admin123! · modo@towbam.test / Admin123!</p>
          <p class="form-status" id="login-error"></p>
          <button type="submit" class="primary-btn">Se connecter</button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const apiUrl = document.getElementById('api-url').value.trim().replace(/\/$/, '');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    state.apiBase = apiUrl;
    localStorage.setItem('towbam_api', apiUrl);

    try {
      const response = await fetch(`${state.apiBase}/login`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Erreur de connexion');
      }

      if (!['admin', 'moderator'].includes(payload.user?.role)) {
        throw new Error('Accès réservé à l’équipe TOWBAM');
      }

      state.token = payload.token;
      state.user = payload.user;
      sessionStorage.setItem('towbam_admin_token', state.token);
      renderShell();
    } catch (error) {
      document.getElementById('login-error').textContent = error.message;
    }
  });
};

const logout = () => {
  state.token = '';
  state.user = null;
  state.cache = {
    stats: null,
    submissions: [],
    users: [],
    reports: [],
    payouts: [],
    books: [],
    audit: [],
    commission: null
  };
  sessionStorage.removeItem('towbam_admin_token');
  renderLogin();
};

const getInitials = (name) => {
  const cleanName = (name || 'A').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  const initials = parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return initials || 'A';
};

const attachShellEvents = () => {
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('logout-menu-btn')?.addEventListener('click', logout);

  document.querySelectorAll('[data-section]').forEach((button) => {
    button.addEventListener('click', () => {
      const sectionId = button.getAttribute('data-section');
      if (!sectionId) return;
      location.hash = `#${sectionId}`;
      state.activeSection = sectionId;
      renderNav();
      renderSection();
    });
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    ensureTheme();
  });

  document.getElementById('refresh-btn')?.addEventListener('click', async () => {
    state.cache = {
      stats: null,
      submissions: [],
      users: [],
      reports: [],
      payouts: [],
      books: [],
      audit: [],
      commission: null
    };
    renderNav();
    await renderSection();
    showToast('Données actualisées');
  });

  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  document.getElementById('user-menu-button')?.addEventListener('click', () => {
    document.getElementById('user-menu-wrap')?.classList.toggle('open');
  });

  document.addEventListener('click', (event) => {
    const userMenuWrap = document.getElementById('user-menu-wrap');
    const userButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    if (userMenuWrap && userButton && userMenu && !userMenuWrap.contains(event.target)) {
      userMenuWrap.classList.remove('open');
    }
    if (sidebar && window.innerWidth <= 980 && !sidebar.contains(event.target) && event.target.id !== 'sidebar-toggle') {
      sidebar.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.getElementById('user-menu-wrap')?.classList.remove('open');
      sidebar?.classList.remove('open');
    }
  });

  document.addEventListener('click', async (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-action');
    const id = Number(actionEl.getAttribute('data-id'));
    if (!action || !Number.isFinite(id)) return;

    if (action === 'approve') {
      await apiRequest(`/admin/submissions/${id}/approve`, { method: 'POST' });
      state.cache.submissions = state.cache.submissions.filter((entry) => entry.id !== id);
      await renderSection();
      showToast('Soumission approuvée');
      return;
    }

    if (action === 'needs_changes' || action === 'refused') {
      const reason = prompt('Motif obligatoire :');
      if (!reason) return;
      await apiRequest(`/admin/submissions/${id}/reject`, {
        method: 'POST',
        body: { reason, action }
      });
      state.cache.submissions = state.cache.submissions.filter((entry) => entry.id !== id);
      await renderSection();
      showToast('Décision enregistrée');
      return;
    }

    if (action === 'toggle-user') {
      await apiRequest(`/admin/users/${id}/suspend`, { method: 'POST' });
      state.cache.users = [];
      await renderSection();
      showToast('Statut utilisateur mis à jour');
      return;
    }

    if (action === 'resolve-report') {
      await apiRequest(`/admin/reports/${id}/resolve`, { method: 'POST' });
      state.cache.reports = [];
      await renderSection();
      showToast('Signalement marqué traité');
      return;
    }

    if (action === 'pay-payout') {
      await apiRequest(`/admin/payouts/${id}/pay`, { method: 'POST' });
      state.cache.payouts = [];
      await renderSection();
      showToast('Retrait marqué payé');
      return;
    }

    if (action === 'toggle-feature') {
      await apiRequest(`/admin/books/${id}/feature`, { method: 'POST' });
      state.cache.books = [];
      await renderSection();
      showToast('Mise à jour du catalogue enregistrée');
    }
  });
};

const boot = () => {
  if (!state.token) {
    renderLogin();
    return;
  }

  const uid = state.user ? state.user.id : null;
  if (!uid) {
    renderLogin();
    return;
  }

  const role = state.user?.role || 'admin';
  if (!['admin', 'moderator'].includes(role)) {
    renderLogin();
    return;
  }

  renderShell();
};

window.addEventListener('hashchange', () => {
  const nextSection = getActiveSection();
  state.activeSection = nextSection;
  renderNav();
  renderSection();
});

window.addEventListener('DOMContentLoaded', () => {
  ensureTheme();
  const storedTheme = localStorage.getItem('towbam_admin_theme');
  if (storedTheme) {
    state.theme = storedTheme;
  }
  boot();
});
