import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthClientPage from "../../components/auth/AuthClientPage";

export interface AuthPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AuthPage({ 
  searchParams 
}: AuthPageProps) {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  
  if (session) {
    // Redirect authenticated users to dashboard
    redirect("/dashboard");
  }
  
  // Handle searchParams safely by awaiting them
  const params = await Promise.resolve(searchParams);
  
  // Extract callbackUrl safely
  const callbackUrl = params?.callbackUrl 
    ? (typeof params.callbackUrl === 'string' ? params.callbackUrl : "/dashboard")
    : "/dashboard";
  
  // Extract mode param safely
  const mode = params?.mode 
    ? (typeof params.mode === 'string' ? params.mode : "signin")
    : "signin";
    
  const showRegisterForm = mode === "register" || mode === "signup";
  
  return <AuthClientPage showRegisterForm={showRegisterForm} callbackUrl={callbackUrl} />;
} 