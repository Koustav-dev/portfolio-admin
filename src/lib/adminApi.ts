const BASE = import.meta.env.VITE_API_URL;

// Authenticated fetch — attaches Bearer token
async function authRequest<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data;
}

// Public fetch (no auth needed)
async function publicRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data;
}

export const adminApi = {
  // ── Projects ─────────────────────────────────────────────────
  getProjects: (token: string, page = 1) =>
    fetch(`${BASE}/projects?page=${page}&limit=20`, {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(r => r.json()),

  createProject: (token: string, data: FormData) =>
    fetch(`${BASE}/projects`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body:    data,
    }).then(r => r.json()),

  updateProject: (token: string, id: string, data: FormData) =>
    fetch(`${BASE}/projects/${id}`, {
      method:  "PATCH",
      headers: { "Authorization": `Bearer ${token}` },
      body:    data,
    }).then(r => r.json()),

  deleteProject: (token: string, id: string) =>
    authRequest(`/projects/${id}`, token, { method: "DELETE" }),

  // ── Experience ───────────────────────────────────────────────
  getExperience: (token: string) =>
    fetch(`${BASE}/experience?limit=50`, {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(r => r.json()),

  createExperience: (token: string, data: FormData) =>
    fetch(`${BASE}/experience`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body:    data,
    }).then(r => r.json()),

  updateExperience: (token: string, id: string, data: FormData) =>
    fetch(`${BASE}/experience/${id}`, {
      method:  "PATCH",
      headers: { "Authorization": `Bearer ${token}` },
      body:    data,
    }).then(r => r.json()),

  deleteExperience: (token: string, id: string) =>
    authRequest(`/experience/${id}`, token, { method: "DELETE" }),

  // ── Messages ─────────────────────────────────────────────────
  getMessages: (token: string, filter?: string, page = 1) => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter && filter !== "all") params.set("read", filter === "unread" ? "false" : "true");
    return fetch(`${BASE}/contact?${params}`, {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(r => r.json());
  },

  markRead: (token: string, id: string, read: boolean) =>
    authRequest(`/contact/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify({ read }),
    }),

  markStarred: (token: string, id: string, starred: boolean) =>
    authRequest(`/contact/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify({ starred }),
    }),

  deleteMessage: (token: string, id: string) =>
    authRequest(`/contact/${id}`, token, { method: "DELETE" }),

  // ── Auth ─────────────────────────────────────────────────────
  getMe: (token: string) =>
    authRequest("/admin/me", token),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    authRequest("/admin/password", token, {
      method: "PATCH",
      body:   JSON.stringify({ currentPassword, newPassword }),
    }),
};
