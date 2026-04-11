import React from 'react';

// Skeleton loader for list items
export function SkeletonLoader({ count = 3, height = '60px' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          style={{
            height,
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Skeleton for table rows
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[...Array(rows)].map((_, row) => (
        <div
          key={row}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '12px',
          }}
        >
          {[...Array(columns)].map((_, col) => (
            <div
              key={col}
              style={{
                height: '30px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ count = 3, columns = 3 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
        gap: '1rem',
      }}
    >
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              height: '100px',
              backgroundColor: '#e5e7eb',
              borderRadius: '6px',
              marginBottom: '1rem',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              height: '20px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              height: '20px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              width: '70%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Full page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          height: '40px',
          backgroundColor: '#e5e7eb',
          borderRadius: '6px',
          marginBottom: '2rem',
          width: '200px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      <SkeletonLoader count={5} height='60px' />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
