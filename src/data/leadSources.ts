import type { LeadSource } from '@/types';

/**
 * Where leads actually come from for Indian and global B2B/B2C sales teams, and
 * how leadVico pulls them in. Every channel feeds the same intake pipeline:
 * capture → de-duplicate → enrich & score → route → instant follow-up.
 */
export type ConnectMethod = 'api' | 'oauth' | 'webhook' | 'email' | 'embed' | 'sheet' | 'native' | 'file';

export interface SourceDef {
  id: string;
  name: string;
  source: LeadSource;
  group: 'Marketplaces & directories' | 'Ads & social' | 'Property portals' | 'Website & forms' | 'Calls & messaging' | 'Universal';
  method: ConnectMethod;
  hue: number;
  desc: string;
  how: string;
  fields?: { key: string; label: string; placeholder: string; help: string; secret?: boolean }[];
  oauthLabel?: string;
  pickLabel?: string;
  pickOptions?: string[];
  freq: string;
  sample: { title: string; company: string; city: string; need: string; value: number; employees: number };
}

export const METHOD_META: Record<ConnectMethod, { label: string; tone: 'brand' | 'success' | 'warning' | 'violet' | 'info' | 'neutral' | 'teal' }> = {
  api: { label: 'API sync', tone: 'brand' },
  oauth: { label: 'One-click login', tone: 'violet' },
  webhook: { label: 'Webhook', tone: 'info' },
  email: { label: 'Email parsing', tone: 'warning' },
  embed: { label: 'Website snippet', tone: 'teal' },
  sheet: { label: 'Sheet sync', tone: 'success' },
  native: { label: 'Built in', tone: 'success' },
  file: { label: 'File upload', tone: 'neutral' },
};

export const SOURCE_DEFS: SourceDef[] = [
  // Marketplaces & directories
  { id: 'indiamart', name: 'IndiaMART', source: 'IndiaMART', group: 'Marketplaces & directories', method: 'api', hue: 8,
    desc: 'Buy-leads and direct enquiries from IndiaMART Lead Manager.', how: 'IndiaMART Seller Panel → Lead Manager → Import/Export Leads → CRM Integration → generate CRM key.',
    fields: [{ key: 'key', label: 'IndiaMART CRM key', placeholder: 'mR2x…', help: 'Pulled every 5 minutes (IndiaMART’s allowed rate).', secret: true }],
    freq: 'Every 5 min', sample: { title: 'Purchase Manager', company: 'Shree Ganesh Industries', city: 'Ahmedabad', need: 'Requirement: 40-seat calling CRM, quote needed', value: 18000, employees: 120 } },
  { id: 'justdial', name: 'JustDial', source: 'JustDial', group: 'Marketplaces & directories', method: 'email', hue: 28,
    desc: 'JustDial enquiry emails & SMS alerts, parsed automatically.', how: 'Forward JustDial lead emails to your leadVico capture address (set a Gmail/Outlook auto-forward rule).',
    freq: 'Instant', sample: { title: 'Owner', company: 'Sai Krupa Enterprises', city: 'Pune', need: 'Looking for CRM software for sales team', value: 9000, employees: 35 } },
  { id: 'tradeindia', name: 'TradeIndia', source: 'TradeIndia', group: 'Marketplaces & directories', method: 'api', hue: 210,
    desc: 'Inquiries from your TradeIndia catalogue.', how: 'TradeIndia → My Inquiries → API settings → copy User ID, Profile ID and Key.',
    fields: [{ key: 'uid', label: 'User ID', placeholder: '12345678', help: '' }, { key: 'pid', label: 'Profile ID', placeholder: '87654321', help: '' }, { key: 'key', label: 'API key', placeholder: '••••••', help: 'Polled every 15 minutes.', secret: true }],
    freq: 'Every 15 min', sample: { title: 'Director', company: 'Vardhman Polymers', city: 'Ludhiana', need: 'Bulk enquiry for sales automation', value: 14000, employees: 210 } },

  // Ads & social
  { id: 'meta', name: 'Meta Lead Ads', source: 'Meta Lead Ads', group: 'Ads & social', method: 'oauth', hue: 220,
    desc: 'Facebook & Instagram instant forms — leads arrive in seconds.', how: 'Log in with Facebook, choose your Page and the lead forms to sync.',
    oauthLabel: 'Continue with Facebook', pickLabel: 'Lead forms', pickOptions: ['Free demo — Oct campaign', 'Pricing enquiry form', 'Webinar sign-up'],
    freq: 'Real time', sample: { title: 'Founder', company: 'Urban Threads', city: 'Bengaluru', need: 'Form: Free demo — Oct campaign', value: 12000, employees: 40 } },
  { id: 'google', name: 'Google Ads lead forms', source: 'Google Ads', group: 'Ads & social', method: 'webhook', hue: 140,
    desc: 'Lead form assets on Search, YouTube and Discovery.', how: 'Google Ads → Assets → Lead form → Lead delivery → Webhook integration: paste the URL and key below.',
    freq: 'Real time', sample: { title: 'Head of Sales', company: 'Pinnacle Realty', city: 'Gurugram', need: 'Search ad: “sales crm with calling”', value: 26000, employees: 160 } },
  { id: 'linkedin', name: 'LinkedIn Lead Gen Forms', source: 'LinkedIn', group: 'Ads & social', method: 'oauth', hue: 205,
    desc: 'B2B leads from Sponsored Content & Message Ads.', how: 'Log in with LinkedIn, select your ad account and forms.',
    oauthLabel: 'Continue with LinkedIn', pickLabel: 'Ad accounts', pickOptions: ['leadVico — Brand', 'leadVico — Demand gen'],
    freq: 'Every 15 min', sample: { title: 'VP Revenue', company: 'Northbridge Analytics', city: 'Mumbai', need: 'Downloaded: Sales calling playbook', value: 42000, employees: 650 } },

  // Property portals
  { id: '99acres', name: '99acres', source: '99acres', group: 'Property portals', method: 'email', hue: 200,
    desc: 'Buyer & tenant responses on your listings.', how: 'Forward 99acres response emails to your capture address, or request API access from your account manager.',
    freq: 'Instant', sample: { title: 'Home buyer', company: 'Individual', city: 'Noida', need: 'Interested in 3 BHK, Sector 150 — budget ₹1.2 Cr', value: 15000, employees: 1 } },
  { id: 'magicbricks', name: 'MagicBricks', source: 'MagicBricks', group: 'Property portals', method: 'email', hue: 355,
    desc: 'Enquiries from MagicBricks listings.', how: 'Forward MagicBricks enquiry emails to your capture address.',
    freq: 'Instant', sample: { title: 'Home buyer', company: 'Individual', city: 'Hyderabad', need: 'Enquiry on 2 BHK, Gachibowli', value: 12000, employees: 1 } },

  // Website & forms
  { id: 'website', name: 'Website forms', source: 'Website', group: 'Website & forms', method: 'embed', hue: 250,
    desc: 'Capture any existing form (contact, demo, pricing) with one snippet — no rebuild.', how: 'Paste the snippet before </body>. It captures submissions from your existing forms, plus UTM source & page.',
    freq: 'Real time', sample: { title: 'Operations Manager', company: 'Crescent Logistics', city: 'Chennai', need: 'Pricing page form · utm_source=google', value: 22000, employees: 300 } },
  { id: 'wordpress', name: 'WordPress / Elementor', source: 'Website', group: 'Website & forms', method: 'webhook', hue: 215,
    desc: 'Contact Form 7, Elementor, WPForms, Gravity Forms.', how: 'Add the webhook URL as a form action (Elementor → Actions after submit → Webhook).',
    freq: 'Real time', sample: { title: 'Marketing Lead', company: 'Lotus Wellness', city: 'Jaipur', need: 'Contact form: “Need demo for 15 users”', value: 8000, employees: 60 } },
  { id: 'gforms', name: 'Google Forms & Sheets', source: 'Google Sheets', group: 'Website & forms', method: 'sheet', hue: 145,
    desc: 'Sync rows from a Google Sheet (Forms responses, event lists, team sheets).', how: 'Share the sheet URL; new rows are imported every 5 minutes with column mapping.',
    freq: 'Every 5 min', sample: { title: 'Event attendee', company: 'Saffron Hotels', city: 'Mumbai', need: 'Expo stall sign-up sheet', value: 16000, employees: 900 } },

  // Calls & messaging
  { id: 'whatsapp', name: 'WhatsApp (Scriwo)', source: 'WhatsApp', group: 'Calls & messaging', method: 'native', hue: 145,
    desc: 'New WhatsApp numbers that message you become leads automatically.', how: 'Uses your Scriwo connection — turn on “Create a lead from new WhatsApp numbers”.',
    freq: 'Real time', sample: { title: 'Prospect', company: 'Unknown', city: 'Indore', need: 'WhatsApp: “Hi, saw your ad, need pricing”', value: 7000, employees: 20 } },
  { id: 'missedcall', name: 'Missed calls & IVR', source: 'Missed call', group: 'Calls & messaging', method: 'native', hue: 0,
    desc: 'Unknown callers and missed-call campaigns create leads with a callback task.', how: 'Uses your telephony provider (Exotel, Knowlarity, MyOperator…) call events.',
    freq: 'Real time', sample: { title: 'Caller', company: 'Unknown', city: 'Lucknow', need: 'Missed call on sales line · IVR option 2 (Sales)', value: 6000, employees: 10 } },

  // Universal
  { id: 'webhook', name: 'Webhook / REST API', source: 'API', group: 'Universal', method: 'webhook', hue: 260,
    desc: 'Any app or custom system can POST leads — Zapier, Make, Pabbly, n8n.', how: 'POST JSON to the URL with the key header. Fields: name, phone, email, company, source, notes.',
    freq: 'Real time', sample: { title: 'Customer', company: 'Shopify store — Kaveri Organics', city: 'Coimbatore', need: 'Abandoned checkout · ₹42,000 cart', value: 5000, employees: 15 } },
  { id: 'email', name: 'Email inbox', source: 'Email', group: 'Universal', method: 'email', hue: 40,
    desc: 'Forward any enquiry email; Vico AI extracts name, phone, company and need.', how: 'Forward to your capture address or set an auto-forward rule on sales@yourcompany.com.',
    freq: 'Instant', sample: { title: 'Procurement', company: 'Ironwood Constructions', city: 'Kolkata', need: 'Email: “Please share quotation for 25 licences”', value: 11000, employees: 140 } },
  { id: 'csv', name: 'CSV / Excel import', source: 'CSV import', group: 'Universal', method: 'file', hue: 120,
    desc: 'Bulk import with column mapping and duplicate merge.', how: 'Leads → Import, or drop a file here.',
    freq: 'On demand', sample: { title: 'Contact', company: 'Trade fair list', city: 'Delhi', need: 'Imported from expo-visitors.xlsx', value: 6000, employees: 50 } },
];

export const CAPTURE_EMAIL = 'leads.ws7f3k@in.leadvico.com';
export const INTAKE_WEBHOOK = 'https://api.leadvico.com/v1/leads/ws_7f3k2m';
