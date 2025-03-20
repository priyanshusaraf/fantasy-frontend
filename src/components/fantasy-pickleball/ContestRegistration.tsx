"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContestRegistrationProps {
  contestId: number;
  tournamentId: number;
  contestName: string;
  entryFee: number;
  prizePool: number;
  isDynamicPrizePool?: boolean;
}

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    
    document.body.appendChild(script);
  });
};

export default function ContestRegistration({
  contestId,
  tournamentId,
  contestName,
  entryFee,
  prizePool,
  isDynamicPrizePool = true
}: ContestRegistrationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadScript = async () => {
      const loaded = await loadRazorpay();
      setRazorpayLoaded(loaded);
    };
    
    loadScript();
  }, []);

  const initiatePayment = async () => {
    if (!session?.user) {
      toast({
        title: "Login Required",
        description: "Please login to join this contest",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Create an order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: entryFee,
          contestId,
          type: "fantasy_entry",
          description: `Entry fee for ${contestName}`,
        }),
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || "Failed to create payment order");
      }
      
      const { order } = await orderResponse.json();
      
      // 2. Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "MatchUp Fantasy Pickleball",
        description: `Entry fee for ${contestName}`,
        order_id: order.id,
        handler: function (response: any) {
          verifyPayment(response);
        },
        prefill: {
          name: session.user.name || session.user.username || "",
          email: session.user.email || "",
        },
        notes: {
          contestId,
          type: "fantasy_entry",
          userId: session.user.id,
        },
        theme: {
          color: "#00a1e0",
        },
      };
      
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      toast({
        title: "Payment Failed",
        description: err instanceof Error ? err.message : "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse: any) => {
    setIsLoading(true);
    try {
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          contestId,
        }),
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || "Payment verification failed");
      }
      
      setPaymentSuccessful(true);
      toast({
        title: "Payment Successful",
        description: "You've successfully joined the contest. Create your team now!",
      });
      
      // Redirect to team creation page
      setTimeout(() => {
        router.push(`/fantasy/contests/${contestId}/create-team`);
      }, 2000);
      
    } catch (err) {
      console.error("Payment verification error:", err);
      setError(err instanceof Error ? err.message : "Payment verification failed");
      toast({
        title: "Payment Failed",
        description: err instanceof Error ? err.message : "Payment verification failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Join {contestName}</CardTitle>
        <CardDescription>
          {isDynamicPrizePool 
            ? "77.64% of all entry fees go directly to the prize pool" 
            : "Contest with fixed prize pool"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Entry Fee</p>
            <p className="text-xl font-bold">₹{entryFee.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Current Prize Pool</p>
            <p className="text-xl font-bold">₹{prizePool.toLocaleString()}</p>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {paymentSuccessful && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Payment successful! Redirecting to team creation...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          size="lg"
          onClick={initiatePayment}
          disabled={isLoading || paymentSuccessful || !razorpayLoaded}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : paymentSuccessful ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Joined Successfully
            </>
          ) : (
            `Join Now - ₹${entryFee}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 