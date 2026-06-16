import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { X, Pencil } from "lucide-react";
import { api } from "../../services/api";
import {
  Card,
  Badge,
  Button,
  Field,
  money,
} from "../../components/ui/primitives";
import { container, fadeUp, ease } from "../../components/motion/variants";

const STATUS = ["Draft", "Open", "In Progress", "Completed", "Cancelled"];

export default function AdminCampaigns() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () =>
    api
      .getCampaigns()
      .then(setRows)
      .catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Manage campaigns</h1>
        <p className="muted">
          Edit any campaign's details or status across the platform.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="stack"
        style={{ gap: 12, marginTop: 20 }}
      >
        {rows.map((c) => (
          <Card key={c.id} className="card-pad">
            <div className="row between wrap" style={{ gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                  {c.title}
                </div>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  by {c.brand} · {money(c.budget)} · due {c.deadline || "—"}
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
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
                <Button size="sm" variant="soft" onClick={() => setEditing(c)}>
                  <Pencil size={14} /> Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="muted">No campaigns found.</p>}
      </motion.div>

      <AnimatePresence>
        {editing && (
          <EditModal
            campaign={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditModal({ campaign, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: campaign.title,
      budget: campaign.budget,
      deadline: campaign.deadline || "",
      status: campaign.status,
      brief: campaign.brief,
    },
  });
  const onSubmit = async (data) => {
    try {
      await api.updateCampaign(campaign.id, {
        title: data.title,
        brief: data.brief,
        budget: data.budget ? Number(data.budget) : undefined,
        deadline: data.deadline || undefined,
        status: data.status,
      });
      onSaved();
    } catch (err) {
      setError("root", { message: err.message || "Update failed" });
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
        style={{ width: "100%", maxWidth: 460 }}
      >
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: "1.3rem" }}>Edit campaign</h2>
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
          style={{ gap: 14 }}
        >
          <Field label="Title" {...register("title", { required: true })} />
          <div className="row" style={{ gap: 12 }}>
            <Field label="Budget (USD)" type="number" {...register("budget")} />
            <Field label="Deadline" type="date" {...register("deadline")} />
          </div>
          <Field label="Status">
            <select className="select" {...register("status")}>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Brief">
            <textarea className="input" rows={3} {...register("brief")} />
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
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
