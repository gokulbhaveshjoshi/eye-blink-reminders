let interval = 20;
let alarmDuration = 3000;
let alarmSound = 'bell';
let disableMusic = false;
let count = 0;
let displayStyle = 'fullscreen'; // default
let connectionErrorLogged = false;
let enableExtension = true; // default

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("eyeReminder", { periodInMinutes: interval });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Eye Reminder] Message received:", request);

  if (request.action === 'updateInterval') {
    interval = request.interval;
    alarmDuration = (request.duration || 3) * 1000;
    alarmSound = request.sound || 'bell';
    disableMusic = !!request.disableMusic;
    displayStyle = request.displayStyle || 'fullscreen';
    chrome.alarms.clear("eyeReminder", () => {
      chrome.alarms.create("eyeReminder", { periodInMinutes: interval });
      console.log("[Eye Reminder] Alarm updated to", interval, "minutes");
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("[Eye Reminder] Querying active tabs:", tabs);
      console.log("[Eye Reminder] Current configuration:",
        "Interval (min):", interval,
        "| Popup Duration (ms):", alarmDuration,
        "| Sound:", alarmSound,
        "| Disable Music:", disableMusic,
        "| Display Style:", displayStyle
      );
      const tab = tabs[0];
      if (tab && tab.id && tab.url && tab.url.startsWith("http")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "blink",
          interval: interval,
          duration: alarmDuration,
          sound: alarmSound,
          disableMusic: disableMusic,
          displayStyle: displayStyle
        }, (response) => {
          if (chrome.runtime.lastError && !connectionErrorLogged) {
            console.log("[Eye Reminder] Could not send message (likely not a regular web page):", chrome.runtime.lastError.message);
            connectionErrorLogged = true;
          }
        });
        console.log("[Eye Reminder] Sent blink message to tab:", tab.url, "Count:", count);
      } else {
        console.log("[Eye Reminder] Skipped tab (tab or tab.id missing, or not http/https):", tab);
      }
    });

    sendResponse({ status: "alarm updated" });
  }

  if (request.action === 'reloadConfig') {
    chrome.storage.sync.get(['interval', 'duration', 'sound', 'displayStyle', 'enableExtension'], (data) => {
      if (data.interval) interval = data.interval;
      if (data.duration) alarmDuration = data.duration * 1000;
      if (data.sound) alarmSound = data.sound;
      if (data.displayStyle) displayStyle = data.displayStyle;
      if (typeof data.enableExtension === "boolean") enableExtension = data.enableExtension;

      // Reset alarm with new interval
      chrome.alarms.clear("eyeReminder", () => {
        if (enableExtension && interval > 0) {
          chrome.alarms.create("eyeReminder", { periodInMinutes: Number(interval) });
        }
      });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.id && tab.url && tab.url.startsWith("http")) {
          chrome.tabs.sendMessage(tab.id, {
            action: "blink",
            interval: interval,
            duration: alarmDuration,
            sound: alarmSound,
            disableMusic: disableMusic,
            displayStyle: displayStyle
          }, (response) => {
            if (chrome.runtime.lastError && !connectionErrorLogged) {
              console.log("[Eye Reminder] Could not send message (likely not a regular web page):", chrome.runtime.lastError.message);
              connectionErrorLogged = true;
            }
          });
        } else {
          console.log("[Eye Reminder] Skipped tab (tab or tab.id missing, or not http/https):", tab);
        }
      });

      sendResponse({ status: 'reloaded' });
    });
    return true;
  }

  if (typeof request.enableExtension === "boolean") {
    enableExtension = request.enableExtension;
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!enableExtension) return;
  if (alarm.name === "eyeReminder") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      console.log("[Eye Reminder] Alarm triggered for tab:", tab ? tab.url : "No active tab");
      console.log("[Eye Reminder] Current configuration:",
        "Interval (min):", interval,
        "| Popup Duration (ms):", alarmDuration,
        "| Sound:", alarmSound,
        "| Disable Music:", disableMusic,
        "| Display Style:", displayStyle
      );
      if (tab && tab.id && tab.url && tab.url.startsWith("http")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "blink",
          interval: interval,
          duration: alarmDuration,
          sound: alarmSound,
          disableMusic: disableMusic,
          displayStyle: displayStyle
        }, (response) => {
          if (chrome.runtime.lastError && !connectionErrorLogged) {
            console.log("[Eye Reminder] Could not send message (likely not a regular web page):", chrome.runtime.lastError.message);
            connectionErrorLogged = true;
          }
        });
      } else {
        console.log("[Eye Reminder] Skipped tab (tab or tab.id missing, or not http/https):", tab);
      }
    });
  }
});
