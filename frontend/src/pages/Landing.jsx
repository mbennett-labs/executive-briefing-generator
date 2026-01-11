import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-logo">
            <span className="logo-icon">Q</span>
            <span className="logo-text">Quantum Security Labs</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-nav">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              48-Question Deep Dive Into Your
              <span className="highlight"> Quantum Risk Exposure</span>
            </h1>
            <p className="hero-subtitle">
              Complete our comprehensive assessment across 6 critical categories
              and receive an AI-powered personalized executive briefing with
              actionable recommendations tailored to your organization.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-hero">
                Start Your Assessment
              </Link>
              <p className="hero-note">LLM-powered personalized analysis</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="hero-card-header">Executive Briefing</div>
              <div className="hero-card-score">
                <span className="score-number">72</span>
                <span className="score-label">Risk Score</span>
              </div>
              <div className="hero-card-level critical">CRITICAL RISK</div>
              <div className="hero-card-items">
                <div className="card-item"></div>
                <div className="card-item"></div>
                <div className="card-item short"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quantum Threat Section */}
      <section className="threat-section">
        <div className="section-container">
          <h2 className="section-title">The Quantum Threat is Real</h2>
          <p className="section-subtitle">
            Quantum computers will break current encryption standards, exposing decades of sensitive data
          </p>

          <div className="threat-grid">
            <div className="threat-card">
              <div className="threat-icon">2030</div>
              <h3>Cryptographic Deadline</h3>
              <p>
                Experts predict cryptographically relevant quantum computers could arrive
                by 2030, potentially breaking RSA and ECC encryption that protects most
                digital communications today.
              </p>
            </div>
            <div className="threat-card">
              <div className="threat-icon">Now</div>
              <h3>Harvest Now, Decrypt Later</h3>
              <p>
                Nation-states are already collecting encrypted data today, planning to
                decrypt it once quantum computers become available. Your data from years
                ago may still be at risk.
              </p>
            </div>
            <div className="threat-card">
              <div className="threat-icon">$4.5M</div>
              <h3>Average Breach Cost</h3>
              <p>
                The average cost of a data breach continues to rise. Organizations that
                fail to prepare for quantum threats face potentially catastrophic financial
                and reputational damage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get your personalized quantum risk assessment in three simple steps
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3>Answer 48 Questions</h3>
              <p>
                Complete our deep-dive assessment across 6 categories: data sensitivity,
                encryption, compliance, vendor risk, incident response, and quantum readiness.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3>Get Your Score</h3>
              <p>
                Receive an instant risk score with detailed breakdown of your
                organization's quantum vulnerability across key areas.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3>Download Briefing</h3>
              <p>
                Get a comprehensive 8-page executive briefing with recommendations,
                cost projections, and a roadmap for quantum readiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">What's In Your Executive Briefing</h2>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-check">&#10003;</div>
              <span>Personalized risk score and analysis</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">&#10003;</div>
              <span>Top 3 vulnerability areas identified</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">&#10003;</div>
              <span>Cost of inaction projections</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">&#10003;</div>
              <span>Priority recommendations</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">&#10003;</div>
              <span>Budget estimates for remediation</span>
            </div>
            <div className="feature-item">
              <div className="feature-check">&#10003;</div>
              <span>Quantum threat timeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-container">
          <div className="pricing-card">
            <div className="pricing-header">
              <h2>Quantum Risk Executive Briefing</h2>
              <p>Complete assessment with personalized recommendations</p>
            </div>
            <div className="pricing-amount">
              <span className="currency">$</span>
              <span className="price">497</span>
              <span className="period">one-time</span>
            </div>
            <ul className="pricing-features">
              <li>48-question deep assessment across 6 categories</li>
              <li>AI-powered personalized analysis</li>
              <li>8-page executive briefing PDF</li>
              <li>Industry benchmark comparison</li>
              <li>Prioritized remediation roadmap</li>
              <li>Email delivery of your report</li>
            </ul>
            <Link to="/register" className="btn btn-pricing">
              Get Your Briefing Now
            </Link>
            <p className="pricing-guarantee">
              100% satisfaction guaranteed or your money back
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Don't Wait Until It's Too Late</h2>
          <p>
            The quantum threat is approaching. Organizations that prepare now will
            have the advantage. Start your assessment today.
          </p>
          <Link to="/register" className="btn btn-cta">
            Start Your Assessment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="logo-icon">Q</span>
              <span className="logo-text">Quantum Security Labs</span>
            </div>
            <p className="footer-tagline">
              Preparing organizations for the post-quantum era
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/register">Get Started</Link>
              <Link to="/login">Sign In</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="mailto:contact@quantumsecuritylabs.com">Contact Us</a>
              <a href="mailto:support@quantumsecuritylabs.com">Support</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Quantum Security Labs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
