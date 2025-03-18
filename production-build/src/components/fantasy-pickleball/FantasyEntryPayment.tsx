"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';

// Dynamically import RazorpayCheckout to avoid import issues
const RazorpayCheckout = dynamic(
  () => import('@/components/payment/RazorpayCheckout'),
  { ssr: false }
);

interface FantasyEntryPaymentProps {
  tournamentId: number;
  tournamentName: string;
  entryFee: number;
  currency?: string;
}

export default function FantasyEntryPayment({
  tournamentId,
  tournamentName,
  entryFee,
  currency = 'INR'
}: FantasyEntryPaymentProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleStartPayment = () => {
    setIsPaying(true);
  };

  const handlePaymentSuccess = (response: any) => {
    console.log('Payment successful:', response);
    setIsSuccess(true);
    setIsPaying(false);
    toast({
      title: 'Payment Successful',
      description: 'Your fantasy team entry has been confirmed!',
    });
    
    // Redirect to team creation or dashboard
    setTimeout(() => {
      router.push(`/fantasy/contests/${tournamentId}/join`);
    }, 2000);
  };

  const handlePaymentFailure = (error: any) => {
    console.error('Payment failed:', error);
    setIsPaying(false);
    toast({
      title: 'Payment Failed',
      description: 'There was an issue processing your payment. Please try again.',
      variant: 'destructive',
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Fantasy Tournament Entry</CardTitle>
        <CardDescription>
          {tournamentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Entry Fee:</span>
            <span className="font-semibold text-lg">
              {entryFee} {currency}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>By proceeding with payment, you agree to the tournament rules and fantasy contest terms.</p>
            <p className="mt-2">
              80% of the entry fee goes to the prize pool, 10% to the tournament organizer, and 10% to the platform.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {!isPaying && !isSuccess ? (
          <Button 
            onClick={handleStartPayment} 
            className="w-full"
          >
            Enter Tournament
          </Button>
        ) : isPaying ? (
          <RazorpayCheckout
            tournamentId={tournamentId}
            amount={entryFee}
            currency={currency}
            buttonText="Pay Entry Fee"
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-medium">Payment Complete! Redirecting...</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 