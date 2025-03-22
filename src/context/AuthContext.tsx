import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { getSession } from "next-auth/react";
import { pingDatabase } from "@/lib/prisma";

export type UserRole =
  | "USER"
  | "PLAYER"
  | "TOURNAMENT_ADMIN"
  | "REFEREE"
  | "MASTER_ADMIN";

export type User = {
  id: string;
  name?: string;
  email: string;
  username?: string;
  role: UserRole;
  image?: string;
  rank?: string;
};

interface LoginCredentials {
  email: string;
  password: string;
  callbackUrl?: string;
}

interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  rank?: string;
  callbackUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error' | 'success';
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to determine the dashboard path based on user role
const getRoleDashboardPath = (role?: string): string => {
  switch (role) {
    case "PLAYER":
      return "/player/dashboard";
    case "REFEREE":
      return "/referee/dashboard";
    case "TOURNAMENT_ADMIN":
    case "MASTER_ADMIN":
      return "/admin/dashboard";
    default:
      return "/user/dashboard";
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error' | 'success'>('loading');

  // Update user state when session changes
  useEffect(() => {
    if (sessionStatus === "loading") {
      setStatus('loading');
      return;
    }

    if (session?.user) {
      setUser(session.user as User);
      setStatus('authenticated');
    } else {
      setUser(null);
      setStatus('unauthenticated');
    }

    setIsLoading(false);
  }, [session, sessionStatus]);

  // Login user with credentials
  const login = async (credentials: LoginCredentials) => {
    setStatus('loading');
    setError(null);
    
    try {
      // First check database connectivity
      const isDbConnected = await pingDatabase();
      
      // If database is disconnected, show a specific message
      if (!isDbConnected) {
        console.error('Login attempted while database is disconnected');
        setError('Database connection issue. Please try again in a few moments.');
        setStatus('error');
        toast.error('Database connection issue. Please try again in a few moments.');
        return;
      }
      
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });

      console.log('Login attempt result:', result);

      if (result?.error) {
        // Handle specific error messages
        if (result.error.includes('database') || result.error.includes('connection')) {
          setError('Database connection issue. Please try again in a few moments.');
          toast.error('Database connection issue. Please try again in a few moments.');
        } else if (result.error.includes('Invalid credentials')) {
          setError('Invalid email or password');
          toast.error('Invalid email or password');
        } else {
          setError(result.error);
          toast.error(result.error);
        }
        setStatus('error');
      } else {
        console.log('Login successful. Refreshing session...');
        // Successfully signed in, update the session
        const session = await getSession();
        if (session) {
          setUser(session.user as User);
          setStatus('authenticated');
          toast.success('Logged in successfully!');
          
          // If there's a callback URL, redirect to it
          if (credentials.callbackUrl) {
            router.push(credentials.callbackUrl);
          } else {
            router.push('/dashboard');
          }
        } else {
          // This shouldn't happen, but just in case
          setError('Failed to get session after login');
          setStatus('error');
          toast.error('Authentication error. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle network or unexpected errors
      const errorMessage = 
        error.message?.includes('database') || error.message?.includes('connection') 
          ? 'Database connection issue. Please try again later.'
          : 'An error occurred during login. Please try again.';
      
      setError(errorMessage);
      setStatus('error');
      toast.error(errorMessage);
    }
  };

  // Register a new user
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Check database connectivity first
      let dbConnected = false;
      try {
        const dbCheckResponse = await fetch('/api/check-db-connection', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const dbStatus = await dbCheckResponse.json();
        dbConnected = dbStatus.connected;
        
        if (!dbConnected) {
          console.log("Database disconnected during registration attempt");
        }
      } catch (dbCheckError) {
        console.error("Error checking database connection:", dbCheckError);
        // Continue with registration even if DB check fails
      }
      
      // Proceed with registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle database connection error during registration
        if (response.status === 503) {
          console.log("Registration attempted while database was disconnected");
          setError(data.error || "Database connection issue. Please try again later.");
          setIsLoading(false);
          
          return;
        }
        
        // Handle other errors
        setError(data.error || "Registration failed");
        setIsLoading(false);
        
        return;
      }
      
      // Registration successful!
      console.log("Registration successful for:", userData.email);
      
      // Check if we should attempt auto-login
      if (!dbConnected) {
        // If DB is disconnected, don't attempt auto-login
        setIsLoading(false);
        
        // Redirect to sign in page with prefilled email
        setTimeout(() => {
          window.location.href = `/auth?email=${encodeURIComponent(userData.email)}&autoLogin=true`;
        }, 1500);
        
        return;
      }
      
      // With DB connected, attempt auto-login
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email: userData.email,
          password: userData.password,
        });
        
        if (result?.error) {
          console.error("Auto-login failed after registration:", result.error);
          setError("Account created but auto-login failed. Please sign in manually.");
          setIsLoading(false);
          
          // Redirect to sign in page with prefilled email after a short delay
          setTimeout(() => {
            window.location.href = `/auth?email=${encodeURIComponent(userData.email)}&autoLogin=true`;
          }, 1500);
          
          return;
        }
        
        // Auto-login successful!
        setIsLoading(false);
        setUser(session?.user as User);
        setStatus('authenticated');
        toast.success('Registration and login successful!');
        
        // Get dashboard path based on role
        const dashboardPath = getRoleDashboardPath(userData.role);
        
        // Use direct navigation instead of NextAuth's signIn to avoid auth callback issues
        console.log(`Registration successful, redirecting to: ${dashboardPath}`);
        
        // Set a small delay to allow registration to complete fully
        setTimeout(() => {
          router.push(dashboardPath);
        }, 1000);
      } catch (loginError) {
        console.error("Error during auto-login:", loginError);
        setError("Account created but auto-login failed. Please sign in manually.");
        setIsLoading(false);
        
        // Redirect to sign in page with prefilled email
        setTimeout(() => {
          window.location.href = `/auth?email=${encodeURIComponent(userData.email)}&autoLogin=true`;
        }, 1500);
        
        return;
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
      
      return;
    }
  };

  // Logout the user
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      setUser(null);
      setStatus('unauthenticated');
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Provide auth context
  const value = {
    user,
    isLoading,
    error,
    status,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
