import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Building2,
  ShieldCheck,
  ArrowRight,
  Search,
  FileText,
  Wallet,
  Star,
} from "lucide-react";
import { Logo, Button, Avatar } from "../components/ui/primitives";
import ThemeToggle from "../components/ui/ThemeToggle";
import { container, fadeUp, ease } from "../components/motion/variants";

const roles = [
  {
    role: "influencer",
    icon: Sparkles,
    title: "I'm an Influencer",
    desc: "Get discovered, apply to campaigns, and get paid on time.",
  },
  {
    role: "brand",
    icon: Building2,
    title: "I'm a Media House",
    desc: "Find verified creators and run campaigns end-to-end.",
  },
];

const testimonials = [
  {
    name: "Maya Castellano",
    role: "Lifestyle creator · 1.4M",
    quote:
      "I get matched with briefs that actually fit my niche, and payments clear on time. It changed how I work.",
  },
  {
    name: "Atelier Norde",
    role: "Fashion media house",
    quote:
      "Running three campaigns at once used to be chaos. Now briefs, contracts and payments live in one place.",
  },
  {
    name: "Dev Anand",
    role: "Tech creator · 930K",
    quote:
      "The verified badge means brands trust my numbers instantly. Less back-and-forth, more collaborations.",
  },
];

const faqs = [
  {
    q: "How does CollabSphere verify accounts?",
    a: "Our team reviews each new influencer and media house before approval, so the marketplace only surfaces real, vetted accounts. Until you’re approved you can explore, but applying and creating campaigns stay locked.",
  },
  {
    q: "How do payments work?",
    a: "Funds are committed when a contract starts and released as the influencer’s deliverables are approved by the media house — so both sides are protected.",
  },
  {
    q: "Is it free to join?",
    a: "Creating an account is free for creators and media houses. CollabSphere only takes a small platform fee on completed contracts.",
  },
  {
    q: "What happens if a deliverable needs changes?",
    a: "Media houses can request revisions with a comment before approving, so feedback and approvals are documented in one thread.",
  },
  {
    q: "Can a media house invite a creator directly?",
    a: "Yes. Beyond open applications, media houses can invite specific creators to a campaign, and the creator can accept or decline from their dashboard.",
  },
];

const features = [
  {
    icon: Search,
    title: "Verified discovery",
    desc: "Search creators by niche, platform, reach and engagement — no more guesswork.",
  },
  {
    icon: FileText,
    title: "Lifecycle in one place",
    desc: "Brief → apply → contract → deliverables → review. Nothing lost in DMs.",
  },
  {
    icon: Wallet,
    title: "Escrow-style payments",
    desc: "Funds held and released against approved deliverables. Fewer disputes.",
  },
  {
    icon: Star,
    title: "Two-way reputation",
    desc: "Both sides build a track record after every completed collaboration.",
  },
];

export default function Landing() {
  return (
    <div>
      {/* Nav */}
      <header
        className="container row between"
        style={{ padding: "22px 24px" }}
      >
        <Logo />
        <div className="row" style={{ gap: 12 }}>
          <ThemeToggle />
          <Button as={Link} to="/login/brand" variant="ghost" size="sm">
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        className="container"
        style={{ padding: "60px 24px 40px", textAlign: "center" }}
      >
        <motion.div initial="initial" animate="animate" variants={container}>
          <motion.div
            variants={fadeUp}
            className="badge"
            style={{ marginInline: "auto" }}
          >
            <span className="dot" /> Where creators & media houses meet
          </motion.div>
          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: "clamp(2.6rem, 7vw, 5rem)",
              margin: "22px auto 0",
              maxWidth: 880,
            }}
          >
            The collaboration layer for the{" "}
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>
              creator economy
            </span>
            .
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="muted"
            style={{
              fontSize: "1.12rem",
              maxWidth: 560,
              margin: "20px auto 0",
            }}
          >
            CollabSphere connects social media influencers with media houses —
            discovery, campaigns, contracts, deliverables and payments, all in
            one structured place.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="row"
            style={{ gap: 12, justifyContent: "center", marginTop: 30 }}
          >
            <Button as={Link} to="/signup/influencer" variant="primary">
              Join as creator <ArrowRight size={16} />
            </Button>
            <Button as={Link} to="/signup/brand" variant="ghost">
              I'm a media house
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Role cards */}
      <section className="container" style={{ padding: "20px 24px" }}>
        <motion.div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          variants={container}
        >
          {roles.map((r) => (
            <motion.div key={r.role} variants={fadeUp}>
              <Link to={`/signup/${r.role}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ ease, duration: 0.25 }}
                  className="card card-pad"
                  style={{ height: "100%" }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                  >
                    <r.icon size={22} />
                  </span>
                  <h3 style={{ fontSize: "1.3rem", marginTop: 16 }}>
                    {r.title}
                  </h3>
                  <p
                    className="muted"
                    style={{ marginTop: 6, fontSize: "0.92rem" }}
                  >
                    {r.desc}
                  </p>
                  <span
                    className="link-accent row"
                    style={{ gap: 6, marginTop: 14, fontSize: "0.9rem" }}
                  >
                    Continue <ArrowRight size={15} />
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="container" style={{ padding: "70px 24px" }}>
        <div style={{ maxWidth: 520, marginBottom: 36 }}>
          <span className="eyebrow">Why CollabSphere</span>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginTop: 12 }}>
            One source of truth, instead of scattered chats.
          </h2>
        </div>
        <motion.div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          variants={container}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="panel"
              style={{ padding: 22 }}
            >
              <f.icon size={22} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: "1.12rem", marginTop: 14 }}>{f.title}</h3>
              <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ padding: "70px 24px" }}>
          <div style={{ maxWidth: 520, marginBottom: 36 }}>
            <span className="eyebrow">Loved by both sides</span>
            <h2
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginTop: 12 }}
            >
              Creators and media houses, on the same page.
            </h2>
          </div>
          <motion.div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-60px" }}
            variants={container}
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="card card-pad"
              >
                <div className="row" style={{ gap: 2, color: "var(--accent)" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p
                  className="serif"
                  style={{
                    fontStyle: "italic",
                    marginTop: 14,
                    fontSize: "1.02rem",
                  }}
                >
                  “{t.quote}”
                </p>
                <div className="row" style={{ gap: 10, marginTop: 18 }}>
                  <Avatar name={t.name} size={38} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {t.name}
                    </div>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container" style={{ padding: "70px 24px" }}>
        <div style={{ maxWidth: 520, marginBottom: 30 }}>
          <span className="eyebrow">FAQ</span>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", marginTop: 12 }}>
            Questions, answered.
          </h2>
        </div>
        <div className="stack" style={{ gap: 12, maxWidth: 760 }}>
          {faqs.map((f) => (
            <details
              key={f.q}
              className="card card-pad"
              style={{ cursor: "pointer" }}
            >
              <summary style={{ fontWeight: 600, listStyle: "none" }}>
                {f.q}
              </summary>
              <p
                className="muted"
                style={{ marginTop: 10, fontSize: "0.92rem" }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="container" style={{ padding: "0 24px 80px" }}>
        <div
          className="card card-pad"
          style={{
            textAlign: "center",
            padding: "56px 24px",
            background: "var(--ink)",
            color: "var(--bg)",
            border: 0,
          }}
        >
          <h2
            className="display"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            Ready to collaborate?
          </h2>
          <p style={{ opacity: 0.78, marginTop: 10 }}>
            Create an account in under a minute.
          </p>
          <div
            className="row"
            style={{ gap: 12, justifyContent: "center", marginTop: 24 }}
          >
            <Button as={Link} to="/signup/influencer" variant="primary">
              Get started
            </Button>
          </div>
        </div>
      </section>

      <footer
        className="container row between wrap"
        style={{
          padding: "24px",
          borderTop: "1px solid var(--border)",
          gap: 12,
        }}
      >
        <Logo size={20} />
        <span className="muted" style={{ fontSize: "0.82rem" }}>
          © 2026 CollabSphere · Database Systems Project
        </span>
      </footer>
    </div>
  );
}
