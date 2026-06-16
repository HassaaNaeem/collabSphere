import { forwardRef } from "react";
import { motion } from "framer-motion";
import { hoverLift } from "../motion/variants";

export function Logo({ size = 26, withText = true }) {
  return (
    <span className="row" style={{ gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <circle
          cx="13"
          cy="16"
          r="7"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.4"
        />
        <circle
          cx="20"
          cy="16"
          r="7"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.4"
        />
      </svg>
      {withText && (
        <span
          className="display"
          style={{
            fontSize: "1.22rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          CollabSphere
        </span>
      )}
    </span>
  );
}

export function Button({
  as: As = "button",
  variant = "primary",
  size,
  className = "",
  children,
  ...rest
}) {
  const cls =
    `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`.trim();
  const Comp = As === "button" ? motion.button : motion(As);
  return (
    <Comp
      whileHover={{ scale: rest.disabled ? 1 : 1.02 }}
      whileTap={{ scale: rest.disabled ? 1 : 0.97 }}
      className={cls}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* React Hook Form friendly field. forwardRef so `{...register(name)}`
   (which includes a ref) reaches the underlying input. */
export const Field = forwardRef(function Field(
  { label, error, hint, children, ...rest },
  ref,
) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      {children || (
        <input ref={ref} className={`input ${error ? "err" : ""}`} {...rest} />
      )}
      {hint && !error && (
        <span className="errmsg" style={{ color: "var(--muted)" }}>
          {hint}
        </span>
      )}
      {error && <span className="errmsg">{error}</span>}
    </label>
  );
});

export function Card({ hover = false, className = "", style, children }) {
  if (hover) {
    return (
      <motion.div
        variants={hoverLift}
        initial="rest"
        whileHover="hover"
        className={`card ${className}`}
        style={style}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Badge({ children, tone }) {
  const style =
    tone === "good"
      ? {
          background: "color-mix(in srgb, var(--good) 16%, transparent)",
          color: "var(--good)",
        }
      : tone === "warn"
        ? {
            background: "color-mix(in srgb, var(--warn) 18%, transparent)",
            color: "var(--warn)",
          }
        : undefined;
  return (
    <span className="badge" style={style}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="card card-pad">
      <div className="tag">{label}</div>
      <div className="display" style={{ fontSize: "1.9rem", marginTop: 4 }}>
        {value}
      </div>
      {sub && (
        <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, size = 38 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function RatingStars({ value }) {
  return (
    <span
      style={{ color: "var(--accent)", fontSize: "0.9rem", letterSpacing: 1 }}
    >
      {"★".repeat(Math.round(value))}
      <span className="muted">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export const fmt = (n) =>
  n == null || Number.isNaN(n) || !Number.isFinite(n)
    ? "—"
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
        ? `${(n / 1000).toFixed(0)}K`
        : `${n}`;
export const money = (n) =>
  n == null || Number.isNaN(n) ? "—" : `$${Number(n).toLocaleString()}`;
