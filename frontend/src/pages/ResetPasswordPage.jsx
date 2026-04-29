import { useState } from 'react';
import { requestOTP, resetPassword } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOTP(email);
      setStep(2); // always move to step 2 — we don't reveal if email exists
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (form.new_password !== form.confirm) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp: form.otp, new_password: form.new_password });
      setSuccess('Password reset successfully. Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} style={styles.form}>
            <p style={styles.hint}>Enter your email and we'll send you a 6-digit OTP.</p>
            <input type="email" placeholder="Your email" required style={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)} />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button type="button" style={styles.backBtn} onClick={() => navigate('/')}>
              Back to Login
            </button>
          </form>
        )}

        {/* Step 2 — OTP + new password */}
        {step === 2 && (
          <form onSubmit={handleReset} style={styles.form}>
            <p style={styles.hint}>Check your email for the OTP. It expires in 10 minutes.</p>
            <input type="text" placeholder="6-digit OTP" required maxLength={6} style={styles.input}
              value={form.otp}
              onChange={e => setForm({ ...form, otp: e.target.value })} />
            <input type="password" placeholder="New password (min 8 characters)" required style={styles.input}
              value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })} />
            <input type="password" placeholder="Confirm new password" required style={styles.input}
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} />
            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" style={styles.backBtn} onClick={() => setStep(1)}>
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8' },
  card: { backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' },
  title: { margin: '0 0 1rem', fontSize: '1.4rem', color: '#1a1a2e' },
  hint: { color: '#666', fontSize: '0.9rem', margin: '0 0 1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  input: { padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' },
  error: { color: '#e74c3c', fontSize: '0.9rem', margin: 0 },
  success: { color: '#059669', fontSize: '0.9rem', margin: 0 },
  btn: { padding: '0.8rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  backBtn: { padding: '0.8rem', backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
};