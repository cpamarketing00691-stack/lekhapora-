// Push service module removed to eliminate OneSignal dependencies and errors.
// Basic permission check retained for future local notification implementation.

export async function checkNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function subscribeToPush() {
  console.log("Push subscription disabled - OneSignal feature removed.");
  return null;
}
