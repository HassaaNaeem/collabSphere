import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";
import { Card, Badge, money } from "../components/ui/primitives";
import { container, fadeUp } from "../components/motion/variants";

const tone = (s) =>
  s === "Released"
    ? "good"
    : s === "Held" || s === "Pending"
      ? "warn"
      : undefined;

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .getPayments()
      .then((d) => {
        setRows(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = rows
    .filter((p) => p.status === "Released")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const held = rows
    .filter((p) => p.status === "Held")
    .reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Finance</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Payments</h1>
        <p className="muted">
          Escrow funding and releases across your contracts.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="row wrap"
        style={{ gap: 14, marginTop: 20 }}
      >
        <Card className="card-pad" style={{ minWidth: 200 }}>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Released
          </div>
          <div className="display" style={{ fontSize: "1.6rem" }}>
            {money(total)}
          </div>
        </Card>
        <Card className="card-pad" style={{ minWidth: 200 }}>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            Held in escrow
          </div>
          <div className="display" style={{ fontSize: "1.6rem" }}>
            {money(held)}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} style={{ marginTop: 20 }}>
        <Card className="card-pad" style={{ padding: 0 }}>
          {rows.map((p) => (
            <div
              key={p.id}
              className="row between"
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                  {p.campaign}
                </div>
                <div className="muted" style={{ fontSize: "0.78rem" }}>
                  {p.counterpart} · {p.kind} · {p.date}
                </div>
              </div>
              <div className="row" style={{ gap: 12 }}>
                <span style={{ fontWeight: 600 }}>{money(p.amount)}</span>
                <Badge tone={tone(p.status)}>{p.status}</Badge>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <p className="muted" style={{ padding: 18, fontSize: "0.88rem" }}>
              No payments yet.
            </p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
