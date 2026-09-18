import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/formatPrice';
import { getDishImage, PLACEHOLDER_FOOD } from '../../utils/constants';

export default function CustomizeModal({ open, item, restaurant, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setSelectedAddOns([]);
      setInstructions('');
    }
  }, [open, item?._id]);

  const addOnTotal = useMemo(
    () => selectedAddOns.reduce((sum, a) => sum + Number(a.price || 0), 0),
    [selectedAddOns]
  );

  const unit = Number(item?.price || 0) + addOnTotal;
  const total = unit * quantity;

  const toggleAddOn = (addOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((a) => a.name === addOn.name && a.price === addOn.price);
      if (exists) return prev.filter((a) => !(a.name === addOn.name && a.price === addOn.price));
      return [...prev, { name: addOn.name, price: addOn.price }];
    });
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm?.({
        foodItem: item,
        restaurant,
        quantity,
        addOns: selectedAddOns,
        specialInstructions: instructions.trim(),
      });
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize item"
      size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button loading={submitting} onClick={handleConfirm} className="flex-1">
            Add · {formatPrice(total)}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-4">
          <img
            src={getDishImage(item.name, item.image)}
            alt={item.name}
            className="h-24 w-24 rounded-xl bg-slate-100 object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PLACEHOLDER_FOOD;
            }}
          />
          <div>
            <h4 className="font-semibold text-slate-900">{item.name}</h4>
            <p className="mt-1 text-sm text-slate-500 line-clamp-3">{item.description}</p>
            <p className="mt-2 font-semibold text-brand-700">{formatPrice(item.price)}</p>
          </div>
        </div>

        {item.nutritionalInfo && (
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center">
            {[
              ['Cal', item.nutritionalInfo.calories],
              ['Protein', item.nutritionalInfo.protein, 'g'],
              ['Carbs', item.nutritionalInfo.carbs, 'g'],
              ['Fat', item.nutritionalInfo.fat, 'g'],
            ].map(([label, value, unit = '']) => (
              <div key={label}>
                <p className="text-sm font-semibold text-slate-900">
                  {value != null ? `${value}${unit}` : '—'}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {(item.addOns || []).length > 0 && (
          <div>
            <h5 className="mb-2 text-sm font-semibold text-slate-800">Add-ons</h5>
            <div className="space-y-2">
              {item.addOns.map((addOn, idx) => {
                const checked = selectedAddOns.some(
                  (a) => a.name === addOn.name && a.price === addOn.price
                );
                return (
                  <label
                    key={addOn._id || idx}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                      checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddOn(addOn)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      {addOn.name}
                    </span>
                    <span className="font-medium text-slate-700">+{formatPrice(addOn.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-800">
            Special instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="No onions, extra spicy, allergy notes..."
            className="input-field resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
