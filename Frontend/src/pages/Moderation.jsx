import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { api } from "../services/api";
import {
  Card,
  Button,
  Badge,
  RatingStars,
  Avatar,
} from "../components/ui/primitives";
import { container, fadeUp } from "../components/motion/variants";

export default function Moderation() {
  const [reviews, setReviews] = useState([]);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    api.getReviews({ all: true }).then(setReviews);
  }, []);

  const setHidden = async (id, hidden) => {
    setBusy(id);
    try {
      await api.setReviewHidden(id, hidden);
      setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, hidden } : r)));
    } catch (e) {
      alert(e.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Moderation</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Review moderation</h1>
        <p className="muted">
          Hide reviews that violate guidelines, or keep them visible. Hidden
          reviews stay out of public profiles.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          marginTop: 22,
        }}
      >
        {reviews.map((r) => (
          <Card
            key={r.id}
            className="card-pad"
            style={{ opacity: r.hidden ? 0.55 : 1 }}
          >
            <div className="row between">
              <div className="row" style={{ gap: 10 }}>
                <Avatar name={r.from} size={38} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                    {r.from}
                  </div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    reviewed {r.to}
                  </div>
                </div>
              </div>
              <RatingStars value={r.rating} />
            </div>
            <p className="serif" style={{ fontStyle: "italic", marginTop: 12 }}>
              “{r.comment}”
            </p>
            <div className="row between" style={{ marginTop: 14 }}>
              <span className="row" style={{ gap: 8 }}>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  {format(new Date(r.date), "MMM d, yyyy")}
                </span>
                {r.hidden && <Badge tone="warn">Hidden</Badge>}
              </span>
              <div className="row" style={{ gap: 8 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy === r.id || r.hidden}
                  onClick={() => setHidden(r.id, true)}
                >
                  Hide
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  disabled={busy === r.id || !r.hidden}
                  onClick={() => setHidden(r.id, false)}
                >
                  Keep
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      </motion.div>
    </motion.div>
  );
}
