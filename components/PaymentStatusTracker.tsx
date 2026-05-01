"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaymentStatus {
  transactionId?: string;
  status?: string;
  message?: string;
  timestamp?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
}

interface PaymentStatusTrackerProps {
  initialTransactionId?: string;
  onPaymentComplete?: (status: PaymentStatus) => void;
}

export default function PaymentStatusTracker({ 
  initialTransactionId, 
  onPaymentComplete 
}: PaymentStatusTrackerProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    isLoading: !!initialTransactionId,
  });
  const [isVisible, setIsVisible] = useState(!!initialTransactionId);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkPaymentStatusWithEvents = useCallback((transactionId: string) => {
    try {
      const eventSource = new EventSource(`/api/payments/events?transactionId=${encodeURIComponent(transactionId)}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status_update':
              setPaymentStatus({
                transactionId: data.transactionId,
                status: data.status,
                message: getStatusMessage(data.status),
                timestamp: data.timestamp,
                isLoading: false,
                isSuccess: ['SUCCESS', 'COMPLETED', 'VALID'].includes(data.status),
                isError: ['FAILED', 'CANCELED', 'REVERSED'].includes(data.status),
              });

              if (data.isSuccess) {
                onPaymentComplete?.({ isSuccess: true, transactionId: data.transactionId });
                setTimeout(() => setIsVisible(false), 3000);
              } else if (data.isError) {
                setTimeout(() => setIsVisible(false), 5000);
              }
              break;
              
            case 'error':
              setPaymentStatus(prev => ({
                ...prev,
                isLoading: false,
                isError: true,
                message: data.message,
              }));
              setTimeout(() => setIsVisible(false), 5000);
              break;
              
            case 'timeout':
              setPaymentStatus(prev => ({
                ...prev,
                isLoading: false,
                message: "Payment status check timed out",
              }));
              setTimeout(() => setIsVisible(false), 3000);
              break;
              
            case 'complete':
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('Error parsing event data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setPaymentStatus(prev => ({
          ...prev,
          isLoading: false,
          isError: true,
          message: "Connection to payment server lost",
        }));
        eventSource.close();
        setTimeout(() => setIsVisible(false), 5000);
      };

      return eventSource;
    } catch (error) {
      setPaymentStatus(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        message: "Unable to connect to payment server",
      }));
      return null;
    }
  }, [onPaymentComplete]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'COMPLETED':
      case 'VALID':
        return "Payment successful! Your account has been upgraded.";
      case 'FAILED':
        return "Payment failed. Please try again or contact support.";
      case 'CANCELED':
        return "Payment was canceled.";
      case 'REVERSED':
        return "Payment was reversed.";
      case 'PENDING':
        return "Payment is being processed...";
      case 'PROCESSING':
        return "Payment is being processed...";
      default:
        return "Checking payment status...";
    }
  };

  useEffect(() => {
    const transactionId = initialTransactionId || searchParams.get("reference") || searchParams.get("transactionId");
    
    if (!transactionId) return;

    setIsVisible(true);
    setPaymentStatus({ isLoading: true, transactionId });

    // Start real-time status checking with Server-Sent Events
    const eventSource = checkPaymentStatusWithEvents(transactionId);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [initialTransactionId, searchParams, checkPaymentStatusWithEvents]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {paymentStatus.isLoading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {paymentStatus.isSuccess && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {paymentStatus.isError && (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-charter text-sm font-semibold text-slate-900 mb-1">
            Payment Status
          </h3>
          <p className="font-charter text-xs text-slate-600 mb-2">
            {paymentStatus.isLoading && "Processing your payment..."}
            {paymentStatus.isSuccess && "Payment successful!"}
            {paymentStatus.isError && paymentStatus.message}
            {!paymentStatus.isLoading && !paymentStatus.isSuccess && !paymentStatus.isError && "Checking payment status..."}
          </p>
          {paymentStatus.transactionId && (
            <p className="font-charter text-xs text-slate-400">
              Ref: {paymentStatus.transactionId.slice(-8)}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
