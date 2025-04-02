// A simple fake authentication service that doesn't use context
import { useState, useEffect } from "react";
import { apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

export type User = {
  id: number;
  username: string;
};

// A simple global variable to store the current user
let currentUser: User | null = null;

// Using a function to get/set the global value for testing
export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
}

// Simple hook that doesn't use context
export function useAuth() {
  const [user, setUser] = useState<User | null>(currentUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "include",
      });
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setUser(data.user);
      } else {
        setCurrentUser(null);
        setUser(null);
      }
    } catch (error) {
      setCurrentUser(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setUser(data.user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.username}!`,
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setCurrentUser(null);
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      // Redirect to landing page after logout
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

// Empty provider component for compatibility with App.tsx
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};