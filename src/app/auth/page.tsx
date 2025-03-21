import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthClientPage from "../../components/auth/AuthClientPage";

export interface AuthPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Helper to sanitize URLs to prevent redirect loops
function sanitizeUrl(url: string | string[] | undefined): string {
  // Default to dashboard if no URL provided
  if (!url) return "/dashboard";
  
  // Handle array case
  const urlStr = typeof url === 'string' ? url : url[0] || "/dashboard";
  
  // Check for nested callbackUrls which indicate a loop
  if (urlStr.includes('callbackUrl=') && urlStr.includes('%')) {
    return "/dashboard";
  }
  
  // Check if it's a valid local path
  if (urlStr.startsWith('/') && !urlStr.includes('://')) {
    return urlStr;
  }
  
  // Check if it's a valid absolute URL for our site
  try {
    const parsedUrl = new URL(urlStr);
    if (parsedUrl.hostname === 'localhost' || 
        parsedUrl.hostname === 'matchup.ltd') {
      return parsedUrl.pathname + parsedUrl.search;
    }
  } catch {
    // If URL parsing fails, return dashboard
  }
  
  return "/dashboard";
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
  
  // Handle search params properly by awaiting them
  const params = await Promise.resolve(searchParams);
  
  // Extract mode param safely
  const mode = params?.mode 
    ? (typeof params.mode === 'string' ? params.mode : "signin")
    : "signin";
    
  // Sanitize callback URL to prevent loops
  const callbackUrl = sanitizeUrl(params?.callbackUrl);
  
  const showRegisterForm = mode === "register" || mode === "signup";
  
  return <AuthClientPage showRegisterForm={showRegisterForm} callbackUrl={callbackUrl} />;
} 