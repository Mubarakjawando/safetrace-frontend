import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!open) return null;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div className="mono-label" style={{ letterSpacing: '0.1em' }}>SAFETRACE ABEOKUTA</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--indigo-dark)', marginTop: 4 }}>
              {user?.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--stone)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: 'var(--ink-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        <div className="drawer-nav">
          <button className="drawer-link" onClick={() => go('/map')}>🗺️ Map</button>
          <button className="drawer-link" onClick={() => go('/trips')}>📍 Trip History</button>
          <button className="drawer-link" onClick={() => go('/profile')}>👤 Profile</button>
        </div>

        <div className="drawer-footer">
          <button onClick={logout} className="btn" style={{ background: 'var(--stone-warm)', color: 'var(--ink)' }}>
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
