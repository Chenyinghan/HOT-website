document.addEventListener('DOMContentLoaded', function () {
  // Only decode task videos while visible, leaving resources for the intro.
  const videoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.play().catch(function () {});
      else entry.target.pause();
    });
  }, { threshold: 0 }) : null;
  document.querySelectorAll('.simulation-card').forEach(function (card) {
    const video = card.querySelector('video');
    if (videoObserver) {
      video.autoplay = false;
      video.pause();
      videoObserver.observe(video);
    }
    const isRealWorld = card.dataset.domain === 'real-world';
    const variants = isRealWorld ? ['Video 1', 'Video 2'] : ['Reference', card.dataset.task === 'torque' ? 'Alternative' : 'Creative'];
    let current = 0;
    card.querySelectorAll('[data-direction]').forEach(function (button) {
      button.addEventListener('click', function () {
        current = (current + Number(button.dataset.direction) + variants.length) % variants.length;
        const file = card.dataset.task + '-' + (current + 1) + (isRealWorld ? '' : '-stage2');
        video.pause();
        video.poster = './static/images/video-posters/' + (isRealWorld ? 'real-' : '') + file + '.jpg';
        video.querySelector('source').src = './static/videos/' + (isRealWorld ? 'real-world/' : 'simulation/') + file + '.mp4';
        video.setAttribute('aria-label', card.dataset.title + ' — ' + variants[current]);
        video.load();
        video.play().catch(function () {});
      });
    });
  });
});
