import {
  AttioApiConfig,
  AttioPerson,
  AttioCompany,
  AttioDeal,
  AttioRecordsResponse,
  AttioAttribute,
  AttioStatusOption,
} from './types';

const ATTIO_CONFIG: AttioApiConfig = {
  apiKey: import.meta.env.VITE_ATTIO_API_KEY,
  baseUrl: 'https://api.attio.com/v2',
};

const PEOPLE_OBJECT_ID = 'ed6666f8-0d62-45d1-976a-e6cddc20cb40';
const COMPANY_OBJECT_ID = 'c5737efd-39f5-489e-a628-a3042a172775';
const DEAL_OBJECT_ID = '7d663994-057f-44f6-80cd-b3f2e768f025';

// Helper function to make API requests
async function attioFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ATTIO_CONFIG.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${ATTIO_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Attio API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Search for a person by email
export async function searchPersonByEmail(email: string): Promise<AttioPerson | null> {
  try {
    const response = await attioFetch<AttioRecordsResponse<AttioPerson>>(
      `/objects/${PEOPLE_OBJECT_ID}/records/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            email_addresses: {
              $contains: email,
            },
          },
          limit: 1,
        }),
      }
    );

    const person = response.data[0] || null;
    
    if (person) {
      console.log('ðŸ” Person found in Attio:', {
        recordId: person.id?.record_id,
        availableAttributes: Object.keys(person.values || {}),
        fullPersonData: person
      });
    }

    return person;
  } catch (error) {
    console.error('Error searching person by email:', error);
    throw error;
  }
}

// Get a person by ID
export async function getPerson(recordId: string): Promise<AttioPerson> {
  try {
    const response = await attioFetch<{ data: AttioPerson }>(
      `/objects/${PEOPLE_OBJECT_ID}/records/${recordId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching person:', error);
    throw error;
  }
}

// Create a new person
export async function createPerson(data: {
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  company_id?: string;
}): Promise<AttioPerson> {
  // Parse name into first and last name
  const nameParts = data.name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const values: any = {
    name: [{
      first_name: firstName,
      last_name: lastName,
      full_name: data.name
    }],
    email_addresses: [{ email_address: data.email }],
  };

  if (data.phone) {
    values.phone_numbers = [{ original_phone_number: data.phone }];
  }

  if (data.job_title) {
    values.job_title = [{ value: data.job_title }];
  }

  if (data.company_id) {
    values.company = [{
      target_object: 'companies',
      target_record_id: data.company_id,
    }];
  }

  const response = await attioFetch<{ data: AttioPerson }>(
    `/objects/${PEOPLE_OBJECT_ID}/records`,
    {
      method: 'POST',
      body: JSON.stringify({ data: { values } }),
    }
  );
  
  return response.data;
}

// Update a person
export async function updatePerson(
  recordId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    job_title?: string;
    company_id?: string;
  }
): Promise<AttioPerson> {
  const values: any = {};

  if (data.name !== undefined) {
    // Parse name into first and last name
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    values.name = [{
      first_name: firstName,
      last_name: lastName,
      full_name: data.name
    }];
  }

  if (data.email !== undefined) {
    values.email_addresses = [{ email_address: data.email }];
  }

  if (data.phone !== undefined) {
    values.phone_numbers = data.phone ? [{ original_phone_number: data.phone }] : [];
  }

  if (data.job_title !== undefined) {
    values.job_title = data.job_title ? [{ value: data.job_title }] : [];
  }

  if (data.company_id !== undefined) {
    values.company = data.company_id
      ? [{
          target_object: 'companies',
          target_record_id: data.company_id,
        }]
      : [];
  }

  const response = await attioFetch<{ data: AttioPerson }>(
    `/objects/${PEOPLE_OBJECT_ID}/records/${recordId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ data: { values } }),
    }
  );
  
  return response.data;
}

// Get a company by ID
export async function getCompany(recordId: string): Promise<AttioCompany> {
  try {
    const response = await attioFetch<{ data: AttioCompany }>(
      `/objects/${COMPANY_OBJECT_ID}/records/${recordId}`
    );
    
    console.log('ðŸ¢ Company fetched - full response:', response);
    console.log('ðŸ¢ Company data object:', response.data);
    console.log('ðŸ¢ Company name from values:', response.data?.values?.name?.[0]?.value);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

// List all companies
export async function listCompanies(): Promise<AttioCompany[]> {
  try {
    const response = await attioFetch<AttioRecordsResponse<AttioCompany>>(
      `/objects/${COMPANY_OBJECT_ID}/records/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          sorts: [{ attribute: 'name', direction: 'asc' }],
          limit: 500,
        }),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error listing companies:', error);
    return [];
  }
}

// Update a company
export async function updateCompany(
  recordId: string,
  data: {
    domain?: string;
  }
): Promise<AttioCompany> {
  const values: any = {};

  if (data.domain !== undefined) {
    values.domains = data.domain ? [{ domain: data.domain }] : [];
  }

  const response = await attioFetch<{ data: AttioCompany }>(
    `/objects/${COMPANY_OBJECT_ID}/records/${recordId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ data: { values } }),
    }
  );
  
  return response.data;
}

// Helper function to safely get record ID from a record reference value
function getRecordIdFromReference(ref: any): string | null {
  if (!ref) return null;
  return ref.target_record_id || ref.referenced_record_id || ref.record_id || null;
}

// Helper function to check if a deal is related to a person
function isDealRelatedToPerson(deal: AttioDeal, personId: string): boolean {
  if (!deal || !deal.values) return false;
  
  // Check all possible person reference attributes
  const personAttributes = ['associated_people', 'people', 'person', 'contacts', 'contact', 'primary_contact'];
  
  for (const attr of personAttributes) {
    const values = deal.values[attr];
    if (Array.isArray(values)) {
      for (const value of values) {
        const refId = getRecordIdFromReference(value);
        if (refId === personId) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Helper function to check if a deal is related to a company
function isDealRelatedToCompany(deal: AttioDeal, companyId: string): boolean {
  if (!deal || !deal.values) return false;
  
  // Check all possible company reference attributes
  const companyAttributes = ['associated_company', 'companies', 'company', 'organization', 'organizations', 'primary_company'];
  
  for (const attr of companyAttributes) {
    const values = deal.values[attr];
    if (Array.isArray(values)) {
      for (const value of values) {
        const refId = getRecordIdFromReference(value);
        if (refId === companyId) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Get deals related to a person - simplified approach: get all deals, filter client-side
export async function getDealsForPerson(personId: string): Promise<AttioDeal[]> {
  console.log('ðŸ” Getting deals for person (client-side filtering):', personId);
  
  try {
    // Get all deals (or at least a large batch)
    const response = await attioFetch<AttioRecordsResponse<AttioDeal>>(
      `/objects/${DEAL_OBJECT_ID}/records/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          limit: 500, // Get a large batch
        }),
      }
    );
    
    console.log(`ðŸ“Š Retrieved ${response.data.length} total deals, filtering client-side...`);
    
    // Filter deals client-side
    let relatedDeals: AttioDeal[];
    if (personId === '_all_') {
      console.log('Returning all deals (no filtering)');
      relatedDeals = response.data;
    } else {
      relatedDeals = response.data.filter(deal => isDealRelatedToPerson(deal, personId));
      console.log(`Found ${relatedDeals.length} deals related to person ${personId}`);
    }
    
    // Filter out any invalid deals
    const validDeals = relatedDeals.filter(deal => 
      deal && 
      deal.id && 
      deal.id.record_id
    );
    
    return validDeals;
  } catch (error) {
    console.error('âŒ Error getting deals for person:', error);
    return [];
  }
}

// Get deals related to a company - simplified approach: get all deals, filter client-side
export async function getDealsForCompany(companyId: string): Promise<AttioDeal[]> {
  console.log('ðŸ” Getting deals for company (client-side filtering):', companyId);
  
  try {
    // Get all deals (or at least a large batch)
    const response = await attioFetch<AttioRecordsResponse<AttioDeal>>(
      `/objects/${DEAL_OBJECT_ID}/records/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          limit: 500, // Get a large batch
        }),
      }
    );
    
    console.log(`ðŸ“Š Retrieved ${response.data.length} total deals, filtering client-side...`);
    
    // Filter deals client-side
    const relatedDeals = response.data.filter(deal => isDealRelatedToCompany(deal, companyId));
    
    console.log(`âœ… Found ${relatedDeals.length} deals related to company ${companyId}`);
    
    // Filter out any invalid deals
    const validDeals = relatedDeals.filter(deal => 
      deal && 
      deal.id && 
      deal.id.record_id
    );
    
    return validDeals;
  } catch (error) {
    console.error('âŒ Error getting deals for company:', error);
    return [];
  }
}

// Create a new deal
export async function createDeal(data: {
  name: string;
  value: number;
  stage_id: string;
  description?: string;
  person_id?: string;
  company_id?: string;
}): Promise<AttioDeal> {
  const values: any = {
    name: [{ value: data.name }],
    value: [{ currency_value: data.value }],
  };

  // Add stage if provided
  if (data.stage_id) {
    const [_workspaceId, _objectId, _attributeId, _statusId] = data.stage_id.split('|');
    values.stage = [{ status: _statusId }];
  }

  if (data.description) {
    values.description = [{ value: data.description }];
  }

  if (data.person_id) {
    values.associated_people = [{
      target_object: 'people',
      target_record_id: data.person_id,
    }];
  }

  if (data.company_id) {
    values.associated_company = [{
      target_object: 'companies',
      target_record_id: data.company_id,
    }];
  }

  const response = await attioFetch<{ data: AttioDeal }>(
    `/objects/${DEAL_OBJECT_ID}/records`,
    {
      method: 'POST',
      body: JSON.stringify({ data: { values } }),
    }
  );
  
  return response.data;
}

// Get deal stages (status options for the stage attribute)
export async function getDealStages(): Promise<AttioStatusOption[]> {
  try {
    // First, get the attributes to find the stage attribute ID
    const attributesResponse = await attioFetch<{ data: AttioAttribute[] }>(
      `/objects/${DEAL_OBJECT_ID}/attributes`
    );
    
    const stageAttribute = attributesResponse.data.find(attr => attr.api_slug === 'stage');
    
    if (!stageAttribute) {
      console.error('No stage attribute found on deals object');
      return [];
    }
    
    // Fetch statuses from the statuses endpoint
    const statusesResponse = await attioFetch<{ data: AttioStatusOption[] }>(
      `/objects/${DEAL_OBJECT_ID}/attributes/${stageAttribute.id.attribute_id}/statuses`
    );
    
    return statusesResponse.data.filter(status => !status.is_archived);
  } catch (error) {
    console.error('Error getting deal stages:', error);
    return [];
  }
}
