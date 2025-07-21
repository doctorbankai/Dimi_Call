import React, { useEffect, useState } from 'react';

interface StickyHeaderDebugProps {
  enabled?: boolean;
}

export const StickyHeaderDebug: React.FC<StickyHeaderDebugProps> = ({ enabled = false }) => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (!enabled) return;

    const checkStickyHeader = () => {
      const container = document.querySelector('.contact-table-container');
      const scrollContainer = container?.querySelector('[class*="overflow"]');
      const thead = container?.querySelector('thead');
      const firstTh = container?.querySelector('thead th');

      if (container && scrollContainer && thead && firstTh) {
        const containerStyles = window.getComputedStyle(container as Element);
        const scrollStyles = window.getComputedStyle(scrollContainer as Element);
        const theadStyles = window.getComputedStyle(thead as Element);
        const thStyles = window.getComputedStyle(firstTh as Element);

        setDebugInfo({
          container: {
            position: containerStyles.position,
            height: containerStyles.height,
            overflow: containerStyles.overflow,
          },
          scrollContainer: {
            position: scrollStyles.position,
            height: scrollStyles.height,
            overflow: scrollStyles.overflow,
            overflowY: scrollStyles.overflowY,
            overflowX: scrollStyles.overflowX,
          },
          thead: {
            position: theadStyles.position,
            top: theadStyles.top,
            zIndex: theadStyles.zIndex,
            backgroundColor: theadStyles.backgroundColor,
          },
          th: {
            position: thStyles.position,
            top: thStyles.top,
            zIndex: thStyles.zIndex,
            backgroundColor: thStyles.backgroundColor,
          }
        });
      }
    };

    // Check immediately and on scroll
    checkStickyHeader();
    const interval = setInterval(checkStickyHeader, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        maxHeight: '400px',
        overflow: 'auto'
      }}
    >
      <h3>🔍 Sticky Header Debug</h3>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => {
            const container = document.querySelector('.contact-table-container');
            if (container) {
              container.classList.toggle('debug-sticky');
            }
          }}
          style={{
            background: '#007acc',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Toggle Debug Borders
        </button>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => {
            const scrollContainer = document.querySelector('.contact-table-container > div');
            if (scrollContainer) {
              (scrollContainer as HTMLElement).scrollTop = 200;
            }
          }}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Test Scroll
        </button>
      </div>
    </div>
  );
};

// Hook pour activer le debug facilement
export const useStickyHeaderDebug = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl + Shift + D pour activer/désactiver le debug
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setEnabled(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return { enabled, setEnabled };
};