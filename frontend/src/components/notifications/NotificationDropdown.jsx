import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/formatPrice';

export default function NotificationDropdown() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications overlay"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  title="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  You&apos;re all caught up
                </p>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => {
                      if (!n.isRead) markRead(n._id);
                      setOpen(false);
                    }}
                    className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${
                      !n.isRead ? 'bg-brand-50/40' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
