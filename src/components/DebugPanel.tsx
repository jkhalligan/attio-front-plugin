// DebugPanel.tsx - Fixed version without duplicate style attributes
// This fix resolves the build warning about duplicate "style" attribute

import { useState } from 'react';
import { Code } from 'lucide-react';

interface DebugPanelProps {
  context: any;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ context }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div style={styles.card}>
      {/* FIXED: Combined styles into single style attribute */}
      <div 
        style={{ ...styles.header, cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={styles.headerLeft}>
          <Code size={20} style={styles.icon} />
          <h3 style={styles.title}>Debug Panel</h3>
        </div>
        <span style={styles.toggle}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div style={styles.content}>
          <pre style={styles.pre}>
            {JSON.stringify(context, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    color: 'var(--text-secondary)',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  toggle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  content: {
    padding: '16px',
  },
  pre: {
    margin: 0,
    fontSize: '11px',
    fontFamily: 'monospace',
    color: 'var(--text-primary)',
    overflow: 'auto',
    maxHeight: '400px',
    backgroundColor: 'var(--bg-primary)',
    padding: '12px',
    borderRadius: '4px',
  },
};
