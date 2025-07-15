document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const intervalInput = document.getElementById('interval');
  const durationInput = document.getElementById('duration');
  const soundSelect = document.getElementById('sound');
  const displayStyle = document.getElementById('displayStyle');
  const enableExtension = document.getElementById('enableExtension');
  const playBtn = document.getElementById('playSound');

  // Load saved settings
  chrome.storage.sync.get(['interval', 'duration', 'sound', 'displayStyle', 'enableExtension'], (data) => {
    if (data.interval) intervalInput.value = data.interval;
    if (data.duration) durationInput.value = data.duration;
    if (data.sound) soundSelect.value = data.sound;
    if (data.displayStyle) displayStyle.value = data.displayStyle;
    if (typeof data.enableExtension === "boolean") {
      enableExtension.checked = data.enableExtension;
    }
  });

  // Save handler
  document.getElementById('reminderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const interval = parseInt(intervalInput.value, 10) || 20;
    const duration = parseInt(durationInput.value, 10) || 3;
    const sound = soundSelect.value;
    const displayStyleVal = displayStyle.value;
    const enableExtensionVal = enableExtension.checked;

    chrome.storage.sync.set({
      interval,
      duration,
      sound,
      displayStyle: displayStyleVal,
      enableExtension: enableExtensionVal
    }, function() {
      alert('Configuration is saved!');
      chrome.runtime.sendMessage({ action: 'reloadConfig' });
      window.close();
    });
  });

  // Play sound preview
  playBtn.addEventListener('click', function () {
    const sound = soundSelect.value;
    if (sound === 'beep') playBeep();
    else if (sound === 'chime') playChime();
    else if (sound === 'pop') playPop();
    else if (sound === 'softblink') playSoftBlink();
    else if (sound.endsWith('.mp3')) playAudioFile(sound);
    else playBell();
  });

  // Sound/tone functions
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
  function playPop() {
    playTone(700, 0.06, 'triangle');
    setTimeout(() => playTone(500, 0.08, 'triangle'), 80);
  }
  function playSoftBlink() {
    playTone(660, 0.05, 'sine');
    setTimeout(() => playTone(440, 0.07, 'sine'), 60);
    setTimeout(() => playTone(330, 0.05, 'sine'), 120);
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
  function playAudioFile(src) {
    const audio = new Audio(chrome.runtime.getURL(src));
    audio.volume = 0.7;
    audio.play().catch(() => {});
  }
});
