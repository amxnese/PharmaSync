import { useState, useEffect } from 'react';
import { changePassword } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password !== form.confirm) {
      return setError('New passwords do not match');
    }

    setLoading(true);

    try {
      await changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });

      setSuccess('Password changed. Redirecting to login...');

      setTimeout(() => {
        localStorage.clear();
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');

        * {
          box-sizing: border-box;
        }

        .card-enter {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }

        .card-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }

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
          transition: all 0.2s ease;
        }

        .ps-input:focus {
          border-color: #2a9d8f;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(42,157,143,0.12);
        }

        .ps-input::placeholder {
          color: #9bb5c5;
        }

        .ps-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #1a6b8a 0%, #2a9d8f 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ps-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }

        .ps-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .secondary-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: 1px solid #dbe7ee;
          background: #f8fbfd;
          color: #476171;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-btn:hover {
          background: #eef6fa;
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

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Background */}
      <div style={styles.bg}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />

        <svg style={styles.gridSvg} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(42,157,143,0.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={styles.container}>
        <div
          className={`card-enter ${mounted ? 'visible' : ''}`}
          style={styles.card}
        >

          <div style={styles.iconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect
                x="5"
                y="11"
                width="14"
                height="9"
                rx="2"
                stroke="#2a9d8f"
                strokeWidth="2"
              />
              <path
                d="M8 11V8a4 4 0 118 0v3"
                stroke="#2a9d8f"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div style={styles.header}>
            <h1 style={styles.title}>Change Password</h1>

            <p style={styles.subtitle}>
              Update your credentials to keep your PharmaSync account secure.
            </p>
          </div>

          <div style={styles.divider} />

          <form onSubmit={handleSubmit} style={styles.form}>

            <div style={styles.field}>
              <label style={styles.label}>Current password</label>

              <input
                className="ps-input"
                type="password"
                placeholder="Enter current password"
                required
                value={form.old_password}
                onChange={e =>
                  setForm({ ...form, old_password: e.target.value })
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>New password</label>

              <input
                className="ps-input"
                type="password"
                placeholder="Minimum 8 characters"
                required
                value={form.new_password}
                onChange={e =>
                  setForm({ ...form, new_password: e.target.value })
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirm password</label>

              <input
                className="ps-input"
                type="password"
                placeholder="Re-enter new password"
                required
                value={form.confirm}
                onChange={e =>
                  setForm({ ...form, confirm: e.target.value })
                }
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            {success && (
              <div style={styles.successBox}>
                {success}
              </div>
            )}

            <button
              type="submit"
              className="ps-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#f0f7fa',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },

  bg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
  },

  blob1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(42,157,143,0.16) 0%, transparent 70%)',
    top: '-180px',
    left: '-120px',
  },

  blob2: {
    position: 'absolute',
    width: '450px',
    height: '450px',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(26,107,138,0.12) 0%, transparent 70%)',
    bottom: '-120px',
    right: '-120px',
  },

  gridSvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  },

  container: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
  },

  card: {
    width: '100%',
    maxWidth: '460px',
    background: '#fff',
    borderRadius: '22px',
    padding: '2.6rem',
    border: '1px solid rgba(212,228,240,0.8)',
    boxShadow:
      '0 20px 60px rgba(26,58,74,0.12), 0 4px 16px rgba(26,58,74,0.06)',
  },

  iconWrap: {
    width: '62px',
    height: '62px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #e8f7f5 0%, #d0f0eb 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.4rem',
  },

  header: {
    marginBottom: '1.6rem',
  },

  title: {
    margin: 0,
    fontFamily: "'Playfair Display', serif",
    fontSize: '30px',
    color: '#1a2e3b',
  },

  subtitle: {
    marginTop: '0.7rem',
    color: '#7a9aaa',
    lineHeight: '1.7',
    fontSize: '14px',
  },

  divider: {
    height: '1px',
    background:
      'linear-gradient(90deg, #e8f2f7 0%, #c8dfe9 50%, #e8f2f7 100%)',
    marginBottom: '1.8rem',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },

  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#3a5a6a',
  },

  errorBox: {
    padding: '12px 14px',
    background: '#fdf0ef',
    border: '1px solid #f5c6c4',
    borderRadius: '10px',
    color: '#c0392b',
    fontSize: '13px',
  },

  successBox: {
    padding: '12px 14px',
    background: '#edfdf5',
    border: '1px solid #b7ebd0',
    borderRadius: '10px',
    color: '#059669',
    fontSize: '13px',
  },
};