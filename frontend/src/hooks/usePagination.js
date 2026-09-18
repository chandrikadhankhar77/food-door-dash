import { useMemo, useState } from 'react';

export default function usePagination({ initialPage = 1, initialLimit = 12 } = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit) || 1),
    [total, limit]
  );

  return {
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
