export interface LeadPayload {
  name: string;
  email: string;
  country_code: string;
  phone_number: string;
  full_phone_number: string;
  organization: string;
  message: string;
  project_type: string;
  source: string;
  page: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

export interface EmailFallback {
  sendVisitorOnly?: (payload: LeadPayload) => Promise<unknown>;
  sendOwnerOnly?: (payload: LeadPayload) => Promise<unknown>;
}

export interface TrackPayload {
  event_type: string;
  path: string;
  referrer?: string;
  visitor_id?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  content?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}
