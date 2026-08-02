import type {PropsWithChildren} from 'react';

type WorkflowSectionProps = PropsWithChildren<{
  step: string;
  title: string;
  hint?: string;
  rightSlot?: React.ReactNode;
}>;

/**
 * Presentational wrapper for the dashboard workflow steps.
 * Renders the step eyebrow + title + optional right slot and children.
 */
export default function WorkflowSection({
  step,
  title,
  hint,
  rightSlot,
  children,
}: WorkflowSectionProps) {
  return (
    <section className="step-card workflow-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{step}</p>
          <h2>{title}</h2>
        </div>
        {rightSlot}
      </div>
      {hint && <p className="workflow-hint">{hint}</p>}
      {children}
    </section>
  );
}
