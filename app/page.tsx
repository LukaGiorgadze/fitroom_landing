const CameraIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8.5 5.5 10 3.8h4l1.5 1.7H19A2.5 2.5 0 0 1 21.5 8v9A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V8A2.5 2.5 0 0 1 5 5.5h3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="12.5" r="3.6" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const SparklesIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5c.8 4.1 2.8 6.1 7 7-4.2.8-6.2 2.8-7 7-.8-4.2-2.8-6.2-7-7 4.2-.9 6.2-2.9 7-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M19 15.5c.3 1.7 1.2 2.6 3 3-1.8.3-2.7 1.2-3 3-.4-1.8-1.3-2.7-3-3 1.7-.4 2.6-1.3 3-3Z" fill="currentColor" />
  </svg>
);

const ChartIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const TargetIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand-mark ${inverse ? "brand-mark-inverse" : ""}`} aria-label="Fitroom">
      <span className="brand-dot" aria-hidden="true" />
      fitroom
    </span>
  );
}

function AppStoreBadge({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`store-badge ${dark ? "store-badge-dark" : ""}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M16.8 12.8c0-2.4 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.8.9-.8 0-2-1-3.3-1-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.5 1-1.4 1.4-2.9 1.4-3-.1 0-3.2-1.2-3.2-4.1ZM14.3 5.5A4.3 4.3 0 0 0 15.4 2a4.7 4.7 0 0 0-3.1 1.6 4 4 0 0 0-1.1 3.3 3.8 3.8 0 0 0 3.1-1.4Z" />
      </svg>
      <span><small>Coming soon on the</small>App Store</span>
    </span>
  );
}

function PhoneMockup() {
  const days = [["W", "12"], ["T", "13"], ["F", "14"], ["S", "15"], ["S", "16"], ["M", "17"], ["T", "18"]];
  return (
    <div className="phone-scene" aria-label="Fitroom app nutrition dashboard preview">
      <div className="orb orb-mint" /><div className="orb orb-violet" />
      <div className="scan-float glass-card">
        <span className="scan-float-icon"><SparklesIcon /></span>
        <span><strong>Meal analyzed</strong><small>4 foods identified</small></span>
        <span className="scan-check">✓</span>
      </div>
      <div className="macro-float glass-card">
        <span className="macro-float-dot" />
        <span><small>Protein</small><strong>82g</strong></span>
        <span className="macro-float-up">+18%</span>
      </div>
      <div className="phone-shell">
        <div className="phone-screen">
          <div className="phone-island" />
          <div className="reference-phone">
            <div className="reference-status">
              <strong>11:51</strong>
              <span className="status-cluster"><i className="status-signal" /><i className="status-wifi" /><i className="status-battery">46</i></span>
            </div>

            <div className="reference-wordmark">FITROOM</div>

            <div className="reference-week">
              {days.map(([day, date], index) => (
                <span key={date} className={index === 3 ? "active" : ""}>
                  <small>{day}</small><i /><b>{date}</b>
                </span>
              ))}
            </div>

            <div className="reference-calorie-card">
              <div className="reference-calorie-copy">
                <small>Calories left</small>
                <strong>2,268</strong>
                <span><i className="flame-mark">♨</i> Eaten&nbsp; <b>0 / 2,268 kcal</b></span>
              </div>
              <div className="reference-ring reference-ring-large"><span>0%</span></div>
            </div>

            <div className="reference-macros">
              {[['0', '/120g', 'Protein'], ['0', '/305g', 'Carbs'], ['0', '/63g', 'Fat']].map(([value, goal, label]) => (
                <div className="reference-macro-card" key={label}>
                  <strong>{value}<small>{goal}</small></strong>
                  <span>{label}</span>
                  <div className="reference-ring reference-ring-small"><span>0%</span></div>
                </div>
              ))}
            </div>

            <div className="reference-pages"><i /><i /></div>

            <div className="reference-nutrition-title"><strong>Nutrition</strong><span>Today</span></div>
            <div className="reference-nutrition-card">
              <strong>0 kcal</strong>
              <div className="reference-empty-meal">
                <span className="reference-scan-icon"><i /><i /><i /><i /></span>
                <span className="reference-empty-lines"><i /><i /></span>
                <span className="reference-mini-add">+</span>
              </div>
              <small>No foods logged<br />Start this day&apos;s meal log with +</small>
            </div>

            <div className="reference-tab-bar">
              <div className="reference-tab-pill">
                <span className="selected"><i className="home-icon"><b /></i><small>Home</small></span>
                <span><i className="progress-icon"><b /><b /><b /></i><small>Progress</small></span>
                <span><i className="profile-icon"><b /></i><small>Profile</small></span>
              </div>
              <span className="reference-add">+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanCard() {
  return (
    <div className="scan-demo">
      <div className="scan-photo">
        <div className="plate"><span className="food avocado">🥑</span><span className="food egg">🍳</span><span className="food greens">🌿</span></div>
        <div className="scan-line" />
        <span className="food-tag tag-avocado"><i />Avocado <b>160 kcal</b></span><span className="food-tag tag-egg"><i />Egg <b>95 kcal</b></span><span className="food-tag tag-greens"><i />Greens <b>10 kcal</b></span>
      </div>
      <div className="scan-summary"><span><small>Calories</small><strong>265</strong></span><span><small>Protein</small><strong>9g</strong></span><span><small>Carbs</small><strong>10g</strong></span><span><small>Fat</small><strong>22g</strong></span></div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="nav-wrap" aria-label="Main navigation">
        <a href="#top" className="nav-logo"><BrandMark /></a>
        <div className="nav-links"><a href="#how">How it works</a><a href="#features">Features</a><a href="#goals">Goals</a></div>
        <a href="#download" className="nav-cta">Get the app <ArrowIcon /></a>
      </nav>

      <section id="top" className="hero-section">
        <div className="hero-noise" />
        <div className="hero-copy">
          <div className="eyebrow"><span><SparklesIcon /></span>AI-powered calorie tracking</div>
          <h1>Snap your food.<br /><span>Know what you eat.</span></h1>
          <p>Track calories and macros in seconds. Fitroom recognizes your meal, estimates portions, and keeps your goals clear.</p>
          <div className="hero-actions"><a href="#download"><AppStoreBadge /></a><a className="text-link" href="#how">See how it works <ArrowIcon /></a></div>
          <div className="hero-proof"><span><i>✓</i>No manual searching</span><span><i>✓</i>Fully editable</span><span><i>✓</i>Built for your goal</span></div>
        </div>
        <PhoneMockup />
      </section>

      <section id="how" className="section how-section">
        <div className="section-heading centered"><div className="eyebrow soft">Simple by design</div><h2>From photo to progress<br />in a few seconds.</h2><p>Less time logging. More clarity about what you eat.</p></div>
        <div className="steps-grid">
          <article><span className="step-number">01</span><span className="step-icon mint"><CameraIcon /></span><h3>Snap your meal</h3><p>Take a photo or choose one from your library.</p></article>
          <article><span className="step-number">02</span><span className="step-icon violet"><SparklesIcon /></span><h3>See what’s inside</h3><p>AI identifies foods and estimates portions, calories, and macros.</p></article>
          <article><span className="step-number">03</span><span className="step-icon coral"><ChartIcon /></span><h3>Stay on track</h3><p>Review your day, adjust anything, and move toward your goal.</p></article>
        </div>
      </section>

      <section id="features" className="section feature-section">
        <div className="section-heading split-heading"><div><div className="eyebrow soft">Everything in one place</div><h2>Tracking that feels<br />effortless.</h2></div><p>Fitroom keeps the useful detail and removes the friction—so tracking becomes a habit you can actually keep.</p></div>
        <div className="bento-grid">
          <article className="bento-card bento-scan"><div className="card-copy"><span className="mini-label">AI MEAL ANALYSIS</span><h3>See what’s in your meal.</h3><p>Calories, portions, protein, carbs, and fat—estimated from one photo.</p></div><ScanCard /></article>
          <article className="bento-card bento-dashboard">
            <div className="card-copy"><span className="mini-label">DAILY DASHBOARD</span><h3>Your day at a glance.</h3><p>Know what’s left without digging through numbers.</p></div>
            <div className="mini-dashboard"><div className="mini-ring"><span><strong>1,346</strong><small>left</small></span></div><div className="mini-bars"><span><small>Protein</small><i><b className="bar-mint" /></i><em>64%</em></span><span><small>Carbs</small><i><b className="bar-violet" /></i><em>40%</em></span><span><small>Fat</small><i><b className="bar-coral" /></i><em>51%</em></span></div></div>
          </article>
          <article className="bento-card bento-edit">
            <div className="card-copy"><span className="mini-label">FLEXIBLE EDITING</span><h3>Change anything.</h3><p>Edit foods, portions, and nutrition—or simply tell AI what needs fixing.</p></div>
            <div className="fix-card"><span className="fix-spark"><SparklesIcon /></span><div><small>What should be fixed?</small><p>The chicken portion is smaller, and the sauce was not included.</p></div><button type="button">Fix with AI <ArrowIcon /></button></div>
          </article>
          <article className="bento-card bento-progress">
            <div className="card-copy"><span className="mini-label">PROGRESS</span><h3>See where you’re going.</h3><p>Log your weight, follow the trend, and keep your target in sight.</p></div>
            <div className="trend-card"><div className="trend-meta"><span><small>Current</small><strong>73.4 kg</strong></span><span><small>Goal</small><strong>68 kg</strong></span></div><svg viewBox="0 0 420 150" preserveAspectRatio="none" aria-label="Weight trending toward goal"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#65D6C9" stopOpacity=".32"/><stop offset="1" stopColor="#65D6C9" stopOpacity="0"/></linearGradient></defs><path className="grid-line" d="M0 35H420M0 80H420M0 125H420"/><path className="area-line" d="M0 24 C55 28 65 45 110 44 S170 67 215 69 275 88 320 93 375 112 420 118 V150 H0Z"/><path className="weight-line" d="M0 24 C55 28 65 45 110 44 S170 67 215 69 275 88 320 93 375 112 420 118"/><circle cx="420" cy="118" r="5"/></svg><span className="goal-line">Goal 68 kg</span></div>
          </article>
        </div>
      </section>

      <section id="goals" className="goal-section">
        <div className="goal-glow" />
        <div className="goal-copy"><div className="eyebrow dark"><TargetIcon />Personal daily goals</div><h2>Built around where<br />you want to go.</h2><p>Fitroom creates a daily target from your body, activity, and pace—whether you want to lose, maintain, or gain weight.</p><div className="goal-pills"><span>Lose weight</span><span>Maintain</span><span>Gain weight</span></div></div>
        <div className="goal-card"><div className="goal-card-top"><span><small>Your goal</small><strong>Lose weight</strong></span><span className="target-bubble"><TargetIcon /></span></div><div className="goal-metric"><strong>2,150</strong><span>kcal <small>daily target</small></span></div><div className="goal-divider"/><div className="goal-data"><span><small>Current</small><strong>73.4 kg</strong></span><span><small>Target</small><strong>68 kg</strong></span><span><small>Pace</small><strong>0.3 kg/wk</strong></span></div><div className="goal-progress"><i><b /></i><span>42% complete</span></div></div>
      </section>

      <section id="download" className="download-section"><div className="download-card"><span className="download-icon"><BrandMark inverse /></span><div className="download-copy"><div className="eyebrow soft">Your next meal is a snap away</div><h2>Eat with more clarity.</h2><p>Simple tracking. Personal goals. Real progress.</p></div><AppStoreBadge dark /></div></section>
      <footer><BrandMark /><p>AI-powered calorie tracking, made simple.</p><span>© 2026 Fitroom</span></footer>
    </main>
  );
}
