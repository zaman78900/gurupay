import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabase';
import { I } from '../app';

const AuthModal = ({ isOpen, onClose, initialView = 'sign_in' }) => {
  const [currentView, setCurrentView] = useState(initialView);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuthSuccess = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box" style={{ maxWidth: 480, width: '95vw' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {currentView === 'sign_in' && '🔐 Sign In'}
              {currentView === 'sign_up' && '📝 Sign Up'}
              {currentView === 'forgotten_password' && '🔑 Reset Password'}
              {currentView === 'update_password' && '🔒 Change Password'}
            </div>
            <div className="modal-subtitle">
              {currentView === 'sign_in' && 'Access your GuruPay account'}
              {currentView === 'sign_up' && 'Create your GuruPay account'}
              {currentView === 'forgotten_password' && 'Reset your password'}
              {currentView === 'update_password' && 'Update your password'}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <I.X />
          </button>
        </div>
        
        <div className="modal-body">
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '24px' }}>🪔</div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text)' }}>GuruPay Pro</div>
                <div style={{ fontSize: '12px', color: 'var(--text4)' }}>Professional Fee Management</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text4)', lineHeight: '1.5' }}>
              Securely manage your coaching fees, students, and payments with our professional dashboard.
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'var(--accent)',
                      brandAccent: 'var(--accent-dark)',
                    }
                  }
                }
              }}
              providers={['google']}
              onlyThirdPartyProviders={false}
              view={currentView}
              redirectTo={window.location.origin}
              onAuthStateChange={(event, session) => {
                if (event === 'SIGNED_IN' && session) {
                  handleAuthSuccess();
                }
              }}
            />
          </div>

          {/* View Switcher */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '12px', color: 'var(--text4)' }}>
            {currentView !== 'sign_in' && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setCurrentView('sign_in')}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                Sign In
              </button>
            )}
            {currentView !== 'sign_up' && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setCurrentView('sign_up')}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                Sign Up
              </button>
            )}
            {currentView !== 'forgotten_password' && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setCurrentView('forgotten_password')}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                Forgot Password?
              </button>
            )}
          </div>

          {/* Profile Management */}
          {currentView === 'update_password' && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text4)', marginBottom: '8px' }}>
                🔒 For security, please use the form above to update your password.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {currentView === 'sign_in' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setCurrentView('sign_up')}
                disabled={loading}
              >
                Create Account
              </button>
            </>
          )}
          {currentView === 'sign_up' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setCurrentView('sign_in')}
                disabled={loading}
              >
                Sign In
              </button>
            </>
          )}
          {currentView === 'forgotten_password' && (
            <>
              <button className="btn btn-secondary" onClick={() => setCurrentView('sign_in')}>
                Back to Sign In
              </button>
            </>
          )}
          {currentView === 'update_password' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;