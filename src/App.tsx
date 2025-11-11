import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useFrontContext } from './providers/FrontContext';
import { PersonCard } from './components/PersonCard';
import { CompanyCard } from './components/CompanyCard';
import { DealsSection } from './components/DealsSection';
import { CreatePersonCard } from './components/CreatePersonCard';
import { Accordion } from './components/Accordion'; // ✅ Added accordion import
// import { DebugPanel } from './components/DebugPanel';
// import { DebugInspector } from './components/DebugInspector';
import {
  searchPersonByEmail,
  getCompany,
  listCompanies,
  getDealsForPerson,
  getDealsForCompany,
  getDealStages,
} from './attioApi';
import { PluginState } from './types';
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

  // const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';

  const getFromEmail = async (): Promise<string | null> => {
    if (context?.type !== 'singleConversation') return null;
    try {
      const messagesResponse = await context.listMessages();
      if (messagesResponse.results.length === 0) return null;
      const firstMessage = messagesResponse.results[0];
      return firstMessage.from.handle;
    } catch (error) {
      console.error('Error getting from email:', error);
      return null;
    }
  };

  const loadData = async () => {
    if (context?.type !== 'singleConversation') return;

    console.log('🚀 Starting to load Attio data...');
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const fromEmail = await getFromEmail();
      console.log('📧 From email:', fromEmail);

      if (!fromEmail) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Could not extract email from conversation',
          fromEmail: null,
        }));
        return;
      }

      setState(prev => ({ ...prev, fromEmail }));

      const companiesPromise = listCompanies();
      const dealStagesPromise = getDealStages();
      console.log('🔍 Searching for person with email:', fromEmail);
      const person = await searchPersonByEmail(fromEmail);

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

  useEffect(() => {
    if (context?.type === 'singleConversation') loadData();
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
        {/* {isDebugMode && <DebugPanel context={context} />} */}
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
        {/* {isDebugMode && <DebugPanel context={context} />} */}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {/* <h1 style={styles.headerTitle}>Attio CRM</h1> */}
        {/* {state.fromEmail && (
          <p style={styles.headerSubtitle}>Contact: {state.fromEmail}</p>
        )} */}
      </div>

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

      {/* DEBUG MODE BLOCK COMMENTED OUT */}
      {/*
      {!state.loading && state.person && (
        <div style={styles.debugSection}>
          <h2 style={styles.debugTitle}>🐛 Debug Data Inspector</h2>
          ...
        </div>
      )}
      */}

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

      {/* {isDebugMode && <DebugPanel context={context} />} */}
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
  header: {
    // marginBottom: '20px',
    // paddingBottom: '16px',
    // borderBottom: '2px solid var(--border-color)',
  },
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
