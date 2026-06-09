import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Variable, RotateCcw, Copy } from 'lucide-react';
import { extractVariables, fillTemplate } from '../lib/promptVars';
import { estimateTokens } from '../lib/tokens';
import { copyText } from '../lib/clipboard';
import { useToast } from '../contexts/ToastContext';

/**
 * Renders a form for every `{{var}}` / `[VAR]` placeholder in the prompt so the
 * user can produce a ready-to-use copy. Renders nothing when there are no vars.
 */
export default function VariableFiller({ template }: { template: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const vars = useMemo(() => extractVariables(template), [template]);
  const [values, setValues] = useState<Record<string, string>>({});

  if (vars.length === 0) return null;

  const filled = fillTemplate(template, values);

  const copyFilled = async () => {
    const ok = await copyText(filled);
    if (ok) toast.success('toast.copiedTokens', { tokens: estimateTokens(filled) });
    else toast.error('errors.copyFailed');
  };

  return (
    <div className="bg-card rounded-2xl border border-line p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Variable className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-content uppercase tracking-wider">
          {t('prompt.variables.title')}
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
          {vars.length}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {vars.map((v) => (
          <label key={v.token} className="block">
            <span className="text-xs font-medium text-content-soft">{v.name}</span>
            <input
              type="text"
              value={values[v.token] ?? ''}
              onChange={(e) => setValues((s) => ({ ...s, [v.token]: e.target.value }))}
              placeholder={v.name}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-line bg-card text-content placeholder-content-faint focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyFilled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-dark"
        >
          <Copy className="h-3.5 w-3.5" />
          {t('prompt.variables.copyFilled')}
        </button>
        <button
          type="button"
          onClick={() => setValues({})}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-content-soft hover:bg-subtle"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('prompt.variables.reset')}
        </button>
      </div>
    </div>
  );
}
