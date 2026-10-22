(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const quickViewButton = $('#quickView');
  const quickPanel = $('#quickPanel');
  const roomSections = {
    about: 'about',
    projects: 'projects',
    publications: 'publications',
    outreach: 'outreach',
    certificates: 'certificates',
    trophies: 'trophies',
    gallery: 'gallery',
    contact: 'contact',
  };
  const roomForSection = Object.fromEntries(
    Object.entries(roomSections).map(([room, section]) => [section, room]),
  );
  const navigateToSection = (room, { scroll = true } = {}) => {
    const sectionId = roomSections[room];
    if (!sectionId) return;
    const section = document.getElementById(sectionId);
    $$('[data-room]').forEach((button) => {
      const active = button.dataset.room === room;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('.room-panel[id]').forEach((panel) => panel.classList.toggle('room-current', panel === section));
    if (scroll) {
      section?.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };
  window.srNavigateToSection = navigateToSection;
  let selectedRoute = 'journey';

  try {
    const savedTheme = localStorage.getItem('sr-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.body.classList.toggle('dark', savedTheme === 'dark');
    }
  } catch (error) {
    console.warn('Theme preference storage is unavailable.', error);
  }

  $('#themeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    try {
      localStorage.setItem('sr-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    } catch (error) {
      console.warn('Could not save the theme preference.', error);
    }
  });

  const setSelectedRoute = (button) => {
    selectedRoute = button.dataset.route === 'research' ? 'research' : 'journey';
    $$('[data-route]').forEach((route) => {
      const active = route === button;
      route.classList.toggle('active', active);
      route.setAttribute('aria-pressed', String(active));
    });
  };

  $$('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      setSelectedRoute(button);
      const startsAtProjects = selectedRoute === 'research';
      const start = startsAtProjects ? 'Projects & Innovation' : 'About & Career';
      $('#tourStatus').textContent = `The guide will begin at ${start}.`;
      $('#guideSpeech').textContent = startsAtProjects
        ? 'Let’s explore projects and research.'
        : 'Let’s explore the professional journey.';
    });
  });

  $$('[data-room]').forEach((button) => {
    button.addEventListener('click', () => {
      const sectionId = roomSections[button.dataset.room];
      if (!sectionId) return;
      const roomLabel = button.textContent.trim();
      const usingFallback = $('#studio3d')?.classList.contains('scene-fallback-active');
      $('#tourStatus').textContent = usingFallback
        ? `3D tour unavailable; showing ${roomLabel}.`
        : `Opening ${roomLabel}…`;
      navigateToSection(button.dataset.room);
      $('#guideSpeech').textContent = usingFallback
        ? `The 3D tour is unavailable. The ${roomLabel} section is shown below.`
        : `Let’s explore ${roomLabel}.`;
    });
  });

  $('#startTour')?.addEventListener('click', () => {
    const room = selectedRoute === 'research' ? 'projects' : 'about';
    $(`[data-room="${room}"]`)?.click();
  });

  quickViewButton?.addEventListener('click', () => {
    if (!quickPanel) return;
    if (typeof quickPanel.showModal === 'function') quickPanel.showModal();
    else quickPanel.setAttribute('open', '');
    quickViewButton.setAttribute('aria-expanded', 'true');
    $('[data-close]', quickPanel)?.focus();
  });

  quickPanel?.addEventListener('close', () => {
    quickViewButton?.setAttribute('aria-expanded', 'false');
    quickViewButton?.focus();
  });

  quickPanel?.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      quickPanel.close?.();
      const sectionId = link.getAttribute('href').slice(1);
      const room = roomForSection[sectionId];
      if (room) navigateToSection(room);
      else document.getElementById(sectionId)?.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
    });
  });

  $$('[data-close]').forEach((button) => button.addEventListener('click', () => {
    const dialog = button.closest('dialog');
    if (dialog?.open) dialog.close();
    else dialog?.removeAttribute('open');
  }));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openDialog = $('dialog[open]');
    if (openDialog?.open) {
      event.preventDefault();
      openDialog.close();
    }
  });

  $$('.previewable').forEach((button) => button.addEventListener('click', () => {
    const dialog = $('#previewDialog');
    const image = $('#previewImage');
    if (!dialog || !image) return;
    $('#previewTitle').textContent = button.dataset.title || '';
    $('#previewDescription').textContent = button.dataset.description || '';
    image.hidden = !button.dataset.image;
    image.src = button.dataset.image || '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    $('[data-close]', dialog)?.focus();
  }));

  $$('.filter[data-filter-target]').forEach((button) => button.addEventListener('click', () => {
    const filterGroup = button.closest('.filters');
    const target = document.getElementById(button.dataset.filterTarget);
    if (!filterGroup || !target) return;
    $$('.filter', filterGroup).forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    $$('.searchable', target).forEach((item) => {
      item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
    });
  }));

  $('#certificateSearch')?.addEventListener('input', (event) => {
    const query = event.currentTarget.value.trim().toLocaleLowerCase();
    const cards = $$('.searchable-credential');
    let visibleCount = 0;
    cards.forEach((card) => {
      const matches = card.dataset.search.includes(query);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });
    const noResults = $('.credential-no-results');
    if (noResults) noResults.hidden = visibleCount > 0 || query.length === 0 || cards.length === 0;
  });

  $('#contactForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const feedback = $('#contactFeedback');
    const submitButton = form.querySelector('button[type="submit"]');
    const started = form.dataset.started ? Number(form.dataset.started) : 0;
    form.querySelector('#contactTs').value = String(started);
    if (submitButton) { submitButton.disabled = true; }
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      const payload = await response.json();
      if (response.ok && payload.ok) {
        feedback.textContent = payload.message || 'Message received. Thank you.';
        form.reset();
        form.dataset.started = '';
      } else {
        feedback.textContent = payload.error || 'The message could not be sent. Please try again.';
      }
    } catch (error) {
      feedback.textContent = 'The message could not be sent. Check your connection and try again.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
  $('#contactForm')?.addEventListener('input', (event) => {
    const form = event.currentTarget;
    if (!form.dataset.started) form.dataset.started = String(Date.now());
  });

  $$('.shortlist').forEach((button) => button.addEventListener('click', () => {
    let shortlist = [];
    try {
      const saved = JSON.parse(localStorage.getItem('sr-shortlist') || '[]');
      if (Array.isArray(saved)) shortlist = saved;
    } catch (error) {
      console.warn('Could not read the saved project shortlist.', error);
    }

    const key = button.dataset.key;
    const alreadySaved = shortlist.some((item) => item.key === key);
    shortlist = alreadySaved
      ? shortlist.filter((item) => item.key !== key)
      : [...shortlist, { key, title: button.dataset.title }];
    button.textContent = alreadySaved ? '＋ Shortlist' : '✓ Saved';
    button.setAttribute('aria-pressed', String(!alreadySaved));
    try {
      localStorage.setItem('sr-shortlist', JSON.stringify(shortlist));
    } catch (error) {
      console.warn('Could not save the project shortlist.', error);
    }
  }));

  $$('form[data-confirm]').forEach((form) => form.addEventListener('submit', (event) => {
    if (!confirm(form.dataset.confirm)) event.preventDefault();
  }));
})();
