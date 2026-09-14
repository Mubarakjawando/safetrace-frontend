import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [category, setCategory] = useState('elderly');
  const [form, setForm] = useState({
    name: '', phone_number: '', password: '', hotel_name: '',
    contact_name: '', contact_phone: '', relationship: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerUser({ ...form, category });
      login(data.user, data.token);
      navigate('/map');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-reveal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div className="auth-hero" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="mono-label" style={{ letterSpacing: '0.12em', marginBottom: 6 }}>ABEOKUTA</div>
          <h1 style={{ fontSize: 34 }}>SafeTrace</h1>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: 15 }}>
            Route watching for the people who matter to you.
          </p>
        </div>

        <div className="strata-card">
          <div className="category-toggle">
            <button type="button" className={category === 'elderly' ? 'active' : ''} onClick={() => setCategory('elderly')}>
              Elderly Resident
            </button>
            <button type="button" className={category === 'tourist' ? 'active' : ''} onClick={() => setCategory('tourist')}>
              Tourist
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="field-label">Full name</label>
              <input className="field-input" name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label className="field-label">Phone number</label>
              <input className="field-input" name="phone_number" value={form.phone_number} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>

            {category === 'tourist' && (
              <div className="form-field">
                <label className="field-label">Hotel name</label>
                <input className="field-input" name="hotel_name" value={form.hotel_name} onChange={handleChange} />
              </div>
            )}

            <div className="form-section">
              <h3 style={{ fontSize: 17, marginBottom: 16 }}>
                {category === 'elderly' ? 'Family contact' : 'Hotel or guide contact'}
              </h3>

              <div className="form-field">
                <label className="field-label">Contact name</label>
                <input className="field-input" name="contact_name" value={form.contact_name} onChange={handleChange} required />
              </div>

              <div className="form-field">
                <label className="field-label">Contact phone</label>
                <input className="field-input" name="contact_phone" value={form.contact_phone} onChange={handleChange} required />
              </div>

              <div style={{ marginBottom: 4 }}>
                <label className="field-label">Relationship</label>
                <select className="field-select" name="relationship" value={form.relationship} onChange={handleChange} required>
                  <option value="">Select relationship</option>
                  {category === 'elderly' ? (
                    <>
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="grandson">Grandson</option>
                      <option value="granddaughter">Granddaughter</option>
                      <option value="spouse">Spouse</option>
                      <option value="sibling">Sibling</option>
                      <option value="caregiver">Caregiver</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="hotel_receptionist">Hotel receptionist</option>
                      <option value="tour_guide">Tour guide</option>
                      <option value="hotel_manager">Hotel manager</option>
                      <option value="travel_companion">Travel companion</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--ink-soft)', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}