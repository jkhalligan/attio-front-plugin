import { TrendingUp, Plus } from 'lucide-react';
import { useState } from 'react';

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

export const DealsSection: React.FC<DealsSectionProps> = ({
  deals,
  dealStages,
  personId,
  companyId,
  onUpdate,
}) => {
  const [isCreating, setIsCreating] = useState(false);

  // 🧠 Sort deals:
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

    // 1️⃣ Open deals first
    if (aWon !== bWon) return aWon ? 1 : -1;

    // 2️⃣ Then sort descending by close date (most recent first)
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
        <button
          onClick={() => setIsCreating(true)}
          style={styles.addButton}
          title="Create new deal"
        >
          <Plus size={16} />
          <span>New Deal</span>
        </button>
      </div>

      <div style={styles.content}>
        {sortedDeals.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No deals yet</p>
            <button
              onClick={() => setIsCreating(true)}
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
                    <div
                      style={{
                        ...styles.dealStage,
                        ...(isWon ? styles.dealStageWon : {}),
                      }}
                    >
                      {isWon ? `Won 🎉` : stageName}
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
  content: { padding: '12px' },
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
};
