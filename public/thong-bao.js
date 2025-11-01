const bell = document.getElementById('floatingBell');
const dot = document.getElementById('notifyDot');
let offsetX, offsetY, dragging = false, moved = false;

// ======== PC ========
bell.addEventListener('mousedown', e => {
  dragging = true;
  moved = false;
  offsetX = e.clientX - bell.offsetLeft;
  offsetY = e.clientY - bell.offsetTop;
});

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  moved = true;
  bell.style.left = (e.clientX - offsetX) + 'px';
  bell.style.top = (e.clientY - offsetY) + 'px';
  bell.style.bottom = 'auto';
  bell.style.right = 'auto';
});

bell.addEventListener('mouseup', () => {
  if (!moved) {
    if (dot) dot.style.display = 'none';
    localStorage.setItem('lastSeenNotify', new Date().toISOString());
    window.location.href = '/hop-thu.html';
  }
  dragging = false;
});

// ======== MOBILE ========
bell.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  dragging = true;
  moved = false;
  offsetX = touch.clientX - bell.offsetLeft;
  offsetY = touch.clientY - bell.offsetTop;
});

document.addEventListener('touchmove', e => {
  if (!dragging) return;
  moved = true;
  const touch = e.touches[0];
  bell.style.left = (touch.clientX - offsetX) + 'px';
  bell.style.top = (touch.clientY - offsetY) + 'px';
  bell.style.bottom = 'auto';
  bell.style.right = 'auto';
});

bell.addEventListener('touchend', () => {
  if (!moved) {
    if (dot) dot.style.display = 'none';
    localStorage.setItem('lastSeenNotify', new Date().toISOString());
    window.location.href = './hop-thu.html';
  }
  dragging = false;
});

// ======== Kiểm tra thông báo mới ========
(async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/notifications/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.notifications && data.notifications.length > 0) {
      const latest = data.notifications[0];
      const lastSeen = localStorage.getItem('lastSeenNotify');

      if (!lastSeen || new Date(latest.createdAt) > new Date(lastSeen)) {
        if (dot) dot.style.display = 'block';
        bell.classList.add('ringing');
        setTimeout(() => bell.classList.remove('ringing'), 1000);
      }
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra thông báo:', err);
  }
})();