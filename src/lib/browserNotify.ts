// Thin wrapper around the browser Notification API — fires a real OS/desktop
// notification when the tab isn't focused (backgrounded, minimized, another
// app in front), for new chat messages / task assignments / due-date
// reminders. Does NOT survive a fully closed browser — that needs a service
// worker + server-side push (VAPID), which is a separate, bigger build.

const DISMISSED_KEY = 'nf_notify_banner_dismissed'

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notifyPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return Notification.requestPermission()
}

export function bannerDismissed() {
  return typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === '1'
}
export function dismissBanner() {
  localStorage.setItem(DISMISSED_KEY, '1')
}

// Only fires while permission is granted AND the tab genuinely isn't the
// thing the user is looking at right now — avoids a redundant OS popup on
// top of the in-app toast that already covers the focused-tab case.
export function sendBrowserNotification(title: string, options?: NotificationOptions & { onClick?: () => void }) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (document.hasFocus()) return
  try {
    const n = new Notification(title, { icon: '/favicon.svg', ...options })
    if (options?.onClick) {
      n.onclick = () => { window.focus(); options.onClick!(); n.close() }
    }
  } catch {
    // Some mobile browsers (esp. iOS Safari, even installed as PWA) don't
    // support the Notification constructor at all — fail silently rather
    // than break the calling feature (chat/task alerts still show in-app).
  }
}
