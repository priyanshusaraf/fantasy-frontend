// Razorpay Payment Types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  modal?: {
    ondismiss?: () => void;
    animation?: boolean;
    backdrop_close?: boolean;
    confirm_close?: boolean;
    escape?: boolean;
    handle_back?: boolean;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string;
  captured: boolean;
  description: string;
  card_id: string;
  bank: string;
  wallet: string;
  vpa: string;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string;
  error_description: string;
  created_at: number;
}

export interface RazorpayOrderParams {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
  payment_capture?: 0 | 1;
}

export interface RazorpayOrderCreationResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface FantasyPaymentInfo {
  fantasyId: number;
  tournamentId: number;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentId?: string;
  orderId?: string;
  signature?: string;
}

export interface PaymentSplitDetails {
  tournamentAdminShare: number;
  masterAdminShare: number;
  prizePoolShare: number;
  totalAmount: number;
} 