import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { api } from "../services/api";
import { NICHES } from "../data/dummyData";
import { Card, Badge, Button, Field, money } from "../components/ui/primitives";
import { container, fadeUp, ease } from "../components/motion/variants";

const STATUSES = ["Open", "In Progress", "Completed"];
const safeDate = (d) => {
  try {
    return d ? format(new Date(d), "MMM d, yyyy") : "No deadline";
  } catch {
    return "No deadline";
  }
};

export default function Campaigns({
  mine = false,
  title = "Discover campaigns",
  subtitle = "Open briefs from media houses looking for creators.",
}) {
  const [niche, setNiche] = useState(null);
  const [status, setStatus] = useState(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyFor, setApplyFor] = useState(null);
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const fetcher = mine ? api.getMyCampaigns : api.getCampaigns;
    fetcher({ niche, status, q }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [mine, niche, status, q]);

  const messageBrand = async (brandId) => {
    try {
      const { id: cid } = await api.startConversation({
        mediaHouseId: brandId,
      });
      navigate("/app/influencer/messages", { state: { open: cid } });
    } catch (e) {
      alert(e.message || "Could not open chat");
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Marketplace</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>{title}</h1>
        <p className="muted">{subtitle}</p>
      </motion.div>

      <motion.div variants={fadeUp} style={{ marginTop: 22 }}>
        <div style={{ position: "relative", maxWidth: 420 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: 13,
              color: "var(--muted)",
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 42 }}
            placeholder="Search campaigns or brands…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
          <button
            className={`chip ${!niche ? "active" : ""}`}
            onClick={() => setNiche(null)}
          >
            All niches
          </button>
          {NICHES.slice(0, 6).map((n) => (
            <button
              key={n}
              className={`chip ${niche === n ? "active" : ""}`}
              onClick={() => setNiche(niche === n ? null : n)}
            >
              {n}
            </button>
          ))}
        </div>
        {mine && (
          <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
            <button
              className={`chip ${!status ? "active" : ""}`}
              onClick={() => setStatus(null)}
            >
              Any status
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`chip ${status === s ? "active" : ""}`}
                onClick={() => setStatus(status === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          marginTop: 22,
        }}
      >
        <AnimatePresence mode="popLayout">
          {data.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card hover className="card-pad" style={{ height: "100%" }}>
                <div className="row between">
                  <Badge>{c.niche || "General"}</Badge>
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
                <h3 style={{ fontSize: "1.18rem", marginTop: 12 }}>
                  {c.title}
                </h3>
                <div
                  className="muted"
                  style={{ fontSize: "0.85rem", marginTop: 2 }}
                >
                  by {c.brand}
                </div>
                <p
                  className="muted"
                  style={{ fontSize: "0.88rem", marginTop: 10 }}
                >
                  {c.brief}
                </p>
                <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>
                  {(c.deliverables || []).map((d) => (
                    <span key={d} className="kbd">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="divider" style={{ margin: "14px 0" }} />
                <div className="row between">
                  <div>
                    <div className="display" style={{ fontSize: "1.3rem" }}>
                      {money(c.budget)}
                    </div>
                    <div className="muted" style={{ fontSize: "0.76rem" }}>
                      due {safeDate(c.deadline)}
                    </div>
                  </div>
                  {!mine && (
                    <div className="row" style={{ gap: 6 }}>
                      {c.brandId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => messageBrand(c.brandId)}
                        >
                          Message
                        </Button>
                      )}
                      {appliedIds.has(c.id) ? (
                        <Badge tone="good">Applied</Badge>
                      ) : c.status === "Open" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setApplyFor(c)}
                        >
                          Apply
                        </Button>
                      ) : (
                        <Badge tone="warn">{c.status}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {!loading && data.length === 0 && (
        <p className="muted" style={{ marginTop: 30, textAlign: "center" }}>
          No campaigns match those filters.
        </p>
      )}

      <AnimatePresence>
        {applyFor && (
          <ApplyModal
            campaign={applyFor}
            onClose={() => setApplyFor(null)}
            onApplied={() => {
              setAppliedIds((s) => new Set(s).add(applyFor.id));
              setApplyFor(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ApplyModal({ campaign, onClose, onApplied }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();
  const onSubmit = async (data) => {
    try {
      await api.applyToCampaign({
        campaignId: campaign.id,
        quote: data.quote ? Number(data.quote) : undefined,
        message: data.message || undefined,
      });
      onApplied();
    } catch (err) {
      setError("root", { message: err.message || "Could not apply" });
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
        style={{ width: "100%", maxWidth: 440 }}
      >
        <div className="row between" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: "1.3rem" }}>Apply to campaign</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: 0,
              color: "var(--muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <p className="muted" style={{ fontSize: "0.86rem", marginBottom: 14 }}>
          {campaign.title} · by {campaign.brand}
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="stack"
          style={{ gap: 14 }}
        >
          <Field
            label="Your quote (USD)"
            type="number"
            placeholder={String(campaign.budget || "")}
            {...register("quote")}
          />
          <Field label="Message to the brand">
            <textarea
              className="input"
              rows={3}
              placeholder="Why you're a great fit…"
              {...register("message")}
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
              {isSubmitting ? "Sending…" : "Submit application"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
