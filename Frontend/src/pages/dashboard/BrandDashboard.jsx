import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ArrowRight, Plus, X, ExternalLink } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Stat,
  Card,
  Badge,
  Button,
  Field,
  money,
} from "../../components/ui/primitives";
import { NICHES } from "../../data/dummyData";
import { container, fadeUp, ease } from "../../components/motion/variants";

export default function BrandDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [apps, setApps] = useState([]);
  const [subs, setSubs] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    api.getMyCampaigns().then(setCampaigns);
    api.getApplications().then(setApps);
    api
      .getReviewQueue()
      .then(setSubs)
      .catch(() => setSubs([]));
  };

  const reviewSub = async (id, decision, feedback) => {
    try {
      await api.reviewDeliverable(id, { decision, feedback });
      load();
    } catch (e) {
      alert(e.message || "Action failed");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const decide = async (id, status) => {
    try {
      await api.decideApplication(id, status);
      load();
    } catch (e) {
      alert(e.message || "Action failed");
    }
  };

  const active = campaigns.filter((c) => c.status !== "Completed").length;
  const spend = campaigns.reduce((s, c) => s + c.budget, 0);
  const applicants = campaigns.reduce((s, c) => s + c.applicants, 0);

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div
        variants={fadeUp}
        className="row between wrap"
        style={{ gap: 12 }}
      >
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>
            {user?.name || "Your media house"}
          </h1>
          <p className="muted">
            Manage campaigns and the creators you work with.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New campaign
        </Button>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          marginTop: 24,
        }}
      >
        <Stat label="Active campaigns" value={active} sub="currently running" />
        <Stat label="Total budget" value={money(spend)} sub="committed" />
        <Stat label="Applicants" value={applicants} sub="across campaigns" />
        <Stat label="Avg fill time" value="2.4d" sub="brief to contract" />
      </motion.div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.5fr 1fr",
          marginTop: 24,
          alignItems: "start",
        }}
      >
        <motion.div variants={fadeUp}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: "1.3rem" }}>Your campaigns</h2>
            <Link
              to="/app/brand/campaigns"
              className="link-accent row"
              style={{ gap: 4, fontSize: "0.88rem" }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {campaigns.slice(0, 4).map((c) => (
              <Card key={c.id} hover className="card-pad">
                <div className="row between wrap" style={{ gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>
                      {[c.niche, (c.deliverables || []).join(", ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <Badge
                    tone={
                      c.status === "Completed"
                        ? "good"
                        : c.status === "Open"
                          ? undefined
                          : "warn"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
                <div
                  className="row between"
                  style={{ marginTop: 12, fontSize: "0.84rem" }}
                >
                  <span className="muted">
                    {c.applicants} applicants
                    {c.deadline
                      ? ` · due ${format(new Date(c.deadline), "MMM d")}`
                      : ""}
                  </span>
                  <span style={{ fontWeight: 600 }}>{money(c.budget)}</span>
                </div>
              </Card>
            ))}
            {campaigns.length === 0 && (
              <p className="muted">No campaigns yet — create your first one.</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>
            Applications to review
          </h2>
          <Card className="card-pad">
            <div className="stack" style={{ gap: 14 }}>
              {apps.map((a) => (
                <div key={a.id} className="stack" style={{ gap: 8 }}>
                  <div className="row between">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {a.influencer}
                      </div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>
                        {a.campaign}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                        {money(a.quote)}
                      </div>
                      <Badge
                        tone={
                          a.status === "Accepted"
                            ? "good"
                            : a.status === "Pending"
                              ? "warn"
                              : a.status === "Rejected"
                                ? undefined
                                : "warn"
                        }
                      >
                        {a.status}
                      </Badge>
                    </div>
                  </div>
                  {["Pending", "Shortlisted"].includes(a.status) && (
                    <div
                      className="row"
                      style={{ gap: 6, justifyContent: "flex-end" }}
                    >
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => decide(a.id, "accepted")}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => decide(a.id, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  <div className="divider" />
                </div>
              ))}
              {apps.length === 0 && (
                <p className="muted" style={{ fontSize: "0.85rem" }}>
                  No applications yet.
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {subs.length > 0 && (
        <motion.div variants={fadeUp} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>
            Submissions to review
          </h2>
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            }}
          >
            {subs.map((s) => (
              <SubRow key={s.id} s={s} onReview={reviewSub} />
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <NewCampaignModal
            onClose={() => setShowForm(false)}
            onCreated={() => {
              setShowForm(false);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NewCampaignModal({ onClose, onCreated }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.createCampaign({
        title: data.title,
        niche: data.niche || undefined,
        budget: Number(data.budget),
        deadline: data.deadline || null,
        brief: data.brief || null,
        status: "open",
      });
      onCreated();
    } catch (err) {
      setError("root", { message: err.message || "Could not create campaign" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,18,16,0.45)",
        backdropFilter: "blur(2px)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ duration: 0.25, ease }}
        onClick={(e) => e.stopPropagation()}
        className="card card-pad"
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: "1.4rem" }}>New campaign</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="stack"
          style={{ gap: 14 }}
        >
          <Field
            label="Title"
            error={errors.title?.message}
            placeholder="Spring Capsule — Quiet Luxury"
            {...register("title", { required: "Title is required" })}
          />

          <Field label="Niche" error={errors.niche?.message}>
            <select className="select" defaultValue="" {...register("niche")}>
              <option value="">— optional —</option>
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field
              label="Budget (USD)"
              type="number"
              error={errors.budget?.message}
              placeholder="8000"
              {...register("budget", {
                required: "Budget is required",
                min: { value: 0, message: "Must be ≥ 0" },
              })}
            />
            <Field label="Deadline" type="date" {...register("deadline")} />
          </div>

          <Field label="Brief">
            <textarea
              className="input"
              rows={3}
              placeholder="What should creators deliver?"
              {...register("brief")}
            />
          </Field>

          {errors.root && (
            <p className="errmsg" style={{ textAlign: "center" }}>
              {errors.root.message}
            </p>
          )}

          <div className="row" style={{ gap: 10, justifyContent: "flex-end" }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create campaign"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function SubRow({ s, onReview }) {
  const [fb, setFb] = useState("");
  const [busy, setBusy] = useState(false);
  const act = async (decision) => {
    if ((decision === "changes" || decision === "reject") && !fb)
      return alert("Add a comment for the creator");
    setBusy(true);
    try {
      await onReview(s.id, decision, fb);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="card-pad">
      <div className="row between wrap" style={{ gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{s.influencer}</div>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            {s.campaign} · {s.quantity}× {s.kind}
            {s.submittedAt ? ` · ${s.submittedAt}` : ""}
          </div>
        </div>
        <Badge tone="warn">Submitted</Badge>
      </div>
      {s.submissionUrl && (
        <div style={{ marginTop: 8, fontSize: "0.85rem" }}>
          <a
            href={s.submissionUrl}
            target="_blank"
            rel="noreferrer"
            className="link-accent row"
            style={{ gap: 4, display: "inline-flex" }}
          >
            View submitted content <ExternalLink size={13} />
          </a>
          {s.caption && (
            <div className="muted" style={{ marginTop: 2 }}>
              “{s.caption}”
            </div>
          )}
        </div>
      )}
      <div className="stack" style={{ gap: 8, marginTop: 10 }}>
        <input
          className="input"
          placeholder="Comment (required for changes/reject)"
          value={fb}
          onChange={(e) => setFb(e.target.value)}
        />
        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
          <Button
            size="sm"
            variant="primary"
            disabled={busy}
            onClick={() => act("approve")}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="soft"
            disabled={busy}
            onClick={() => act("changes")}
          >
            Request changes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => act("reject")}
          >
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}
