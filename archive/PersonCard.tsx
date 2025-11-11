import { useState } from 'react';
import { User, Mail, Phone, Briefcase, Building2, Edit2, ExternalLink, Save, X } from 'lucide-react';
import { updatePerson } from '../attioApi';

interface PersonCardProps {
  person: any;
  companies: any[];
  onUpdate: () => void;
}

// Helper function to safely get person's full name
const getPersonName = (person: any): string => {
  // Try to get full_name from the name attribute
  const nameValue = person?.values?.name?.[0];
  
  if (nameValue?.full_name) {
    return nameValue.full_name;
  }
  
  // Fallback to first + last name
  if (nameValue?.first_name || nameValue?.last_name) {
    return [nameValue.first_name, nameValue.last_name].filter(Boolean).join(' ');
  }
  
  // Last resort: use record_text if available
  if (person?.record_text) {
    return person.record_text;
  }
  
  return 'No name';
};

// Helper function to safely get email
const getPersonEmail = (person: any): string => {
  const email = person?.values?.email_addresses?.[0]?.email_address;
  return email || 'No email';
};

// Helper function to safely get phone
const getPersonPhone = (person: any): string | null => {
  const phone = person?.values?.phone_numbers?.[0]?.phone_number;
  return phone || null;
};

// Helper function to safely get job title
const getPersonJobTitle = (person: any): string | null => {
  const jobTitle = person?.values?.job_title?.[0]?.value;
  return jobTitle || null;
};

// Helper function to get company ID
const getPersonCompanyId = (person: any): string | null => {
  const companyRef = person?.values?.company?.[0];
  return companyRef?.target_record_id || null;
};

// Helper function to get company name from the person's company reference
const getCompanyName = (person: any, companyRecord: any): string => {
  // First try to get it from the passed company record
  if (companyRecord?.values?.name?.[0]?.value) {
    return companyRecord.values.name[0].value;
  }
  
  if (companyRecord?.record_text) {
    return companyRecord.record_text;
  }
  
  return 'Unknown Company';
};

export const PersonCard: React.FC<PersonCardProps> = ({ person, companies, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personName = getPersonName(person);
  const email = getPersonEmail(person);
  const phone = getPersonPhone(person);
  const jobTitle = getPersonJobTitle(person);
  const companyId = getPersonCompanyId(person);
  const webUrl = person?.web_url;

  // Form state
  const [formData, setFormData] = useState({
    name: personName,
    email: email,
    phone: phone || '',
    job_title: jobTitle || '',
    company_id: companyId || '',
  });

  const handleEdit = () => {
    // Reset form data when entering edit mode
    setFormData({
      name: personName,
      email: email,
      phone: phone || '',
      job_title: jobTitle || '',
      company_id: companyId || '',
    });
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updatePerson(person.id.record_id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        job_title: formData.job_title || undefined,
        company_id: formData.company_id || undefined,
      });

      setIsEditing(false);
      onUpdate(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <User size={20} style={styles.icon} />
          <h3 style={styles.title}>Contact Details</h3>
        </div>
        <div style={styles.headerRight}>
          {!isEditing && (
            <button
              onClick={handleEdit}
              style={styles.iconButton}
              title="Edit contact"
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
            <div style={styles.formField}>
              <label style={styles.label}>
                <User size={14} style={styles.fieldIcon} />
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
                placeholder="John Doe"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                <Mail size={14} style={styles.fieldIcon} />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
                placeholder="john@example.com"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                <Phone size={14} style={styles.fieldIcon} />
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={styles.input}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                <Briefcase size={14} style={styles.fieldIcon} />
                Job Title
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                style={styles.input}
                placeholder="Software Engineer"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>
                <Building2 size={14} style={styles.fieldIcon} />
                Organization
              </label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                style={styles.input}
              >
                <option value="">No organization</option>
                {companies.map((company) => (
                  <option key={company.id.record_id} value={company.id.record_id}>
                    {company.values?.name?.[0]?.value || company.record_text || 'Unknown Company'}
                  </option>
                ))}
              </select>
            </div>

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
              <div style={styles.fieldLabel}>
                <User size={14} style={styles.fieldIcon} />
                Name
              </div>
              <div style={styles.fieldValue}>
                {personName}
              </div>
            </div>

            <div style={styles.field}>
              <div style={styles.fieldLabel}>
                <Mail size={14} style={styles.fieldIcon} />
                Email
              </div>
              <div style={styles.fieldValue}>
                {email}
              </div>
            </div>

            {phone && (
              <div style={styles.field}>
                <div style={styles.fieldLabel}>
                  <Phone size={14} style={styles.fieldIcon} />
                  Phone
                </div>
                <div style={styles.fieldValue}>
                  {phone}
                </div>
              </div>
            )}

            {jobTitle && (
              <div style={styles.field}>
                <div style={styles.fieldLabel}>
                  <Briefcase size={14} style={styles.fieldIcon} />
                  Job Title
                </div>
                <div style={styles.fieldValue}>
                  {jobTitle}
                </div>
              </div>
            )}

            <div style={styles.field}>
              <div style={styles.fieldLabel}>
                <Building2 size={14} style={styles.fieldIcon} />
                Organization
              </div>
              <div style={styles.fieldValue}>
                {companyId ? (
                  <span>
                    {companies.find(c => c.id.record_id === companyId)?.values?.name?.[0]?.value || 'Linked to company'}
                  </span>
                ) : (
                  <span style={styles.emptyValue}>No organization</span>
                )}
              </div>
            </div>

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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  fieldIcon: {
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    paddingLeft: '20px',
  },
  emptyValue: {
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
