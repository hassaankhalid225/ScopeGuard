import { generateJson, aiEnabled } from '../lib/anthropic';

export interface ScopeAnalysis {
  verdict: 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'AMBIGUOUS';
  confidence: number; // 0-100
  reasoning: string;
  suggestedReply: string;
  estimatedHours: number | null;
  estimatedCost: number | null;
  analysedByAi: boolean;
}

interface BaselineContext {
  projectName: string;
  description: string | null;
  deliverables: string[];
  revisionsLimit: number;
  revisionsUsed: number;
  hourlyRate: number;
  currency: string;
}

const SCOPE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['IN_SCOPE', 'OUT_OF_SCOPE', 'AMBIGUOUS'] },
    confidence: { type: 'integer' },
    reasoning: { type: 'string' },
    suggestedReply: { type: 'string' },
    estimatedHours: { type: 'number' },
    estimatedCost: { type: 'integer' },
  },
  required: ['verdict', 'confidence', 'reasoning', 'suggestedReply', 'estimatedHours', 'estimatedCost'],
  additionalProperties: false,
};

/**
 * The AI Scope Sentinel. Compares a raw client request against the project
 * baseline and classifies it as in-scope / out-of-scope / ambiguous, with a
 * suggested professional reply and a price for any extra work.
 */
export async function analyseScope(
  request: string,
  ctx: BaselineContext,
): Promise<ScopeAnalysis> {
  if (aiEnabled) {
    const system = [
      'You are ScopeGuard, an AI assistant that protects freelancers from scope creep.',
      'Given a project baseline and a new client request, decide whether the request',
      'is already covered by the agreed scope/deliverables/revisions, or whether it is',
      'extra work the freelancer should charge for.',
      '',
      'Rules:',
      '- A revision request is in-scope only if the client has remaining revisions.',
      '- New features, new pages, new deliverables, or extra rounds are out-of-scope.',
      '- Be fair: do not flag clarifications or trivial fixes as out-of-scope.',
      '- For out-of-scope or ambiguous items, estimate the extra hours and compute',
      '  estimatedCost = round(estimatedHours * hourlyRate). For in-scope items set both to 0.',
      '- suggestedReply must be a polite, professional message the freelancer can send',
      '  to the client. For out-of-scope work it should propose a change order without',
      '  sounding hostile. Keep it under 120 words.',
      '- confidence is your certainty 0-100.',
    ].join('\n');

    const user = JSON.stringify({
      baseline: {
        project: ctx.projectName,
        description: ctx.description,
        deliverables: ctx.deliverables,
        revisionsIncluded: ctx.revisionsLimit,
        revisionsUsed: ctx.revisionsUsed,
        hourlyRate: ctx.hourlyRate,
        currency: ctx.currency,
      },
      clientRequest: request,
    });

    const result = await generateJson<Omit<ScopeAnalysis, 'analysedByAi'>>({
      system,
      user,
      schema: SCOPE_SCHEMA,
      maxTokens: 1500,
    });

    if (result) {
      return {
        ...result,
        confidence: clamp(result.confidence, 0, 100),
        estimatedHours: result.estimatedHours ?? null,
        estimatedCost: result.estimatedCost ?? null,
        analysedByAi: true,
      };
    }
  }

  return heuristicScope(request, ctx);
}

/**
 * Deterministic fallback used when no Anthropic key is configured (demo mode).
 * Keyword heuristics — good enough to demonstrate the flow end-to-end.
 */
function heuristicScope(request: string, ctx: BaselineContext): ScopeAnalysis {
  const text = request.toLowerCase();
  const outSignals = [
    'also',
    'additionally',
    'one more',
    'add a',
    'add an',
    'new feature',
    'new page',
    'can you also',
    'extra',
    'another round',
    'redesign',
    'rebuild',
    'while you',
    'quick favor',
    'integrate',
    'animation',
  ];
  const revisionSignals = ['revision', 'change the', 'tweak', 'adjust', 'edit the', 'update the'];

  const hitsOut = outSignals.filter((s) => text.includes(s)).length;
  const isRevision = revisionSignals.some((s) => text.includes(s));
  const revisionsLeft = ctx.revisionsLimit - ctx.revisionsUsed;

  let verdict: ScopeAnalysis['verdict'] = 'AMBIGUOUS';
  let estimatedHours: number | null = null;
  let reasoning: string;

  if (hitsOut >= 1 && !isRevision) {
    verdict = 'OUT_OF_SCOPE';
    estimatedHours = Math.max(2, hitsOut * 2);
    reasoning =
      'The request appears to add new work beyond the agreed deliverables. Phrases like "also" / "add" / "new" signal additional scope not covered by the baseline.';
  } else if (isRevision && revisionsLeft <= 0) {
    verdict = 'OUT_OF_SCOPE';
    estimatedHours = 2;
    reasoning = `This is a revision request, but the client has used all ${ctx.revisionsLimit} included revisions. Further revisions are billable.`;
  } else if (isRevision && revisionsLeft > 0) {
    verdict = 'IN_SCOPE';
    reasoning = `This is a revision and the client has ${revisionsLeft} of ${ctx.revisionsLimit} revisions remaining — it is covered.`;
  } else {
    verdict = 'AMBIGUOUS';
    reasoning =
      'Could not confidently classify this request. Review it against the baseline manually before responding.';
  }

  const estimatedCost =
    estimatedHours != null ? Math.round(estimatedHours * ctx.hourlyRate) : null;

  const suggestedReply =
    verdict === 'OUT_OF_SCOPE'
      ? `Hi! Happy to take this on. Just a heads up — this falls outside our original project scope, so I'll put together a quick change order (about ${estimatedHours} hrs / ${ctx.currency} ${estimatedCost}). Once you approve it I'll get started right away.`
      : verdict === 'IN_SCOPE'
        ? `Thanks! This is covered under our agreement — I'll take care of it and include it in the current milestone.`
        : `Thanks for the note — let me confirm a couple of details so I can scope this correctly and get back to you shortly.`;

  return {
    verdict,
    confidence: aiEnabled ? 50 : 60,
    reasoning,
    suggestedReply,
    estimatedHours,
    estimatedCost,
    analysedByAi: false,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
