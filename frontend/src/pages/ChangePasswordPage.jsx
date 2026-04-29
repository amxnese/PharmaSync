import { useState } from 'react';
import { changePassword } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password !== form.confirm) {
      return setError('New passwords do not match');
    }

    setLoading(true);
    try {
      await changePassword({ old_password: form.old_password, new_password: form.new_password });
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Change Password</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input type="password" placeholder="Current password" required style={styles.input}
            value={form.old_password}
            onChange={e => setForm({ ...form, old_password: e.target.value })} />
          <input type="password" placeholder="New password (min 8 characters)" required style={styles.input}
            value={form.new_password}
            onChange={e => setForm({ ...form, new_password: e.target.value })} />
          <input type="password" placeholder="Confirm new password" required style={styles.input}
            value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })} />
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Updating...' : 'Change Password'}
          </button>
          <button type="button" style={styles.backBtn} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f8' },
  card: { backgroundColor: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' },
  title: { margin: '0 0 1.5rem', fontSize: '1.4rem', color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  input: { padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' },
  error: { color: '#e74c3c', fontSize: '0.9rem', margin: 0 },
  success: { color: '#059669', fontSize: '0.9rem', margin: 0 },
  btn: { padding: '0.8rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  backBtn: { padding: '0.8rem', backgroundColor: '#f1f5f9', color: '#444', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
};