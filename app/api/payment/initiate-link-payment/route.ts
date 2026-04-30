/**
 * Compatibility alias — some gateways or embeds expect /api/payment/initiate-link-payment.
 * Canonical handler lives at POST /api/urubutopay/initiate
 */
export { POST } from "@/app/api/urubutopay/initiate/route";
