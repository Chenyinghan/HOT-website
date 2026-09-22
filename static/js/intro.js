(function () {
  'use strict';
  const intro = document.querySelector('.intro');
  if (!intro) return;
  const videos = [...intro.querySelectorAll('.intro-video')];
  const note = intro.querySelector('.intro-note');
  const noteText = intro.querySelector('.intro-note-text');
  const playButton = intro.querySelector('.intro-play');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clips = [
    { src: '01_Layers_4K60.mp4', text: 'Joint design of tool structure, shape, and action.' },
    { src: '02_HOT_4K60.mp4', text: 'HOT: Hierarchical Optimization for Tool Design.' },
    { src: '03_Assets_4K60.mp4', text: 'Functional tools constructed from geometric primitives.' },
    { src: '04_Tasks_4K60.mp4', text: 'Tools designed for physical goals: Sweep Balls, Hammer & Extract Nail, Torque Bolt, and Scoop Balls.' }
  ];
  const readingDuration = 1500;
  const fadeDuration = 450;
  let active = !window.location.hash && !reducedMotion.matches;
  let current = -1;
  let phase = 'idle';
  let queued = false;
  let readingTimer = 0;
  let loadingTimer = 0;
  let fadeTimer = 0;
  let remaining = readingDuration;
  let readingStarted = 0;
  let touchY = null;
  let exitAnimations = [];

  function setPhase(value) {
    phase = value;
    intro.dataset.state = value;
  }
  function hideNote() {
    intro.classList.remove('has-note');
    note.setAttribute('aria-hidden', 'true');
  }
  function prepare(index) {
    if (index >= clips.length) return;
    const video = videos[index % 2];
    if (video.dataset.clip === String(index)) return;
    video.dataset.clip = String(index);
    video.src = './static/videos/' + clips[index].src;
    video.load();
  }
  function stop() {
    active = false;
    queued = false;
    clearTimeout(readingTimer);
    clearTimeout(loadingTimer);
    clearTimeout(fadeTimer);
    exitAnimations.forEach(animation => animation.cancel());
    exitAnimations = [];
    intro.classList.remove('is-exiting');
    videos.forEach(video => video.pause());
    playButton.hidden = true;
    hideNote();
    setPhase('done');
  }
  function enterPaper() {
    const paper = document.getElementById('paper');
    const stage = intro.querySelector('.intro-stage');
    const hero = paper.nextElementSibling;
    if (reducedMotion.matches || !stage.animate) {
      stop();
      paper.scrollIntoView({ behavior: 'instant' });
      paper.focus({ preventScroll: true });
      return;
    }
    setPhase('exiting');
    queued = false;
    videos.forEach(video => video.pause());
    // Keep the actual last video frame over the viewport while positioning the
    // real article behind it. No screenshot, duplicate content, or white flash.
    intro.classList.add('is-exiting');
    paper.scrollIntoView({ behavior: 'instant' });
    const easing = 'cubic-bezier(.65, 0, .25, 1)';
    exitAnimations = [
      intro.querySelector('.intro-media').animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(.92) translateY(-16px)', opacity: .65 }
      ], { duration: 650, easing, fill: 'forwards' }),
      intro.querySelector('.intro-bottom').animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 220, fill: 'forwards' }),
      stage.animate([
        { transform: 'translateY(0)', borderRadius: '0' },
        { transform: 'translateY(-102%)', borderRadius: '0 0 64px 64px' }
      ], { duration: 950, delay: 160, easing, fill: 'forwards' }),
      hero.animate([
        { transform: 'translateY(100px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 950, delay: 300, easing, fill: 'both' }),
      paper.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 450, delay: 650, fill: 'both' })
    ];
    Promise.all(exitAnimations.map(animation => animation.finished)).then(() => {
      if (phase !== 'exiting') return;
      stop();
      paper.focus({ preventScroll: true });
    }).catch(() => { /* Skip intro or a motion-preference change cancels cleanly. */ });
  }
  function fallback() {
    stop();
    // Native video controls and the skip link remain usable if media cannot play.
    const visible = videos.find(video => video.classList.contains('is-active'));
    if (visible) visible.controls = true;
  }
  function playCurrent() {
    if (!active) return;
    playButton.hidden = true;
    clearTimeout(loadingTimer);
    loadingTimer = setTimeout(() => {
      if (active && phase === 'loading') playButton.hidden = false;
    }, 8000);
    videos[current % 2].play().catch(() => {
      if (active && phase === 'loading') playButton.hidden = false;
    });
  }
  function startClip(index) {
    if (!active) return;
    if (intro.classList.contains('has-note')) {
      queued = false;
      setPhase('fading');
      hideNote();
      fadeTimer = setTimeout(() => startClip(index), fadeDuration);
      return;
    }
    if (index >= clips.length) { enterPaper(); return; }
    queued = false;
    current = index;
    intro.dataset.clip = String(index + 1);
    hideNote();
    setPhase('loading');
    prepare(index);
    playCurrent();
  }
  function readingFinished() {
    if (!active || phase !== 'reading') return;
    remaining = 0;
    setPhase('ready');
    if (queued) startClip(current + 1);
  }
  function scheduleReading() {
    clearTimeout(readingTimer);
    if (document.hidden) return;
    readingStarted = performance.now();
    readingTimer = setTimeout(readingFinished, remaining);
  }
  function requestNext() {
    if (!active) return;
    if (phase === 'idle' || phase === 'ready') startClip(current + 1);
    else if (phase === 'loading' && !playButton.hidden) playCurrent();
    else if (phase === 'reading') queued = true;
    // Scroll momentum during playback never fast-forwards or skips a clip.
  }

  videos.forEach(video => {
    video.muted = true;
    video.controls = !active && video.classList.contains('is-active');
    video.addEventListener('playing', () => {
      if (!active || video !== videos[current % 2]) return;
      clearTimeout(loadingTimer);
      playButton.hidden = true;
      videos.forEach(other => {
        const selected = other === video;
        other.classList.toggle('is-active', selected);
        other.setAttribute('aria-hidden', String(!selected));
        if (!selected) other.pause();
      });
      setPhase('playing');
      // Decode the next clip behind the current one; switch only after it starts.
      prepare(current + 1);
    });
    video.addEventListener('ended', () => {
      if (!active || phase !== 'playing' || video !== videos[current % 2]) return;
      noteText.textContent = clips[current].text;
      note.setAttribute('aria-hidden', 'false');
      intro.classList.add('has-note');
      remaining = readingDuration + fadeDuration;
      setPhase('reading');
      scheduleReading();
    });
    video.addEventListener('error', () => {
      if (active && (video === videos[current % 2] || (current < 0 && video === videos[0]))) fallback();
    });
  });
  playButton.addEventListener('click', playCurrent);
  intro.querySelector('.intro-skip').addEventListener('click', stop);
  window.addEventListener('hashchange', stop);
  reducedMotion.addEventListener('change', fallback);
  document.addEventListener('visibilitychange', () => {
    if (!active || phase !== 'reading') return;
    if (document.hidden) {
      clearTimeout(readingTimer);
      remaining = Math.max(0, remaining - (performance.now() - readingStarted));
    } else scheduleReading();
  });

  window.addEventListener('wheel', event => {
    if (!active || event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    if (event.deltaY > 1) requestNext();
  }, { passive: false });
  window.addEventListener('touchstart', event => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (!active || event.touches.length !== 1 || touchY === null) return;
    const y = event.touches[0].clientY;
    const delta = touchY - y;
    event.preventDefault();
    if (delta > 6) { requestNext(); touchY = y; }
  }, { passive: false });
  window.addEventListener('touchend', () => { touchY = null; }, { passive: true });
  window.addEventListener('keydown', event => {
    if (!active || event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
    if (['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) {
      event.preventDefault();
      requestNext();
    }
  });
  // Handle scrollbar dragging and native keyboard scrolling as one gesture too.
  window.addEventListener('scroll', () => {
    if (!active || phase === 'exiting') return;
    const top = window.scrollY + intro.getBoundingClientRect().top;
    if (window.scrollY > top + 2) {
      window.scrollTo({ top, behavior: 'instant' });
      requestNext();
    }
  }, { passive: true });
  setPhase(active ? 'idle' : 'done');
  if (active) {
    prepare(1);
    startClip(0);
  }
}());
