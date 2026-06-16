import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, BadgeCheck } from "lucide-react";
import { api } from "../../services/api";
import { Card, Badge, Button } from "../../components/ui/primitives";
import { container, fadeUp } from "../../components/motion/variants";

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () =>
    api
      .getAdminUsers()
      .then(setRows)
      .catch(() => setRows([]));
  useEffect(() => {
    load();
  }, []);

  const remove = async (u) => {
    if (
      !window.confirm(
        `Delete ${u.name} (${u.email})? This removes all their data and cannot be undone.`,
      )
    )
      return;
    setBusy(u.id);
    try {
      await api.deleteUser(u.id);
      load();
    } catch (e) {
      alert(e.message || "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Administration</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Manage users</h1>
        <p className="muted">
          Every influencer and media house on the platform.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} style={{ marginTop: 20 }}>
        <Card className="card-pad" style={{ padding: 0 }}>
          {rows.map((u) => (
            <div
              key={u.id}
              className="row between"
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="row" style={{ gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                    {u.name}
                  </span>
                  {u.verified && (
                    <BadgeCheck size={15} style={{ color: "var(--accent)" }} />
                  )}
                </div>
                <div className="muted" style={{ fontSize: "0.78rem" }}>
                  {u.email} · joined {u.joined}
                </div>
              </div>
              <div className="row" style={{ gap: 12 }}>
                <Badge>{u.type}</Badge>
                <Badge tone={u.verified ? "good" : "warn"}>
                  {u.verified ? "Verified" : "Pending"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === u.id}
                  onClick={() => remove(u)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="muted" style={{ padding: 18, fontSize: "0.88rem" }}>
              No users found.
            </p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
