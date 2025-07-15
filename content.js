const audioContext = new (window.AudioContext || window.webkitAudioContext)();

window.addEventListener('click', () => {
    if (audioContext.state === 'suspended') audioContext.resume();
});
window.addEventListener('keydown', () => {
    if (audioContext.state === 'suspended') audioContext.resume();
});

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
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, audioContext.currentTime + duration
        );
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.error('Error playing tone:', e);
    }
}

let audioWarningShown = false;

function showAudioWarning(overlay) {
    if (audioWarningShown) return;
    audioWarningShown = true;
    const warn = document.createElement("div");
    warn.textContent = "🔈 Click or press any key on this page to enable sound for reminders.";
    warn.style.color = "#ffd700";
    warn.style.fontSize = "1em";
    warn.style.fontWeight = "normal";
    warn.style.marginTop = "1em";
    warn.style.textAlign = "center";
    warn.style.textShadow = "0 2px 8px #000";
    overlay.appendChild(warn);
}

function blinkScreen(duration = 100, sound = 'bell', displayStyle = 'fullscreen') {
    if (document.getElementById("eye-reminder-overlay") || document.getElementById("eye-reminder-toast")) return;

    if (displayStyle === 'toast') {
        // Toast message
        const toast = document.createElement("div");
        toast.id = "eye-reminder-toast";
        toast.textContent = "Time for an eye break! Blink your eyes.";

        // Close icon
        const closeBtn = document.createElement("span");
        closeBtn.textContent = "✖";
        closeBtn.style.marginLeft = "18px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "1.2em";
        closeBtn.style.verticalAlign = "middle";
        closeBtn.style.float = "right";
        closeBtn.style.marginTop = "-2px";
        closeBtn.style.marginRight = "-8px";
        closeBtn.title = "Close";
        closeBtn.onclick = () => toast.remove();

        // Toast styling
        toast.style.position = "fixed";
        toast.style.bottom = "30px";
        toast.style.right = "30px";
        toast.style.background = "rgba(0,0,0,0.85)";
        toast.style.color = "#fff";
        toast.style.padding = "18px 32px";
        toast.style.borderRadius = "12px";
        toast.style.fontSize = "1.3em";
        toast.style.fontWeight = "bold";
        toast.style.boxShadow = "0 4px 24px #0008";
        toast.style.zIndex = "999999";
        toast.style.maxWidth = "340px";
        toast.style.minWidth = "220px";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.justifyContent = "space-between";

        toast.appendChild(closeBtn);
        document.body.appendChild(toast);

        // Always play sound
        if (sound !== 'none') {
            playSound(sound);
        }

        setTimeout(() => {
            if (document.body.contains(toast)) toast.remove();
        }, duration);
    } else if ('fullscreen' === displayStyle) {
        // Fullscreen overlay
        const overlay = document.createElement("div");
        overlay.id = "eye-reminder-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
        overlay.style.zIndex = "999999";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";

        const msg = document.createElement("div");
        msg.textContent = "Time for an eye break! Blink your eyes.";
        msg.style.color = "#fff";
        msg.style.fontSize = "2em";
        msg.style.fontWeight = "bold";
        msg.style.textAlign = "center";
        msg.style.textShadow = "0 2px 8px #000";
        overlay.appendChild(msg);

        document.body.appendChild(overlay);
        console.log('Sound type is ', sound);

        if (sound !== 'none') {
            playSound(sound);
        }
       

        setTimeout(() => {
            overlay.remove();
        }, duration);
    } else {
        if (sound !== 'none') {
            playSound(sound);
        }
    }
}

function playSound(sound) {
     // Always play sound
     if (sound === 'beep') playBeep();
     else if (sound === 'chime') playChime();
     else if (sound === 'pop') playPop();
     else if (sound === 'softblink') playSoftBlink();
     else if (sound.endsWith && sound.endsWith('.mp3')) playAudioFile(sound);
     else playBell();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "blink") {
        // Log configuration settings
        console.log("[Eye Reminder] Configuration:",
          "Interval (min):", request.interval,
          "| Popup Duration (ms):", request.duration,
          "| Popup Style:", request.displayStyle,
          "| Sound Effect:", request.sound
        );
        blinkScreen(request.duration, request.sound, request.displayStyle);
        sendResponse({ status: "blinked", duration: request.duration });
    }
});

function playAudioFile(src) {
    try {
        const audio = new Audio(chrome.runtime.getURL(src));
        audio.volume = 0.7;
        audio.play().catch(() => {});
    } catch (e) {
        console.error('Error playing audio file:', e);
    }
}
