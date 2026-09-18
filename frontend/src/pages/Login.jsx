import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/formatPrice';
import { ROLES } from '../utils/constants';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user?.name?.split(' ')[0] || 'there'}!`);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else if (user?.role === ROLES.RESTAURANT_ADMIN || user?.role === ROLES.ADMIN) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to continue ordering</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Input
          label="Email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          placeholder="you@fooddash.app"
        />
        <Input
          label="Password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
          placeholder="••••••••"
        />
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
