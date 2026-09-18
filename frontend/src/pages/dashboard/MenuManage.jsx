import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { dashboardService } from '../../services/dashboardService';
import { formatPrice, getErrorMessage } from '../../utils/formatPrice';

const emptyItem = {
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  isVegetarian: false,
  isAvailable: true,
  isPopular: false,
  addOnsText: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
};

export default function MenuManage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState('');
  const [itemModal, setItemModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [cats, menu] = await Promise.all([
        dashboardService.listCategories(),
        dashboardService.listMenuItems(),
      ]);
      setCategories(Array.isArray(cats) ? cats : cats?.categories || []);
      setItems(Array.isArray(menu) ? menu : menu?.items || menu?.foodItems || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await dashboardService.createCategory({ name: catName.trim() });
      setCatName('');
      toast.success('Category added');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await dashboardService.deleteCategory(id);
      toast.success('Category deleted');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyItem, category: categories[0]?._id || '' });
    setItemModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      category: item.category?._id || item.category || '',
      image: item.image || '',
      isVegetarian: Boolean(item.isVegetarian),
      isAvailable: item.isAvailable !== false,
      isPopular: Boolean(item.isPopular),
      addOnsText: (item.addOns || [])
        .map((a) => `${a.name}:${a.price}`)
        .join(', '),
      calories: item.nutritionalInfo?.calories ?? '',
      protein: item.nutritionalInfo?.protein ?? '',
      carbs: item.nutritionalInfo?.carbs ?? '',
      fat: item.nutritionalInfo?.fat ?? '',
    });
    setItemModal(true);
  };

  const parseAddOns = (text) =>
    text
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const [name, price] = chunk.split(':');
        return { name: name?.trim(), price: Number(price) || 0 };
      })
      .filter((a) => a.name);

  const saveItem = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        image: form.image,
        isVegetarian: form.isVegetarian,
        isAvailable: form.isAvailable,
        isPopular: form.isPopular,
        addOns: parseAddOns(form.addOnsText),
        nutritionalInfo: {
          calories: form.calories === '' ? undefined : Number(form.calories),
          protein: form.protein === '' ? undefined : Number(form.protein),
          carbs: form.carbs === '' ? undefined : Number(form.carbs),
          fat: form.fat === '' ? undefined : Number(form.fat),
        },
      };
      if (editing) {
        await dashboardService.updateMenuItem(editing._id, payload);
        toast.success('Item updated');
      } else {
        await dashboardService.createMenuItem(payload);
        toast.success('Item created');
      }
      setItemModal(false);
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await dashboardService.deleteMenuItem(id);
      toast.success('Item deleted');
      load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Menu</h2>
          <p className="text-sm text-slate-500">Categories and food items</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      <section className="card p-5">
        <h3 className="mb-3 font-semibold text-slate-900">Categories</h3>
        <form onSubmit={addCategory} className="mb-4 flex gap-2">
          <input
            className="input-field"
            placeholder="New category name"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat._id}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm"
            >
              {cat.name}
              <button type="button" onClick={() => deleteCategory(cat._id)}>
                <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-rose-600" />
              </button>
            </span>
          ))}
          {!categories.length && (
            <p className="text-sm text-slate-500">No categories yet.</p>
          )}
        </div>
      </section>

      {!items.length ? (
        <EmptyState title="No menu items" description="Create your first dish." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.category?.name || 'Uncategorized'}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatPrice(item.price)}</td>
                    <td className="px-4 py-3">
                      {item.isAvailable ? (
                        <span className="text-emerald-600">Available</span>
                      ) : (
                        <span className="text-rose-600">Unavailable</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item._id)}
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={itemModal}
        onClose={() => setItemModal(false)}
        title={editing ? 'Edit menu item' : 'New menu item'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setItemModal(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={saveItem}>
              Save
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <Input
            label="Price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Image URL"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input
              label="Calories"
              type="number"
              value={form.calories}
              onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
            />
            <Input
              label="Protein (g)"
              type="number"
              value={form.protein}
              onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={form.carbs}
              onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={form.fat}
              onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
            />
          </div>
          <Input
            label="Add-ons (name:price, comma separated)"
            value={form.addOnsText}
            onChange={(e) => setForm((f) => ({ ...f, addOnsText: e.target.value }))}
            placeholder="Extra cheese:1.5, Bacon:2"
          />
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              ['isVegetarian', 'Vegetarian'],
              ['isAvailable', 'Available'],
              ['isPopular', 'Popular'],
            ].map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
