// Push service module for handling local browser notifications.

export async function checkNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export function showLocalNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    // Fallback if not supported or not granted
    console.log(`In-app alert: ${title} - ${body}`);
    return;
  }

  const notification = new Notification(title, {
    body: body,
    icon: '/app-icon.png',
    badge: '/app-icon.png',
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function generateICS(title: string, date: number) {
  const startDate = new Date(date);
  const endDate = new Date(date + 30 * 60 * 1000); // Default 30 min duration

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
