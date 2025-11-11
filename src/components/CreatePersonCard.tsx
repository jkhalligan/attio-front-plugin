import { useState } from 'react';
import { UserPlus, Save, X } from 'lucide-react';
import { PersonFormData } from '../types';
import { createPerson } from '../attioApi';

interface CreatePersonCardProps {
  email: string;
  onCreated: () => void;
}

export function CreatePersonCard({ email, onCreated }: CreatePersonCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to extract name from email
  const extractNameFromEmail = (email: string): string => {
    const localPart = email.split('@')[0];
    // Replace dots, underscores, and hyphens with spaces
    const nameAttempt = localPart.replace(/[._-]/g, ' ');
    // Capitalize first letter of each word
    return nameAttempt
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [formData, setFormData] = useState<PersonFormData>({
    name: extractNameFromEmail(email),
    email: email,
    phone: '',
    job_title: '',
    company_id: '',
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createPerson({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        job_title: formData.job_title || undefined,
        company_id: formData.company_id || undefined,
      });
      
      setIsCreating(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create person');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setError(null);
  };

  if (!isCreating) {
    return (
      <div style={styles.card}>
        <div style={styles.notFoundContent}>
          <UserPlus size={48} style={styles.notFoundIcon} />
          <h3 style={styles.notFoundTitle}>Contact Not Found</h3>
          <p style={styles.notFoundText}>
            No contact found in Attio for <strong>{email}</strong>
          </p>
          <button
            onClick={() => setIsCreating(true)}
            style={styles.createButton}
          >
            <UserPlus size={16} />
            Create New Contact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <UserPlus size={20} style={styles.icon} />
        <h2 style={styles.title}>Create New Contact</h2>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.form}>
        <div style={styles.formField}>
          <label style={styles.label}>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            placeholder="John Doe"
          />
        </div>

        <div style={styles.formField}>
          <label style={styles.label}>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={styles.input}
            placeholder="john@example.com"
          />
        </div>

        <div style={styles.actions}>
          <button
            onClick={handleCancel}
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleCreate}
            style={styles.saveButton}
            disabled={isSubmitting}
          >
            <Save size={16} />
            {isSubmitting ? 'Creating...' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  icon: {
    color: 'var(--accent-color)',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  notFoundContent: {
    textAlign: 'center',
    padding: '24px 16px',
  },
  notFoundIcon: {
    color: 'var(--text-tertiary)',
    marginBottom: '16px',
  },
  notFoundTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  notFoundText: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid var(--input-border)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
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
  error: {
    padding: '8px 12px',
    backgroundColor: 'var(--error-color)',
    color: 'white',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '12px',
  },
};
