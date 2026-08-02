import EmptyState from '../components/ui/EmptyState';

export default function RenderHistory() {
  return (
    <section className="page-section">
      <div className="page-title">
        <p className="eyebrow">Renders</p>
        <h1>Render History</h1>
        <p>Completed jobs will be listed here when persistent job history is added to the API.</p>
      </div>

      <EmptyState
        title="No render history yet"
        description="Start a batch render and your completed jobs will appear here with per-variant downloads."
      />
    </section>
  );
}
