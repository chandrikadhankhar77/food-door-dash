import { Link } from 'react-router-dom';
import { Globe, Mail, MapPin, Phone, Share2 } from 'lucide-react';
import { APP_NAME, isStaffRole } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();
  const isStaff = isAuthenticated && isStaffRole(user?.role);
  const exploreLinks = isStaff
    ? [
        { to: '/dashboard', label: 'Partner dashboard' },
        { to: '/dashboard/orders', label: 'Incoming orders' },
        { to: '/dashboard/menu', label: 'Menu' },
        { to: '/dashboard/restaurant', label: 'Restaurant profile' },
      ]
    : [
        { to: '/restaurants', label: 'Restaurants' },
        { to: '/favorites', label: 'Favorites' },
        { to: '/orders', label: 'Your orders' },
        { to: '/payments', label: 'Payments' },
      ];

  return (
    <footer className="mt-auto relative overflow-hidden border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="container-app relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-lg shadow-brand-600/30">
              FD
            </span>
            <span className="text-lg font-bold text-white">{APP_NAME}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Crave it. Tap it. Get it delivered. Discover local favorites and track every bite in
            real time.
          </p>
          <div className="mt-5 space-y-2 text-sm text-slate-400">
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-400" /> Austin · Houston · Dallas
            </p>
            <p className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-400" /> +1 (512) 555-0199
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {exploreLinks.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex transition hover:translate-x-0.5 hover:text-brand-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href="#how-it-works" className="transition hover:text-brand-400">
                How it works
              </a>
            </li>
            <li>
              <Link to="/register" className="transition hover:text-brand-400">
                Partner with us
              </Link>
            </li>
            <li>
              <a href="mailto:hello@fooddash.app" className="transition hover:text-brand-400">
                Support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Connect</h4>
          <p className="mt-4 text-sm text-slate-400">Follow FoodDash for deals and new spots.</p>
          <div className="mt-4 flex gap-3">
            {[
              { Icon: Share2, href: '#' },
              { Icon: Globe, href: '#' },
              { Icon: Mail, href: 'mailto:hello@fooddash.app' },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-600 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-slate-800/80 py-5">
        <div className="container-app flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-slate-600">Fast delivery · Secure checkout · Live order tracking</p>
        </div>
      </div>
    </footer>
  );
}
