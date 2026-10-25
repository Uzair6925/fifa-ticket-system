import React, { useState, useEffect } from 'react';
import {
  User,
  CreditCard,
  Shield,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  MapPin,
} from 'lucide-react';
import { api } from '../services/api';

const formatRegionName = (region) => {
  if (!region) return 'Europe';
  return region.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function AccountSettings({ user, onUserUpdated }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    passport_number: user?.passport_number || '',
  });

  const [billingAddress, setBillingAddress] = useState({
    street: user?.billing_address?.street || '',
    city: user?.billing_address?.city || '',
    postal_code: user?.billing_address?.postal_code || '',
    country: user?.billing_address?.country || '',
  });

  const [paymentMethods, setPaymentMethods] = useState(
    user?.payment_methods && user.payment_methods.length > 0
      ? user.payment_methods
      : [
          {
            id: 'pm-default',
            type: 'Visa Credit Card',
            cardholder: user?.full_name || 'Cardholder',
            last4: '4242',
            expiry: '08/28',
            bank_name: 'Global Settlement Bank',
            iban: 'GB29 NWBK **** **** 4242',
            is_default: true,
          },
        ]
  );

  const [newCardOpen, setNewCardOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    type: 'Visa Credit Card',
    cardholder: user?.full_name || '',
    card_number: '',
    expiry: '',
    bank_name: '',
    iban: '',
  });

  const [preferences, setPreferences] = useState({
    email_notifications: user?.preferences?.email_notifications ?? true,
    sms_alerts: user?.preferences?.sms_alerts ?? true,
    two_factor_auth: user?.preferences?.two_factor_auth ?? false,
    currency: user?.preferences?.currency || 'USD',
    seat_preference: user?.preferences?.seat_preference || 'Category 1 - Premium',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) return;
    setProfileData({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      nationality: user.nationality || '',
      passport_number: user.passport_number || '',
    });
    if (user.billing_address) {
      setBillingAddress({
        street: user.billing_address.street || '',
        city: user.billing_address.city || '',
        postal_code: user.billing_address.postal_code || '',
        country: user.billing_address.country || '',
      });
    }
    if (user.payment_methods && user.payment_methods.length > 0) {
      setPaymentMethods(user.payment_methods);
    }
    if (user.preferences) {
      setPreferences((prev) => ({ ...prev, ...user.preferences }));
    }
  }, [user]);

  const showMessage = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const saveAccountChanges = async (overridePayload = {}) => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        full_name: profileData.full_name,
        phone: profileData.phone,
        nationality: profileData.nationality,
        passport_number: profileData.passport_number,
        billing_address: billingAddress,
        payment_methods: paymentMethods,
        preferences,
        ...overridePayload,
      };

      const res = await api.updateProfile(payload);
      if (!res.success) {
        showMessage('error', res.message || 'Unable to update account settings.');
        return;
      }

      localStorage.setItem('fifa_user', JSON.stringify(res.user));
      onUserUpdated(res.user);
      showMessage('success', res.message || 'Account settings saved successfully.');
    } catch (err) {
      showMessage('error', 'Network error while saving account details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    const digitsOnly = newCard.card_number.replace(/\D/g, '');
    if (digitsOnly.length < 12) {
      showMessage('error', 'Please enter a valid 16-digit card number.');
      return;
    }

    const addedMethod = {
      id: `pm-${Date.now()}`,
      type: newCard.type,
      cardholder: newCard.cardholder || profileData.full_name,
      last4: digitsOnly.slice(-4),
      expiry: newCard.expiry || '12/28',
      bank_name: newCard.bank_name || 'International Banking Corp',
      iban: newCard.iban
        ? `${newCard.iban.slice(0, 8)} **** **** ${newCard.iban.slice(-4)}`
        : `INTL **** **** ${digitsOnly.slice(-4)}`,
      is_default: paymentMethods.length === 0,
    };

    const updatedMethods = [...paymentMethods, addedMethod];
    setPaymentMethods(updatedMethods);
    setNewCard({
      type: 'Visa Credit Card',
      cardholder: profileData.full_name,
      card_number: '',
      expiry: '',
      bank_name: '',
      iban: '',
    });
    setNewCardOpen(false);
    await saveAccountChanges({ payment_methods: updatedMethods });
  };

  const handleSetDefaultMethod = async (id) => {
    const updatedMethods = paymentMethods.map((pm) => ({
      ...pm,
      is_default: pm.id === id,
    }));
    setPaymentMethods(updatedMethods);
    await saveAccountChanges({ payment_methods: updatedMethods });
  };

  const handleRemoveMethod = async (id) => {
    const updatedMethods = paymentMethods.filter((pm) => pm.id !== id);
    if (updatedMethods.length > 0 && !updatedMethods.some((pm) => pm.is_default)) {
      updatedMethods[0].is_default = true;
    }
    setPaymentMethods(updatedMethods);
    await saveAccountChanges({ payment_methods: updatedMethods });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage('error', 'New password and confirmation do not match.');
      return;
    }
    if (passwords.newPassword.length < 8) {
      showMessage('error', 'New password must be at least 8 characters long.');
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      if (!res.success) {
        showMessage('error', res.message || 'Unable to update password.');
        return;
      }

      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Your account password has been updated.');
    } catch (err) {
      showMessage('error', 'Network error while updating password.');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Personal Profile', icon: User },
    { id: 'banking', label: 'Banking & Payment Methods', icon: CreditCard },
    { id: 'security', label: 'Password & Security', icon: Shield },
    { id: 'preferences', label: 'Ticketing Preferences', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400">
            Account Management
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-0.5">
            Profile, Banking & Settings
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage your personal identification, saved bank accounts, payment cards, and security settings.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 px-4 py-2.5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm uppercase">
            {profileData.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{profileData.full_name}</p>
            <p className="text-[11px] text-gray-400">
              Assigned Region: <span className="text-emerald-400 font-semibold">{formatRegionName(user?.home_region)}</span>
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-slide-up ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-1.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-left transition-all ${
                  active
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/[0.03] text-gray-300 hover:bg-white/[0.07] hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div>
                <h3 className="text-lg font-heading font-extrabold text-white">Personal Information & Billing Address</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your official attendee details used for stadium entry verification and ticket invoicing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Legal Name</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+1 555 234 5678"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nationality / Country</label>
                  <input
                    type="text"
                    value={profileData.nationality}
                    onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                    placeholder="e.g. United Kingdom"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Passport / National ID Number</label>
                  <input
                    type="text"
                    value={profileData.passport_number}
                    onChange={(e) => setProfileData({ ...profileData, passport_number: e.target.value })}
                    placeholder="For stadium Fan ID verification"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Assigned Regional Zone</label>
                  <input
                    type="text"
                    value={formatRegionName(user?.home_region)}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-emerald-400 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Billing Address
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                      placeholder="Street name, building, apartment"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">City</label>
                    <input
                      type="text"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Postal / ZIP Code</label>
                    <input
                      type="text"
                      value={billingAddress.postal_code}
                      onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
                      placeholder="Postal Code"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  disabled={saving}
                  onClick={() => saveAccountChanges()}
                  className="btn-primary text-xs !py-3 !px-6"
                >
                  {saving ? 'Saving Changes...' : 'Save Profile & Address'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'banking' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-heading font-extrabold text-white">Saved Bank Accounts & Payment Cards</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Manage your settlement bank details and payment cards for instant match ticket checkout.
                  </p>
                </div>

                <button
                  onClick={() => setNewCardOpen(!newCardOpen)}
                  className="btn-primary text-xs !py-2.5 !px-4 self-start"
                >
                  <Plus className="w-4 h-4" />
                  Add Bank / Card
                </button>
              </div>

              {newCardOpen && (
                <form
                  onSubmit={handleAddPaymentMethod}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-amber-500/30 space-y-4 animate-slide-up"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    New Payment Method & Bank Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Card / Account Type</label>
                      <select
                        value={newCard.type}
                        onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                        className="w-full px-3.5 py-2 bg-[#0d1424] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Visa Credit Card">Visa Credit Card</option>
                        <option value="MasterCard World">MasterCard World</option>
                        <option value="Direct Bank Wire (IBAN)">Direct Bank Wire (IBAN)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Account / Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={newCard.cardholder}
                        onChange={(e) => setNewCard({ ...newCard, cardholder: e.target.value })}
                        placeholder="Full name on account"
                        className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={newCard.card_number}
                        onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value })}
                        placeholder="4532 •••• •••• 8890"
                        className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Expiration Date (MM/YY)</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={newCard.expiry}
                        onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                        placeholder="08/29"
                        className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Issuing Bank Name</label>
                      <input
                        type="text"
                        required
                        value={newCard.bank_name}
                        onChange={(e) => setNewCard({ ...newCard, bank_name: e.target.value })}
                        placeholder="e.g. HSBC / Citibank / HBL"
                        className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">IBAN / Account Number (Optional)</label>
                      <input
                        type="text"
                        value={newCard.iban}
                        onChange={(e) => setNewCard({ ...newCard, iban: e.target.value })}
                        placeholder="e.g. PK36 HABB 0000 1111 2222"
                        className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewCardOpen(false)}
                      className="btn-secondary text-xs !py-2 !px-4"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-emerald text-xs !py-2 !px-5">
                      Save Banking Method
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      pm.is_default
                        ? 'bg-gradient-to-r from-amber-500/10 to-emerald-500/5 border-amber-400/40'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">
                            {pm.type} •••• {pm.last4}
                          </span>
                          {pm.is_default && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                              Primary Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-300">
                          Bank: <span className="font-semibold text-white">{pm.bank_name || 'Verified Financial Institution'}</span> | Holder: {pm.cardholder}
                        </p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          IBAN / Acct: {pm.iban || `•••• •••• ${pm.last4}`} • Expires: {pm.expiry}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!pm.is_default && (
                        <button
                          onClick={() => handleSetDefaultMethod(pm.id)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 font-semibold transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                      {paymentMethods.length > 1 && (
                        <button
                          onClick={() => handleRemoveMethod(pm.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title="Remove Method"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div>
                <h3 className="text-lg font-heading font-extrabold text-white">Password & Account Security</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update your account password and configure security verification options.
                </p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs !py-3 !px-6"
                >
                  {saving ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div>
                <h3 className="text-lg font-heading font-extrabold text-white">Notification & Seating Preferences</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Customize your default seating tier, display currency, and match alert notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Preferred Seating Category</label>
                  <select
                    value={preferences.seat_preference}
                    onChange={(e) => setPreferences({ ...preferences, seat_preference: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0d1424] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="VIP Hospitality">VIP Hospitality ($550)</option>
                    <option value="Category 1 - Premium">Category 1 - Premium ($320)</option>
                    <option value="Category 2 - Standard">Category 2 - Standard ($150)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Display Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0d1424] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="QAR">QAR - Qatari Riyal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    key: 'email_notifications',
                    title: 'Email Confirmation & Digital Ticket Delivery',
                    desc: 'Receive instant booking confirmations and downloadable passes via email.',
                  },
                  {
                    key: 'sms_alerts',
                    title: 'SMS Match-Day & Gate Entry Alerts',
                    desc: 'Receive stadium gate opening times and seat updates on your mobile phone.',
                  },
                  {
                    key: 'two_factor_auth',
                    title: 'Enhanced Account Verification',
                    desc: 'Require additional verification when purchasing high-value hospitality tickets.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10 cursor-pointer hover:border-white/20 transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(preferences[item.key])}
                      onChange={(e) =>
                        setPreferences({ ...preferences, [item.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  disabled={saving}
                  onClick={() => saveAccountChanges()}
                  className="btn-primary text-xs !py-3 !px-6"
                >
                  {saving ? 'Saving Preferences...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
