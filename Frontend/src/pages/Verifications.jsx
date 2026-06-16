import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck } from "lucide-react";
import { api } from "../services/api";
import { Card, Badge, Button, Avatar } from "../components/ui/primitives";
import { container, fadeUp } from "../components/motion/variants";

export default function Verifications() {
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(null);
  useEffect(() => {
    api.getVerificationQueue().then(setQueue);
  }, []);

  const act = async (id, approve) => {
    setBusy(id);
    try {
      await api.decideVerification(id, approve);
      setQueue((q) => q.filter((x) => x.id !== id));
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
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Verification queue</h1>
        <p className="muted">
          Review and verify pending influencer and media-house accounts.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="stack"
        style={{ gap: 12, marginTop: 22 }}
      >
        {queue.map((q) => (
          <Card key={q.id} className="card-pad">
            <div className="row between wrap" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar name={q.name} size={44} />
                <div>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 600 }}>{q.name}</span>
                    <Badge>{q.type}</Badge>
                  </div>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    Submitted{" "}
                    {formatDistanceToNow(new Date(q.submitted), {
                      addSuffix: true,
                    })}
                    {q.followers
                      ? ` · ${(q.followers / 1000).toFixed(0)}K followers`
                      : ""}
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busy === q.id}
                  onClick={() => act(q.id, true)}
                >
                  <BadgeCheck size={15} /> Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy === q.id}
                  onClick={() => act(q.id, false)}
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {queue.length === 0 && (
          <p className="muted" style={{ textAlign: "center", marginTop: 20 }}>
            Queue cleared. Nice work.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
