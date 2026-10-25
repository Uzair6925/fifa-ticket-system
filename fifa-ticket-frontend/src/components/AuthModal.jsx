import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Globe2, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    region: 'europe',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password rules validation logic
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

  const handleQuickDemo = (type) => {
    if (type === 'admin') {
      setFormData((prev) => ({
        ...prev,
        email: 'admin@fifa.com',
        password: 'Admin@Fifa2026!',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        email: 'messi@fifa.com',
        password: 'Champion2026!',
      }));
    }
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'register') {
        const res = await api.register(formData);
        if (!res.success) {
          setErrorMsg(res.message || 'Registration failed. Please check the fields.');
          setLoading(false);
          return;
        }

        // Store JWT
        localStorage.setItem('fifa_token', res.token);
        localStorage.setItem('fifa_user', JSON.stringify(res.user));
        setSuccessMsg(`Welcome to FIFA 2026! Registered in ${res.user.home_region?.toUpperCase()} shard.`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 900);
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
        setSuccessMsg(`Login successful! Connected to ${res.user.home_region?.toUpperCase()} shard.`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 900);
      }
    } catch (err) {
      setErrorMsg('Network error connecting to backend API. Please make sure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg glass-panel-gold p-6 sm:p-8 shadow-2xl border border-white/10 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient backdrops */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            FIFA Ticketing Authentication
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            {mode === 'login' ? 'Sign In to Your Account' : 'Create FIFA Fan Account'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'login'
              ? 'Access world cup tickets and real-time seat reservation'
              : 'Registered directly into your preferred Regional Database Shard'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
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
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Register (New Fan)
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name (Register Only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Lionel Messi"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              {mode === 'register' && (
                <span className="text-[11px] text-amber-400 font-medium">
                  {strengthLabels[Math.min(score, 4)]}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Registration Password Checklist & Strength Meter */}
            {mode === 'register' && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                {/* Strength Bar */}
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

                {/* Validation Requirements Checklist */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400 pt-1">
                  <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${checks.length ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.hasDigit ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${checks.hasDigit ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>1+ number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.hasUpper ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${checks.hasUpper ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>1+ uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.hasLower ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${checks.hasLower ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>1+ lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${checks.hasSpecial ? 'text-emerald-400' : ''}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${checks.hasSpecial ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>1+ special symbol (!@#$%^&*)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regional Shard Selector (Register Only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Assign Home Database Shard</span>
                <span className="text-[10px] text-amber-400 font-mono">DDB Partition</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'europe', label: '🇪🇺 Europe', desc: 'fifa_europe' },
                  { id: 'asia', label: '🇦ジア Asia', desc: 'fifa_asia' },
                  { id: 'north_america', label: '🇺🇸 North America', desc: 'fifa_north_am' },
                  { id: 'south_america', label: '🇧🇷 South America', desc: 'fifa_south_am' },
                ].map((shard) => (
                  <button
                    key={shard.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, region: shard.id }))}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.region === shard.id
                        ? 'bg-amber-500/15 border-amber-400/60 text-white shadow-sm shadow-amber-500/20'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-bold text-white leading-tight">{shard.label}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{shard.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center !py-3 text-xs tracking-wider uppercase mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Connecting Shard...
              </span>
            ) : mode === 'login' ? (
              'Sign In to FIFA'
            ) : (
              'Register in Regional Shard'
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Footer (Sign In Mode) */}
        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-400 mb-2 font-medium">⚡ Quick Demo One-Click Fill:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-amber-400 font-medium transition-colors"
              >
                👑 Admin Account
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('fan')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-emerald-400 font-medium transition-colors"
              >
                ⚽ Fan Account (Messi)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
