type HomeProps = {
  onGetStarted: () => void;
  onOpenComposer: () => void;
};

export default function Home({onGetStarted, onOpenComposer}: HomeProps) {
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
          <div className="button-row">
            <button className="primary-button" type="button" onClick={onGetStarted}>
              Get Started
            </button>
            <button className="secondary-button" type="button" onClick={onOpenComposer}>
              Scene Composer
            </button>
          </div>
        </div>

        <div className="hero-mockup" aria-label="Dashboard mockup">
          <div className="mockup-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="mockup-content">
            <div className="mockup-preview">
              <strong>Product Launch</strong>
              <p>Introducing Vary Studio</p>
              <span>Get Started Today</span>
            </div>
            <div className="mockup-panel">
              <span>Insurance Ad</span>
              <span>Real Estate</span>
              <span>Social Clip</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
