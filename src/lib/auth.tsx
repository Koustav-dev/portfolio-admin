import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface Admin {
  id:    string;
  email: string;
  name:  string;
}

interface AuthContextType {
  admin:      Admin | null;
  token:      string | null;
  login:      (email: string, password: string) => Promise<void>;
  logout:     () => void;
  isLoading:  boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin,     setAdmin]     = useState<Admin | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    const savedAdmin = localStorage.getItem("admin_user");
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res  = await fetch(`${BASE}/admin/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Invalid credentials");

    const { admin, accessToken, refreshToken } = json.data;
    setAdmin(admin);
    setToken(accessToken);
    localStorage.setItem("admin_token",   accessToken);
    localStorage.setItem("admin_refresh", refreshToken);
    localStorage.setItem("admin_user",    JSON.stringify(admin));
  };

  const logout = useCallback(() => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh");
    localStorage.removeItem("admin_user");
  }, []);

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
