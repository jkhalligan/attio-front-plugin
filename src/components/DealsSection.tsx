import { TrendingUp, Plus, Save, X, Circle, CircleDashed, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { createDeal } from '../attioApi';

interface DealsSectionProps {
  deals: any[];
  dealStages: any[];
  personId: string | null;
  companyId: string | null;
  onUpdate: () => void;
}

// Helper function to safely get deal name
const getDealName = (deal: any): string => {
  const name = deal?.values?.name?.[0]?.value;
  if (name) return name;
  if (deal?.record_text) return deal.record_text;
  return 'Unnamed Deal';
};

// Helper function to safely get deal value
const getDealValue = (deal: any): { amount: number; currency: string } | null => {
  const valueData = deal?.values?.value?.[0];
  if (valueData) {
    return {
      amount: valueData.currency_value || valueData.value || 0,
      currency: valueData.currency_code || 'USD'
    };
  }
  return null;
};

// Helper function to get close date
const getCloseDate = (deal: any): string | null => {
  const closeDateValue = deal?.values?.close_date?.[0]?.value;
  return closeDateValue || null;
};

// Helper function to check if deal is "won" (i.e., closed)
const isDealWon = (deal: any): boolean => {
  const closeDate = getCloseDate(deal);
  if (!closeDate) return false;
  try {
    const closeDateObj = new Date(closeDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return closeDateObj <= today; // closed if date is today or in the past
  } catch {
    return false;
  }
};

// Helper function to format currency
const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  try {
    return formatter.format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

// Helper function to get deal stage name
const getDealStageName = (deal: any, dealStages: any[]): string => {
  const stageData = deal?.values?.stage?.[0];
  if (!stageData) return 'No Stage';
  if (stageData.status?.title) return stageData.status.title;
  if (stageData.option?.title) return stageData.option.title;
  if (stageData.status_id && dealStages.length > 0) {
    const stage = dealStages.find(
      (s: any) =>
        s.id === stageData.status_id ||
        s.status_id === stageData.status_id ||
        s.id?.status_id === stageData.status_id
    );
    if (stage?.title) return stage.title;
  }
  if (stageData.value) return stageData.value;
  if (stageData.option_id) return `Stage ${stageData.option_id.substring(0, 8)}`;
  return 'Unknown Stage';
};

// Helper function to get billing status
const getBillingStatus = (deal: any): 'none' | 'partial' | 'billed' => {
  const billingData = deal?.values?.billing_status?.[0];
  
  // No billing data at all
  if (!billingData) return 'none';
  
  // Check for option_id in nested structure (most common for select fields)
  const optionId = 
    billingData.option?.id?.option_id ||  // Nested structure: option.id.option_id
    billingData.option_id ||               // Direct option_id
    billingData.status_id;                 // Alternative: status_id
  
  if (optionId === 'd807ffb1-fc06-4492-afe6-8c57af5e8af8') return 'billed';
  if (optionId === '6090cbbf-6caa-4207-bc38-9bb607c4d4e2') return 'partial';
  
  // Check for title/text match (fallback)
  const title = billingData.option?.title || billingData.status?.title || billingData.value || '';
  const titleLower = title.toLowerCase();
  if (titleLower.includes('billed') && !titleLower.includes('partial')) return 'billed';
  if (titleLower.includes('partial')) return 'partial';
  
  return 'none';
};

export const DealsSection: React.FC<DealsSectionProps> = ({
  deals,
  dealStages,
  personId,
  companyId,
  onUpdate,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    stage_id: '',
    description: '',
  });

  const handleCreate = () => {
    setFormData({
      name: '',
      value: '',
      stage_id: dealStages.length > 0 ? getDealStageId(dealStages[0]) : '',
      description: '',
    });
    setError(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('Deal name is required');
      return;
    }

    if (!formData.value || isNaN(parseFloat(formData.value))) {
      setError('Valid deal value is required');
      return;
    }

    if (!formData.stage_id) {
      setError('Deal stage is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createDeal({
        name: formData.name,
        value: parseFloat(formData.value),
        stage_id: formData.stage_id,
        description: formData.description || undefined,
        person_id: personId || undefined,
        company_id: companyId || undefined,
      });

      setIsCreating(false);
      onUpdate(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to construct stage ID for Attio API
  const getDealStageId = (stage: any): string => {
    // If stage has a direct id property that's already a string
    if (typeof stage.id === 'string') {
      return stage.id;
    }
    
    // If stage.id is an object with components
    if (stage.id && typeof stage.id === 'object') {
      const { workspace_id, object_id, attribute_id, status_id } = stage.id;
      return `${workspace_id}|${object_id}|${attribute_id}|${status_id}`;
    }
    
    // If stage itself has the components
    if (stage.workspace_id && stage.object_id && stage.attribute_id && stage.status_id) {
      return `${stage.workspace_id}|${stage.object_id}|${stage.attribute_id}|${stage.status_id}`;
    }
    
    // Fallback - just use the whole stage as a string
    return String(stage);
  };

  // ðŸ§  Sort deals:
  // 1. Open deals first (no close_date or future date)
  // 2. Then closed deals (past close_date)
  // 3. Within each, sort by close_date descending
  const sortedDeals = [...deals].sort((a, b) => {
    const aClose = getCloseDate(a);
    const bClose = getCloseDate(b);

    const aDate = aClose ? new Date(aClose).getTime() : Infinity;
    const bDate = bClose ? new Date(bClose).getTime() : Infinity;

    const aWon = isDealWon(a);
    const bWon = isDealWon(b);

    // 1ï¸âƒ£ Open deals first
    if (aWon !== bWon) return aWon ? 1 : -1;

    // 2ï¸âƒ£ Then sort descending by close date (most recent first)
    return (bDate || 0) - (aDate || 0);
  });

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <TrendingUp size={20} style={styles.icon} />
          <h3 style={styles.title}>Deals</h3>
          <span style={styles.count}>({sortedDeals.length})</span>
        </div>
        {!isCreating && (
          <button
            onClick={handleCreate}
            style={styles.addButton}
            title="Create new deal"
          >
            <Plus size={16} />
            <span>New Deal</span>
          </button>
        )}
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {isCreating ? (
          // Create Deal Form
          <div style={styles.createForm}>
            <div style={styles.formField}>
              <label style={styles.label}>Deal Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
                placeholder="Studio Europa 2024 - Website"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Deal Value (USD) *</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                style={styles.input}
                placeholder="5000"
                step="0.01"
              />
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Stage *</label>
              <select
                value={formData.stage_id}
                onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                style={styles.input}
              >
                <option value="">Select a stage</option>
                {dealStages.map((stage) => (
                  <option key={getDealStageId(stage)} value={getDealStageId(stage)}>
                    {stage.title || 'Unknown Stage'}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                placeholder="Add notes about this deal..."
              />
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
                {isSaving ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </div>
        ) : sortedDeals.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No deals yet</p>
            <button
              onClick={handleCreate}
              style={styles.emptyButton}
            >
              <Plus size={16} />
              Create First Deal
            </button>
          </div>
        ) : (
          <div style={styles.dealsList}>
            {sortedDeals.map((deal) => {
              const dealName = getDealName(deal);
              const dealValue = getDealValue(deal);
              const stageName = getDealStageName(deal, dealStages);
              const billingStatus = getBillingStatus(deal);
              const isWon = isDealWon(deal);
              const closeDate = getCloseDate(deal);
              const webUrl = deal?.web_url;

              return (
                <div key={deal.id.record_id} style={styles.dealCard}>
                  <div style={styles.dealHeader}>
                    <div style={styles.dealName}>{dealName}</div>
                    {dealValue && (
                      <div
                        style={{
                          ...styles.dealValue,
                          color: isWon ? '#10b981' : '#6b7280',
                        }}
                      >
                        {formatCurrency(dealValue.amount, dealValue.currency)}
                      </div>
                    )}
                  </div>

                  <div style={styles.dealFooter}>
                    <div style={styles.statusLabels}>
                      <div
                        style={{
                          ...styles.dealStage,
                          ...(isWon ? styles.dealStageWon : {}),
                        }}
                      >
                        {isWon ? `Won 🎉` : stageName}
                      </div>

                      {/* Billing Status Label */}
                      <div
                        style={{
                          ...styles.billingStatus,
                          ...(billingStatus === 'billed' ? styles.billingStatusBilled : {}),
                          ...(billingStatus === 'partial' ? styles.billingStatusPartial : {}),
                          ...(billingStatus === 'none' ? styles.billingStatusNone : {}),
                        }}
                        title={
                          billingStatus === 'billed' ? 'Fully Billed' :
                          billingStatus === 'partial' ? 'Partially Billed' :
                          'Not Billed'
                        }
                      >
                        {billingStatus === 'billed' && <CheckCircle size={12} />}
                        {billingStatus === 'partial' && <CircleDashed size={12} />}
                        {billingStatus === 'none' && <Circle size={12} />}
                        <span>
                          {billingStatus === 'billed' ? 'Billed' :
                           billingStatus === 'partial' ? 'Partial' :
                           'Not Billed'}
                        </span>
                      </div>
                    </div>

                    {closeDate && !isWon && (
                      <div style={styles.closeDate}>
                        Due: {new Date(closeDate).toLocaleDateString()}
                      </div>
                    )}

                    {webUrl && (
                      <a
                        href={webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.dealLink}
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
  icon: { color: 'var(--text-secondary)' },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  count: { fontSize: '13px', color: 'var(--text-secondary)' },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'white',
    backgroundColor: 'var(--accent-color)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  content: { padding: '8px' },
  emptyState: { textAlign: 'center', padding: '24px 16px' },
  emptyText: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  emptyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--accent-color)',
    backgroundColor: 'transparent',
    border: '1px solid var(--accent-color)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  dealsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  dealCard: {
    padding: '12px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
  },
  dealHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  dealName: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    flex: 1,
  },
  dealValue: { fontSize: '14px', fontWeight: 600, flexShrink: 0 },
  dealFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  statusLabels: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  dealStage: {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  dealStageWon: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderColor: '#10b981',
  },
  billingStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  billingStatusNone: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-tertiary)',
    borderColor: 'var(--border-color)',
  },
  billingStatusPartial: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderColor: '#f59e0b',
  },
  billingStatusBilled: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderColor: '#3b82f6',
  },
  closeDate: {
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontStyle: 'italic',
  },
  dealLink: {
    fontSize: '12px',
    color: 'var(--accent-color)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  createForm: {
    padding: '4px',
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
