import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function ResolveIncident() {
  const { incidentId } = useParams();
  const [status, setStatus] = useState('idle');
  const [role, setRole] = useState(null);

  const handleResolve = async (resolvedBy) => {
    setStatus('loading');
    setRole(resolvedBy);
    try {
      await api.patch(`/incidents/${incidentId}/resolve`, { resolvedBy });
      setStatus('done');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="page-reveal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="strata-card strata-card--alert" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        {status === 'done' ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h2 style={{ marginBottom: 8 }}>Marked as resolved</h2>
            <p style={{ color: 'var(--ink-soft)' }}>
              Thank you for confirming. This incident is now closed.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
            <h2 style={{ marginBottom: 8 }}>Route deviation alert</h2>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
              You received this because someone you're watching over deviated from their route.
              Once you've confirmed they're safe, mark it resolved below.
            </p>

            {status === 'error' && (
              <div className="error-banner" style={{ marginBottom: 16 }}>
                Could not resolve — it may already be marked safe, or the link has expired.
              </div>
            )}

            <button
              onClick={() => handleResolve('contact')}
              className="btn btn-primary"
              disabled={status === 'loading'}
              style={{ marginBottom: 12 }}
            >
              {status === 'loading' && role === 'contact' ? 'Marking safe…' : "I've confirmed they're safe"}
            </button>
            <button
              onClick={() => handleResolve('authority')}
              className="btn"
              disabled={status === 'loading'}
              style={{ background: 'var(--stone-warm)', color: 'var(--ink)' }}
            >
              {status === 'loading' && role === 'authority' ? 'Marking safe…' : 'Resolve as authority'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
