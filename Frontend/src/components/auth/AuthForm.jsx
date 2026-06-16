import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo, Button, Field } from "../ui/primitives";
import ThemeToggle from "../ui/ThemeToggle";
import { NICHES, PLATFORMS } from "../../data/dummyData";
import { fadeUp, container, ease } from "../motion/variants";

/* One configurable form powers all 6 routes:
   /login|signup  ×  influencer|brand|admin
   Fields differ per role, satisfying the proposal's distinct actors. */

const ROLE_META = {
  influencer: {
    label: "Influencer",
    icon: Sparkles,
    home: "/app/influencer",
    blurb: "Showcase your work, get discovered by media houses, and get paid.",
    quote: "“CollabSphere replaced three group chats and a spreadsheet.”",
  },
  brand: {
    label: "Media House",
    icon: Building2,
    home: "/app/brand",
    blurb: "Find verified creators, launch campaigns, and manage deliverables.",
    quote: "“We shipped a campaign in two days instead of two weeks.”",
  },
  admin: {
    label: "Super Admin",
    icon: ShieldCheck,
    home: "/app/admin",
    blurb:
      "Verify accounts, moderate the marketplace, and watch platform health.",
    quote: "“Full operational visibility from one console.”",
  },
};

export default function AuthForm({ role, mode }) {
  const meta = ROLE_META[role];
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      if (isSignup) await signup({ role, ...data });
      else await login({ role, email: data.email, password: data.password });
      navigate(meta.home);
    } catch (err) {
      setError("root", { message: err.message || "Something went wrong" });
    }
  };

  const Icon = meta.icon;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
      }}
      className="auth-grid"
    >
      {/* Brand side */}
      <aside
        className="auth-aside"
        style={{
          background: "var(--ink)",
          color: "var(--bg)",
          padding: "40px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: 0.9,
            fontSize: "0.9rem",
          }}
        >
          <ArrowLeft size={16} /> Back home
        </Link>
        <motion.div initial="initial" animate="animate" variants={container}>
          <motion.div
            variants={fadeUp}
            className="row"
            style={{ gap: 10, marginBottom: 22 }}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--accent)",
                color: "var(--accent-ink)",
              }}
            >
              <Icon size={22} />
            </span>
            <span className="display" style={{ fontSize: "1.2rem" }}>
              {meta.label} access
            </span>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}
          >
            {isSignup ? "Join the" : "Welcome back to"}
            <br />
            creator economy, organized.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            style={{ marginTop: 16, opacity: 0.78, maxWidth: 380 }}
          >
            {meta.blurb}
          </motion.p>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, ease }}
          className="serif"
          style={{ fontStyle: "italic", fontSize: "1.05rem" }}
        >
          {meta.quote}
        </motion.p>
      </aside>

      {/* Form side */}
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 24, right: 24 }}>
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{ width: "100%", maxWidth: 400 }}
        >
          <div style={{ marginBottom: 26 }}>
            <Logo />
            <h1 style={{ fontSize: "1.7rem", marginTop: 22 }}>
              {isSignup
                ? `Create your ${meta.label.toLowerCase()} account`
                : `Sign in as ${meta.label.toLowerCase()}`}
            </h1>
            <p className="muted" style={{ marginTop: 6, fontSize: "0.92rem" }}>
              {isSignup
                ? "It takes less than a minute."
                : "Enter your details to continue."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="stack"
            style={{ gap: 16 }}
          >
            {isSignup && role === "influencer" && (
              <Field
                label="Full name"
                error={errors.name?.message}
                placeholder="Maya Castellano"
                {...register("name", { required: "Name is required" })}
              />
            )}
            {isSignup && role === "brand" && (
              <Field
                label="Company / Media house"
                error={errors.company?.message}
                placeholder="Northbound Media"
                {...register("company", {
                  required: "Company name is required",
                })}
              />
            )}

            <Field
              label="Email"
              error={errors.email?.message}
              type="email"
              placeholder="you@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/, message: "Enter a valid email" },
              })}
            />

            {isSignup && role === "influencer" && (
              <Field label="Primary niche" error={errors.niche?.message}>
                <select
                  className="select"
                  {...register("niche", { required: "Pick a niche" })}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a niche…
                  </option>
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {isSignup && role === "influencer" && (
              <Field
                label="Handle"
                placeholder="@mayacreates"
                {...register("handle")}
              />
            )}
            {isSignup && role === "influencer" && (
              <Field
                label="Location"
                placeholder="Karachi, PK"
                {...register("location")}
              />
            )}
            {isSignup && role === "influencer" && (
              <div className="row" style={{ gap: 12 }}>
                <Field
                  label="Base rate (USD)"
                  type="number"
                  placeholder="500"
                  {...register("rate")}
                />
                <Field label="Main platform">
                  <select
                    className="select"
                    defaultValue=""
                    {...register("platform")}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            {isSignup && role === "influencer" && (
              <Field
                label="Followers"
                type="number"
                placeholder="25000"
                {...register("followers")}
              />
            )}
            {isSignup && role === "brand" && (
              <Field
                label="Industry"
                placeholder="Consumer Tech"
                {...register("industry")}
              />
            )}
            {role === "admin" && isSignup && (
              <Field
                label="Admin invite code"
                error={errors.code?.message}
                placeholder="CS-ADMIN-XXXX"
                {...register("code", { required: "Invite code required" })}
              />
            )}

            <Field
              label="Password"
              error={errors.password?.message}
              type="password"
              placeholder="••••••••"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />

            {errors.root && (
              <p className="errmsg" style={{ textAlign: "center" }}>
                {errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait…"
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p
            className="muted"
            style={{ marginTop: 20, fontSize: "0.9rem", textAlign: "center" }}
          >
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <Link
              className="link-accent"
              to={isSignup ? `/login/${role}` : `/signup/${role}`}
            >
              {isSignup ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
