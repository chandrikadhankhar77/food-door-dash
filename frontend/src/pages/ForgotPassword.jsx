import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/formatPrice';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devReset, setDevReset] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDevReset(null);
    try {
      const data = await authService.forgotPassword({ email });
      setSubmitted(true);
      if (data?.resetUrl) {
        setDevReset(data);
      }
      toast.success('Check your email for reset instructions');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not start password reset'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Forgot password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your account email and we&apos;ll send a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Input
          label="Email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@fooddash.app"
        />
        <Button type="submit" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>

      {submitted && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          If an account exists for that email, password reset instructions have been sent.
        </div>
      )}

      {devReset?.resetUrl && (
        <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Local demo reset link</p>
          <p className="text-xs text-amber-800">
            No email provider is configured. Use this link (expires in{' '}
            {devReset.expiresInMinutes || 15} minutes):
          </p>
          <Link
            to={`/reset-password?token=${encodeURIComponent(devReset.resetToken)}`}
            className="block break-all font-medium text-brand-700 underline"
          >
            {devReset.resetUrl}
          </Link>
        </div>
      )}

      <p className="mt-4 text-center text-sm text-slate-600">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
