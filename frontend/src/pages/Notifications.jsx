import { Bell } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../utils/formatPrice';

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    fetchNotifications,
  } = useNotifications();

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <PageCloseButton fallbackTo="/" label="Close notifications" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">
              {unreadCount} unread · order updates and promos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchNotifications}>
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
          <PageCloseButton fallbackTo="/" label="Close notifications" />
        </div>
      </div>

      {loading && !notifications.length ? (
        <Spinner />
      ) : !notifications.length ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Updates about your orders will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card w-full p-4 text-left transition hover:shadow-md ${
                  !n.isRead ? 'border-brand-200 bg-brand-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatRelativeTime(n.createdAt)} · {n.type}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
