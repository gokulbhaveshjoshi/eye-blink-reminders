document.getElementById('reminderForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const interval = parseInt(document.getElementById('interval').value, 10);
  const duration = parseInt(document.getElementById('duration').value, 10);
  const sound = document.getElementById('sound').value;
  const disableMusic = document.getElementById('disableMusic').checked;
  const displayStyle = document.getElementById('displayStyle').value;

  if (!disableMusic) {
    if (sound === 'beep') playBeep();
    else if (sound === 'chime') playChime();
    else playBell();
  }

  chrome.storage.sync.set({ interval, duration, sound, disableMusic, displayStyle }, function() {
    window.close();
  });

  chrome.runtime.sendMessage({ action: 'updateInterval', interval, duration, sound, disableMusic, displayStyle });
});

// Load saved settings on popup open
window.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['interval', 'duration', 'sound', 'disableMusic', 'displayStyle'], (data) => {
    if (data.interval) document.getElementById('interval').value = data.interval;
    if (data.duration) document.getElementById('duration').value = data.duration;
    if (data.sound) document.getElementById('sound').value = data.sound;
    if (data.disableMusic) document.getElementById('disableMusic').checked = data.disableMusic;
    if (data.displayStyle) document.getElementById('displayStyle').value = data.displayStyle;
  });
});

// Add these functions to popup.js or import them if defined elsewhere
function playBell() {
  playTone(880, 0.1, 'sine');
  setTimeout(() => playTone(660, 0.1, 'sine'), 120);
  setTimeout(() => playTone(440, 0.15, 'triangle'), 240);
}
function playBeep() {
  playTone(1000, 0.2, 'square');
}
function playChime() {
  playTone(523.25, 0.12, 'triangle');
  setTimeout(() => playTone(659.25, 0.12, 'triangle'), 130);
  setTimeout(() => playTone(783.99, 0.18, 'triangle'), 260);
}
function playTone(frequency, duration, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.3;
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, ctx.currentTime + duration
    );
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    oscillator.onended = () => ctx.close();
  } catch (e) {
    console.error('Error playing tone:', e);
  }
}
