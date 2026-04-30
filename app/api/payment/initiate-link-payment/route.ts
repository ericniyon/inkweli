/**
 * Compatibility alias — some gateways expect /api/payment/initiate-link-payment.
 * New subscriptions: POST /api/payments/initiate — this alias keeps the legacy request body.
 */
export { POST } from "@/app/api/urubutopay/initiate/route";
