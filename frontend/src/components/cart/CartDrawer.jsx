import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

export default function CartDrawer() {
  const {
    cart,
    drawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
  } = useCart();

  if (!drawerOpen) return null;

  const restaurantName =
    cart.restaurant?.name || (typeof cart.restaurant === 'object' ? '' : '');

  return (
    <div className="fixed inset-0 z-[75]">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close cart"
        onClick={() => setDrawerOpen(false)}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your cart</h2>
            <p className="text-xs text-slate-500">
              {itemCount} item{itemCount === 1 ? '' : 's'}
              {restaurantName ? ` · ${restaurantName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!cart.items?.length ? (
            <EmptyState
              icon={ShoppingBag}
              title="Cart is empty"
              description="Browse restaurants and add something delicious."
              actionLabel="Find food"
              onAction={() => {
                setDrawerOpen(false);
              }}
            />
          ) : (
            <ul className="space-y-3">
              {cart.items.map((item) => {
                const addOnTotal = (item.addOns || []).reduce(
                  (s, a) => s + Number(a.price || 0),
                  0
                );
                const line = (Number(item.price) + addOnTotal) * Number(item.quantity);
                return (
                  <li key={item._id} className="rounded-2xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        {(item.addOns || []).length > 0 && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.addOns.map((a) => a.name).join(', ')}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="mt-1 text-xs italic text-slate-400">
                            “{item.specialInstructions}”
                          </p>
                        )}
                        <p className="mt-2 text-sm font-semibold text-brand-700">
                          {formatPrice(line)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 p-1.5"
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 p-1.5"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.items?.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(cart.subtotal || 0)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={clearCart}>
                Clear
              </Button>
              <Link
                to="/cart"
                onClick={() => setDrawerOpen(false)}
                className="btn-secondary text-center"
              >
                View cart
              </Link>
            </div>
            <Link
              to="/checkout"
              onClick={() => setDrawerOpen(false)}
              className="btn-primary w-full"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
