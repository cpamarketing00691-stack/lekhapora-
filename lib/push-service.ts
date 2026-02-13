
// VAPID Public Key - Ideally from process.env but usually constant for frontend
const PUBLIC_VAPID_KEY = "BOQS5jGeY1uyMDkK7BocruEAkQVcWx3sSPe7VBVvoj_UpNT5FZmr52hu9izrT9i6M5J2ScIJhOd6AYhzWHRiAyI";

export async function checkNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications(userId: string) {
  try {
    const permission = await checkNotificationPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
    }

    // Persist to backend
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription })
    });

  } catch (error) {
    console.error("Push registration failed:", error);
  }
}

export function showLocalNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/app-icon.svg' });
}

export function generateICS(title: string, date: number) {
  const startDate = new Date(date);
  const endDate = new Date(date + 30 * 60 * 1000); 
  const format = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");
  
  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudyKori//HSC Tracker//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DTSTART:${format(startDate)}`,
    `DTEND:${format(endDate)}`,
    "DESCRIPTION:HSC Tracker Reminder",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ical], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, '_')}.ics`;
  link.click();
}
