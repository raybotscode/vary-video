type HomeProps = {
  onGetStarted: () => void;
};

export default function Home({onGetStarted}: HomeProps) {
  return (
    <section className="home-page">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Vary.video</p>
          <h1>Batch video variants. One template, infinite ads.</h1>
          <p>
            Create a reusable video ad template, drop in audience rows, tune the brand
            styling, and trigger a full batch render from one dashboard.
          </p>
          <button className="primary-button" type="button" onClick={onGetStarted}>
            Get Started
          </button>
        </div>

        <div className="hero-mockup" aria-label="Dashboard mockup">
          <div className="mockup-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="mockup-content">
            <div className="mockup-preview">
              <strong>Insurance Ad</strong>
              <p>Are you a 52 year old man in Dublin?</p>
              <span>Get a Quote Today</span>
            </div>
            <div className="mockup-panel">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
