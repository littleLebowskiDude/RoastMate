/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface RoastSession {
  id: string;
  sessionDate: string;
}

export default function RoastSessionsPage() {
  const [sessions, setSessions] = useState<RoastSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch('/api/roast-sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      setError('Could not load sessions');
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSession = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/roast-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDate: new Date() })
      });
      await load();
    } catch (err) {
      setError('Failed to create session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pill">Roast Sessions</div>
          <h2 style={{ marginTop: 10 }}>Plan and run the weekly roast</h2>
        </div>
        <button className="btn" onClick={createSession} disabled={loading}>
          {loading ? 'Creating...' : 'Start new session'}
        </button>
      </div>

      {error && <div className="panel" style={{ borderColor: 'var(--danger)' }}>{error}</div>}

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.sessionDate?.slice(0, 10)}</td>
                <td>
                  <Link href={`/roast-sessions/${session.id}`} className="btn secondary" style={{ padding: '8px 12px' }}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {!sessions.length && (
              <tr>
                <td colSpan={2} className="muted">
                  No sessions yet. Create one to import orders and calculate drops.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
