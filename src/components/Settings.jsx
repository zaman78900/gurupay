import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { I } from '../app';
import { fmtINR, getInitials } from '../utils';
import AuthModal from './AuthModal';

const Settings = ({ 
  profile, 
  setProfile, 
  features, 
  setFeatures, 
  theme, 
  setTheme, 
  toast, 
  user 
}) => {
  const [activeTab, setActiveTab] = useState('business');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('sign_in');

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  const updateFeature = async (key, value) => {
    const newFeatures = { ...features, [key]: value };
    setFeatures(newFeatures);
    try {
      localStorage.setItem('gp2_feat', JSON.stringify(newFeatures));
      toast(`${key === 'enableWaiveFee' ? 'Fee Waiver' : key === 'enableGST' ? 'GST' : key} ${value ? 'enabled' : 'disabled'}!`, { icon: "✅" });
    } catch (error) {
      toast("Failed to save settings", { icon: "❌" });
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      setProfile(profileForm);
      localStorage.setItem('gp2_pr', JSON.stringify(profileForm));
      setIsEditingProfile(false);
      toast("Profile saved successfully!", { icon: "✅" });
    } catch (error) {
      toast("Failed to save profile", { icon: "❌" });
    } finally {
      setLoading(false);
    }
  };

  const resetProfile = () => {
    setProfileForm(profile);
    setIsEditingProfile(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast("Signed out successfully", { icon: "👋" });
    } catch (error) {
      toast("Sign out failed", { icon: "❌" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      // Delete user data
      localStorage.removeItem('gp2_b');
      localStorage.removeItem('gp2_s');
      localStorage.removeItem('gp2_p');
      localStorage.removeItem('gp2_pr');
      localStorage.removeItem('gp2_th');
      localStorage.removeItem('gp2_feat');
      
      // Delete user from Supabase
      await supabase.auth.admin.deleteUser(user.id);
      
      toast("Account deleted successfully", { icon: "🗑️" });
      window.location.reload();
    } catch (error) {
      toast("Failed to delete account", { icon: "❌" });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      batches: JSON.parse(localStorage.getItem('gp2_b') || '[]'),
      students: JSON.parse(localStorage.getItem('gp2_s') || '[]'),
      payments: JSON.parse(localStorage.getItem('gp2_p') || '[]'),
      profile: JSON.parse(localStorage.getItem('gp2_pr') || '{}'),
      theme: localStorage.getItem('gp2_th') || 'light',
      features: JSON.parse(localStorage.getItem('gp2_feat') || '{}'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gurupay_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Data exported successfully", { icon: "📥" });
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data.batches || !data.students || !data.payments) {
          throw new Error("Invalid backup file format");
        }

        // Backup current data
        const backup = {
          batches: JSON.parse(localStorage.getItem('gp2_b') || '[]'),
          students: JSON.parse(localStorage.getItem('gp2_s') || '[]'),
          payments: JSON.parse(localStorage.getItem('gp2_p') || '[]'),
          profile: JSON.parse(localStorage.getItem('gp2_pr') || '{}'),
          theme: localStorage.getItem('gp2_th') || 'light',
          features: JSON.parse(localStorage.getItem('gp2_feat') || '{}'),
          backupDate: new Date().toISOString()
        };

        // Import new data
        localStorage.setItem('gp2_b', JSON.stringify(data.batches));
        localStorage.setItem('gp2_s', JSON.stringify(data.students));
        localStorage.setItem('gp2_p', JSON.stringify(data.payments));
        localStorage.setItem('gp2_pr', JSON.stringify(data.profile));
        localStorage.setItem('gp2_th', data.theme || 'light');
        localStorage.setItem('gp2_feat', JSON.stringify(data.features));

        // Create backup file
        const backupBlob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const backupUrl = URL.createObjectURL(backupBlob);
        const backupLink = document.createElement('a');
        backupLink.href = backupUrl;
        backupLink.download = `gurupay_backup_before_import_${new Date().toISOString().slice(0, 10)}.json`;
        backupLink.click();
        URL.revokeObjectURL(backupUrl);

        toast("Data imported successfully", { icon: "📤" });
        window.location.reload();
      } catch (error) {
        toast("Failed to import data: Invalid file format", { icon: "❌" });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (!window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      return;
    }
    
    try {
      localStorage.removeItem('gp2_b');
      localStorage.removeItem('gp2_s');
      localStorage.removeItem('gp2_p');
      localStorage.removeItem('gp2_pr');
      localStorage.removeItem('gp2_th');
      localStorage.removeItem('gp2_feat');
      
      toast("All data cleared", { icon: "🧹" });
      window.location.reload();
    } catch (error) {
      toast("Failed to clear data", { icon: "❌" });
    }
  };

  const tabs = [
    { id: 'business', label: '🏢 Business Profile', icon: '🏢' },
    { id: 'features', label: '⚙️ Feature Settings', icon: '⚙️' },
    { id: 'appearance', label: '🎨 Appearance', icon: '🎨' },
    { id: 'auth', label: '🔐 Authentication', icon: '🔐' },
    { id: 'data', label: '💾 Data Management', icon: '💾' },
    { id: 'about', label: 'ℹ️ About', icon: 'ℹ️' }
  ];

  return (
    <div className="settings">
      {/* Settings Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">⚙️ Settings</div>
            <div className="card-subtitle">Manage your GuruPay Pro account and preferences</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px' }}>
                {getInitials(user.email || profile.name)}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{user.email || profile.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text4)' }}>PRO Account</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Sidebar Navigation */}
        <div className="card" style={{ padding: '0', height: 'fit-content' }}>
          <div style={{ borderBottom: '1px solid var(--border)', padding: '16px', background: 'var(--bg3)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Settings Sections
            </div>
          </div>
          <div style={{ padding: '8px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ 
                  width: '100%', 
                  justifyContent: 'flex-start',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '4px'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ marginRight: '8px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="card">
          {activeTab === 'business' && (
            <div>
              <div className="card-header">
                <div>
                  <div className="card-title">🏢 Business Profile</div>
                  <div className="card-subtitle">Manage your coaching center information</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEditingProfile ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={resetProfile} disabled={loading}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsEditingProfile(true)}>
                      <I.Edit /> Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { key: 'name', label: 'Business Name', type: 'text', required: true },
                  { key: 'gstin', label: 'GSTIN (optional)', type: 'text' },
                  { key: 'address', label: 'Address', type: 'textarea' },
                  { key: 'phone', label: 'Phone Number', type: 'tel' },
                  { key: 'email', label: 'Email Address', type: 'email' },
                  { key: 'upiId', label: 'UPI ID', type: 'text' }
                ].map(field => (
                  <div key={field.key} className="input-group">
                    <label className="input-label">
                      {field.label} {field.required && <span style={{ color: 'var(--red)' }}>*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="input"
                        value={profileForm[field.key] || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })}
                        disabled={!isEditingProfile || loading}
                        placeholder={field.key === 'address' ? '123 Main Street, City, State - PIN' : ''}
                      />
                    ) : (
                      <input
                        className="input"
                        type={field.type}
                        value={profileForm[field.key] || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })}
                        disabled={!isEditingProfile || loading}
                        placeholder={field.key === 'phone' ? '+91 9876543210' : field.key === 'email' ? 'contact@business.com' : ''}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Profile Preview */}
              {isEditingProfile && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '8px' }}>Preview:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'var(--bg2)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' }}>
                      {getInitials(profileForm.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{profileForm.name || 'Your Business'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text4)' }}>{profileForm.address || 'Your address'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div>
              <div className="card-header">
                <div>
                  <div className="card-title">⚙️ Feature Settings</div>
                  <div className="card-subtitle">Control which features are available in your dashboard</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { key: 'showStudents', label: '👥 Student Management', desc: 'Enable student list and batch management' },
                  { key: 'showPayments', label: '💳 Fee Tracking', desc: 'Enable fee tracking and payment management' },
                  { key: 'showReports', label: '📊 Analytics & Reports', desc: 'Enable revenue reports and analytics' },
                  { key: 'enableNotifications', label: '🔔 Notifications', desc: 'Enable desktop and in-app notifications' },
                  { key: 'enableWaiveFee', label: '🔵 Fee Waiver', desc: 'Allow fee waivers for students' },
                  { key: 'enableGST', label: '💰 GST Calculation', desc: 'Enable GST calculation and reporting' },
                  { key: 'enableDarkMode', label: '🌙 Dark Mode', desc: 'Allow switching to dark theme' },
                  { key: 'enableBulkActions', label: '📦 Bulk Operations', desc: 'Enable bulk student and payment operations' }
                ].map(feature => (
                  <div key={feature.key} className="settings-item">
                    <div>
                      <div className="settings-item-label">{feature.label}</div>
                      <div className="settings-item-desc">{feature.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={features[feature.key] || false}
                      onChange={(e) => updateFeature(feature.key, e.target.checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <div className="card-header">
                <div>
                  <div className="card-title">🎨 Appearance</div>
                  <div className="card-subtitle">Customize your dashboard theme and display options</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="settings-item">
                  <div>
                    <div className="settings-item-label">Theme</div>
                    <div className="settings-item-desc">Switch between light and dark themes</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text4)' }}>Light</span>
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={theme === 'dark'}
                      onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text4)' }}>Dark</span>
                  </div>
                </div>

                <div className="settings-item">
                  <div>
                    <div className="settings-item-label">Font Size</div>
                    <div className="settings-item-desc">Adjust text size for better readability</div>
                  </div>
                  <select className="month-sel" style={{ width: '120px' }}>
                    <option>Normal</option>
                    <option>Large</option>
                    <option>Extra Large</option>
                  </select>
                </div>

                <div className="settings-item">
                  <div>
                    <div className="settings-item-label">Animations</div>
                    <div className="settings-item-desc">Enable smooth transitions and animations</div>
                  </div>
                  <input type="checkbox" className="toggle-input" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div>
              <div className="card-header">
                <div>
                  <div className="card-title">🔐 Authentication</div>
                  <div className="card-subtitle">Manage your account security and login options</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>Account Information</div>
                      <div style={{ fontSize: '12px', color: 'var(--text4)' }}>Your current login details</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setAuthView('update_password'); setAuthModalOpen(true); }}>
                        <I.Edit /> Change Password
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <div style={{ color: 'var(--text4)', marginBottom: '4px' }}>Email</div>
                      <div style={{ fontWeight: '600' }}>{user.email}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text4)', marginBottom: '4px' }}>Provider</div>
                      <div style={{ fontWeight: '600' }}>Google</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text4)', marginBottom: '4px' }}>Account Type</div>
                      <div style={{ fontWeight: '600', color: 'var(--accent)' }}>PRO</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text4)', marginBottom: '4px' }}>Member Since</div>
                      <div style={{ fontWeight: '600' }}>{new Date(user.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>Security Actions</div>
                      <div style={{ fontSize: '12px', color: 'var(--text4)' }}>Manage your account security</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => { setAuthView('sign_in'); setAuthModalOpen(true); }}>
                      🔐 Sign In to Another Account
                    </button>
                    <button className="btn btn-primary" onClick={() => { setAuthView('sign_up'); setAuthModalOpen(true); }}>
                      👤 Create New Account
                    </button>
                    <button className="btn btn-danger" onClick={handleSignOut} disabled={loading}>
                      🚪 Sign Out
                    </button>
                    <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={loading}>
                      🗑️ Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <div className="card-header">
                <div>
                  <div className="card-title">💾 Data Management</div>
                  <div className="card-subtitle">Backup, restore, and manage your data</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Export Data</div>
                  <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '16px' }}>
                    Download a backup of all your data including students, payments, and settings.
                  </div>
                  <button className="btn btn-primary" onClick={exportData}>
                    📥 Export All Data
                  </button>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Import Data</div>
                  <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '16px' }}>
                    Restore data from a previously exported backup file.
                  </div>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                    📤 Import Data
                    <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
                  </label>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Clear All Data</div>
                  <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '16px' }}>
                    Remove all data from your local storage. This action cannot be undone.
                  </div>
                  <button className="btn btn-danger" onClick={clearAllData}>
                    🧹 Clear All Data
                  </button>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Reset to Defaults</div>
                  <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '16px' }}>
                    Reset all settings to their default values while keeping your data.
                  </div>
                  <button className="btn btn-secondary" onClick={() => {
                    localStorage.setItem('gp2_th', 'light');
                    localStorage.setItem('gp2_feat', JSON.stringify({
                      showStudents: true, showAttendance: true, showPayments: true, 
                      showReports: true, enableNotifications: true, enableDarkMode: true, 
                      enableWaiveFee: true, enableGST: true
                    }));
                    toast("Settings reset to defaults", { icon: "🔄" });
                    window.location.reload();
                  }}>
                    🔄 Reset Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div>
              <div className="card-header">
                <div>
                  <div className="card-title">ℹ️ About GuruPay Pro</div>
                  <div className="card-subtitle">Learn more about your fee management solution</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Application Info</div>
                  <div style={{ fontSize: '13px', color: 'var(--text4)', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Version:</strong> 2.1.0
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Build:</strong> 2026.03.05
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>License:</strong> Professional Edition
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Storage:</strong> Local Storage (Client-side)
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Features</div>
                  <div style={{ fontSize: '13px', color: 'var(--text4)', lineHeight: '1.6' }}>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      <li>Student & Batch Management</li>
                      <li>Fee Tracking & Payment History</li>
                      <li>GST Calculation & Reporting</li>
                      <li>WhatsApp Integration</li>
                      <li>Export & Import</li>
                      <li>Dark/Light Theme</li>
                    </ul>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Support</div>
                  <div style={{ fontSize: '13px', color: 'var(--text4)', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Email:</strong> support@gurupay.com
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Website:</strong> gurupay.com
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Documentation:</strong> docs.gurupay.com
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Legal</div>
                  <div style={{ fontSize: '13px', color: 'var(--text4)', lineHeight: '1.6' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Privacy:</strong> Your data never leaves your device
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Terms:</strong> By using this app, you agree to our terms
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Security:</strong> All data is encrypted in your browser
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* authentication modal used by several tabs */}
      <AuthModal isOpen={authModalOpen} initialView={authView} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default Settings;