'use strict';

const deck = document.querySelector('#deck');
const slides = Array.from(deck.querySelectorAll('.slide'));
const count = document.querySelector('#count');
const progress = document.querySelector('#progress');
const progressFill = progress.querySelector('span');
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const toc = document.querySelector('#toc');
const tocLinks = [...toc.querySelectorAll('a')];
const notes = document.querySelector('#notes');
const notesText = document.querySelector('#notes-text');
const lightbox = document.querySelector('#lightbox');
const largeImage = lightbox.querySelector('img');
const largeCaption = lightbox.querySelector('figcaption');
const fullscreen = document.querySelector('#fullscreen');
let active = -1;
let touchStart;

const format = (number) => String(number).padStart(2, '0');

function render(index, focusSlide = false) {
  if (active === index) return;

  if (active >= 0) {
    slides[active].hidden = true;
    tocLinks[active].removeAttribute('aria-current');
  }
  active = index;
  const slide = slides[active];
  const number = active + 1;
  const note = slide.querySelector('.speaker-note');

  slide.hidden = false;
  count.value = format(number) + ' / ' + format(slides.length);
  progress.setAttribute('aria-valuenow', number);
  progressFill.style.width = (number / slides.length * 100) + '%';
  tocLinks[active].setAttribute('aria-current', 'page');
  notesText.textContent = note?.content.textContent.trim() || 'Для этого слайда подсказок нет.';
  prev.disabled = active === 0;
  next.disabled = number === slides.length;

  if (focusSlide) {
    slide.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function syncHash(focusSlide = false) {
  const index = slides.findIndex((slide) => '#' + slide.id === location.hash);
  if (index === -1) history.replaceState(null, '', '#slide-1');
  render(Math.max(0, index), focusSlide);
}

function goTo(index) {
  if (index < 0 || index >= slides.length || index === active) return;
  history.pushState(null, '', '#' + slides[index].id);
  render(index, true);
}

prev.addEventListener('click', () => goTo(active - 1));
next.addEventListener('click', () => goTo(active + 1));
window.addEventListener('hashchange', () => syncHash(true));
window.addEventListener('popstate', () => syncHash(true));

document.querySelector('#show-toc').addEventListener('click', () => {
  toc.showModal();
  tocLinks[active].focus();
});
toc.addEventListener('click', (event) => {
  const link = event.target.closest('.toc-list a');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  toc.close();
  goTo(tocLinks.indexOf(link));
});
document.querySelector('#show-notes').addEventListener('click', () => notes.showModal());

for (const dialog of [toc, notes]) {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
}

deck.addEventListener('click', (event) => {
  const imageButton = event.target.closest('.shot-open');
  if (!imageButton) return;

  const image = imageButton.querySelector('img');
  largeImage.src = image.currentSrc || image.src;
  largeImage.alt = image.alt;
  largeCaption.textContent = image.alt;
  lightbox.showModal();
});
lightbox.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('close', () => largeImage.removeAttribute('src'));

document.addEventListener('keydown', (event) => {
  if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      goTo(active - 1);
      break;
    case 'ArrowRight':
      event.preventDefault();
      goTo(active + 1);
      break;
  }
});

deck.addEventListener('touchstart', (event) => {
  touchStart = event.touches.length === 1 ? event.touches[0] : undefined;
}, { passive: true });
deck.addEventListener('touchend', (event) => {
  const start = touchStart;
  touchStart = undefined;
  if (!start || event.changedTouches.length !== 1) return;

  const end = event.changedTouches[0];
  const dx = end.clientX - start.clientX;
  const dy = end.clientY - start.clientY;
  if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

  if (event.cancelable) event.preventDefault();
  goTo(active + (dx < 0 ? 1 : -1));
}, { passive: false });
deck.addEventListener('touchcancel', () => { touchStart = undefined; }, { passive: true });

fullscreen.disabled = !document.fullscreenEnabled;
fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (error) {
    fullscreen.title = 'Браузер не разрешил полноэкранный режим';
  }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Выйти из полного экрана' : 'Полный экран';
  fullscreen.querySelector('span').textContent = label;
  fullscreen.setAttribute('aria-label', label);
  fullscreen.title = label;
});

syncHash();

