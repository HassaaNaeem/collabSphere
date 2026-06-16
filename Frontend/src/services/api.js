/* ------------------------------------------------------------------
   API service layer — talks to the CollabSphere Express backend.
   The frontend uses role "brand"; the backend uses "media_house".
   This file maps between the two so the rest of the app is unchanged.
   ------------------------------------------------------------------ */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "cs-token";

// --- token storage ---
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// --- role mapping (frontend <-> backend) ---
const toBackendRole = {
  influencer: "influencer",
  brand: "media_house",
  admin: "admin",
};
const toFrontendRole = {
  influencer: "influencer",
  media_house: "brand",
  admin: "admin",
};
const mapUser = (u) =>
  u ? { ...u, role: toFrontendRole[u.role] || u.role } : u;

// --- enum status -> display label ("in_progress" -> "In Progress") ---
const pretty = (s) =>
  typeof s === "string"
    ? s
        .split("_")
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ")
    : s;

// --- core fetch helper ---
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const qstr = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v) p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  // ---- auth ----
  async login({ role, email, password }) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password, role: toBackendRole[role] },
    });
    setToken(data.token);
    return mapUser(data.user);
  },
  async signup(payload) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: { ...payload, role: toBackendRole[payload.role] },
    });
    setToken(data.token);
    return mapUser(data.user);
  },
  async me() {
    const data = await request("/auth/me", { auth: true });
    return mapUser(data.user);
  },
  logout() {
    clearToken();
  },

  // ---- data ----
  async getCampaigns({ niche, status, q } = {}) {
    const rows = await request(`/campaigns${qstr({ niche, status, q })}`);
    // add singular `niche` for the card badge, and Title-case the status
    return rows.map((c) => ({
      ...c,
      niche: c.niches?.[0],
      status: pretty(c.status),
    }));
  },
  async createCampaign(payload) {
    return request("/campaigns", { method: "POST", body: payload, auth: true });
  },
  async getMyCampaigns({ niche, status, q } = {}) {
    const rows = await request(`/campaigns/mine${qstr({ niche, status, q })}`, {
      auth: true,
    });
    return rows.map((c) => ({
      ...c,
      niche: c.niches?.[0],
      status: pretty(c.status),
    }));
  },
  async getInfluencers({ niche, platform, q } = {}) {
    return request(`/influencers${qstr({ niche, platform, q })}`);
  },
  async getApplications() {
    const rows = await request("/applications", { auth: true });
    return rows.map((a) => ({ ...a, status: pretty(a.status) }));
  },
  async getContracts() {
    const rows = await request("/contracts", { auth: true });
    return rows.map((c) => ({ ...c, status: pretty(c.status) }));
  },
  async getReviews({ all = false, userId } = {}) {
    return request(`/reviews${qstr({ all: all ? "1" : "", userId })}`, {
      auth: all,
    });
  },
  async setReviewHidden(id, hidden) {
    return request(`/reviews/${id}`, {
      method: "PATCH",
      body: { hidden },
      auth: true,
    });
  },
  async decideVerification(userId, approve) {
    return request(`/admin/verifications/${userId}`, {
      method: "PATCH",
      body: { approve },
      auth: true,
    });
  },
  async getAdminStats() {
    return request("/admin/stats", { auth: true });
  },
  async getVerificationQueue() {
    return request("/admin/verifications", { auth: true });
  },
  async getBrands() {
    return request("/brands");
  },

  // ---- applications (apply + brand decision) ----
  async applyToCampaign({ campaignId, quote, message }) {
    return request("/applications", {
      method: "POST",
      body: { campaignId, quote, message },
      auth: true,
    });
  },
  async decideApplication(id, status) {
    return request(`/applications/${id}`, {
      method: "PATCH",
      body: { status },
      auth: true,
    });
  },

  // ---- invitations (brand invite + influencer decision) ----
  async inviteInfluencer({ campaignId, influencerId, message }) {
    return request("/invitations", {
      method: "POST",
      body: { campaignId, influencerId, message },
      auth: true,
    });
  },
  async getInvitations() {
    const rows = await request("/invitations", { auth: true });
    return rows.map((i) => ({ ...i, status: pretty(i.status) }));
  },
  async decideInvitation(id, status) {
    return request(`/invitations/${id}`, {
      method: "PATCH",
      body: { status },
      auth: true,
    });
  },

  // ---- notifications ----
  async getNotifications() {
    return request("/notifications", { auth: true });
  },
  async markNotificationRead(id) {
    return request(`/notifications/${id}/read`, {
      method: "PATCH",
      auth: true,
    });
  },
  async markAllNotificationsRead() {
    return request("/notifications/read-all", { method: "PATCH", auth: true });
  },

  // ---- deliverables ----
  async getReviewQueue() {
    return request("/deliverables/inbox", { auth: true });
  },
  async getDeliverables(contractId) {
    return request(`/deliverables${qstr({ contractId })}`, { auth: true });
  },
  async submitDeliverable(id, { url, caption }) {
    return request(`/deliverables/${id}/submit`, {
      method: "POST",
      body: { url, caption },
      auth: true,
    });
  },
  async reviewDeliverable(id, { decision, feedback }) {
    return request(`/deliverables/${id}/review`, {
      method: "PATCH",
      body: { decision, feedback },
      auth: true,
    });
  },

  // ---- payments ----
  async getPayments() {
    const rows = await request("/payments", { auth: true });
    return rows.map((p) => ({
      ...p,
      status: pretty(p.status),
      kind: pretty(p.kind),
    }));
  },

  // ---- admin powers ----
  async updateCampaign(id, payload) {
    return request(`/campaigns/${id}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },
  async getAdminUsers() {
    return request("/admin/users", { auth: true });
  },
  async deleteUser(id) {
    return request(`/admin/users/${id}`, { method: "DELETE", auth: true });
  },

  // ---- chat ----
  async startConversation({ influencerId, mediaHouseId }) {
    return request("/conversations", {
      method: "POST",
      body: { influencerId, mediaHouseId },
      auth: true,
    });
  },
  async getConversations() {
    return request("/conversations", { auth: true });
  },
  async getMessages(id) {
    return request(`/conversations/${id}/messages`, { auth: true });
  },
  async sendMessage(id, body) {
    return request(`/conversations/${id}/messages`, {
      method: "POST",
      body: { body },
      auth: true,
    });
  },
};
