import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Landing from "../pages/Landing";
import NotFound from "../pages/NotFound";
import AuthForm from "../components/auth/AuthForm";
import RequireAuth from "../components/auth/RequireAuth";
import AppLayout from "../components/layout/AppLayout";

import InfluencerDashboard from "../pages/dashboard/InfluencerDashboard";
import BrandDashboard from "../pages/dashboard/BrandDashboard";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import Campaigns from "../pages/Campaigns";
import Influencers from "../pages/Influencers";
import Contracts from "../pages/Contracts";
import Payments from "../pages/Payments";
import Messages from "../pages/Messages";
import Verifications from "../pages/Verifications";
import Moderation from "../pages/Moderation";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminCampaigns from "../pages/admin/AdminCampaigns";

export default function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />

        {/* --- Auth: one component, six distinct routes (per actor) --- */}
        <Route
          path="/login/influencer"
          element={<AuthForm role="influencer" mode="login" />}
        />
        <Route
          path="/signup/influencer"
          element={<AuthForm role="influencer" mode="signup" />}
        />
        <Route
          path="/login/brand"
          element={<AuthForm role="brand" mode="login" />}
        />
        <Route
          path="/signup/brand"
          element={<AuthForm role="brand" mode="signup" />}
        />
        <Route
          path="/login/admin"
          element={<AuthForm role="admin" mode="login" />}
        />
        <Route
          path="/signup/admin"
          element={<AuthForm role="admin" mode="signup" />}
        />

        {/* --- Influencer app --- */}
        <Route
          element={
            <RequireAuth role="influencer">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/app/influencer" element={<InfluencerDashboard />} />
          <Route path="/app/influencer/campaigns" element={<Campaigns />} />
          <Route path="/app/influencer/contracts" element={<Contracts />} />
          <Route path="/app/influencer/payments" element={<Payments />} />
          <Route path="/app/influencer/messages" element={<Messages />} />
        </Route>

        {/* --- Media house (brand) app --- */}
        <Route
          element={
            <RequireAuth role="brand">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/app/brand" element={<BrandDashboard />} />
          <Route path="/app/brand/influencers" element={<Influencers />} />
          <Route
            path="/app/brand/campaigns"
            element={
              <Campaigns
                mine
                title="My campaigns"
                subtitle="Briefs you've published and their status."
              />
            }
          />
          <Route path="/app/brand/payments" element={<Payments />} />
          <Route path="/app/brand/messages" element={<Messages />} />
        </Route>

        {/* --- Super admin app --- */}
        <Route
          element={
            <RequireAuth role="admin">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/app/admin" element={<AdminDashboard />} />
          <Route path="/app/admin/verifications" element={<Verifications />} />
          <Route path="/app/admin/reviews" element={<Moderation />} />
          <Route path="/app/admin/users" element={<AdminUsers />} />
          <Route path="/app/admin/campaigns" element={<AdminCampaigns />} />
          <Route path="/app/admin/payments" element={<Payments />} />
          <Route path="/app/admin/messages" element={<Messages />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
