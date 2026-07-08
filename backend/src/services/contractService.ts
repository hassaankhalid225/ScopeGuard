import { generateText, aiEnabled } from '../lib/anthropic';

export interface ContractInput {
  freelancerName: string;
  clientName: string;
  clientCompany?: string | null;
  projectName: string;
  brief: string;
  template: string; // web-dev | design | writing | marketing | general
  jurisdiction: string; // US | UK | EU | PK
  totalBudget?: number;
  currency?: string;
  revisionsLimit?: number;
}

export interface GeneratedContract {
  body: string;
  generatedByAi: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
  'web-dev': 'Web Development',
  design: 'Design',
  writing: 'Writing & Content',
  marketing: 'Marketing',
  general: 'Freelance Services',
};

/**
 * AI Contract Generator — turns a plain-language brief into a structured,
 * legally-sound (but not legal advice) contract in markdown.
 */
export async function generateContract(input: ContractInput): Promise<GeneratedContract> {
  if (aiEnabled) {
    const system = [
      'You are ScopeGuard, drafting a clear, professional freelance contract in Markdown.',
      'The contract is a DRAFT for the freelancer to review — not legal advice.',
      'Include these sections: Parties, Scope of Work, Deliverables, Revisions,',
      'Payment Terms & Milestones, Late Payment & Fees, Intellectual Property',
      '(copyright transfers only after full payment), Scope Changes (change-order clause),',
      'Termination / Kill-Switch (work pauses on non-payment), and a Disclaimer.',
      `Tailor the language to a ${TEMPLATE_LABELS[input.template] ?? 'freelance'} project`,
      `and to ${input.jurisdiction} jurisdiction where relevant.`,
      'Always end with this exact line on its own:',
      '> _This is an AI-generated draft, not legal advice. Consult a lawyer before signing._',
    ].join('\n');

    const user = JSON.stringify(input);
    const body = await generateText({ system, user, maxTokens: 4000 });
    if (body) {
      return { body, generatedByAi: true };
    }
  }

  return { body: fallbackContract(input), generatedByAi: false };
}

/** Deterministic template used in demo mode. */
function fallbackContract(input: ContractInput): string {
  const label = TEMPLATE_LABELS[input.template] ?? 'Freelance Services';
  const money =
    input.totalBudget != null
      ? `${input.currency ?? 'USD'} ${input.totalBudget.toLocaleString()}`
      : 'as agreed in writing';
  const today = new Date().toISOString().slice(0, 10);

  return `# ${label} Agreement

**Effective date:** ${today}
**Jurisdiction:** ${input.jurisdiction}

## 1. Parties
This agreement is between **${input.freelancerName}** ("Freelancer") and **${
    input.clientCompany || input.clientName
  }** ("Client").

## 2. Scope of Work
The Freelancer will perform the following work for the project **"${input.projectName}"**:

> ${input.brief}

Work not described above is out of scope and handled via a Change Order (Section 7).

## 3. Deliverables
Deliverables are as agreed in the ScopeGuard project baseline and any attached statement of work.

## 4. Revisions
The project includes **${input.revisionsLimit ?? 2}** round(s) of revisions. Additional
revisions are billed at the Freelancer's standard hourly rate via a Change Order.

## 5. Payment Terms & Milestones
Total project fee: **${money}**. Payment is due per the milestone schedule defined in
ScopeGuard. Invoices are payable within 14 days of issue.

## 6. Late Payment & Fees
Invoices unpaid after the due date accrue a late fee of 5% per 30 days. The Freelancer
may pause work until outstanding invoices are settled.

## 7. Scope Changes
Any request beyond Section 2 requires a written Change Order specifying additional hours,
cost, and timeline. Work on changes begins only after Client approval.

## 8. Intellectual Property
All deliverables remain the property of the Freelancer until payment is received in full.
Upon full payment, ownership of the final deliverables transfers to the Client.

## 9. Termination / Kill-Switch
Either party may terminate with written notice. If the Client fails to pay, the Freelancer
may pause or suspend all work until payment is made.

## 10. Disclaimer
This contract is provided as a starting point and does not constitute legal advice.

> _This is an AI-generated draft, not legal advice. Consult a lawyer before signing._`;
}
