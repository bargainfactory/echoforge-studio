"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type Project,
  type Asset,
  type Notification,
  defaultProjects,
  defaultAssets,
  defaultNotifications,
} from "./data";

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
  projects: Project[];
  assets: Asset[];
  notifications: Notification[];
  toasts: Toast[];
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  approveProject: (id: string) => void;
  toggleAssetLike: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<Notification, "id">) => void;
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [assets, setAssets] = useState<Asset[]>(defaultAssets);
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(loadFromStorage("ef_user", null));
    setProjects(loadFromStorage("ef_projects", defaultProjects));
    setAssets(loadFromStorage("ef_assets", defaultAssets));
    setNotifications(loadFromStorage("ef_notifications", defaultNotifications));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage("ef_user", user);
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage("ef_projects", projects);
  }, [projects, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage("ef_assets", assets);
  }, [assets, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveToStorage("ef_notifications", notifications);
  }, [notifications, hydrated]);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      if (!email || !password) return false;
      const name = email.split("@")[0].replace(/[^a-zA-Z]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      const u: User = { name, email, initials, plan: "Creator Pro" };
      setUser(u);
      addToast(`Welcome back, ${name}!`);
      return true;
    },
    [addToast]
  );

  const signup = useCallback(
    (name: string, email: string, password: string) => {
      if (!name || !email || !password) return false;
      const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
      const u: User = { name, email, initials, plan: "Starter" };
      setUser(u);
      addToast(`Welcome to EchoForge, ${name}!`);
      return true;
    },
    [addToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("ef_user");
    addToast("Logged out successfully", "info");
  }, [addToast]);

  const addProject = useCallback(
    (project: Project) => {
      setProjects((prev) => [project, ...prev]);
      addToast(`Project "${project.title}" created`);
      const notif: Omit<Notification, "id"> = {
        title: "New Project",
        message: `"${project.title}" has been uploaded and is now processing.`,
        time: "Just now",
        read: false,
        type: "info",
      };
      setNotifications((prev) => [{ ...notif, id: `n-${Date.now()}` }, ...prev]);
    },
    [addToast]
  );

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const removeProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setAssets((prev) => prev.filter((a) => a.projectId !== id));
      addToast("Project removed", "info");
    },
    [addToast]
  );

  const approveProject = useCallback(
    (id: string) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: "published" as const, eta: `Published ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}` }
            : p
        )
      );
      setAssets((prev) =>
        prev.map((a) =>
          a.projectId === id ? { ...a, status: "live" as const } : a
        )
      );
      addToast("Project approved & published!");
      setNotifications((prev) => [
        {
          id: `n-${Date.now()}`,
          title: "Project Published",
          message: "Assets are now live and being distributed to all platforms.",
          time: "Just now",
          read: false,
          type: "success",
        },
        ...prev,
      ]);
    },
    [addToast]
  );

  const toggleAssetLike = useCallback((id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, liked: !a.liked } : a))
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, "id">) => {
    setNotifications((prev) => [{ ...n, id: `n-${Date.now()}` }, ...prev]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        projects,
        assets,
        notifications,
        toasts,
        login,
        signup,
        logout,
        addProject,
        updateProject,
        removeProject,
        approveProject,
        toggleAssetLike,
        markNotificationRead,
        markAllNotificationsRead,
        addNotification,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
