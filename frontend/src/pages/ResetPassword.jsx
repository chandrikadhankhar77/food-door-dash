import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/formatPrice';
import { isStaffRole } from '../utils/constants';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const tokenFromQuery = params.get('token') || '';

  const [form, setForm] = useState({
    token: tokenFromQuery,
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.token.trim()) {
      toast.error('Reset token is required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await resetPassword({
        token: form.token.trim(),
        password: form.password,
      });
      toast.success('Password updated — you are signed in');
      navigate(isStaffRole(user?.role) ? '/dashboard' : '/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not reset password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {!tokenFromQuery && (
          <Input
            label="Reset token"
            name="token"
            required
            value={form.token}
            onChange={onChange}
            placeholder="Paste the token from your reset email"
          />
        )}
        <Input
          label="New password"
          type="password"
          name="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          placeholder="At least 6 characters"
        />
        <Input
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={onChange}
        />
        <Button type="submit" loading={loading} className="w-full">
          Update password
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
