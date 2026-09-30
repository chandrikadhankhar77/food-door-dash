import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../utils/formatPrice';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success('Settings saved');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Passwords do not match');
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Account preferences for restaurant admins</p>
      </div>

      <form onSubmit={saveProfile} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-semibold text-slate-900">Admin profile</h3>
        <Input
          label="Name"
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
        />
        <Input label="Email" value={user?.email || ''} disabled />
        <Input
          label="Phone"
          value={profile.phone}
          onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
        />
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="card grid gap-4 p-5 sm:grid-cols-3">
        <h3 className="sm:col-span-3 font-semibold text-slate-900">Security</h3>
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
          label="Confirm password"
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

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900">Session</h3>
        <p className="mt-1 text-sm text-slate-500">Sign out of the admin dashboard on this device.</p>
        <Button variant="danger" className="mt-4" onClick={logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
