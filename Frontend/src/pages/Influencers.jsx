import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Search, MapPin, BadgeCheck, X } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NICHES, PLATFORMS } from "../data/dummyData";
import {
  Card,
  Button,
  Badge,
  Avatar,
  Field,
  RatingStars,
  fmt,
  money,
} from "../components/ui/primitives";
import { container, fadeUp, ease } from "../components/motion/variants";

export default function Influencers() {
  const { user } = useAuth();
  const isBrand = user?.role === "brand";
  const navigate = useNavigate();
  const [niche, setNiche] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [inviteFor, setInviteFor] = useState(null);
  const [invitedIds, setInvitedIds] = useState(() => new Set());

  useEffect(() => {
    api.getInfluencers({ niche, platform, q }).then(setData);
  }, [niche, platform, q]);

  const messageInfluencer = async (id) => {
    try {
      const { id: cid } = await api.startConversation({ influencerId: id });
      navigate("/app/brand/messages", { state: { open: cid } });
    } catch (e) {
      alert(e.message || "Could not open chat");
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Discovery</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Find influencers</h1>
        <p className="muted">
          Search verified creators by niche, platform and reach.
        </p>
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
            placeholder="Search by name or handle…"
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
        <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
          <button
            className={`chip ${!platform ? "active" : ""}`}
            onClick={() => setPlatform(null)}
          >
            All platforms
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              className={`chip ${platform === p ? "active" : ""}`}
              onClick={() => setPlatform(platform === p ? null : p)}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          marginTop: 22,
        }}
      >
        <AnimatePresence mode="popLayout">
          {data.map((i) => {
            const accounts = i.accounts || [];
            const top = accounts.length
              ? Math.max(...accounts.map((a) => a.followers))
              : null;
            return (
              <motion.div
                key={i.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card hover className="card-pad" style={{ height: "100%" }}>
                  <div className="row" style={{ gap: 12 }}>
                    <Avatar name={i.name} size={48} />
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{i.name}</span>
                        {i.verified && (
                          <BadgeCheck
                            size={16}
                            style={{ color: "var(--accent)" }}
                          />
                        )}
                      </div>
                      <div className="muted" style={{ fontSize: "0.82rem" }}>
                        {i.handle}
                      </div>
                    </div>
                  </div>
                  <p
                    className="muted"
                    style={{ fontSize: "0.86rem", marginTop: 12 }}
                  >
                    {i.bio}
                  </p>
                  <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                    {(i.niches || []).map((n) => (
                      <span
                        key={n}
                        className="chip"
                        style={{
                          cursor: "default",
                          fontSize: "0.72rem",
                          padding: "4px 9px",
                        }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <div
                    className="row between"
                    style={{ marginTop: 14, fontSize: "0.82rem" }}
                  >
                    <span className="row muted" style={{ gap: 4 }}>
                      <MapPin size={13} /> {i.location}
                    </span>
                    <RatingStars value={i.rating} />
                  </div>
                  <div className="divider" style={{ margin: "14px 0" }} />
                  <div className="row between">
                    <div>
                      <div className="display" style={{ fontSize: "1.2rem" }}>
                        {fmt(top)}
                      </div>
                      <div className="muted" style={{ fontSize: "0.74rem" }}>
                        top platform · from {money(i.rate)}
                      </div>
                    </div>
                    {isBrand && (
                      <div className="row" style={{ gap: 6 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => messageInfluencer(i.id)}
                        >
                          Message
                        </Button>
                        {invitedIds.has(i.id) ? (
                          <Badge tone="good">Invited</Badge>
                        ) : (
                          <Button
                            variant="soft"
                            size="sm"
                            onClick={() => setInviteFor(i)}
                          >
                            Invite
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {data.length === 0 && (
        <p className="muted" style={{ marginTop: 30, textAlign: "center" }}>
          No creators match those filters.
        </p>
      )}

      <AnimatePresence>
        {inviteFor && (
          <InviteModal
            influencer={inviteFor}
            onClose={() => setInviteFor(null)}
            onInvited={() => {
              setInvitedIds((s) => new Set(s).add(inviteFor.id));
              setInviteFor(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InviteModal({ influencer, onClose, onInvited }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();
  const [campaigns, setCampaigns] = useState([]);
  useEffect(() => {
    api
      .getMyCampaigns()
      .then(setCampaigns)
      .catch(() => setCampaigns([]));
  }, []);

  const onSubmit = async (data) => {
    if (!data.campaignId)
      return setError("root", { message: "Pick a campaign first" });
    try {
      await api.inviteInfluencer({
        campaignId: Number(data.campaignId),
        influencerId: influencer.id,
        message: data.message || undefined,
      });
      onInvited();
    } catch (err) {
      setError("root", { message: err.message || "Could not send invite" });
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
          <h2 style={{ fontSize: "1.3rem" }}>Invite {influencer.name}</h2>
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="stack"
          style={{ gap: 14, marginTop: 8 }}
        >
          <Field label="Campaign">
            <select
              className="select"
              defaultValue=""
              {...register("campaignId", { required: true })}
            >
              <option value="" disabled>
                Select a campaign…
              </option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Message (optional)">
            <textarea
              className="input"
              rows={3}
              placeholder="Tell them why they're a fit…"
              {...register("message")}
            />
          </Field>
          {campaigns.length === 0 && (
            <p className="muted" style={{ fontSize: "0.82rem" }}>
              You have no campaigns yet — create one first.
            </p>
          )}
          {errors.root && (
            <p className="errmsg" style={{ textAlign: "center" }}>
              {errors.root.message}
            </p>
          )}
          <div className="row" style={{ gap: 10, justifyContent: "flex-end" }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || campaigns.length === 0}
            >
              {isSubmitting ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
