/** External AI tools the user can open a prompt in. */
export interface AiTool {
  id: string;
  label: string;
  /** Landing page (used when no prefill or the prompt is too long for a URL). */
  base: string;
  /** Builds a deep link that prefills the prompt, when supported. */
  prefill?: (text: string) => string;
}

export const AI_TOOLS: AiTool[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    base: 'https://chatgpt.com/',
    prefill: (t) => `https://chatgpt.com/?q=${encodeURIComponent(t)}`,
  },
  {
    id: 'claude',
    label: 'Claude',
    base: 'https://claude.ai/new',
    prefill: (t) => `https://claude.ai/new?q=${encodeURIComponent(t)}`,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    base: 'https://gemini.google.com/app',
  },
];

/** Keep prefill URLs short enough to be reliable; long prompts rely on clipboard. */
const MAX_PREFILL_LEN = 1800;

export function aiUrl(tool: AiTool, text: string): string {
  if (tool.prefill && text && text.length <= MAX_PREFILL_LEN) return tool.prefill(text);
  return tool.base;
}
