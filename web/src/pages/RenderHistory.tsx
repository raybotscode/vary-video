const historyItems = [
  {
    id: 'sample-1',
    date: 'No completed API-backed batches yet',
    template: 'Insurance Ad',
    variants: 0,
    status: 'Waiting for first render',
  },
];

export default function RenderHistory() {
  return (
    <section className="page-section">
      <div className="page-title">
        <p className="eyebrow">Renders</p>
        <h1>Render History</h1>
        <p>Completed jobs will be listed here when persistent job history is added to the API.</p>
      </div>

      <div className="history-list">
        {historyItems.map((item) => (
          <article className="history-card" key={item.id}>
            <div>
              <strong>{item.template}</strong>
              <p>{item.date}</p>
            </div>
            <span>{item.variants} variants</span>
            <span className="status-pill queued">{item.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
