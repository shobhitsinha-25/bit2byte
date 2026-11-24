
export {};

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayCheckoutOptions
    ) => RazorpayCheckoutInstance;
  }

  interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;

    handler: (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => void | Promise<void>;

    modal?: {
      ondismiss?: () => void;
    };

    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };

    theme?: {
      color?: string;
    };
  }

  interface RazorpayCheckoutInstance {
    open: () => void;
    on: (
      event: string,
      callback: (response: unknown) => void
    ) => void;
  }
}
