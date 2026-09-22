document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.navbar-burger').forEach(function (button) {
    button.addEventListener('click', function () {
      const menu = document.getElementById(button.getAttribute('aria-controls'));
      const active = button.classList.toggle('is-active');
      if (menu) menu.classList.toggle('is-active', active);
      button.setAttribute('aria-expanded', String(active));
    });
  });
  document.querySelectorAll('.simulation-card').forEach(function (card) {
    const video = card.querySelector('video');
    // The second wrench is also conventional in the paper, despite its source folder name.
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
