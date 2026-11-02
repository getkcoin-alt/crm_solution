export type Role = 'Admin' | 'Sales Manager' | 'Account Executive' | 'SDR';
export type Presence = 'online' | 'on-call' | 'away' | 'offline';
export type Team = 'Enterprise' | 'Mid-Market' | 'Growth';

export interface Rep {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  title: string;
  team: Team;
  territory: string;
  quota: number; // quarterly, USD
  hue: number;
  presence: Presence;
  joinedAt: number;
  managerId?: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employees: number;
  revenue: number; // annual USD
  city: string;
  country: string;
  ownerId: string;
  tier: 'Strategic' | 'Key' | 'Standard';
  hue: number;
  health: number; // 0-100
  description: string;
  createdAt: number;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  companyId: string;
  email: string;
  phone: string;
  ownerId: string;
  lastContactedAt: number;
  createdAt: number;
  tags: string[];
  timezone: string;
  persona: 'Decision maker' | 'Champion' | 'Influencer' | 'End user' | 'Blocker';
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Nurturing' | 'Unqualified' | 'Converted';
export type LeadSource =
  | 'Website' | 'Referral' | 'LinkedIn' | 'Webinar' | 'Cold outbound' | 'Trade show' | 'Partner' | 'Paid search'
  | 'IndiaMART' | 'JustDial' | 'TradeIndia' | 'Meta Lead Ads' | 'Google Ads' | '99acres' | 'MagicBricks' | 'WhatsApp' | 'Missed call' | 'Google Sheets' | 'API' | 'Email' | 'CSV import';

export const ALL_SOURCES: LeadSource[] = ['Website', 'IndiaMART', 'JustDial', 'TradeIndia', 'Meta Lead Ads', 'Google Ads', 'LinkedIn', '99acres', 'MagicBricks', 'WhatsApp', 'Missed call', 'Referral', 'Webinar', 'Cold outbound', 'Trade show', 'Partner', 'Paid search', 'Google Sheets', 'API', 'Email', 'CSV import'];

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companyId?: string;
  industry: string;
  employees: number;
  email: string;
  phone: string;
  city: string;
  country: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  scoreFactors: { label: string; points: number }[];
  ownerId: string | null;
  estValue: number;
  createdAt: number;
  lastActivityAt: number;
  tags: string[];
  starred?: boolean;
  dealId?: string;
}

export type Stage = 'Discovery' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface Deal {
  id: string;
  name: string;
  companyId: string;
  contactId: string;
  ownerId: string;
  stage: Stage;
  value: number;
  probability: number;
  closeDate: number;
  createdAt: number;
  stageChangedAt: number;
  product: string;
  priority: 'High' | 'Medium' | 'Low';
  nextStep: string;
  leadId?: string;
  lostReason?: string;
}

export type EntityRef = { type: 'lead' | 'contact'; id: string };

export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'completed' | 'missed' | 'voicemail' | 'no-answer';
export type Disposition = 'Interested' | 'Meeting booked' | 'Call back later' | 'Not interested' | 'Left voicemail' | 'No answer' | 'Wrong number';

export interface Call {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  ref: EntityRef;
  repId: string;
  phone: string;
  startedAt: number;
  duration: number; // seconds
  recorded: boolean;
  disposition: Disposition;
  notes: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
}

export type TaskType = 'Call' | 'Email' | 'Meeting' | 'Follow-up' | 'Demo';
export interface Task {
  id: string;
  title: string;
  type: TaskType;
  dueAt: number;
  durationMin?: number;
  priority: 'High' | 'Medium' | 'Low';
  done: boolean;
  completedAt?: number;
  ownerId: string;
  ref?: EntityRef;
  notes?: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'status' | 'deal' | 'task' | 'created' | 'whatsapp';
export interface Activity {
  id: string;
  type: ActivityType;
  at: number;
  repId: string;
  ref: EntityRef;
  title: string;
  body?: string;
  callId?: string;
}

export interface Notification {
  id: string;
  at: number;
  title: string;
  body: string;
  kind: 'deal' | 'call' | 'task' | 'lead' | 'mention';
  read: boolean;
  href?: string;
}
