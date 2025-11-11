import { Building2, ExternalLink, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { updateCompany } from '../attioApi';

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyName = getCompanyName(company);
  const domain = getCompanyDomain(company);
  const description = getCompanyDescription(company);
  const webUrl = company?.web_url;

  // Form state - only domain is editable
  const [formData, setFormData] = useState({
    domain: domain || '',
  });

  const handleEdit = () => {
    setFormData({
      domain: domain || '',
    });
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await updateCompany(company.id.record_id, {
        domain: formData.domain || undefined,
      });

      setIsEditing(false);
      onUpdate(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Building2 size={20} style={styles.icon} />
          <h3 style={styles.title}>Company</h3>
        </div>
        <div style={styles.headerRight}>
          {!isEditing && (
            <button
              onClick={handleEdit}
              style={styles.iconButton}
              title="Edit company"
            >
              <Edit2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {isEditing ? (
          // Edit Mode
          <>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Name</div>
              <div style={styles.fieldValue}>{companyName}</div>
              <div style={styles.fieldNote}>Company name cannot be edited</div>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Domain</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                style={styles.input}
                placeholder="example.com"
              />
            </div>

            {description && (
              <div style={styles.field}>
                <div style={styles.fieldLabel}>Description</div>
                <div style={styles.fieldValue}>
                  {description.length > 150 
                    ? `${description.substring(0, 150)}...` 
                    : description
                  }
                </div>
                <div style={styles.fieldNote}>Description cannot be edited</div>
              </div>
            )}

            <div style={styles.actions}>
              <button
                onClick={handleCancel}
                style={styles.cancelButton}
                disabled={isSaving}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={styles.saveButton}
                disabled={isSaving}
              >
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          // Display Mode
          <>
            <div style={styles.field}>
              <div style={styles.fieldLabel}>Name</div>
              <div style={styles.fieldValue}>{companyName}</div>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0',
    marginBottom: '0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 8px',
    borderBottom: 'none',
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
    padding: '8px',
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
  fieldNote: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
    marginTop: '2px',
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
  formField: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  saveButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  error: {
    padding: '8px 12px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '12px',
  },
};
