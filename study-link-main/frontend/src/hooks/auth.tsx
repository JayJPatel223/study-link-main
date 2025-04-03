import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authClient } from "@lib/api-client";
import { User } from "better-auth/types";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  sessionToken: string | null;
  setUser: (user: User | null) => void;
  setSessionToken: (sessionToken: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  refreshSession: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await authClient.getSession();

        if (data && !error) {
          setIsAuthenticated(true);
          setUser(data.user);
          setSessionToken(data.session.token);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const refreshSession = async () => {
    const { data, error } = await authClient.getSession();
    if (data && !error) {
      setIsAuthenticated(true);
      setSessionToken(data.session.token);
      setUser(data.user);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    sessionToken,
    setUser,
    setSessionToken,
    setIsAuthenticated,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
