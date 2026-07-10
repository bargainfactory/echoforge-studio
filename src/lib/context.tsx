"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { type Project, type Asset, type Notification } from "./data";
import { track } from "./track";

export interface User {
  name: string;
  email: string;
  initials: string;
  plan: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppState {
  user: User | null;
  ready: boolean;
  projects: Project[];
  assets: Asset[];
  notifications: Notification[];
  toasts: Toast[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  uploadProject: (
    file: File | null,
    transcript: string,
    onProgress?: (pct: number) => void
  ) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => Promise<void>;
  approveProject: (id: string) => Promise<void>;
  toggleAssetLike: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

async function api(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
}

// Multipart POST with real upload-progress (fetch can't report upload progress).
function xhrPost(
  url: string,
  form: FormData,
  onProgress?: (pct: number) => void
): Promise<{ ok: boolean; status: number; data: unknown }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      let data: unknown = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON response */
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => resolve({ ok: false, status: 0, data: null });
    xhr.send(form);
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const applyBootstrap = useCallback(
    (data: {
      user: User | null;
      projects?: Project[];
      assets?: Asset[];
      notifications?: Notification[];
    }) => {
      setUser(data.user);
      setProjects(data.projects ?? []);
      setAssets(data.assets ?? []);
      setNotifications(data.notifications ?? []);
    },
    []
  );

  const refresh = useCallback(async () => {
    const res = await api("/api/bootstrap");
    if (res.ok) {
      applyBootstrap(await res.json());
    } else {
      applyBootstrap({ user: null });
    }
  }, [applyBootstrap]);

  // Hydrate from the server session on first load.
  useEffect(() => {
    let active = true;
    api("/api/bootstrap")
      .then(async (res) => {
        if (!active) return;
        if (res.ok) applyBootstrap(await res.json());
        else applyBootstrap({ user: null });
      })
      .catch(() => active && applyBootstrap({ user: null }))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, [applyBootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const { user: u } = await res.json();
      await refresh();
      addToast(`Welcome back, ${u.name}!`);
      return true;
    },
    [refresh, addToast]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return false;
      const { user: u } = await res.json();
      track("signup_complete");
      await refresh();
      addToast(`Welcome to EchoForge, ${u.name}!`);
      return true;
    },
    [refresh, addToast]
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    applyBootstrap({ user: null });
    addToast("Logged out successfully", "info");
  }, [applyBootstrap, addToast]);

  const uploadProject = useCallback(
    async (
      file: File | null,
      transcript: string,
      onProgress?: (pct: number) => void
    ) => {
      const derivedFromFile = file?.name?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const derivedFromText = transcript.trim().split(/\s+/).slice(0, 7).join(" ");
      const title = (derivedFromFile || derivedFromText || "Untitled project").trim();

      const form = new FormData();
      form.append("title", title);
      form.append("locale", localStorage.getItem("ef_locale") || "en");
      if (transcript.trim()) form.append("transcript", transcript.trim());
      if (file) form.append("file", file);

      const res = await xhrPost("/api/projects", form, onProgress);
      if (!res.ok) {
        addToast("Upload failed — please sign in again", "error");
        return null;
      }
      const { project, assets: newAssets } = res.data as {
        project: Project;
        assets: Asset[];
      };
      setProjects((prev) => [project, ...prev]);
      if (newAssets?.length) setAssets((prev) => [...newAssets, ...prev]);
      addToast(
        `Generated ${newAssets?.length ?? 0} assets for "${project.title}"`
      );
      api("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setNotifications(d.notifications))
        .catch(() => {});
      return project;
    },
    [addToast]
  );

  // Optimistic local update + persisted PATCH (used by the processing sim).
  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    api(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, []);

  const removeProject = useCallback(
    async (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setAssets((prev) => prev.filter((a) => a.projectId !== id));
      addToast("Project removed", "info");
      await api(`/api/projects/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [addToast]
  );

  const approveProject = useCallback(
    async (id: string) => {
      const res = await api(`/api/projects/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        addToast("Could not publish project", "error");
        return;
      }
      const { project } = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
      setAssets((prev) =>
        prev.map((a) => (a.projectId === id ? { ...a, status: "live" as const } : a))
      );
      addToast("Project approved & published!");
      api("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setNotifications(d.notifications))
        .catch(() => {});
    },
    [addToast]
  );

  const toggleAssetLike = useCallback((id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, liked: !a.liked } : a))
    );
    api(`/api/assets/${id}/like`, { method: "POST" }).catch(() => {});
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    api(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        ready,
        projects,
        assets,
        notifications,
        toasts,
        login,
        signup,
        logout,
        uploadProject,
        updateProject,
        removeProject,
        approveProject,
        toggleAssetLike,
        markNotificationRead,
        markAllNotificationsRead,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
