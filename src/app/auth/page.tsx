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
  
  // If user is already logged in, redirect them directly to dashboard
  if (session) {
    console.log("User is authenticated, redirecting directly to dashboard");
    return redirect("/user/dashboard");
  }
  
  // Properly await search params to avoid NextJS warnings
  const params = await Promise.resolve(searchParams);
  
  // Extract mode param safely
  const modeParam = params?.mode 
    ? (typeof params.mode === 'string' ? params.mode : "signin")
    : "signin";
  
  // Normalize mode - accept both "register" and "signup" for registration
  const mode = modeParam.toLowerCase();
  
  // Check if we should show the register form
  const showRegisterForm = mode === "register" || mode === "signup";
  
  console.log(`Auth page loaded with mode: ${mode}, showing ${showRegisterForm ? 'register' : 'login'} form`);
  
  // Get callback URL from params
  const callbackUrl = params?.callbackUrl 
    ? (typeof params.callbackUrl === 'string' ? params.callbackUrl : "/user/dashboard")
    : "/user/dashboard";
  
  return <AuthClientPage showRegisterForm={showRegisterForm} callbackUrl={callbackUrl} />;
} 