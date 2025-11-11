import { useState } from 'react';
import { User, Mail, Phone, Briefcase, Building2, Edit2, ExternalLink } from 'lucide-react';

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

  const personName = getPersonName(person);
  const email = getPersonEmail(person);
  const phone = getPersonPhone(person);
  const jobTitle = getPersonJobTitle(person);
  const webUrl = person?.web_url;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <User size={20} style={styles.icon} />
          <h3 style={styles.title}>Contact Details</h3>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={styles.iconButton}
            title="Edit contact"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Name */}
        <div style={styles.field}>
          <div style={styles.fieldLabel}>
            <User size={14} style={styles.fieldIcon} />
            Name
          </div>
          <div style={styles.fieldValue}>
            {personName}
          </div>
        </div>

        {/* Email */}
        <div style={styles.field}>
          <div style={styles.fieldLabel}>
            <Mail size={14} style={styles.fieldIcon} />
            Email
          </div>
          <div style={styles.fieldValue}>
            {email}
          </div>
        </div>

        {/* Phone (only show if exists) */}
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

        {/* Job Title (only show if exists) */}
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

        {/* Organization - show company reference */}
        <div style={styles.field}>
          <div style={styles.fieldLabel}>
            <Building2 size={14} style={styles.fieldIcon} />
            Organization
          </div>
          <div style={styles.fieldValue}>
            {person?.values?.company?.[0]?.target_record_id ? (
              <span>Linked to company</span>
            ) : (
              <span style={styles.emptyValue}>No organization</span>
            )}
          </div>
        </div>

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
};
