// Attio API Types

export interface AttioApiConfig {
  apiKey: string;
  baseUrl: string;
}

export interface AttioPerson {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  values: {
    name?: AttributeValue[];
    email_addresses?: EmailAttributeValue[];
    phone_numbers?: PhoneAttributeValue[];
    primary_location?: LocationAttributeValue[];
    job_title?: AttributeValue[];
    primary_company?: RecordReferenceAttributeValue[];
    [key: string]: AttributeValue[] | undefined;
  };
  created_at: string;
}

export interface AttioCompany {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  values: {
    name?: AttributeValue[];
    domains?: DomainAttributeValue[];
    description?: AttributeValue[];
    [key: string]: AttributeValue[] | undefined;
  };
  created_at: string;
}

export interface AttioDeal {
  id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  values: {
    name?: AttributeValue[];
    value?: NumberAttributeValue[];
    stage?: StatusAttributeValue[];
    description?: AttributeValue[];
    companies?: RecordReferenceAttributeValue[];
    people?: RecordReferenceAttributeValue[];
    created_at?: TimestampAttributeValue[];
    [key: string]: AttributeValue[] | undefined;
  };
  created_at: string;
}

export interface AttributeValue {
  value: string;
  attribute_type: string;
}

export interface EmailAttributeValue {
  email_address: string;
  attribute_type: 'email-address';
}

export interface PhoneAttributeValue {
  original_phone_number: string;
  country_code?: string;
  attribute_type: 'phone-number';
}

export interface DomainAttributeValue {
  domain: string;
  attribute_type: 'domain';
}

export interface LocationAttributeValue {
  locality?: string;
  region?: string;
  country?: string;
  attribute_type: 'location';
}

export interface NumberAttributeValue {
  value: number;
  attribute_type: 'currency' | 'number';
  currency_value?: number;
  currency?: string;
}

export interface StatusAttributeValue {
  status: {
    id: {
      workspace_id: string;
      object_id: string;
      attribute_id: string;
      status_id: string;
    };
    title: string;
  };
  attribute_type: 'status';
}

export interface RecordReferenceAttributeValue {
  referenced_record_id: string;
  target_object: string;
  attribute_type: 'record-reference';
}

export interface TimestampAttributeValue {
  value: string;
  attribute_type: 'timestamp';
}

export interface AttioRecordsResponse<T> {
  data: T[];
  next_page_token?: string;
}

export interface AttioStatusOption {
  id: {
    workspace_id: string;
    object_id: string;
    attribute_id: string;
    status_id: string;
  };
  title: string;
  is_archived: boolean;
}

export interface AttioAttribute {
  id: {
    workspace_id: string;
    object_id: string;
    attribute_id: string;
  };
  title: string;
  api_slug: string;
  type: string;
  is_system_attribute: boolean;
  is_required: boolean;
  is_unique: boolean;
  is_multiselect?: boolean;
  config?: {
    statuses?: AttioStatusOption[];
  };
}

// Plugin State Types
export interface PluginState {
  loading: boolean;
  error: string | null;
  person: AttioPerson | null;
  company: AttioCompany | null;
  deals: AttioDeal[];
  companies: AttioCompany[];
  dealStages: AttioStatusOption[];
  fromEmail: string | null;
}

// Form Types
export interface PersonFormData {
  name: string;
  email: string;
  phone: string;
  job_title: string;
  company_id: string;
}

export interface CompanyFormData {
  domain: string;
}

export interface DealFormData {
  name: string;
  value: string;
  stage_id: string;
  description: string;
}
