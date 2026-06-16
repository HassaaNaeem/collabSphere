import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { api } from "../services/api";
import { Card, Button } from "../components/ui/primitives";
import { container, fadeUp } from "../components/motion/variants";

const time = (t) => {
  try {
    return format(new Date(t), "MMM d, HH:mm");
  } catch {
    return "";
  }
};

export default function Messages() {
  const location = useLocation();
  const [convos, setConvos] = useState([]);
  const [sel, setSel] = useState(location.state?.open || null);
  const [thread, setThread] = useState({ readonly: false, messages: [] });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const loadConvos = () =>
    api
      .getConversations()
      .then(setConvos)
      .catch(() => setConvos([]));
  const loadThread = (id) =>
    api
      .getMessages(id)
      .then(setThread)
      .catch(() => {});

  useEffect(() => {
    loadConvos();
  }, []);
  useEffect(() => {
    if (location.state?.open) {
      setSel(location.state.open);
    }
  }, [location.state]);

  useEffect(() => {
    if (!sel) return;
    loadThread(sel);
    const t = setInterval(() => loadThread(sel), 6000);
    return () => clearInterval(t);
  }, [sel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !sel) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(sel, body);
      setThread((t) => ({ ...t, messages: [...t.messages, msg] }));
      setText("");
      loadConvos();
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial="initial" animate="animate" variants={container}>
      <motion.div variants={fadeUp}>
        <span className="eyebrow">Messages</span>
        <h1 style={{ fontSize: "2.1rem", marginTop: 8 }}>Conversations</h1>
        <p className="muted">
          Private chats between a media house and a creator.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="grid"
        style={{
          gridTemplateColumns: "300px 1fr",
          gap: 16,
          marginTop: 20,
          alignItems: "start",
        }}
      >
        {/* conversation list */}
        <Card
          className="card-pad"
          style={{ padding: 0, maxHeight: 540, overflow: "auto" }}
        >
          {convos.map((c) => (
            <button
              key={c.id}
              onClick={() => setSel(c.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "13px 14px",
                cursor: "pointer",
                border: 0,
                borderBottom: "1px solid var(--border)",
                background: sel === c.id ? "var(--accent-soft)" : "transparent",
              }}
            >
              <div className="row between">
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {c.name}
                </span>
                {c.unread > 0 && (
                  <span
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 99,
                      padding: "1px 7px",
                    }}
                  >
                    {c.unread}
                  </span>
                )}
              </div>
              <div
                className="muted"
                style={{
                  fontSize: "0.78rem",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {c.last || "No messages yet"}
              </div>
            </button>
          ))}
          {convos.length === 0 && (
            <p className="muted" style={{ padding: 16, fontSize: "0.85rem" }}>
              No conversations yet.
            </p>
          )}
        </Card>

        {/* thread */}
        <Card
          className="card-pad"
          style={{ display: "flex", flexDirection: "column", height: 540 }}
        >
          {!sel && (
            <div
              className="muted"
              style={{ margin: "auto", fontSize: "0.9rem" }}
            >
              Select a conversation to start.
            </div>
          )}
          {sel && (
            <>
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  paddingRight: 4,
                }}
              >
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.mine ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                    }}
                  >
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: 14,
                        background: m.mine
                          ? "var(--accent)"
                          : "var(--surface-2)",
                        color: m.mine ? "#fff" : "var(--ink)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {thread.readonly && !m.mine && (
                        <div
                          style={{
                            fontSize: "0.72rem",
                            opacity: 0.7,
                            marginBottom: 2,
                          }}
                        >
                          {m.sender}
                        </div>
                      )}
                      {m.body}
                    </div>
                    <div
                      className="muted"
                      style={{
                        fontSize: "0.68rem",
                        marginTop: 3,
                        textAlign: m.mine ? "right" : "left",
                      }}
                    >
                      {time(m.at)}
                    </div>
                  </div>
                ))}
                {thread.messages.length === 0 && (
                  <div
                    className="muted"
                    style={{ margin: "auto", fontSize: "0.86rem" }}
                  >
                    No messages yet — say hello.
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {thread.readonly ? (
                <div
                  className="muted"
                  style={{
                    textAlign: "center",
                    fontSize: "0.82rem",
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  Read-only · admin oversight view
                </div>
              ) : (
                <div
                  className="row"
                  style={{
                    gap: 8,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <input
                    className="input"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send();
                    }}
                  />
                  <Button variant="primary" disabled={sending} onClick={send}>
                    <Send size={16} />
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
