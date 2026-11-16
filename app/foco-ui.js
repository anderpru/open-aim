// Foco lobby: quiet side navigation, a stable recommendation, and details on demand.
// Native tabs, training actions, search and tools remain the source of truth.
(() => {
  if (window.__aimFoco) return;

  const paths = {
    train: '<circle cx="12" cy="12" r="7"/><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/>',
    targets: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    community: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-3-5"/>',
    progress: '<path d="M4 20V12m6 8V4m6 16v-9m5 9H2"/>',
    collection: '<path d="m12 3 10 5-10 5L2 8zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    tools: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h1m-1 6h1m-1 6h1"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.tools}</svg>`;
  const NAV = [
    { key: 'train', label: 'Train', match: /VALORANT Training/i },
    { key: 'targets', label: 'Targets', match: /Target Workshop/i },
    { key: 'community', label: 'Community', match: /Community Workshop/i },
    { key: 'progress', label: 'Progress', match: /Training history/i },
    { key: 'collection', label: 'Collection', match: /^Collection$/i },
    { key: 'settings', label: 'Settings', match: /^Settings$/i },
  ];
  const essentials = new Set(['sensitivity', 'adsSensitivity', 'minimapSize', 'minimapZoom', 'minimapRotates']);
  let rail = null, queued = false, hintId = 0;
  let libraryMode = '', toolsSignature = '';

  const nativeTabs = () => [...document.querySelectorAll('.hall-topnav .hall-tabs > .hall-tab')];
  const inRound = () => document.body.classList.contains('al-training-active') || !!document.querySelector('.al-trainer-shell.al-session-active');
  function navigate(key) {
    const item = NAV.find(n => n.key === key);
    const button = item && nativeTabs().find(b => item.match.test(b.textContent.trim()));
    if (!button || button.classList.contains('is-active')) return;
    closeSearch();
    rail?.querySelector('details')?.removeAttribute('open');
    button.click();
  }

  function search() {
    if (inRound()) return;
    document.body.classList.add('foco-search-open');
    document.querySelector('.hall-search input')?.focus();
  }
  function closeSearch() {
    if (!document.body.classList.contains('foco-search-open')) return;
    const input = document.querySelector('.hall-search input');
    if (input?.value) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.body.classList.remove('foco-search-open');
  }
  function library(mode) {
    libraryMode = libraryMode === mode ? '' : mode;
    document.body.dataset.focoLibrary = libraryMode;
    syncLibrary();
    if (libraryMode) document.querySelector('.al-wk-main')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function mountRail() {
    if (rail?.isConnected) return;
    rail = document.createElement('aside');
    rail.className = 'foco-rail';
    rail.setAttribute('aria-label', 'Main navigation');
    rail.innerHTML = `<button class="foco-brand" type="button" aria-label="openVaim home">open<span>Vaim</span></button>
      <nav class="foco-nav" aria-label="Training areas"></nav>
      <div class="foco-rail-bottom">
        <button type="button" class="foco-search-button">${icon('search')}<span>Search</span><kbd>/</kbd></button>
        <details class="foco-tools"><summary>${icon('tools')}<span>Tools & account</span></summary><div class="foco-tool-list"></div></details>
        <div class="foco-settings-slot"></div>
        <small class="foco-local"><i></i>Local training</small>
      </div>`;
    rail.querySelector('.foco-brand').addEventListener('click', () => navigate('train'));
    for (const item of NAV) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'foco-nav-item';
      button.dataset.focoNav = item.key;
      button.innerHTML = `${icon(item.key)}<span>${item.label}</span>`;
      button.addEventListener('click', () => navigate(item.key));
      rail.querySelector(item.key === 'settings' ? '.foco-settings-slot' : '.foco-nav').append(button);
    }
    rail.querySelector('.foco-search-button').addEventListener('click', search);
    document.body.append(rail);
  }

  function syncTools() {
    const native = [...document.querySelectorAll('.es-bar .es-bar-btn')];
    const signature = native.map(b => `${b.textContent.trim()}:${b.disabled}`).join('|');
    if (signature === toolsSignature) return;
    toolsSignature = signature;
    const host = rail.querySelector('.foco-tool-list');
    host.replaceChildren();
    for (const original of native) {
      const label = original.textContent.trim();
      if (!label) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.title = original.title || label;
      button.disabled = original.disabled;
      button.addEventListener('click', () => {
        const live = [...document.querySelectorAll('.es-bar .es-bar-btn')].find(b => b.textContent.trim() === label);
        rail.querySelector('details').open = false;
        live?.click();
      });
      host.append(button);
    }
    const signOut = document.querySelector('.es-account-menu button');
    if (signOut) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Sign out';
      button.addEventListener('click', () => document.querySelector('.es-account-menu button')?.click());
      host.append(button);
    }
    const support = document.createElement('button');
    support.type = 'button';
    support.textContent = 'Community support';
    support.addEventListener('click', () => document.querySelector('.es-discord-panel')?.click());
    host.append(support);
  }

  function syncLibrary() {
    const hero = document.querySelector('.al-wk-hero');
    if (!hero) return;
    let actions = hero.parentElement.querySelector('.foco-library-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'foco-library-actions';
      actions.innerHTML = `<button type="button" data-foco-browse="maps">${icon('map')}<span>Change map</span></button>
        <button type="button" data-foco-browse="exercises">${icon('list')}<span>Browse exercises</span></button>
        <span class="foco-library-count"></span>`;
      hero.after(actions);
      actions.addEventListener('click', event => {
        const button = event.target.closest('[data-foco-browse]');
        if (button) library(button.dataset.focoBrowse);
      });
    }
    for (const button of actions.querySelectorAll('[data-foco-browse]')) {
      const expanded = libraryMode === button.dataset.focoBrowse;
      button.setAttribute('aria-expanded', String(expanded));
      const label = button.querySelector('span');
      const text = button.dataset.focoBrowse === 'maps' ? (expanded ? 'Close maps' : 'Change map') : (expanded ? 'Hide exercises' : 'Browse exercises');
      if (label.textContent !== text) label.textContent = text;
    }
    const count = document.querySelector('.al-wk-slice.is-all .al-wk-s-count')?.textContent.trim();
    const maps = document.querySelectorAll('.al-wk-slice:not(.is-all):not(.is-locked)').length;
    const note = count && maps ? `${count} · ${maps} maps` : '';
    const counter = actions.querySelector('.foco-library-count');
    if (counter.textContent !== note) counter.textContent = note;
    const title = hero.querySelector('.al-wk-hero-copy > h1');
    if (title && title.textContent !== 'Ready to train?') title.textContent = 'Ready to train?';
    // The existing carousel pauses on pointerenter. Keep its own recommendation and
    // play handler stable while the player decides, including after leaving the card.
    const feature = hero.querySelector('.al-wk-feat');
    if (feature && !feature.dataset.focoStable) {
      feature.dataset.focoStable = 'true';
      feature.addEventListener('pointerleave', () => queueMicrotask(() => {
        if (feature.isConnected) feature.dispatchEvent(new PointerEvent('pointerenter'));
      }));
      feature.dispatchEvent(new PointerEvent('pointerenter'));
    }
  }

  function settings() {
    const view = document.querySelector('.st-view');
    if (!view) return;
    const searching = !!view.querySelector('[data-role="settings-search"]')?.value.trim();
    if (document.body.classList.contains('foco-settings-search') !== searching) document.body.classList.toggle('foco-settings-search', searching);
    let controls = view.querySelector('.foco-settings-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'foco-settings-controls';
      controls.innerHTML = '<button type="button" data-foco-advanced aria-expanded="false">More options</button><button type="button" data-foco-help aria-pressed="false">Show explanations</button>';
      view.querySelector('.st-tabbar')?.after(controls);
      controls.querySelector('[data-foco-advanced]').addEventListener('click', () => {
        document.body.classList.toggle('foco-advanced-open');
        syncSettingsControls(controls);
      });
      controls.querySelector('[data-foco-help]').addEventListener('click', () => {
        document.body.classList.toggle('foco-help-open');
        syncSettingsControls(controls);
      });
    }
    syncSettingsControls(controls);
    for (const row of view.querySelectorAll('.st-list [data-setting]')) {
      if (!essentials.has(row.dataset.setting) && row.dataset.focoExtra !== 'true') row.dataset.focoExtra = 'true';
      const hint = row.querySelector('.hall-field-text > small, .al-number-hint');
      if (!hint || hint.id) continue;
      hint.id = `foco-hint-${++hintId}`;
      if (!row.title) row.title = hint.textContent.trim();
      for (const input of row.querySelectorAll('input,select,button')) {
        const old = input.getAttribute('aria-describedby');
        input.setAttribute('aria-describedby', [old, hint.id].filter(Boolean).join(' '));
      }
    }
    for (const heading of view.querySelectorAll('.st-list > .hall-dialog-section')) {
      if (/^\s*Interface\b/.test(heading.textContent)) heading.dataset.focoExtra = 'true';
    }
  }
  function syncSettingsControls(controls) {
    const advanced = document.body.classList.contains('foco-advanced-open');
    const help = document.body.classList.contains('foco-help-open');
    const more = controls.querySelector('[data-foco-advanced]');
    more.setAttribute('aria-expanded', String(advanced));
    more.textContent = advanced ? 'Fewer options' : 'More options';
    const hints = controls.querySelector('[data-foco-help]');
    hints.setAttribute('aria-pressed', String(help));
    hints.textContent = help ? 'Hide explanations' : 'Show explanations';
  }

  function sync() {
    queued = false;
    if (!document.querySelector('.hall-root')) { rail?.remove(); return; }
    if (!document.body.classList.contains('foco-ui')) document.body.classList.add('foco-ui');
    mountRail();
    const active = nativeTabs().find(b => b.classList.contains('is-active'));
    const current = NAV.find(item => active && item.match.test(active.textContent.trim()))?.key || '';
    if (document.body.dataset.focoView !== current) document.body.dataset.focoView = current;
    for (const button of rail.querySelectorAll('[data-foco-nav]')) {
      const selected = button.dataset.focoNav === current;
      if (selected && button.getAttribute('aria-current') !== 'page') button.setAttribute('aria-current', 'page');
      if (!selected && button.hasAttribute('aria-current')) button.removeAttribute('aria-current');
    }
    syncTools();
    syncLibrary();
    settings();
  }
  function schedule(records = []) {
    if (queued || inRound()) return;
    const touched = records.filter(r => !r.target.parentElement?.closest('.foco-rail, .foco-library-actions, .foco-settings-controls'));
    if (records.length && !touched.length) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  document.addEventListener('click', event => {
    // Search results use the native "Go" action, which clears the query before
    // focusing a row. Keep optional rows exposed when jumping to one of them.
    if (event.target.closest('.st-view [data-jump]')) {
      document.body.classList.add('foco-advanced-open');
      schedule();
    }
  }, true);
  document.addEventListener('click', event => {
    if (libraryMode === 'maps' && event.target.closest('.al-wk-slice:not(.is-locked)')) {
      libraryMode = '';
      document.body.dataset.focoLibrary = '';
      schedule();
    }
  });
  document.addEventListener('input', event => {
    if (event.target.matches('[data-role="settings-search"]')) {
      document.body.classList.toggle('foco-settings-search', !!event.target.value.trim());
    }
    if (event.target.matches('.hall-search input') && event.target.value.trim()) {
      libraryMode = 'exercises';
      document.body.dataset.focoLibrary = libraryMode;
    }
  });
  document.addEventListener('keydown', event => {
    if (inRound()) return;
    if (event.key === '/' && !event.target.closest('input,textarea,select,[contenteditable="true"]')) {
      event.preventDefault();
      search();
    }
    if (event.key === 'Escape') {
      closeSearch();
      rail?.querySelector('details')?.removeAttribute('open');
    }
  });
  window.__aimFoco = Object.freeze({ navigate, search, library, version: 1 });
  window.__aimWatchPage(schedule, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-current'] });
  sync();
})();
