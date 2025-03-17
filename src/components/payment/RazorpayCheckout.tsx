"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { RazorpayOptions, RazorpaySuccessResponse } from '@/types/razorpay';

interface RazorpayCheckoutProps {
  tournamentId: number;
  amount: number;
  currency?: string;
  buttonText?: string;
  onSuccess?: (response: any) => void;
  onFailure?: (error: any) => void;
}

export default function RazorpayCheckout({
  tournamentId,
  amount,
  currency = 'INR',
  buttonText = 'Pay Now',
  onSuccess,
  onFailure
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      setPaymentError('Failed to load payment gateway. Please try again later.');
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Create a Razorpay order
  const createOrder = async () => {
    setLoading(true);
    setPaymentError(null);
    
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          amount,
          currency
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment order');
      }
      
      setOrderId(data.orderId);
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      setPaymentError(error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Open Razorpay payment dialog
  const openRazorpayCheckout = async () => {
    const orderData = await createOrder();
    if (!orderData) return;

    const { orderId, keyId, amount: orderAmount } = orderData;

    const options: RazorpayOptions = {
      key: keyId,
      amount: Number(orderAmount) * 100, // Convert to paise
      currency: currency,
      name: 'Fantasy Tournament',
      description: `Entry fee for tournament #${tournamentId}`,
      order_id: orderId,
      handler: function (response: RazorpaySuccessResponse) {
        handlePaymentSuccess(response, orderData);
      },
      prefill: {
        // These can be fetched from user profile if available
        name: '',
        email: '',
        contact: ''
      },
      notes: {
        tournamentId: String(tournamentId)
      },
      theme: {
        color: '#6366f1',
      },
      modal: {
        ondismiss: function () {
          console.log('Payment dialog dismissed');
        }
      }
    };

    try {
      // Initialize Razorpay
      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Failed to open Razorpay:', error);
      setPaymentError('Failed to open payment gateway. Please try again.');
      toast({
        title: 'Payment Error',
        description: 'Could not open payment gateway. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (
    response: RazorpaySuccessResponse,
    orderData: any
  ) => {
    try {
      setLoading(true);
      console.log('Payment successful:', response);
      
      // Optionally verify the payment on the client side
      // This is just a UX enhancement - the webhook will handle the actual verification
      
      setPaymentSuccess(true);
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully!',
        variant: 'default',
      });
      
      if (onSuccess) {
        onSuccess({
          ...response,
          orderData
        });
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      // Don't set payment error here, as the payment actually succeeded
      // The server will still process it through the webhook
    } finally {
      setLoading(false);
    }
  };

  // Render appropriate button based on state
  if (paymentSuccess) {
    return (
      <Button disabled className="w-full">
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Payment Complete
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {paymentError && (
        <div className="bg-destructive/20 p-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mr-2 mt-0.5" />
          <p className="text-sm text-destructive">{paymentError}</p>
        </div>
      )}
      
      <Button
        onClick={openRazorpayCheckout}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
} 