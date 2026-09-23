import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import PageCloseButton from '../components/ui/PageCloseButton';
import Spinner from '../components/ui/Spinner';
import { useCart } from '../context/CartContext';
import { DEFAULT_DELIVERY_FEE, TAX_RATE } from '../utils/constants';
import { formatPrice } from '../utils/formatPrice';

export default function Cart() {
  const { cart, loading, updateQuantity, removeItem, clearCart, itemCount } = useCart();

  if (loading) {
    return (
      <div className="container-app py-16">
        <Spinner />
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="container-app py-10">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add dishes from a restaurant to get started."
          actionLabel="Browse restaurants"
          onAction={() => {
            window.location.href = '/restaurants';
          }}
        />
      </div>
    );
  }

  const subtotal = cart.subtotal || 0;
  const deliveryFee =
    cart.restaurant?.deliveryFee ?? DEFAULT_DELIVERY_FEE;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + Number(deliveryFee) + tax) * 100) / 100;
  const restaurantName = cart.restaurant?.name || 'Selected restaurant';
  const restaurantId = cart.restaurant?._id || cart.restaurant;

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cart</h1>
          <p className="text-sm text-slate-500">
            {itemCount} items from{' '}
            {restaurantId ? (
              <Link to={`/restaurants/${restaurantId}`} className="font-medium text-brand-600">
                {restaurantName}
              </Link>
            ) : (
              restaurantName
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={clearCart}>
            Clear cart
          </Button>
          <PageCloseButton fallbackTo="/restaurants" label="Close cart" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {cart.items.map((item) => {
            const addOnTotal = (item.addOns || []).reduce(
              (s, a) => s + Number(a.price || 0),
              0
            );
            const line = (Number(item.price) + addOnTotal) * Number(item.quantity);
            return (
              <li key={item._id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  {(item.addOns || []).length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      {item.addOns.map((a) => `${a.name} (+${formatPrice(a.price)})`).join(', ')}
                    </p>
                  )}
                  {item.specialInstructions && (
                    <p className="mt-1 text-xs italic text-slate-400">
                      “{item.specialInstructions}”
                    </p>
                  )}
                  <p className="mt-2 font-semibold text-brand-700">{formatPrice(line)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-1">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 hover:bg-slate-100"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 hover:bg-slate-100"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item._id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card h-fit space-y-3 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Delivery</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-700">{formatPrice(total)}</span>
          </div>
          <Link to="/checkout" className="btn-primary w-full">
            Proceed to checkout
          </Link>
          <Link to="/restaurants" className="btn-secondary w-full text-center">
            Keep browsing
          </Link>
        </aside>
      </div>
    </div>
  );
}
