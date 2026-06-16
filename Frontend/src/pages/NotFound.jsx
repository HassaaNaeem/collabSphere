import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo, Button } from '../components/ui/primitives'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center' }}>
        <Logo />
        <h1 className="display" style={{ fontSize: '4rem', marginTop: 24 }}>404</h1>
        <p className="muted" style={{ marginTop: 4 }}>This page wandered off the brief.</p>
        <Button as={Link} to="/" variant="primary" style={{ marginTop: 20 }}>Back home</Button>
      </motion.div>
    </div>
  )
}
