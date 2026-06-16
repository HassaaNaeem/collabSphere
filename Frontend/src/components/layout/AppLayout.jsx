import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  FileText,
  Star,
  ShieldCheck,
  LogOut,
  BadgeCheck,
  Building2,
  Sparkles,
  CreditCard,
  UserCog,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo, Avatar } from "../ui/primitives";
import ThemeToggle from "../ui/ThemeToggle";
import NotificationBell from "./NotificationBell";

const NAV = {
  influencer: [
    {
      to: "/app/influencer",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/app/influencer/campaigns",
      label: "Discover Campaigns",
      icon: Megaphone,
    },
    { to: "/app/influencer/contracts", label: "My Contracts", icon: FileText },
    { to: "/app/influencer/messages", label: "Messages", icon: MessageCircle },
    { to: "/app/influencer/payments", label: "Payments", icon: CreditCard },
  ],
  brand: [
    { to: "/app/brand", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/app/brand/influencers", label: "Find Influencers", icon: Users },
    { to: "/app/brand/campaigns", label: "My Campaigns", icon: Megaphone },
    { to: "/app/brand/messages", label: "Messages", icon: MessageCircle },
    { to: "/app/brand/payments", label: "Payments", icon: CreditCard },
  ],
  admin: [
    { to: "/app/admin", label: "Overview", icon: LayoutDashboard, end: true },
    {
      to: "/app/admin/verifications",
      label: "Verifications",
      icon: BadgeCheck,
    },
    { to: "/app/admin/reviews", label: "Moderation", icon: Star },
    { to: "/app/admin/users", label: "Manage Users", icon: UserCog },
    { to: "/app/admin/campaigns", label: "Manage Campaigns", icon: Megaphone },
    { to: "/app/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/app/admin/messages", label: "All Chats", icon: MessageCircle },
  ],
};

const ROLE_TAG = {
  influencer: { label: "Influencer", icon: Sparkles },
  brand: { label: "Media House", icon: Building2 },
  admin: { label: "Super Admin", icon: ShieldCheck },
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const items = NAV[user.role] || [];
  const tag = ROLE_TAG[user.role];
  const TagIcon = tag.icon;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "256px 1fr",
        minHeight: "100vh",
      }}
      className="app-grid"
    >
      <aside
        className="app-sidebar"
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "22px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ padding: "6px 8px 18px" }}>
          <Logo />
        </div>

        <div
          className="badge"
          style={{ alignSelf: "flex-start", margin: "0 8px 14px" }}
        >
          <TagIcon size={13} /> {tag.label}
        </div>

        <nav className="stack" style={{ gap: 4 }}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className="nav-link"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: "0.92rem",
                fontWeight: 500,
                color: isActive ? "var(--accent)" : "var(--ink-soft)",
                background: isActive ? "var(--accent-soft)" : "transparent",
              })}
            >
              <it.icon size={18} /> {it.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: "auto" }}>
          <div className="divider" style={{ margin: "12px 0" }} />
          <div className="row" style={{ gap: 10, padding: "6px 8px" }}>
            <Avatar name={user.name || "User"} size={36} />
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {user.name || "User"}
              </div>
              <div
                className="muted"
                style={{
                  fontSize: "0.76rem",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {user.email || "signed in"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "10px 12px",
              borderRadius: 10,
              color: "var(--muted)",
              width: "100%",
              background: "transparent",
              border: 0,
            }}
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          className="row between"
          style={{
            padding: "16px 28px",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "color-mix(in srgb, var(--bg) 85%, transparent)",
            backdropFilter: "blur(10px)",
            zIndex: 5,
          }}
        >
          <span className="muted" style={{ fontSize: "0.9rem" }}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
          <div className="row" style={{ gap: 16 }}>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
        {user && user.isVerified === false && user.role !== "admin" && (
          <div
            style={{
              padding: "10px 28px",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.85rem",
              fontWeight: 500,
              textAlign: "center",
              position: "sticky",
              top: 57,
              zIndex: 4,
            }}
          >
            Your account is pending Super Admin approval — you can browse, but
            applying and creating campaigns stay disabled until you’re approved.
          </div>
        )}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: "30px 28px 60px",
            maxWidth: 1100,
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
