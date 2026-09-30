export const formatPrice = (value) => {
  const amount = Number(value) || 0;
  // Show Indian Rupees without relying on "$"
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};

export const getSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  try {
    const url = new URL(api);
    return url.origin;
  } catch {
    return 'http://localhost:5000';
  }
};

export const unwrap = (payload) => {
  if (payload == null) return payload;
  if (Object.prototype.hasOwnProperty.call(payload, 'data')) return payload.data;
  return payload;
};

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};
