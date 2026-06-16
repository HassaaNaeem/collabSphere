/* ------------------------------------------------------------------
   Dummy data — mirrors the proposal's entities (Influencer, MediaHouse,
   Campaign, Application, Contract, Deliverable, Review, Niche, Platform).
   Replaced by real API responses (Express + PostgreSQL) in a later phase.
   ------------------------------------------------------------------ */

export const NICHES = [
  'Fashion', 'Tech', 'Gaming', 'Food', 'Travel', 'Fitness', 'Beauty', 'Finance', 'Lifestyle',
]

export const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'X', 'Facebook']

export const influencers = [
  {
    id: 'inf_1', name: 'Maya Castellano', handle: '@mayacreates', location: 'Lisbon, PT',
    niches: ['Fashion', 'Lifestyle'], rating: 4.9, completed: 38, verified: true,
    accounts: [{ platform: 'Instagram', followers: 412000, engagement: 4.7 }, { platform: 'TikTok', followers: 980000, engagement: 6.1 }],
    rate: 2200, bio: 'Slow fashion & quiet-luxury storytelling for considered brands.',
  },
  {
    id: 'inf_2', name: 'Dev Anand', handle: '@devbuilds', location: 'Bengaluru, IN',
    niches: ['Tech', 'Finance'], rating: 4.7, completed: 51, verified: true,
    accounts: [{ platform: 'YouTube', followers: 720000, engagement: 5.4 }, { platform: 'X', followers: 210000, engagement: 3.2 }],
    rate: 3100, bio: 'Long-form product breakdowns for hardware & fintech.',
  },
  {
    id: 'inf_3', name: 'Lena Brandt', handle: '@lenaeats', location: 'Berlin, DE',
    niches: ['Food', 'Travel'], rating: 4.8, completed: 27, verified: false,
    accounts: [{ platform: 'Instagram', followers: 156000, engagement: 7.9 }],
    rate: 1400, bio: 'Cinematic food & city guides. High engagement, niche audience.',
  },
  {
    id: 'inf_4', name: 'Theo Kwesi', handle: '@theoplays', location: 'Accra, GH',
    niches: ['Gaming', 'Tech'], rating: 4.6, completed: 44, verified: true,
    accounts: [{ platform: 'YouTube', followers: 1300000, engagement: 4.1 }, { platform: 'TikTok', followers: 540000, engagement: 8.2 }],
    rate: 2800, bio: 'Esports recaps & first-look gameplay for a Gen-Z audience.',
  },
  {
    id: 'inf_5', name: 'Sofia Marchetti', handle: '@sofiamoves', location: 'Milan, IT',
    niches: ['Fitness', 'Beauty'], rating: 5.0, completed: 19, verified: true,
    accounts: [{ platform: 'Instagram', followers: 298000, engagement: 6.6 }],
    rate: 1900, bio: 'Mobility, recovery and clean beauty — premium wellness brands.',
  },
  {
    id: 'inf_6', name: 'Noah Park', handle: '@noahframes', location: 'Seoul, KR',
    niches: ['Travel', 'Lifestyle'], rating: 4.5, completed: 33, verified: false,
    accounts: [{ platform: 'Instagram', followers: 88000, engagement: 9.1 }, { platform: 'YouTube', followers: 120000, engagement: 5.0 }],
    rate: 1100, bio: 'Micro-creator with very high engagement. Great for local launches.',
  },
]

export const campaigns = [
  {
    id: 'cmp_1', title: 'Spring Capsule — Quiet Luxury', brand: 'Atelier Norde', brandId: 'br_1',
    niche: 'Fashion', budget: 8000, deliverables: ['1 Reel', '3 Stories'], status: 'Open',
    deadline: '2026-06-20', applicants: 12, brief: 'Launch our spring capsule with an editorial, understated tone.',
  },
  {
    id: 'cmp_2', title: 'Mobile Chip Launch Review', brand: 'Volt Systems', brandId: 'br_2',
    niche: 'Tech', budget: 12000, deliverables: ['1 Long-form video', '1 X thread'], status: 'In Progress',
    deadline: '2026-06-12', applicants: 7, brief: 'Honest deep-dive review of our new mobile SoC.',
  },
  {
    id: 'cmp_3', title: 'City Food Crawl Series', brand: 'Northbound Media', brandId: 'br_3',
    niche: 'Food', budget: 4500, deliverables: ['4 Reels'], status: 'Open',
    deadline: '2026-06-28', applicants: 21, brief: 'A 4-part food crawl across European capitals.',
  },
  {
    id: 'cmp_4', title: 'Esports Highlights Partnership', brand: 'Volt Systems', brandId: 'br_2',
    niche: 'Gaming', budget: 9500, deliverables: ['2 YouTube videos', '5 TikToks'], status: 'Open',
    deadline: '2026-07-04', applicants: 9, brief: 'Season-long highlight partnership for our tournament.',
  },
  {
    id: 'cmp_5', title: 'Recovery Wellness Drop', brand: 'Atelier Norde', brandId: 'br_1',
    niche: 'Fitness', budget: 6000, deliverables: ['1 Reel', '2 Stories'], status: 'Completed',
    deadline: '2026-05-30', applicants: 15, brief: 'Promote our recovery line to a wellness audience.',
  },
]

export const applications = [
  { id: 'app_1', campaignId: 'cmp_1', campaign: 'Spring Capsule — Quiet Luxury', influencer: 'Maya Castellano', quote: 2200, status: 'Shortlisted', date: '2026-05-28' },
  { id: 'app_2', campaignId: 'cmp_3', campaign: 'City Food Crawl Series', influencer: 'Lena Brandt', quote: 1400, status: 'Accepted', date: '2026-05-25' },
  { id: 'app_3', campaignId: 'cmp_4', campaign: 'Esports Highlights Partnership', influencer: 'Theo Kwesi', quote: 2800, status: 'Pending', date: '2026-05-30' },
  { id: 'app_4', campaignId: 'cmp_2', campaign: 'Mobile Chip Launch Review', influencer: 'Dev Anand', quote: 3100, status: 'Accepted', date: '2026-05-20' },
]

export const contracts = [
  { id: 'ct_1', campaign: 'Mobile Chip Launch Review', counterpart: 'Volt Systems', amount: 3100, status: 'In Progress', start: '2026-05-22', end: '2026-06-12', deliverablesDone: 1, deliverablesTotal: 2 },
  { id: 'ct_2', campaign: 'City Food Crawl Series', counterpart: 'Northbound Media', amount: 1400, status: 'In Progress', start: '2026-05-26', end: '2026-06-28', deliverablesDone: 2, deliverablesTotal: 4 },
  { id: 'ct_3', campaign: 'Recovery Wellness Drop', counterpart: 'Atelier Norde', amount: 1900, status: 'Completed', start: '2026-05-10', end: '2026-05-30', deliverablesDone: 3, deliverablesTotal: 3 },
]

export const reviews = [
  { id: 'rv_1', from: 'Atelier Norde', to: 'Sofia Marchetti', rating: 5, comment: 'Delivered early and on-brief. Exceptional production quality.', date: '2026-05-31' },
  { id: 'rv_2', from: 'Volt Systems', to: 'Dev Anand', rating: 4, comment: 'Thorough and honest. Minor delay on the thread.', date: '2026-05-18' },
]

export const brands = [
  { id: 'br_1', company: 'Atelier Norde', industry: 'Fashion & Lifestyle', verified: true, activeCampaigns: 2, totalSpend: 41200 },
  { id: 'br_2', company: 'Volt Systems', industry: 'Consumer Tech', verified: true, activeCampaigns: 2, totalSpend: 86500 },
  { id: 'br_3', company: 'Northbound Media', industry: 'Digital Media House', verified: false, activeCampaigns: 1, totalSpend: 18900 },
]

// Platform-wide stats for the Super Admin dashboard
export const adminStats = {
  totalUsers: 1284,
  influencers: 942,
  brands: 311,
  pendingVerifications: 18,
  activeCampaigns: 67,
  platformRevenue: 248900,
  disputesOpen: 3,
}

export const verificationQueue = [
  { id: 'vq_1', name: 'Lena Brandt', type: 'Influencer', submitted: '2026-05-29', followers: 156000 },
  { id: 'vq_2', name: 'Northbound Media', type: 'Media House', submitted: '2026-05-27', followers: null },
  { id: 'vq_3', name: 'Noah Park', type: 'Influencer', submitted: '2026-05-30', followers: 208000 },
]
