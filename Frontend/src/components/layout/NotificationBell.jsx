import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { api } from '../../services/api'

export default function NotificationBell() {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = () => api.getNotifications().then(setItems).catch(() => {})

  useEffect(() => {
    load()
    const t = setInterval(load, 30000) // light polling
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unread = items.filter((n) => !n.read).length
  const markAll = async () => { await api.markAllNotificationsRead(); load() }
  const clickItem = async (n) => { if (!n.read) { await api.markNotificationRead(n.id); load() } }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications"
        style={{ position: 'relative', background: 'transparent', border: 0, color: 'var(--ink-soft)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
        <Bell size={19} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent)', color: '#fff',
            fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 99, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="card" style={{ position: 'absolute', right: 0, top: 36, width: 320, maxHeight: 380, overflow: 'auto', zIndex: 30, padding: 0 }}>
          <div className="row between" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
            <span style={{ fontWeight: 600 }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="link-accent"
                style={{ fontSize: '0.78rem', background: 'none', border: 0, cursor: 'pointer' }}>Mark all read</button>
            )}
          </div>
          {items.length === 0 && <p className="muted" style={{ padding: 16, fontSize: '0.85rem' }}>No notifications yet.</p>}
          {items.map((n) => (
            <button key={n.id} onClick={() => clickItem(n)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px',
                borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: n.read ? 'transparent' : 'var(--accent-soft)', borderTop: 0, borderLeft: 0, borderRight: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{n.title}</div>
              {n.body && <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>{n.body}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
