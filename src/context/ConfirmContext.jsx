import React, { createContext, useCallback, useState } from 'react';

export const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    console.warn('useConfirm must be used within ConfirmProvider');
    return () => Promise.resolve(false);
  }
  return context.confirm;
};

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback(
    (message, title = 'Confirm Action', { okText = 'Confirm', cancelText = 'Cancel' } = {}) => {
      return new Promise((resolve) => {
        setDialog({
          title,
          message,
          okText,
          cancelText,
          onConfirm: () => {
            setDialog(null);
            resolve(true);
          },
          onCancel: () => {
            setDialog(null);
            resolve(false);
          },
        });
      });
    },
    []
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && <ConfirmDialog {...dialog} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ title, message, okText, cancelText, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '90%',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', color: '#1f2937' }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', lineHeight: 1.5 }}>
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc2626';
            }}
          >
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}
