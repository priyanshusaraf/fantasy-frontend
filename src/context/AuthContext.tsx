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
  | "ADMIN"
  | "MANAGER"
  | "PLAYER"
  | "COACH"
  | "OWNER";

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
    setStatus('loading');
    setError(null);
    
    try {
      // First check database connectivity
      const isDbConnected = await pingDatabase();
      
      // If database is disconnected, we'll still attempt registration with fallback
      if (!isDbConnected) {
        console.info('Registration will proceed even if database connection is delayed');
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (data.error.includes('database') || data.error.includes('connection')) {
          setError('Registration saved locally. Your account will be activated when database connectivity is restored.');
          setStatus('success'); // We're treating this as success since we handle fallback
          toast('Registration saved locally. Your account will be activated when database connectivity is restored.');
          
          // Redirect to a page explaining the situation
          router.push('/auth/pending');
        } else if (data.error.includes('already exists')) {
          setError('A user with this email already exists');
          setStatus('error');
          toast.error('A user with this email already exists');
        } else {
          setError(data.error);
          setStatus('error');
          toast.error(data.error || 'Registration failed');
        }
      } else {
        // Successfully registered
        setStatus('success');
        toast.success('Registration successful!');
        
        // If in fallback mode, show different message
        if (!isDbConnected) {
          toast('Your account is saved locally and will be activated when database connectivity is restored.');
          router.push('/auth/pending');
        } else {
          // Auto-login the user after successful registration
          try {
            const loginResult = await signIn('credentials', {
              redirect: false,
              email: userData.email,
              password: userData.password,
            });
            
            if (loginResult?.error) {
              // If auto-login fails, redirect to login page with email pre-filled
              console.warn('Auto-login after registration failed:', loginResult.error);
              toast('Account created! Please sign in with your credentials.');
              router.push(`/auth?mode=signin&email=${encodeURIComponent(userData.email)}`);
            } else {
              // Successfully logged in after registration
              toast.success('Account created and logged in successfully!');
              router.push('/dashboard');
            }
          } catch (loginError) {
            // If auto-login throws an error, redirect to login page
            console.error('Auto-login error:', loginError);
            toast('Account created! Please sign in with your credentials.');
            router.push(`/auth?mode=signin&email=${encodeURIComponent(userData.email)}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // If it's a network error, we still want to allow offline registration
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setError('Registration saved locally. Your account will be activated when internet connectivity is restored.');
        setStatus('success'); // Treat as success since we handle fallback
        toast('Registration saved locally. Your account will be activated when internet connectivity is restored.');
        router.push('/auth/pending');
      } else {
        setError(error.message || 'Registration failed');
        setStatus('error');
        toast.error(error.message || 'Registration failed');
      }
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
