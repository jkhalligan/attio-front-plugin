import { Building2, ExternalLink, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface CompanyCardProps {
  company: any;
  onUpdate: () => void;
}

// Helper function to safely get company name
const getCompanyName = (company: any): string => {
  // Try to get from name attribute
  const name = company?.values?.name?.[0]?.value;
  if (name) return name;
  
  // Fallback to record_text
  if (company?.record_text) return company.record_text;
  
  return 'Unknown Company';
};

// Helper function to get company domain
const getCompanyDomain = (company: any): string | null => {
  const domain = company?.values?.domains?.[0]?.domain;
  return domain || null;
};

// Helper function to get company description
const getCompanyDescription = (company: any): string | null => {
  const description = company?.values?.description?.[0]?.value;
  return description || null;
};

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  const companyName = getCompanyName(company);
  const domain = getCompanyDomain(company);
  const description = getCompanyDescription(company);
  const webUrl = company?.web_url;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Building2 size={20} style={styles.icon} />
          <h3 style={styles.title}>Company</h3>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={styles.iconButton}
            title="Edit company"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Company Name */}
        <div style={styles.field}>
          <div style={styles.fieldLabel}>Name</div>
          <div style={styles.fieldValue}>{companyName}</div>
        </div>

        {/* Domain (only if exists) */}
        {domain && (
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Domain</div>
            <div style={styles.fieldValue}>
              <a 
                href={`https://${domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.domainLink}
              >
                {domain}
              </a>
            </div>
          </div>
        )}

        {/* Description (only if exists) */}
        {description && (
          <div style={styles.field}>
            <div style={styles.fieldLabel}>Description</div>
            <div style={styles.fieldValue}>
              {description.length > 150 
                ? `${description.substring(0, 150)}...` 
                : description
              }
            </div>
          </div>
        )}

        {/* View in Attio link */}
        {webUrl && (
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkButton}
          >
            <ExternalLink size={14} />
            <span>View in Attio</span>
          </a>
        )}
      </div>
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
  headerRight: {
    display: 'flex',
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
  iconButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  content: {
    padding: '16px',
  },
  field: {
    marginBottom: '12px',
  },
  fieldLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  fieldValue: {
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  domainLink: {
    color: 'var(--accent-color)',
    textDecoration: 'none',
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    color: 'var(--accent-color)',
    textDecoration: 'none',
    border: '1px solid var(--accent-color)',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
};
