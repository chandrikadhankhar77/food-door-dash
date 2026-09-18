import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/formatPrice';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
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
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      toast.success('Account created!');
      // Use server role (not form value) so redirect matches actual permissions
      if (user?.role === 'restaurant_admin' || user?.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Join FoodDash in under a minute</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Input
          label="Full name"
          name="name"
          required
          value={form.name}
          onChange={onChange}
          placeholder="Alex Rivera"
        />
        <Input
          label="Email"
          type="email"
          name="email"
          required
          value={form.email}
          onChange={onChange}
          placeholder="you@fooddash.app"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="Optional"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">I am a</label>
            <select name="role" value={form.role} onChange={onChange} className="input-field">
              <option value="customer">Customer</option>
              <option value="restaurant_admin">Restaurant partner</option>
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            name="password"
            required
            value={form.password}
            onChange={onChange}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            required
            value={form.confirmPassword}
            onChange={onChange}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Sign up
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
