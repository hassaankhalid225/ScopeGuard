export type FreelancerType = 'DESIGNER' | 'DEVELOPER' | 'WRITER' | 'MARKETER' | 'OTHER';
export type PlanTier = 'STARTER' | 'PRO' | 'AGENCY';

export interface User {
  id: string;
  email: string;
  name: string;
  freelancerType: FreelancerType;
  niche: string | null;
  hourlyRate: number;
  currency: string;
  plan: PlanTier;
  onboarded: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  riskScore: number;
  notes: string | null;
  _count?: { projects: number; invoices: number };
}

export type ProjectStatus = 'DRAFT' | 'AWAITING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  dueDate: string | null;
  status: 'PENDING' | 'COMPLETED';
  completedAt: string | null;
  order: number;
}

export type ScopeVerdict = 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'AMBIGUOUS';

export interface ScopeAlert {
  id: string;
  sourceText: string;
  verdict: ScopeVerdict;
  confidence: number;
  reasoning: string;
  suggestedReply: string;
  estimatedHours: number | null;
  estimatedCost: number | null;
  status: 'OPEN' | 'DISMISSED' | 'CONVERTED';
  analysedByAi: boolean;
  createdAt: string;
}

export interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  extraHours: number;
  extraCost: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  approveToken: string;
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  lateFee: number;
  total: number;
  notes: string | null;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  paymentUrl: string | null;
  client?: Client;
  project?: { name: string } | null;
  items?: InvoiceItem[];
  createdAt: string;
}

export type ContractStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'DECLINED';

export interface Contract {
  id: string;
  title: string;
  template: string;
  jurisdiction: string;
  body: string;
  status: ContractStatus;
  signToken: string;
  signedByName: string | null;
  signedAt: string | null;
  generatedByAi: boolean;
  project?: { name: string } | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  totalBudget: number;
  currency: string;
  revisionsLimit: number;
  revisionsUsed: number;
  startDate: string | null;
  dueDate: string | null;
  portalToken: string;
  clientApprovedAt: string | null;
  client: Client;
  deliverables?: Deliverable[];
  milestones?: Milestone[];
  scopeAlerts?: ScopeAlert[];
  changeOrders?: ChangeOrder[];
  invoices?: Invoice[];
  _count?: { scopeAlerts: number; invoices: number };
}

export interface DashboardData {
  revenue: { earned: number; pending: number; overdue: number; currency: string };
  counts: {
    activeProjects: number;
    totalProjects: number;
    openInvoices: number;
    clients: number;
    scopeAlerts: number;
    outOfScopeCaught: number;
  };
  scope: { savedThisMonth: number; outOfScopeCount: number; creepScore: number };
  activeProjects: {
    id: string;
    name: string;
    client: string;
    status: ProjectStatus;
    percentComplete: number;
    nextMilestone: string | null;
    currency: string;
    totalBudget: number;
  }[];
  riskyClients: { id: string; name: string; riskScore: number }[];
  recentInvoices: {
    id: string;
    number: string;
    client: string;
    total: number;
    currency: string;
    status: InvoiceStatus;
    dueDate: string | null;
  }[];
}
