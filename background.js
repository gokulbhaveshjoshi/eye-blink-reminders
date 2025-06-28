let interval = 20;
let alarmDuration = 3000;
let alarmSound = 'bell';
let disableMusic = false;
let count = 0;
let displayStyle = 'fullscreen'; // default

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
      const tab = tabs[0];
      if (tab && tab.id && tab.url && tab.url.startsWith("http")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "blink",
          duration: alarmDuration,
          sound: alarmSound,
          disableMusic: disableMusic,
          displayStyle: displayStyle
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("[Eye Reminder] Could not send message (likely not a regular web page):", chrome.runtime.lastError.message);
          }
        });
        console.log("[Eye Reminder] Sent blink message to tab:", tab.url, "Count:", count);
      } else {
        console.log("[Eye Reminder] Skipped tab (tab or tab.id missing, or not http/https):", tab);
      }
    });

    sendResponse({ status: "alarm updated" });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "eyeReminder") {
    count++;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id && tab.url && tab.url.startsWith("http")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "blink",
          duration: alarmDuration,
          sound: alarmSound,
          disableMusic: disableMusic,
          displayStyle: displayStyle
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("[Eye Reminder] Could not send message (likely not a regular web page):", chrome.runtime.lastError.message);
          }
        });
        console.log("[Eye Reminder] Sent blink message to tab:", tab.url, "Count:", count);
      } else {
        console.log("[Eye Reminder] Skipped tab (tab or tab.id missing, or not http/https):", tab);
      }
    });
  }
});
