import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useFrontContext } from './providers/FrontContext';
import { PersonCard } from './components/PersonCard';
import { CompanyCard } from './components/CompanyCard';
import { DealsSection } from './components/DealsSection';
import { CreatePersonCard } from './components/CreatePersonCard';
import { Accordion } from './components/Accordion';
import {
  searchPersonByEmail,
  getCompany,
  listCompanies,
  getDealsForPerson,
  getDealsForCompany,
  getDealStages,
} from './attioApi';
import { PluginState, ConversationParticipant } from './types';
import './App.css';

function App() {
  const { context, loading: contextLoading } = useFrontContext();
  const [state, setState] = useState<PluginState>({
    loading: false,
    error: null,
    person: null,
    company: null,
    deals: [],
    companies: [],
    dealStages: [],
    fromEmail: null,
  });
  
  // New state for contact selection
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  
  // Track the current conversation ID to detect changes
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const getConversationParticipants = async (): Promise<ConversationParticipant[]> => {
    if (context?.type !== 'singleConversation') return [];
    
    try {
      const messagesResponse = await context.listMessages();
      if (messagesResponse.results.length === 0) return [];
      
      // Collect all unique email addresses from the conversation
      const emailMap = new Map<string, ConversationParticipant>();
      
      messagesResponse.results.forEach((message, index) => {
        // Add sender
        if (message.from.handle && !emailMap.has(message.from.handle)) {
          emailMap.set(message.from.handle, {
            email: message.from.handle,
            name: message.from.name || message.from.handle,
            isFirstSender: index === 0, // Mark the first sender
          });
        }
        
        // Add recipients
        message.recipients?.forEach(recipient => {
          if (recipient.handle && !emailMap.has(recipient.handle)) {
            emailMap.set(recipient.handle, {
              email: recipient.handle,
              name: recipient.name || recipient.handle,
              isFirstSender: false,
            });
          }
        });
      });
      
      // Convert to array and sort: first sender first, then alphabetically
      const participantList = Array.from(emailMap.values()).sort((a, b) => {
        if (a.isFirstSender) return -1;
        if (b.isFirstSender) return 1;
        return a.name.localeCompare(b.name);
      });
      
      return participantList;
    } catch (error) {
      console.error('Error getting conversation participants:', error);
      return [];
    }
  };

  const loadData = async (emailToLoad?: string) => {
    if (context?.type !== 'singleConversation') return;

    console.log('🚀 Starting to load Attio data...');
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // If no email specified, use the selected email or get participants
      let targetEmail = emailToLoad || selectedEmail;
      
      if (!targetEmail) {
        const participantList = await getConversationParticipants();
        setParticipants(participantList);
        
        if (participantList.length === 0) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Could not extract email from conversation',
            fromEmail: null,
          }));
          return;
        }
        
        // Default to first participant (the original sender)
        targetEmail = participantList[0].email;
        setSelectedEmail(targetEmail);
      }

      console.log('📧 Loading contact for email:', targetEmail);
      setState(prev => ({ ...prev, fromEmail: targetEmail }));

      const companiesPromise = listCompanies();
      const dealStagesPromise = getDealStages();
      console.log('🔍 Searching for person with email:', targetEmail);
      const person = await searchPersonByEmail(targetEmail);

      if (!person) {
        console.log('❌ No person found in Attio');
        const [companies, dealStages] = await Promise.all([companiesPromise, dealStagesPromise]);
        setState(prev => ({
          ...prev,
          loading: false,
          person: null,
          company: null,
          deals: [],
          companies,
          dealStages,
        }));
        return;
      }

      console.log('✅ Person found! Record ID:', person?.id?.record_id);
      if (!person?.id?.record_id) {
        console.error('❌ Person found but invalid ID structure:', person);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Person data is incomplete',
          person: null,
          company: null,
          deals: [],
          companies: [],
          dealStages: [],
        }));
        return;
      }

      const companyId =
        person.values.company?.[0]?.referenced_record_id ||
        person.values.company?.[0]?.target_record_id ||
        person.values.company?.[0]?.record_id ||
        person.values.primary_company?.[0]?.referenced_record_id ||
        person.values.primary_company?.[0]?.target_record_id ||
        person.values.companies?.[0]?.referenced_record_id ||
        person.values.companies?.[0]?.target_record_id;

      console.log('🏢 Company ID from person:', companyId);

      const [companies, dealStages, dealsForPerson] = await Promise.all([
        companiesPromise,
        dealStagesPromise,
        getDealsForPerson(person.id.record_id),
      ]);

      let company = null;
      let dealsForCompany: any[] = [];
      if (companyId) {
        console.log('🏢 Loading company:', companyId);
        [company, dealsForCompany] = await Promise.all([
          getCompany(companyId),
          getDealsForCompany(companyId),
        ]);
        console.log('💼 Deals found for company:', dealsForCompany.length);
      }

      const allDeals = [...dealsForPerson, ...dealsForCompany];
      const validDeals = allDeals.filter(deal => deal && deal.id && deal.id.record_id);
      const uniqueDeals = Array.from(
        new Map(validDeals.map(deal => [deal.id.record_id, deal])).values()
      );
      uniqueDeals.sort((a, b) => {
        try {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        } catch (error) {
          console.error('Error sorting deals:', error);
          return 0;
        }
      });

      console.log('✅ Total unique deals:', uniqueDeals.length);

      setState(prev => ({
        ...prev,
        loading: false,
        person,
        company,
        deals: uniqueDeals,
        companies,
        dealStages,
      }));

      console.log('✅ Data loading complete!');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  };

  const handleContactChange = (email: string) => {
    setSelectedEmail(email);
    loadData(email);
  };

  // Effect to handle conversation changes and initial load
  useEffect(() => {
    if (context?.type === 'singleConversation') {
      const conversationId = context.conversation.id;
      
      // Check if this is a new conversation
      if (conversationId !== currentConversationId) {
        console.log('🔄 Conversation changed, resetting state...', conversationId);
        
        // Reset all state for new conversation
        setCurrentConversationId(conversationId);
        setSelectedEmail(null);
        setParticipants([]);
        setState({
          loading: false,
          error: null,
          person: null,
          company: null,
          deals: [],
          companies: [],
          dealStages: [],
          fromEmail: null,
        });
        
        // Load data for new conversation
        loadData();
      }
    } else {
      // Reset when no conversation or multiple conversations
      setCurrentConversationId(null);
      setSelectedEmail(null);
      setParticipants([]);
    }
  }, [context]);

  if (contextLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <Loader2 size={32} style={styles.spinner} />
          <p style={styles.loadingText}>Connecting to Front...</p>
        </div>
      </div>
    );
  }

  if (context?.type === 'noConversation') {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <AlertCircle size={48} style={styles.emptyIcon} />
          <h2 style={styles.emptyTitle}>No Conversation Selected</h2>
          <p style={styles.emptyText}>Select a conversation to view Attio CRM details</p>
        </div>
      </div>
    );
  }

  if (context?.type === 'multiConversations') {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <AlertCircle size={48} style={styles.emptyIcon} />
          <h2 style={styles.emptyTitle}>Multiple Conversations Selected</h2>
          <p style={styles.emptyText}>Please select only one conversation to use this plugin</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Contact Selector Dropdown - Only show if we have multiple participants */}
      {participants.length > 1 && (
        <div style={styles.selectorContainer}>
          <label style={styles.selectorLabel}>Viewing contact:</label>
          <div style={styles.selectWrapper}>
            <select
              value={selectedEmail || ''}
              onChange={(e) => handleContactChange(e.target.value)}
              style={styles.select}
              disabled={state.loading}
            >
              {participants.map((participant) => (
                <option key={participant.email} value={participant.email}>
                  {participant.name}
                  {participant.isFirstSender && ' (Original Sender)'}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={styles.selectIcon} />
          </div>
        </div>
      )}

      {state.loading && (
        <div style={styles.loadingBanner}>
          <Loader2 size={16} style={styles.spinner} />
          <span>Loading Attio data...</span>
        </div>
      )}

      {state.error && (
        <div style={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{state.error}</span>
        </div>
      )}

      {!state.loading && !state.person && state.fromEmail && (
        <CreatePersonCard email={state.fromEmail} onCreated={loadData} />
      )}

      {state.person && (
        <>
          <Accordion title="Contact Details" defaultOpen={true}>
            <PersonCard
              person={state.person}
              companies={state.companies}
              onUpdate={loadData}
            />
          </Accordion>

          {state.company && (
            <Accordion title="Company" defaultOpen={false}>
              <CompanyCard company={state.company} onUpdate={loadData} />
            </Accordion>
          )}

          <Accordion
            title={`Deals (${state.deals.length})`}
            defaultOpen={false}
          >
            <DealsSection
              deals={state.deals}
              dealStages={state.dealStages}
              personId={state.person?.id?.record_id || null}
              companyId={state.company?.id?.record_id || null}
              onUpdate={loadData}
            />
          </Accordion>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    padding: '16px',
    overflowX: 'hidden',
  },
  selectorContainer: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
  },
  selectorLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  selectWrapper: {
    position: 'relative',
    width: '100%',
  },
  select: {
    width: '100%',
    padding: '8px 32px 8px 12px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    cursor: 'pointer',
    appearance: 'none',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  selectIcon: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: 'var(--text-tertiary)',
  },
  header: {},
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  headerSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: 'var(--accent-color)',
  },
  loadingText: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  loadingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'var(--error-color)',
    color: 'white',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    textAlign: 'center',
    padding: '32px 16px',
  },
  emptyIcon: {
    color: 'var(--text-tertiary)',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    maxWidth: '400px',
  },
  debugSection: {
    marginBottom: '32px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #6c757d',
  },
  debugTitle: { fontSize: '16px', fontWeight: 600 },
  debugDescription: { fontSize: '13px', color: '#6c757d' },
  dealsHeader: { margin: '16px 0 8px 0', fontSize: '14px' },
  noDealsDebug: {
    padding: '12px',
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    fontSize: '13px',
  },
  debugDivider: {
    margin: '24px 0',
    border: 'none',
    borderTop: '2px solid #dee2e6',
  },
};

export default App;
