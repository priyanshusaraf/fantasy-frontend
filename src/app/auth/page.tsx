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
  
  // IMPORTANT: Properly await the search params to fix Next.js warning
  const params = await Promise.resolve(searchParams);
  
  // If user is already logged in, redirect them directly to dashboard
  if (session) {
    console.log("User is authenticated, redirecting directly to dashboard");
    return redirect("/user/dashboard");
  }
  
  // Extract mode param safely with proper awaiting
  const mode = params?.mode 
    ? (typeof params.mode === 'string' ? params.mode : "signin")
    : "signin";
  
  // Always use user dashboard as callback
  const callbackUrl = "/user/dashboard";
  
  const showRegisterForm = mode === "register" || mode === "signup";
  
  return <AuthClientPage showRegisterForm={showRegisterForm} callbackUrl={callbackUrl} />;
} 