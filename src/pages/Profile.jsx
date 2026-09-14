import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '', hotel_name: '', contact_name: '', contact_phone: '', relationship: '', new_password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
        setForm({
          name: res.data.user.name || '',
          hotel_name: res.data.user.hotel_name || '',
          contact_name: res.data.emergencyContact?.contact_name || '',
          contact_phone: res.data.emergencyContact?.contact_phone || '',
          relationship: res.data.emergencyContact?.relationship || '',
          new_password: ''
        });
      } catch (err) {
        setError('Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.patch('/users/me', form);
      setMessage('Profile updated successfully.');
      setForm({ ...form, new_password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/users/me');
      logout();
      navigate('/register');
    } catch (err) {
      setError('Could not delete account. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading profile…</div>
    );
  }

  return (
    <div className="page-reveal" style={{ minHeight: '100vh' }}>
      <div style={{
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 16
      }}>
        <button onClick={() => navigate('/map')} className="page-back-btn">
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div className="mono-label" style={{ letterSpacing: '0.1em' }}>SAFETRACE ABEOKUTA</div>
          <h2 style={{ fontSize: 20 }}>Profile</h2>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 480 }}>
        <div className="strata-card">
          <form onSubmit={handleSave}>
            <div className="form-field">
              <label className="field-label">Full name</label>
              <input className="field-input" name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className="form-field">
              <label className="field-label">Phone number</label>
              <input className="field-input" value={profile.user.phone_number} disabled style={{ opacity: 0.6 }} />
            </div>

            {profile.user.category === 'tourist' && (
              <div className="form-field">
                <label className="field-label">Hotel name</label>
                <input className="field-input" name="hotel_name" value={form.hotel_name} onChange={handleChange} />
              </div>
            )}

            <div className="form-section">
              <h3>Emergency contact</h3>
              <div className="form-field">
                <label className="field-label">Contact name</label>
                <input className="field-input" name="contact_name" value={form.contact_name} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label className="field-label">Contact phone</label>
                <input className="field-input" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
              </div>
            </div>

            <div className="form-section">
              <h3>Change password</h3>
              <div className="form-field">
                <label className="field-label">New password</label>
                <input
                  className="field-input" type="password" name="new_password"
                  value={form.new_password} onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>

            {message && <div style={{ color: 'var(--safe-green)', fontSize: 14, marginBottom: 12 }}>{message}</div>}
            {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="strata-card strata-card--alert" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 8, color: 'var(--alert-red)' }}>Danger zone</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 16 }}>
            Deleting your account permanently removes your profile, trip history, and emergency contact. This cannot be undone.
          </p>

          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="btn"
              style={{ background: 'var(--stone-warm)', color: 'var(--alert-red)' }}
            >
              Delete my account
            </button>
          ) : (
            <div>
              <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Are you sure? This is permanent.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDelete} className="btn btn-alert" disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, delete permanently'}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="btn"
                  style={{ background: 'var(--stone-warm)', color: 'var(--ink)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
