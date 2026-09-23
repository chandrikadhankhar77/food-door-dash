export default function CategoryTabs({ categories = [], active, onChange }) {
  const items = [{ _id: 'all', name: 'All' }, ...categories];

  return (
    <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((cat) => {
        const id = cat._id;
        const isActive = active === id || (!active && id === 'all');
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id === 'all' ? null : id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
