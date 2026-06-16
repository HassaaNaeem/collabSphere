import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Stat,
  Card,
  Badge,
  Button,
  RatingStars,
  money,
} from "../../components/ui/primitives";
import { container, fadeUp } from "../../components/motion/variants";

export default function InfluencerDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [apps, setApps] = useState([]);
  const [invites, setInvites] = useState([]);

  const load = () => {
    api.getContracts().then(setContracts);
    api.getApplications().then(setApps);
    api.getInvitations().then(setInvites);
  };
  useEffect(() => {
    load();
  }, []);

  const decideInvite = async (id, status) => {
    try {
      await api.decideInvitation(id, status);
      load();
    } catch (e) {
      alert(e.message || "Action failed");
    }
  };

  const earnings = contracts
    .filter((c) => c.status === "Completed")
    .reduce((s, c) => s + c.amount, 0);
  const active = contracts.filter((c) => c.status === "In Progress").length;

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Dashboard</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>
          Hi {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="muted">Here's how your collaborations are going.</p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          marginTop: 24,
        }}
      >
        <Stat
          label="Total earnings"
          value={money(earnings)}
          sub="from completed contracts"
        />
        <Stat label="Active contracts" value={active} sub="in progress" />
        <Stat label="Avg rating" value="4.9" sub="across 38 reviews" />
        <Stat label="Profile reach" value="1.4M" sub="combined followers" />
      </motion.div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.4fr 1fr",
          marginTop: 24,
          alignItems: "start",
        }}
      >
        <motion.div variants={fadeUp}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: "1.3rem" }}>Active contracts</h2>
            <Link
              to="/app/influencer/contracts"
              className="link-accent row"
              style={{ gap: 4, fontSize: "0.88rem" }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {contracts.map((c) => (
              <Card key={c.id} hover className="card-pad">
                <div className="row between wrap" style={{ gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.campaign}</div>
                    <div className="muted" style={{ fontSize: "0.85rem" }}>
                      with {c.counterpart}
                    </div>
                  </div>
                  <Badge tone={c.status === "Completed" ? "good" : undefined}>
                    {c.status}
                  </Badge>
                </div>
                <div
                  className="row between"
                  style={{ marginTop: 14, fontSize: "0.85rem" }}
                >
                  <span className="muted">
                    Due {format(new Date(c.end), "MMM d")}
                  </span>
                  <span style={{ fontWeight: 600 }}>{money(c.amount)}</span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    height: 6,
                    borderRadius: 99,
                    background: "var(--bg-2)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(c.deliverablesDone / c.deliverablesTotal) * 100}%`,
                    }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: "100%", background: "var(--accent)" }}
                  />
                </div>
                <div
                  className="muted"
                  style={{ fontSize: "0.78rem", marginTop: 6 }}
                >
                  {c.deliverablesDone}/{c.deliverablesTotal} deliverables
                  approved
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          {invites.filter((i) => i.status === "Pending").length > 0 && (
            <Card
              className="card-pad"
              style={{ marginBottom: 16, borderColor: "var(--accent)" }}
            >
              <div className="tag">Invitations</div>
              <div className="stack" style={{ gap: 14, marginTop: 10 }}>
                {invites
                  .filter((i) => i.status === "Pending")
                  .map((i) => (
                    <div key={i.id}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {i.campaign}
                      </div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>
                        from {i.brand}
                        {i.message ? ` · “${i.message}”` : ""}
                      </div>
                      <div className="row" style={{ gap: 6, marginTop: 8 }}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => decideInvite(i.id, "accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => decideInvite(i.id, "declined")}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
          <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>
            Recent applications
          </h2>
          <Card className="card-pad">
            <div className="stack" style={{ gap: 14 }}>
              {apps.map((a) => (
                <div key={a.id}>
                  <div className="row between">
                    <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                      {a.campaign}
                    </span>
                    <Badge
                      tone={
                        a.status === "Accepted"
                          ? "good"
                          : a.status === "Pending"
                            ? "warn"
                            : undefined
                      }
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <div
                    className="muted"
                    style={{ fontSize: "0.78rem", marginTop: 2 }}
                  >
                    Applied{" "}
                    {formatDistanceToNow(new Date(a.date), { addSuffix: true })}{" "}
                    · {money(a.quote)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="card-pad" style={{ marginTop: 16 }}>
            <div className="tag">Latest review</div>
            <RatingStars value={5} />
            <p
              className="serif"
              style={{ fontStyle: "italic", marginTop: 6, fontSize: "0.95rem" }}
            >
              “Delivered early and on-brief. Exceptional quality.”
            </p>
            <div className="muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
              — Atelier Norde
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
