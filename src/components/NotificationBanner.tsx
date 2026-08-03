import React, { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { notificationsSupported, notifyPermission, requestNotifyPermission, bannerDismissed, dismissBanner } from '@/lib/browserNotify'

// Shown once near the top of the app until the user either enables
// notifications or dismisses it — matches the "Turn on notifications…"
// pattern from other web apps. Only offers foreground/background-tab OS
// notifications (new chat messages, task assignments, due-date reminders)
// — not full closed-browser push, which needs separate server infrastructure.
export const NotificationBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(bannerDismissed())
  const [permission, setPermission] = useState(notifyPermission())

  if (!notificationsSupported() || permission !== 'default' || dismissed) return null

  const enable = async () => {
    const result = await requestNotifyPermission()
    setPermission(result)
    if (result !== 'default') { dismissBanner(); setDismissed(true) }
  }
  const dismiss = () => { dismissBanner(); setDismissed(true) }

  return (
    <div className="flex items-center gap-3 bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 text-sm no-print">
      <Bell size={16} className="text-indigo-500 shrink-0" />
      <p className="flex-1 text-indigo-900">
        Turn on notifications to get alerted for new chat messages and tasks, even when this tab isn't focused.
      </p>
      <button onClick={enable} className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">
        Enable
      </button>
      <button onClick={dismiss} className="shrink-0 text-indigo-400 hover:text-indigo-600" title="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}
