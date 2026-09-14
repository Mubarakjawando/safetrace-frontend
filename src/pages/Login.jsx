import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(phone_number, password);
      login(data.user, data.token);
      navigate(data.user.is_admin ? '/admin' : '/map');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-reveal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="mono-label" style={{ letterSpacing: '0.12em', marginBottom: 6 }}>ABEOKUTA</div>
          <h1 style={{ fontSize: 34 }}>Welcome back</h1>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: 15 }}>
            Log in to start a watched journey.
          </p>
        </div>

        <div className="strata-card">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="field-label">Phone number</label>
              <input className="field-input" value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="field-label">Password</label>
              <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--ink-soft)', fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Register</Link>
        </p>
      </div>
    </div>
  );
}