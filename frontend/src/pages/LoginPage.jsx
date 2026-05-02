import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.role === 'doctor') navigate('/doctor');
      else if (data.role === 'pharmacist') navigate('/pharmacist');
      else setError('Your account has no role assigned.');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ps-input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #d4e4f0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2e3b;
          background: #f7fbfe;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .ps-input:focus {
          border-color: #2a9d8f;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(42,157,143,0.12);
        }
        .ps-input::placeholder { color: #9bb5c5; }

        .ps-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #1a6b8a 0%, #2a9d8f 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, transform 0.15s;
          position: relative;
          overflow: hidden;
        }
        .ps-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .ps-btn:active:not(:disabled) { transform: translateY(0); }
        .ps-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .ps-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
        }

        .forgot-link {
          color: #2a9d8f;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s;
          padding: 0;
        }
        .forgot-link:hover { color: #1a6b8a; text-decoration: underline; }

        .card-enter {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .card-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .left-enter {
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s;
        }
        .left-enter.visible { opacity: 1; transform: translateX(0); }

        .pulse-ring {
          animation: pulseRing 3s ease-in-out infinite;
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.04); }
        }

        .cross-float {
          animation: floatCross 6s ease-in-out infinite;
        }
        @keyframes floatCross {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dot-1 { animation: blink 2s ease-in-out infinite 0s; }
        .dot-2 { animation: blink 2s ease-in-out infinite 0.6s; }
        .dot-3 { animation: blink 2s ease-in-out infinite 1.2s; }
        @keyframes blink {
          0%, 100% { opacity: 0.3; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Background */}
      <div style={styles.bg}>
        {/* Decorative blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />

        {/* Grid pattern */}
        <svg style={styles.gridSvg} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(42,157,143,0.08)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={styles.layout}>

        {/* LEFT PANEL */}
        <div className={`left-enter ${mounted ? 'visible' : ''}`} style={styles.leftPanel}>

          {/* Logo */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <div className="cross-float">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="12" y="4" width="8" height="24" rx="2" fill="white" opacity="0.95"/>
                  <rect x="4" y="12" width="24" height="8" rx="2" fill="white" opacity="0.95"/>
                </svg>
              </div>
            </div>
            <div>
              <div style={styles.logoText}>PharmaSync</div>
              <div style={styles.logoSub}>Healthcare Platform</div>
            </div>
          </div>

          {/* Headline */}
          <div style={styles.headline}>
            <div style={styles.headlineTag}>Clinic Management System</div>
            <h1 style={styles.headlineTitle}>
              Connecting<br />
              <span style={styles.headlineAccent}>Doctors</span> &<br />
              <span style={styles.headlineAccent}>Pharmacies</span>
            </h1>
            <p style={styles.headlineDesc}>
              Real-time prescription management and inventory synchronization for modern healthcare workflows.
            </p>
          </div>

          {/* Feature dots */}
          <div style={styles.features}>
            {[
              { label: 'Live inventory alerts', color: '#2a9d8f' },
              { label: 'Prescription tracking', color: '#264653' },
              { label: 'Patient history', color: '#e9c46a' },
            ].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span
                  className={`dot-${i + 1}`}
                  style={{ ...styles.featureDot, background: f.color }}
                />
                <span style={styles.featureLabel}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Decorative rings */}
          <div style={styles.ringContainer}>
            <div className="pulse-ring" style={styles.ring1} />
            <div className="pulse-ring" style={{ ...styles.ring1, ...styles.ring2 }} />
          </div>
        </div>

        {/* RIGHT PANEL — Login Card */}
        <div style={styles.rightPanel}>
          <div className={`card-enter ${mounted ? 'visible' : ''}`} style={styles.card}>

            {/* Card header */}
            <div style={styles.cardHeader}>
              <div style={styles.cardIconWrap}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12z" fill="#2a9d8f"/>
                  <path d="M12 14.4c-5.28 0-9.6 2.64-9.6 5.88V21.6h19.2v-1.32c0-3.24-4.32-5.88-9.6-5.88z" fill="#2a9d8f" opacity="0.7"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.cardTitle}>Welcome back</h2>
                <p style={styles.cardSub}>Sign in to your account</p>
              </div>
            </div>

            <div style={styles.divider} />

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email address</label>
                <input
                  className="ps-input"
                  type="email"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>Password</label>
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => navigate('/reset-password')}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  className="ps-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="7" stroke="#c0392b" strokeWidth="1.5"/>
                    <path d="M8 5v3.5M8 11v.5" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="ps-btn" disabled={loading} style={{ marginTop: '4px' }}>
                {loading ? (
                  <><span className="spinner" />Signing in...</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={styles.cardFooter}>
              <div style={styles.footerBadge}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" fill="#2a9d8f" opacity="0.8"/>
                </svg>
                Secure connection
              </div>
              <div style={styles.footerBadge}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="#2a9d8f" strokeWidth="1.5" opacity="0.8"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="#2a9d8f" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
                </svg>
                HIPAA compliant
              </div>
            </div>
          </div>

          {/* Bottom credit */}
          <p style={styles.credit}>PharmaSync © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    background: '#f0f7fa',
  },
  bg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
  },
  blob1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(42,157,143,0.18) 0%, transparent 70%)',
    top: '-200px',
    left: '-150px',
  },
  blob2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26,107,138,0.15) 0%, transparent 70%)',
    bottom: '-100px',
    right: '-100px',
  },
  blob3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(233,196,106,0.12) 0%, transparent 70%)',
    top: '40%',
    left: '30%',
  },
  gridSvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },
  layout: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'stretch',
  },

  // LEFT PANEL
  leftPanel: {
    flex: '0.85',
    background: 'linear-gradient(145deg, #1a3a4a 0%, #1a6b8a 50%, #2a9d8f 100%)',
    padding: '3rem 3.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    minWidth: '420px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '22px',
    fontWeight: '600',
    color: '#fff',
    letterSpacing: '0.3px',
  },
  logoSub: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  headline: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '1.2rem',
    padding: '3rem 0',
  },
  headlineTag: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    padding: '5px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  headlineTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '44px',
    fontWeight: '600',
    color: '#fff',
    lineHeight: '1.15',
  },
  headlineAccent: {
    color: '#7de8d8',
  },
  headlineDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: '1.7',
    maxWidth: '340px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  featureDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
  },
  ringContainer: {
    position: 'absolute',
    bottom: '-80px',
    right: '-80px',
    pointerEvents: 'none',
  },
  ring1: {
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.15)',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  ring2: {
    width: '220px',
    height: '220px',
    animationDelay: '1.5s',
    bottom: '40px',
    right: '40px',
  },

  // RIGHT PANEL
  rightPanel: {
  flex: 1,
  maxWidth: '620px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 4rem',
  margin: '0 auto',
},
  card: {
    width: '100%',
    background: '#fff',
    borderRadius: '20px',
    padding: '2.8rem',
    boxShadow: '0 20px 60px rgba(26,58,74,0.12), 0 4px 16px rgba(26,58,74,0.06)',
    border: '1px solid rgba(212,228,240,0.8)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '1.5rem',
  },
  cardIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #e8f7f5 0%, #d0f0eb 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '22px',
    fontWeight: '600',
    color: '#1a2e3b',
    margin: 0,
  },
  cardSub: {
    fontSize: '13px',
    color: '#7a9aaa',
    margin: '3px 0 0',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, #e8f2f7 0%, #c8dfe9 50%, #e8f2f7 100%)',
    marginBottom: '1.8rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#3a5a6a',
    letterSpacing: '0.2px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#fdf0ef',
    border: '1px solid #f5c6c4',
    borderRadius: '8px',
    color: '#c0392b',
    fontSize: '13.5px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '1.8rem',
    paddingTop: '1.4rem',
    borderTop: '1px solid #eef4f7',
  },
  footerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    color: '#7a9aaa',
  },
  credit: {
    marginTop: '1.5rem',
    fontSize: '12px',
    color: '#9bb5c5',
    textAlign: 'center',
  },
};
