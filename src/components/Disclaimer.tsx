import { AlertTriangle } from 'lucide-react';

interface DisclaimerProps {
  variant?: 'screening' | 'toxin';
}

/**
 * Mandatory disclaimer shown on result screens.
 *
 * 'screening' – general screening-not-diagnosis disclaimer.
 * 'toxin'     – specific wording for adulteration/toxin screening flags.
 */
export function Disclaimer({ variant = 'screening' }: DisclaimerProps) {
  return (
    <div
      role="note"
      className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900"
    >
      <AlertTriangle
        className="w-4 h-4 mt-0.5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <p>
        {variant === 'screening' ? (
          <>
            <strong>Screening tool only.</strong> This system is a decision-support aid,
            not a replacement for accredited laboratory analysis. All values shown are{' '}
            <strong>estimated</strong>. Always confirm critical feeding decisions with a
            certified feed testing laboratory.
          </>
        ) : (
          <>
            <strong>Adulteration/toxin screening flag.</strong> This device cannot directly
            detect mycotoxins, aflatoxins, or specific adulterants. A flag indicates a
            spectral anomaly only — not confirmed contamination. Confirm with a certified
            laboratory test before taking action.
          </>
        )}
      </p>
    </div>
  );
}
