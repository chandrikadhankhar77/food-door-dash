import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { CreditCard, Trash2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PageCloseButton from '../components/ui/PageCloseButton';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/formatPrice';

export default function Profile() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [address, setAddress] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await authService.changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      toast.success('Password updated');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    try {
      await authService.addAddress(address);
      await refreshUser();
      toast.success('Address added');
      setAddress({
        label: 'Home',
        street: '',
        city: '',
        state: '',
        zip: '',
        isDefault: false,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeAddress = async (id) => {
    try {
      await authService.deleteAddress(id);
      await refreshUser();
      toast.success('Address removed');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="container-app space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-500">Manage your account and delivery addresses</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/payments" className="btn-secondary inline-flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payments & receipts
          </Link>
          <PageCloseButton fallbackTo="/" label="Close profile" />
        </div>
      </div>

      <form onSubmit={saveProfile} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-lg font-semibold text-slate-900">Personal info</h2>
        <Input
          label="Name"
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <Input label="Email" type="email" value={profile.email} disabled />
        <Input
          label="Phone"
          value={profile.phone}
          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
        />
        <Input
          label="Avatar URL"
          value={profile.avatar}
          onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
          placeholder="https://..."
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="card grid gap-4 p-5 sm:grid-cols-3">
        <h2 className="sm:col-span-3 text-lg font-semibold text-slate-900">Change password</h2>
        <Input
          label="Current password"
          type="password"
          value={password.currentPassword}
          onChange={(e) =>
            setPassword((p) => ({ ...p, currentPassword: e.target.value }))
          }
          required
        />
        <Input
          label="New password"
          type="password"
          value={password.newPassword}
          onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={password.confirmPassword}
          onChange={(e) =>
            setPassword((p) => ({ ...p, confirmPassword: e.target.value }))
          }
          required
        />
        <div className="sm:col-span-3">
          <Button type="submit" variant="secondary">
            Update password
          </Button>
        </div>
      </form>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Addresses</h2>
        <ul className="space-y-3">
          {(user?.addresses || []).map((addr) => (
            <li
              key={addr._id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {addr.label}{' '}
                  {addr.isDefault && (
                    <span className="text-xs font-semibold text-brand-600">Default</span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {addr.street}, {addr.city}, {addr.state} {addr.zip}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAddress(addr._id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {!user?.addresses?.length && (
            <p className="text-sm text-slate-500">No addresses saved yet.</p>
          )}
        </ul>

        <form onSubmit={addAddress} className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-sm font-semibold text-slate-800">Add address</h3>
          <Input
            label="Label"
            value={address.label}
            onChange={(e) => setAddress((a) => ({ ...a, label: e.target.value }))}
          />
          <Input
            label="Street"
            required
            value={address.street}
            onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
          />
          <Input
            label="City"
            required
            value={address.city}
            onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
          />
          <Input
            label="State"
            required
            value={address.state}
            onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
          />
          <Input
            label="ZIP"
            required
            value={address.zip}
            onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={address.isDefault}
              onChange={(e) =>
                setAddress((a) => ({ ...a, isDefault: e.target.checked }))
              }
            />
            Set as default
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Add address</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
