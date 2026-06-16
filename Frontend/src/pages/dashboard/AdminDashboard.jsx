import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { api } from '../../services/api'
import { Stat, Card, Badge, Button, money } from '../../components/ui/primitives'
import { container, fadeUp } from '../../components/motion/variants'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [queue, setQueue] = useState([])

  useEffect(() => {
    api.getAdminStats().then(setStats)
    api.getVerificationQueue().then(setQueue)
  }, [])

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Platform overview</span>
        <h1 style={{ fontSize: '2.1rem', marginTop: 8 }}>Marketplace health</h1>
        <p className="muted">Operational snapshot across all users and campaigns.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginTop: 24 }}>
        <Stat label="Total users" value={stats?.totalUsers ?? '—'} sub={`${stats?.influencers ?? 0} creators · ${stats?.brands ?? 0} brands`} />
        <Stat label="Active campaigns" value={stats?.activeCampaigns ?? '—'} sub="running now" />
        <Stat label="Platform revenue" value={stats ? money(stats.platformRevenue) : '—'} sub="lifetime fees" />
        <Stat label="Open disputes" value={stats?.disputesOpen ?? '—'} sub="need attention" />
      </motion.div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', marginTop: 24, alignItems: 'start' }}>
        <motion.div variants={fadeUp}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.3rem' }}>Verification queue</h2>
            <Link to="/app/admin/verifications" className="link-accent row" style={{ gap: 4, fontSize: '0.88rem' }}>
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          <Card className="card-pad">
            <div className="stack" style={{ gap: 14 }}>
              {queue.map((q) => (
                <div key={q.id} className="row between wrap" style={{ gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{q.name}</div>
                    <div className="muted" style={{ fontSize: '0.78rem' }}>
                      {q.type}{q.followers ? ` · ${(q.followers / 1000).toFixed(0)}K followers` : ''}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <Button variant="soft" size="sm">Approve</Button>
                    <Button variant="ghost" size="sm">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 12 }}>Alerts</h2>
          <Card className="card-pad" style={{ borderColor: 'var(--accent-line)' }}>
            <div className="row" style={{ gap: 10 }}>
              <AlertTriangle size={20} style={{ color: 'var(--warn)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{stats?.pendingVerifications ?? 0} pending verifications</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>Oldest waiting 4 days.</div>
              </div>
            </div>
            <div className="divider" style={{ margin: '14px 0' }} />
            <div className="row" style={{ gap: 10 }}>
              <AlertTriangle size={20} style={{ color: '#c0492f' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{stats?.disputesOpen ?? 0} open disputes</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>Linked to active contracts.</div>
              </div>
            </div>
          </Card>
          <Card className="card-pad" style={{ marginTop: 16 }}>
            <div className="tag">Split</div>
            <div className="row between" style={{ marginTop: 10 }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Influencers</span>
              <Badge>{stats?.influencers ?? 0}</Badge>
            </div>
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>Media houses</span>
              <Badge>{stats?.brands ?? 0}</Badge>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
