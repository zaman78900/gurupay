import React, { createContext, useCallback, useState } from 'react';

export const ToastContext = createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    console.warn('useToast must be used within ToastProvider');
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
    };
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const showSuccess = useCallback(
    (message, duration = 3000) => showToast(message, 'success', duration),
    [showToast]
  );

  const showError = useCallback(
    (message, duration = 4000) => showToast(message, 'error', duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message, duration = 3500) => showToast(message, 'warning', duration),
    [showToast]
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const typeColors = {
    success: { bg: '#dcfce7', text: '#166534', border: '#22c55e', icon: '✓' },
    error: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444', icon: '✕' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b', icon: '⚠' },
    info: { bg: '#dbeafe', text: '#0c4a6e', border: '#3b82f6', icon: 'ℹ' },
  };

  const colors = typeColors[toast.type] || typeColors.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        backgroundColor: colors.bg,
        color: colors.text,
        padding: '12px 16px',
        borderRadius: '6px',
        border: `2px solid ${colors.border}`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'slideIn 0.3s ease-in-out',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <span style={{ fontSize: '18px', fontWeight: 'bold', flexShrink: 0 }}>{colors.icon}</span>
      <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          flexShrink: 0,
          opacity: 0.7,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.opacity = '1')}
        onMouseLeave={(e) => (e.target.style.opacity = '0.7')}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
