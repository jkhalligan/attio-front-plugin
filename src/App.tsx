import { useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Debug flag - set to false for production
  const DEBUG = true;
  
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
  const currentConversationIdRef = useRef<string | null>(null);
  
  // Cache for static/slow-changing data
  const companiesCache = useRef<{ data: any[] | null; timestamp: number }>({ data: null, timestamp: 0 });
  const dealStagesCache = useRef<{ data: any[] | null; timestamp: number }>({ data: null, timestamp: 0 });
  const dealsCache = useRef<{ data: any[] | null; timestamp: number }>({ data: null, timestamp: 0 });
  
  // Cache duration: 5 minutes for companies/stages, 30 seconds for deals
  const CACHE_DURATION_STATIC = 5 * 60 * 1000; // 5 minutes
  const CACHE_DURATION_DEALS = 30 * 1000; // 30 seconds

  // Helper to get cached companies or fetch fresh
  const getCachedCompanies = useCallback(async () => {
    const now = Date.now();
    if (companiesCache.current.data && (now - companiesCache.current.timestamp) < CACHE_DURATION_STATIC) {
      if (DEBUG) console.log('📦 Using cached companies');
      return companiesCache.current.data;
    }
    
    if (DEBUG) console.log('🔄 Fetching fresh companies...');
    const companies = await listCompanies();
    companiesCache.current = { data: companies, timestamp: now };
    return companies;
  }, [DEBUG]);

  // Helper to get cached deal stages or fetch fresh
  const getCachedDealStages = useCallback(async () => {
    const now = Date.now();
    if (dealStagesCache.current.data && (now - dealStagesCache.current.timestamp) < CACHE_DURATION_STATIC) {
      if (DEBUG) console.log('📦 Using cached deal stages');
      return dealStagesCache.current.data;
    }
    
    if (DEBUG) console.log('🔄 Fetching fresh deal stages...');
    const stages = await getDealStages();
    dealStagesCache.current = { data: stages, timestamp: now };
    return stages;
  }, [DEBUG]);

  // Helper to get cached deals or fetch fresh
  const getCachedDeals = useCallback(async () => {
    const now = Date.now();
    if (dealsCache.current.data && (now - dealsCache.current.timestamp) < CACHE_DURATION_DEALS) {
      if (DEBUG) console.log('📦 Using cached deals (' + dealsCache.current.data.length + ' deals)');
      return dealsCache.current.data;
    }
    
    if (DEBUG) console.log('🔄 Fetching ALL deals (will cache for 30s)...');
    // Fetch all deals once - the existing getDealsForPerson already does this
    // We're just caching the result
    const deals = await getDealsForPerson('_all_');
    dealsCache.current = { data: deals, timestamp: now };
    if (DEBUG) console.log('📦 Cached ' + deals.length + ' deals');
    return deals;
  }, [DEBUG]);

  const getConversationParticipants = useCallback(async (): Promise<ConversationParticipant[]> => {
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
        
        // Add "To" recipients
        message.to?.forEach(recipient => {
          if (recipient.handle && !emailMap.has(recipient.handle)) {
            emailMap.set(recipient.handle, {
              email: recipient.handle,
              name: recipient.name || recipient.handle,
              isFirstSender: false,
            });
          }
        });
        
        // Add CC recipients
        message.cc?.forEach(recipient => {
          if (recipient.handle && !emailMap.has(recipient.handle)) {
            emailMap.set(recipient.handle, {
              email: recipient.handle,
              name: recipient.name || recipient.handle,
              isFirstSender: false,
            });
          }
        });
        
        // Add BCC recipients (optional, might want to exclude these)
        message.bcc?.forEach(recipient => {
          if (recipient.handle && !emailMap.has(recipient.handle)) {
            emailMap.set(recipient.handle, {
              email: recipient.handle,
              name: recipient.name || recipient.handle,
              isFirstSender: false,
            });
          }
        });
      });
      
      // Convert to array and filter out avenirthinking.com addresses
      let participantList = Array.from(emailMap.values());
      
      // Filter out avenirthinking.com email addresses
      participantList = participantList.filter(p => 
        !p.email.toLowerCase().endsWith('@avenirthinking.com')
      );
      
      // Sort: first sender first, then alphabetically
      participantList.sort((a, b) => {
        if (a.isFirstSender) return -1;
        if (b.isFirstSender) return 1;
        return a.name.localeCompare(b.name);
      });
      
      if (DEBUG) console.log('👥 All participants (excluding avenirthinking.com):', participantList.map(p => `${p.name} <${p.email}>`));
      
      return participantList;
    } catch (error) {
      console.error('Error getting conversation participants:', error);
      return [];
    }
  }, [context]);

  const loadData = useCallback(async (emailToLoad?: string, forceReload = false) => {
    if (context?.type !== 'singleConversation') {
      if (DEBUG) console.log('❌ Not a single conversation, skipping load');
      return;
    }

    if (DEBUG) console.log('🚀 Starting to load Attio data...', { emailToLoad, forceReload });
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Only fetch participants on force reload (new conversation) or if not already loaded
      let participantList = participants;
      if (forceReload || participants.length === 0) {
        participantList = await getConversationParticipants();
      } else {
        if (DEBUG) console.log('📦 Using existing participants list');
      }
      
      if (participantList.length === 0) {
        if (DEBUG) console.log('❌ No participants found');
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Could not extract email from conversation',
          fromEmail: null,
        }));
        setParticipants([]);
        setSelectedEmail(null);
        return;
      }
      
      // Update participants list only if changed
      if (forceReload || participants.length === 0) {
        setParticipants(participantList);
      }
      
      // Determine which email to load
      let targetEmail = emailToLoad;
      
      if (!targetEmail && forceReload) {
        targetEmail = participantList[0].email;
        setSelectedEmail(targetEmail);
      } 
      else if (!targetEmail) {
        targetEmail = selectedEmail || participantList[0].email;
        if (!selectedEmail) {
          setSelectedEmail(targetEmail);
        }
      } else {
        setSelectedEmail(targetEmail);
      }

      if (DEBUG) console.log('📧 Loading contact for email:', targetEmail);
      setState(prev => ({ ...prev, fromEmail: targetEmail }));

      // Use cached companies and deal stages
      const companiesPromise = getCachedCompanies();
      const dealStagesPromise = getCachedDealStages();
      
      if (DEBUG) console.log('🔍 Searching for person with email:', targetEmail);
      const person = await searchPersonByEmail(targetEmail);

      if (!person) {
        if (DEBUG) console.log('❌ No person found in Attio for:', targetEmail);
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

      if (DEBUG) console.log('✅ Person found! Record ID:', person?.id?.record_id);
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

      if (DEBUG) console.log('🏢 Company ID from person:', companyId);

      // Get all deals from cache once, then filter client-side for both person and company
      const [companies, dealStages, allDeals] = await Promise.all([
        companiesPromise,
        dealStagesPromise,
        getCachedDeals(),
      ]);

      // Filter deals for this person
      const dealsForPerson = allDeals.filter(deal => {
        if (!deal || !deal.values) return false;
        const personAttributes = ['associated_people', 'people', 'person', 'contacts', 'contact', 'primary_contact'];
        for (const attr of personAttributes) {
          const values = deal.values[attr];
          if (Array.isArray(values)) {
            for (const value of values) {
              const refId = value?.target_record_id || value?.referenced_record_id || value?.record_id;
              if (refId === person.id.record_id) {
                return true;
              }
            }
          }
        }
        return false;
      });

      let company = null;
      let dealsForCompany: any[] = [];
      if (companyId) {
        if (DEBUG) console.log('🏢 Loading company:', companyId);
        company = await getCompany(companyId);
        
        // Filter deals for this company from the same cached list
        dealsForCompany = allDeals.filter(deal => {
          if (!deal || !deal.values) return false;
          const companyAttributes = ['associated_company', 'company', 'companies', 'organization', 'organizations'];
          for (const attr of companyAttributes) {
            const values = deal.values[attr];
            if (Array.isArray(values)) {
              for (const value of values) {
                const refId = value?.target_record_id || value?.referenced_record_id || value?.record_id;
                if (refId === companyId) {
                  return true;
                }
              }
            }
          }
          return false;
        });
        
        if (DEBUG) console.log('💼 Deals found for company:', dealsForCompany.length);
      }

      const combinedDeals = [...dealsForPerson, ...dealsForCompany];
      const validDeals = combinedDeals.filter(deal => deal && deal.id && deal.id.record_id);
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

      if (DEBUG) console.log('✅ Total unique deals:', uniqueDeals.length);

      setState(prev => ({
        ...prev,
        loading: false,
        person,
        company,
        deals: uniqueDeals,
        companies,
        dealStages,
      }));

      if (DEBUG) console.log('✅ Data loading complete!');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, [context, getConversationParticipants, getCachedCompanies, getCachedDealStages, getCachedDeals, selectedEmail, participants, DEBUG]);

  const handleContactChange = useCallback((email: string) => {
    if (DEBUG) console.log('🔄 Contact changed to:', email);
    setSelectedEmail(email);
    loadData(email, false);
  }, [loadData, DEBUG]);

  // Effect to handle conversation changes and initial load
  useEffect(() => {
    if (context?.type === 'singleConversation') {
      const conversationId = context.conversation.id;
      
      // Check if this is a new conversation
      if (conversationId !== currentConversationIdRef.current) {
        if (DEBUG) {
          console.log('🔄 Conversation changed!', {
            previous: currentConversationIdRef.current,
            new: conversationId
          });
        }
        
        // Update the ref immediately
        currentConversationIdRef.current = conversationId;
        
        // Reset all state for new conversation
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
        
        // Load data for new conversation with force reload flag
        loadData(undefined, true);
      }
    } else if (currentConversationIdRef.current !== null) {
      // Only reset when transitioning FROM a conversation TO no conversation
      // This prevents infinite loop by only running once when going from conversation to null
      if (DEBUG) console.log('🔄 No single conversation selected, resetting...');
      currentConversationIdRef.current = null;
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
    }
  }, [context, loadData, DEBUG]);

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
        <CreatePersonCard email={state.fromEmail} onCreated={() => loadData(undefined, true)} />
      )}

      {state.person && (
        <>
          <Accordion title="Contact Details" defaultOpen={true}>
            <PersonCard
              person={state.person}
              companies={state.companies}
              onUpdate={() => loadData(undefined, true)}
            />
          </Accordion>

          {state.company && (
            <Accordion title="Company" defaultOpen={false}>
              <CompanyCard company={state.company} onUpdate={() => loadData(undefined, true)} />
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
              onUpdate={() => loadData(undefined, true)}
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
