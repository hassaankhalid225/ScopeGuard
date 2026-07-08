import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

/**
 * Thin wrapper around the Anthropic SDK.
 *
 * The PRD names "Claude API (Anthropic)" as the AI engine for scope analysis,
 * contract generation and email drafting. We default to `claude-opus-4-8` with
 * adaptive thinking. When no API key is configured the wrapper is `disabled`
 * and callers fall back to deterministic heuristics so the product still runs.
 */

let client: Anthropic | null = null;

if (env.anthropic.enabled) {
  client = new Anthropic({ apiKey: env.anthropic.apiKey });
}

export const aiEnabled = env.anthropic.enabled;

interface JsonCallOptions {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}

/**
 * Run a single structured-output request and return the parsed JSON object.
 * Returns `null` if the model refuses, the call fails, or AI is disabled.
 */
export async function generateJson<T>(opts: JsonCallOptions): Promise<T | null> {
  if (!client) return null;

  try {
    // Built as a loose object because the pinned SDK version may not yet type
    // `output_config` / adaptive thinking; the API accepts them.
    const params = {
      model: env.anthropic.model,
      max_tokens: opts.maxTokens ?? 2000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema: opts.schema } },
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    } as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming;

    const response = await client.messages.create(params);

    if ((response.stop_reason as string) === 'refusal') return null;

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;
    return JSON.parse(text.text) as T;
  } catch (err) {
    console.error('[anthropic] generateJson failed:', (err as Error).message);
    return null;
  }
}

interface TextCallOptions {
  system: string;
  user: string;
  maxTokens?: number;
}

/** Run a single request and return the model's text. Returns `null` on failure. */
export async function generateText(opts: TextCallOptions): Promise<string | null> {
  if (!client) return null;

  try {
    const params = {
      model: env.anthropic.model,
      max_tokens: opts.maxTokens ?? 4000,
      thinking: { type: 'adaptive' },
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    } as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming;

    const response = await client.messages.create(params);

    if ((response.stop_reason as string) === 'refusal') return null;

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  } catch (err) {
    console.error('[anthropic] generateText failed:', (err as Error).message);
    return null;
  }
}
