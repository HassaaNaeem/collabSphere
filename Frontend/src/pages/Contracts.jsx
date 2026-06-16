import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, Button, money } from "../components/ui/primitives";
import { container, fadeUp } from "../components/motion/variants";

const safeDate = (d) => {
  try {
    return d ? format(new Date(d), "MMM d, yyyy") : "—";
  } catch {
    return "—";
  }
};

export default function Contracts() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  useEffect(() => {
    api.getContracts().then(setData);
  }, []);

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Collaborations</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>My contracts</h1>
        <p className="muted">
          Track deliverables and payment status across active work.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="stack"
        style={{ gap: 12, marginTop: 22 }}
      >
        {data.map((c) => (
          <ContractCard key={c.id} contract={c} role={user?.role} />
        ))}
        {data.length === 0 && <p className="muted">No contracts yet.</p>}
      </motion.div>
    </motion.div>
  );
}

function ContractCard({ contract: c, role }) {
  const [open, setOpen] = useState(true); // deliverables visible by default
  const [dels, setDels] = useState(null);
  const pct = c.deliverablesTotal
    ? (c.deliverablesDone / c.deliverablesTotal) * 100
    : 0;
  const reviewNeeded = role === "brand" && (c.deliverablesSubmitted || 0) > 0;

  const loadDels = () =>
    api
      .getDeliverables(c.id)
      .then(setDels)
      .catch(() => setDels([]));
  useEffect(() => {
    loadDels();
  }, []); // load immediately, no expand required

  return (
    <Card className="card-pad">
      <div className="row between wrap" style={{ gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
            {c.campaign}
          </div>
          <div className="muted" style={{ fontSize: "0.84rem" }}>
            with {c.counterpart} · {safeDate(c.start)} – {safeDate(c.end)}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {reviewNeeded && (
            <Badge tone="warn">{c.deliverablesSubmitted} to review</Badge>
          )}
          <span className="display" style={{ fontSize: "1.3rem" }}>
            {money(c.amount)}
          </span>
          <Badge tone={c.status === "Completed" ? "good" : "warn"}>
            {c.status}
          </Badge>
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          height: 8,
          borderRadius: 99,
          background: "var(--bg-2)",
          overflow: "hidden",
          maxWidth: 360,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent)",
          }}
        />
      </div>
      <div className="row between" style={{ marginTop: 6 }}>
        <div className="muted" style={{ fontSize: "0.8rem" }}>
          {c.deliverablesDone} of {c.deliverablesTotal} deliverables approved
          {c.status === "Completed"
            ? " · payment released"
            : " · payment held in escrow"}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="link-accent row"
          style={{
            gap: 4,
            fontSize: "0.82rem",
            background: "none",
            border: 0,
            cursor: "pointer",
          }}
        >
          {open ? (
            <>
              Hide deliverables <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show deliverables <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {open && (
        <div
          className="stack"
          style={{
            gap: 10,
            marginTop: 14,
            borderTop: "1px solid var(--border)",
            paddingTop: 14,
          }}
        >
          {dels === null && (
            <p className="muted" style={{ fontSize: "0.84rem" }}>
              Loading…
            </p>
          )}
          {dels && dels.length === 0 && (
            <p className="muted" style={{ fontSize: "0.84rem" }}>
              No deliverables on this contract.
            </p>
          )}
          {dels &&
            dels.map((d) => (
              <DeliverableRow key={d.id} d={d} role={role} reload={loadDels} />
            ))}
        </div>
      )}
    </Card>
  );
}

const tone = (s) =>
  s === "approved" ? "good" : s === "rejected" ? undefined : "warn";

function DeliverableRow({ d, role, reload }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!url) return alert("Add a content URL");
    setBusy(true);
    try {
      await api.submitDeliverable(d.id, { url, caption });
      setUrl("");
      setCaption("");
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };
  const review = async (decision) => {
    if ((decision === "changes" || decision === "reject") && !feedback)
      return alert("Add a comment for the creator");
    setBusy(true);
    try {
      await api.reviewDeliverable(d.id, { decision, feedback });
      setFeedback("");
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="row between wrap" style={{ gap: 8 }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.9rem",
            textTransform: "capitalize",
          }}
        >
          {d.quantity}× {d.kind}
        </span>
        <Badge tone={tone(d.status)}>{d.status}</Badge>
      </div>
      {d.description && (
        <div className="muted" style={{ fontSize: "0.8rem", marginTop: 3 }}>
          {d.description}
        </div>
      )}

      {d.submissionUrl ? (
        <div style={{ marginTop: 8, fontSize: "0.82rem" }}>
          <a
            href={d.submissionUrl}
            target="_blank"
            rel="noreferrer"
            className="link-accent row"
            style={{ gap: 4, display: "inline-flex" }}
          >
            View submitted content <ExternalLink size={12} />
          </a>
          {d.caption && (
            <div className="muted" style={{ marginTop: 2 }}>
              “{d.caption}”
            </div>
          )}
          {d.feedback && (
            <div className="muted" style={{ marginTop: 4 }}>
              Feedback: “{d.feedback}”
            </div>
          )}
        </div>
      ) : (
        (role === "brand" || role === "media_house") && (
          <div className="muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
            Waiting for the creator to submit.
          </div>
        )
      )}

      {/* Influencer: submit / resubmit */}
      {role === "influencer" && d.status !== "approved" && (
        <div className="stack" style={{ gap: 8, marginTop: 10 }}>
          <input
            className="input"
            placeholder="Content URL (link to your post/video)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input
            className="input"
            placeholder="Caption / note (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={submit}
            >
              {d.status === "submitted" ? "Resubmit" : "Submit"}
            </Button>
          </div>
        </div>
      )}

      {/* Media house: review a submitted deliverable */}
      {(role === "brand" || role === "media_house") &&
        d.status === "submitted" && (
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            <input
              className="input"
              placeholder="Comment (required for changes/reject)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
              <Button
                size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => review("approve")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="soft"
                disabled={busy}
                onClick={() => review("changes")}
              >
                Request changes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => review("reject")}
              >
                Reject
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
