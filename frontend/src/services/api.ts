import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// attach JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// on 401 clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// --- auth ---
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  googleLogin: (credential: string) => api.post("/auth/google", { credential }),
};

// --- users ---
export const usersApi = {
  list: () => api.get("/users"),
  getById: (id: string) => api.get(`/users/${id}`),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, { status }),
};

// --- records ---
export const recordsApi = {
  list: (params?: Record<string, string>) => api.get("/records", { params }),
  getById: (id: string) => api.get(`/records/${id}`),
  create: (data: {
    amount: number;
    type: string;
    category: string;
    date: string;
    notes?: string;
  }) => api.post("/records", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/records/${id}`, data),
  delete: (id: string) => api.delete(`/records/${id}`),
};

// --- dashboard ---
export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  categories: () => api.get("/dashboard/categories"),
  trends: (period: string = "monthly") =>
    api.get("/dashboard/trends", { params: { period } }),
  recent: () => api.get("/dashboard/recent"),
};

export default api;
