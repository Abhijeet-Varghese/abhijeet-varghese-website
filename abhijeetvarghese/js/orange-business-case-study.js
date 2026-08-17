(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery?.matches ?? false;
  motionQuery?.addEventListener?.('change', event => { reducedMotion = event.matches; });

  // No-JS and reduced-motion are fully readable baselines. Enhance only when supported.
  const revealElements = $$('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach(element => element.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    revealElements.forEach(element => revealObserver.observe(element));
  }

  // Executive summary dialog.
  const summaryDialog = $('.summary-dialog');
  const closeSummary = () => {
    if (!summaryDialog) return;
    if (typeof summaryDialog.close === 'function') summaryDialog.close();
    else summaryDialog.removeAttribute('open');
    document.body.classList.remove('dialog-open');
  };
  $('.summary-open')?.addEventListener('click', () => {
    if (!summaryDialog) return;
    if (typeof summaryDialog.showModal === 'function') summaryDialog.showModal();
    else summaryDialog.setAttribute('open', '');
    document.body.classList.add('dialog-open');
  });
  $('.dialog-close')?.addEventListener('click', closeSummary);
  summaryDialog?.addEventListener('click', event => {
    if (event.target === summaryDialog) closeSummary();
  });
  summaryDialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));

  // Hero image depth is intentionally restrained.
  const hero = $('.hero');
  if (!reducedMotion && window.matchMedia?.('(pointer:fine)').matches && hero) {
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) - .5;
      hero.style.setProperty('--hero-image-x', `${x * -7}px`);
    });
    hero.addEventListener('pointerleave', () => hero.style.setProperty('--hero-image-x', '0px'));
  }

  // Panoramic spatial overview: drag on constrained screens and select real zones.
  const panoramaViewport = $('.hero-media');
  const panoramaTrack = $('.panorama-track');
  const panoramaOutput = $('.panorama-output');
  const panoramaHotspots = $$('.panorama-hotspot');
  let panoramaX = 0;
  let panoramaStartX = 0;
  let panoramaStartOffset = 0;
  let panoramaDragging = false;
  let panoramaMoved = false;

  const clampPanorama = value => {
    if (!panoramaViewport || !panoramaTrack) return 0;
    const minimum = Math.min(0, panoramaViewport.clientWidth - panoramaTrack.scrollWidth);
    return Math.min(0, Math.max(minimum, value));
  };
  const setPanorama = value => {
    panoramaX = clampPanorama(value);
    hero?.style.setProperty('--pan-x', `${panoramaX}px`);
  };
  panoramaTrack?.addEventListener('pointerdown', event => {
    if (event.target.closest('.panorama-hotspot')) return;
    panoramaDragging = true;
    panoramaMoved = false;
    panoramaStartX = event.clientX;
    panoramaStartOffset = panoramaX;
    panoramaTrack.classList.add('dragging');
    panoramaTrack.setPointerCapture?.(event.pointerId);
  });
  panoramaTrack?.addEventListener('pointermove', event => {
    if (!panoramaDragging) return;
    const delta = event.clientX - panoramaStartX;
    if (Math.abs(delta) > 5) panoramaMoved = true;
    setPanorama(panoramaStartOffset + delta);
  });
  addEventListener('pointerup', () => {
    panoramaDragging = false;
    panoramaTrack?.classList.remove('dragging');
    setTimeout(() => { panoramaMoved = false; }, 60);
  });
  panoramaHotspots.forEach(hotspot => {
    hotspot.addEventListener('pointerdown', () => { panoramaMoved = false; });
    hotspot.addEventListener('click', () => {
      if (panoramaMoved) return;
      panoramaHotspots.forEach(item => {
        const active = item === hotspot;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const title = $('b', panoramaOutput);
      const copy = $('p', panoramaOutput);
      if (title) title.textContent = hotspot.dataset.title;
      if (copy) copy.textContent = hotspot.dataset.copy;
    });
  });

  // Responsibility chain from strategy through site.
  const roleButtons = $$('.role-chain button');
  const roleOutput = $('.role-chain-output p');
  roleButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      roleButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (roleOutput) roleOutput.textContent = button.dataset.copy;
    });
  });

  // Connected visitor journey with evidence-led image transitions.
  const journeyButtons = $$('.journey-strip button');
  const journeyStage = $('.journey-stage');
  const journeyImage = $('#journey-media-image');
  const journeyStageCopy = $('.journey-stage-copy');
  let journeyImageTimer;
  const setJourney = (button, index) => {
    journeyButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    const stageIndex = journeyStageCopy && $('span', journeyStageCopy);
    const stageTitle = journeyStageCopy && $('h3', journeyStageCopy);
    const stageCopy = journeyStageCopy && $('p', journeyStageCopy);
    if (stageIndex) stageIndex.textContent = `EXPERIENCE STAGE · ${String(index + 1).padStart(2, '0')} / 07`;
    if (stageTitle) stageTitle.textContent = button.dataset.title;
    if (stageCopy) stageCopy.textContent = button.dataset.copy;
    if (journeyImage && journeyStage && journeyImage.getAttribute('src') !== button.dataset.image) {
      journeyStage.classList.add('switching');
      clearTimeout(journeyImageTimer);
      journeyImageTimer = setTimeout(() => {
        journeyImage.onload = () => journeyStage.classList.remove('switching');
        journeyImage.srcset = button.dataset.imageSrcset || '';
        journeyImage.sizes = '(max-width:760px) 100vw, 90vw';
        journeyImage.src = button.dataset.image;
        journeyImage.alt = `${button.dataset.title} stage of the Orange Business visitor experience`;
        if (journeyImage.complete) journeyStage.classList.remove('switching');
      }, reducedMotion ? 0 : 150);
    }
  };
  journeyButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => setJourney(button, index));
  });

  // System architecture nodes.
  const systemButtons = $$('.architecture-branches button');
  const systemOutput = $('.architecture-output');
  systemButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      systemButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const blocks = $$('.architecture-output > div');
      if (blocks.length < 4) return;
      $('b', blocks[0]).textContent = button.dataset.title;
      $('p', blocks[1]).textContent = button.dataset.what;
      $('p', blocks[2]).textContent = button.dataset.experience;
      $('p', blocks[3]).textContent = button.dataset.business;
    });
  });

  // Room response simulation explains automation through state change.
  const roomResponse = $('.room-response');
  const responseToggle = $('.response-toggle');
  const setRoomResponse = active => {
    if (!roomResponse) return;
    roomResponse.dataset.state = active ? 'active' : 'standby';
    const visitor = $('.response-visitor', roomResponse);
    const curtains = $('.response-curtains', roomResponse);
    const lights = $('.response-lights', roomResponse);
    const mode = $('.response-mode', roomResponse);
    if (visitor) visitor.textContent = active ? 'DETECTED' : 'NO VISITOR';
    if (curtains) curtains.textContent = active ? 'CLOSED' : 'OPEN';
    if (lights) lights.textContent = active ? 'ON' : 'OFF';
    if (mode) mode.textContent = active ? 'ACTIVE' : 'STANDBY';
    if (responseToggle?.firstChild) responseToggle.firstChild.textContent = active ? 'LEAVE ROOM ' : 'ENTER ROOM ';
    responseToggle?.setAttribute('aria-pressed', String(active));
    responseToggle?.setAttribute('aria-label', active ? 'Set room to standby' : 'Activate room response');
  };
  responseToggle?.setAttribute('aria-pressed', 'false');
  responseToggle?.setAttribute('aria-label', 'Activate room response');
  responseToggle?.addEventListener('click', () => setRoomResponse(roomResponse?.dataset.state !== 'active'));

  // Technology strip connects experience value to business value.
  const purposeButtons = $$('.purpose-strip button');
  const purposeOutput = $('.purpose-output');
  purposeButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      purposeButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      const blocks = $$('.purpose-output > div');
      if (blocks.length < 2) return;
      $('p', blocks[0]).textContent = button.dataset.experience;
      $('p', blocks[1]).textContent = button.dataset.business;
    });
  });

  // Experience proof tabs and deferred video loading.
  const actionButtons = $$('.action-switcher button');
  const actionPanels = $$('.action-panel');
  const evidenceVideos = $$('.evidence-video');

  const loadVideo = video => {
    const source = $('source[data-src]', video);
    if (!source?.dataset.src) return;
    if (!source.hasAttribute('src')) {
      source.src = source.dataset.src;
      video.load();
    }
    if (!reducedMotion && video.dataset.userPaused !== 'true') video.play().catch(() => {});
  };

  // Add accessible pause/play controls without cluttering the markup.
  evidenceVideos.forEach(video => {
    const source = $('source[data-src]', video);
    if (!source?.dataset.src) {
      video.dataset.static = 'true';
      return;
    }
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'video-toggle';
    control.textContent = reducedMotion ? 'PLAY' : 'PAUSE';
    control.setAttribute('aria-label', reducedMotion ? 'Play project video' : 'Pause project video');
    video.parentElement.append(control);
    control.addEventListener('click', () => {
      if (video.paused) {
        video.dataset.userPaused = 'false';
        loadVideo(video);
      } else {
        video.dataset.userPaused = 'true';
        video.pause();
      }
    });
    video.addEventListener('play', () => {
      control.textContent = 'PAUSE';
      control.setAttribute('aria-label', 'Pause project video');
    });
    video.addEventListener('pause', () => {
      control.textContent = 'PLAY';
      control.setAttribute('aria-label', 'Play project video');
    });
    video.addEventListener('error', () => { control.hidden = true; });
  });

  const showActionPanel = key => {
    actionButtons.forEach(button => {
      const active = button.dataset.panel === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    actionPanels.forEach(panel => {
      const active = panel.dataset.panel === key;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
      const video = $('.evidence-video', panel);
      if (video) active ? loadVideo(video) : video.pause();
    });
  };
  actionButtons.forEach((button, index) => {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(index === 0));
    const panel = actionPanels.find(item => item.dataset.panel === button.dataset.panel);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      if (button.id) panel.setAttribute('aria-labelledby', button.id);
      if (panel.id) button.setAttribute('aria-controls', panel.id);
    }
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener('click', () => showActionPanel(button.dataset.panel));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % actionButtons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + actionButtons.length) % actionButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = actionButtons.length - 1;
      actionButtons[next].focus();
      showActionPanel(actionButtons[next].dataset.panel);
    });
  });
  actionPanels.forEach((panel, index) => { panel.hidden = index !== 0; });

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        const panelIsActive = video.closest('.action-panel')?.classList.contains('active');
        if (entry.isIntersecting && panelIsActive && !document.hidden && video.dataset.static !== 'true') loadVideo(video); else video.pause();
      });
    }, { threshold: .3, rootMargin: '120px 0px' });
    evidenceVideos.forEach(video => videoObserver.observe(video));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) evidenceVideos.forEach(video => video.pause());
  });

  // Video wall modes explain multifunctionality while playback provides proof.
  const videoWall = $('.wall-video video');
  const videoModeButtons = $$('.video-modes button');
  const videoModeCopy = $('.wide-media-copy p');
  videoModeButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      videoModeButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (videoModeCopy) videoModeCopy.textContent = button.dataset.copy;
    });
  });
  videoWall?.addEventListener('timeupdate', () => {
    if (!videoWall.duration) return;
    const index = Math.min(videoModeButtons.length - 1, Math.floor((videoWall.currentTime / videoWall.duration) * videoModeButtons.length));
    videoModeButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  });

  // Scroll-linked narrative motion: hero expansion, media depth and closing scale.
  const progressBar = $('.page-progress i');
  const closing = $('.closing');
  const closingImage = $('.closing-media img');
  let frameRequested = false;
  const sceneProgress = element => {
    const rect = element.getBoundingClientRect();
    return clamp((innerHeight - rect.top) / (innerHeight + rect.height));
  };
  const near = element => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.bottom > -innerHeight * .2 && rect.top < innerHeight * 1.2;
  };
  const renderScroll = () => {
    const y = scrollY;
    const available = document.documentElement.scrollHeight - innerHeight;
    const page = available > 0 ? y / available : 0;
    if (progressBar) progressBar.style.width = `${page * 100}%`;

    if (!reducedMotion && hero) {
      const heroProgress = clamp(y / Math.max(innerHeight, 1));
      hero.style.setProperty('--hero-media-y', `${heroProgress * 18}px`);
      hero.style.setProperty('--hero-scale', String(1 + heroProgress * .025));
      hero.style.setProperty('--hero-y', `${heroProgress * -22}px`);
      hero.style.setProperty('--hero-opacity', String(1 - heroProgress * .76));
      if (innerWidth > 760) {
        hero.style.setProperty('--frame-top', `${innerHeight * .46 * (1 - heroProgress)}px`);
      } else {
        hero.style.removeProperty('--frame-top');
      }
      if (closing && closingImage && near(closing)) closingImage.style.setProperty('--closing-scale', String(1.08 - sceneProgress(closing) * .05));
    }
    frameRequested = false;
  };
  addEventListener('scroll', () => {
    if (!frameRequested) {
      requestAnimationFrame(renderScroll);
      frameRequested = true;
    }
  }, { passive: true });
  addEventListener('resize', () => {
    setPanorama(panoramaX);
    requestAnimationFrame(renderScroll);
  }, { passive: true });
  renderScroll();
})();
