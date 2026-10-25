import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Phone, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const INITIAL_FORM_STATE = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  region: 'europe',
};

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [demoRoleHint, setDemoRoleHint] = useState('fan');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setErrorMsg('');
      setSuccessMsg('');
      setShowPassword(false);
      setMode('login');
      setDemoRoleHint('fan');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const switchMode = (newMode) => {
    setMode(newMode);
    setFormData(INITIAL_FORM_STATE);
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const password = formData.password;
  const checks = {
    length: password.length >= 8 && password.length <= 64,
    hasDigit: /[0-9]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[@$!%*?&#^()_\-+={}[\]:;"'<>,./~`|\\]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSelectDemoHint = (type) => {
    setDemoRoleHint(type);
    setFormData(INITIAL_FORM_STATE);
    setErrorMsg('');
  };

  const getEmailPlaceholder = () => {
    if (mode === 'register') {
      return 'e.g. alex.morgan@gmail.com';
    }
    return demoRoleHint === 'admin' ? 'Hint: admin@fifa.com' : 'Hint: messi@fifa.com';
  };

  const getPasswordPlaceholder = () => {
    if (mode === 'register') {
      return 'e.g. WorldCup@2026';
    }
    return demoRoleHint === 'admin' ? 'Hint: Admin@Fifa2026!' : 'Hint: Champion2026!';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const emailParts = cleanEmail.split('@');
    if (emailParts.length !== 2) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const blockedDomains = ['xyz.com', 'xyzl.com', 'abc.com', 'test.com', 'example.com', 'fake.com', 'tempmail.com', 'mailinator.com'];
    if (blockedDomains.includes(emailParts[1])) {
      setErrorMsg(`"${emailParts[1]}" is not an accepted email domain. Please use a real email provider (e.g., gmail.com, outlook.com).`);
      return;
    }

    if (mode === 'register' && score < 5) {
      setErrorMsg('Please ensure your password meets all 5 security requirements before registering.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await api.register(formData);
        if (!res.success) {
          setErrorMsg(res.message || 'Registration failed. Please verify your details.');
          setLoading(false);
          return;
        }

        localStorage.setItem('fifa_token', res.token);
        localStorage.setItem('fifa_user', JSON.stringify(res.user));
        setFormData(INITIAL_FORM_STATE);
        setSuccessMsg('Account created successfully.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 600);
      } else {
        const res = await api.login({
          email: formData.email,
          password: formData.password,
        });

        if (!res.success) {
          setErrorMsg(res.message || 'Invalid email or password.');
          setLoading(false);
          return;
        }

        localStorage.setItem('fifa_token', res.token);
        localStorage.setItem('fifa_user', JSON.stringify(res.user));
        setFormData(INITIAL_FORM_STATE);
        setSuccessMsg('Signed in successfully.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 600);
      }
    } catch (err) {
      setErrorMsg('Unable to connect to the authentication service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass-panel-gold p-5 sm:p-7 shadow-2xl border border-white/10 my-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold mb-1.5">
            FIFA World Cup 2026 Portal
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
            {mode === 'login' ? 'Sign In to Your Account' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {mode === 'login'
              ? 'Access your match passes and manage seat reservations'
              : 'Register with a fresh profile to book official tournament tickets'}
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl mb-4 border border-white/5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  name="full_name"
                  autoComplete="off"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:placeholder-transparent focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="email"
                name="email"
                autoComplete="new-email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={getEmailPlaceholder()}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:placeholder-transparent focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  name="phone"
                  autoComplete="off"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 555 234 5678"
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:placeholder-transparent focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              {mode === 'register' && (
                <span className="text-[11px] text-amber-400 font-medium">
                  {strengthLabels[Math.min(score, 4)]}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={getPasswordPlaceholder()}
                className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:placeholder-transparent focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === 'register' && (
              <div className="mt-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex gap-1">
                  {[0, 1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all duration-300 ${
                        step < score ? strengthColors[Math.min(score - 1, 4)] : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400 pt-0.5">
                  <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3 h-3 ${checks.length ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.hasDigit ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3 h-3 ${checks.hasDigit ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>At least 1 number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.hasUpper ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3 h-3 ${checks.hasUpper ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.hasLower ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3 h-3 ${checks.hasLower ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${checks.hasSpecial ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3 h-3 ${checks.hasSpecial ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Primary Region
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'europe', label: 'Europe', desc: 'London / European Venues' },
                  { id: 'asia', label: 'Asia', desc: 'Lusail / Asian Venues' },
                  { id: 'north_america', label: 'North America', desc: 'New York / NA Venues' },
                  { id: 'south_america', label: 'South America', desc: 'Rio / SA Venues' },
                ].map((regionItem) => (
                  <button
                    key={regionItem.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, region: regionItem.id }))}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      formData.region === regionItem.id
                        ? 'bg-amber-500/15 border-amber-400/60 text-white shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-bold text-white leading-tight">{regionItem.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{regionItem.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center !py-3 text-xs tracking-wider uppercase font-extrabold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        {mode === 'login' && (
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-400 mb-2 font-medium">View Credential Hints:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemoHint('admin')}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  demoRoleHint === 'admin'
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
                }`}
              >
                Administrator Hint
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemoHint('fan')}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  demoRoleHint === 'fan'
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400'
                }`}
              >
                Standard Member Hint
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
