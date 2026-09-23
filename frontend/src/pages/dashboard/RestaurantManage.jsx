import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { CUISINES, PRICE_RANGES } from '../../utils/constants';
import { getErrorMessage } from '../../utils/formatPrice';

const emptyForm = {
  name: '',
  description: '',
  cuisine: [],
  location: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  openingHours: '09:00',
  closingHours: '22:00',
  image: '',
  priceRange: '$$',
  phone: '',
  email: '',
  deliveryFee: 2.99,
  isActive: true,
};

export default function RestaurantManage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [restaurantId, setRestaurantId] = useState('');

  useEffect(() => {
    dashboardService
      .getRestaurant()
      .then((data) => {
        const r = data?.restaurant || data;
        if (!r?._id && !r?.id) {
          setHasRestaurant(false);
          setRestaurantId('');
          return;
        }
        setHasRestaurant(true);
        setRestaurantId(String(r._id || r.id));
        setForm({
          name: r.name || '',
          description: r.description || '',
          cuisine: r.cuisine || [],
          location: r.location || '',
          street: r.address?.street || '',
          city: r.address?.city || '',
          state: r.address?.state || '',
          zip: r.address?.zip || '',
          openingHours: r.openingHours || '09:00',
          closingHours: r.closingHours || '22:00',
          image: r.image || '',
          priceRange: r.priceRange || '$$',
          phone: r.contact?.phone || '',
          email: r.contact?.email || '',
          deliveryFee: r.deliveryFee ?? 2.99,
          isActive: r.isActive !== false,
        });
      })
      .catch(() => setHasRestaurant(false))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCuisine = (c) => {
    setForm((f) => ({
      ...f,
      cuisine: f.cuisine.includes(c)
        ? f.cuisine.filter((x) => x !== c)
        : [...f.cuisine, c],
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        cuisine: form.cuisine,
        location: form.location,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
        },
        openingHours: form.openingHours,
        closingHours: form.closingHours,
        image: form.image,
        priceRange: form.priceRange,
        contact: { phone: form.phone, email: form.email },
        deliveryFee: Number(form.deliveryFee),
        isActive: form.isActive,
      };
      if (hasRestaurant) {
        const saved = await dashboardService.updateRestaurant(payload);
        const id = String(saved?._id || saved?.id || restaurantId || '');
        if (id) setRestaurantId(id);
        await refreshUser();
        toast.success('Restaurant profile saved');
      } else {
        const created = await dashboardService.createRestaurant(payload);
        const id = String(created?._id || created?.id || '');
        setHasRestaurant(true);
        if (id) setRestaurantId(id);
        // Critical: link restaurant onto the auth user so View storefront / RBAC work
        await refreshUser();
        toast.success('Restaurant created — you can preview your storefront now');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {hasRestaurant ? 'Restaurant profile' : 'Create your restaurant'}
          </h2>
          <p className="text-sm text-slate-500">
            {hasRestaurant
              ? 'Public details shown to customers'
              : 'New partner accounts must create a restaurant before View storefront works'}
          </p>
        </div>
        {hasRestaurant && restaurantId && (
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1.5 text-sm"
            onClick={() => navigate(`/restaurants/${restaurantId}`)}
          >
            <ExternalLink className="h-4 w-4" />
            View storefront
          </button>
        )}
      </div>
      {!hasRestaurant && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You signed up as a restaurant partner. Save this profile first — then{' '}
          <span className="font-semibold">View storefront</span> will open your public page at{' '}
          <code className="rounded bg-white/70 px-1">/restaurants/&lt;id&gt;</code>.
        </div>
      )}

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <Input label="Name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
        <Input
          label="Location / area"
          required
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
        />
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <Input label="Street" required value={form.street} onChange={(e) => set('street', e.target.value)} />
        <Input label="City" required value={form.city} onChange={(e) => set('city', e.target.value)} />
        <Input label="State" required value={form.state} onChange={(e) => set('state', e.target.value)} />
        <Input label="ZIP" required value={form.zip} onChange={(e) => set('zip', e.target.value)} />
        <Input label="Opens" type="time" value={form.openingHours} onChange={(e) => set('openingHours', e.target.value)} />
        <Input label="Closes" type="time" value={form.closingHours} onChange={(e) => set('closingHours', e.target.value)} />
        <Input label="Image URL" value={form.image} onChange={(e) => set('image', e.target.value)} />
        <Input
          label="Delivery fee"
          type="number"
          step="0.01"
          min="0"
          value={form.deliveryFee}
          onChange={(e) => set('deliveryFee', e.target.value)}
        />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Price range</label>
          <select
            className="input-field"
            value={form.priceRange}
            onChange={(e) => set('priceRange', e.target.value)}
          >
            {PRICE_RANGES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 self-end pb-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          Restaurant is active / accepting orders
        </label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-slate-700">Cuisines</p>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  form.cuisine.includes(c)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" loading={saving}>
        {hasRestaurant ? 'Save restaurant' : 'Create restaurant'}
      </Button>
    </form>
  );
}
