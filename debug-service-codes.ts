import { getServiceCodeForPlan, getInitiateGatewayServiceCode } from "./lib/urubutopay.js";

console.log("=== Service Code Debug ===");
console.log("getServiceCodeForPlan('plan_per_article'):", getServiceCodeForPlan("plan_per_article"));
console.log("getInitiateGatewayServiceCode('plan_per_article'):", getInitiateGatewayServiceCode("plan_per_article"));

console.log("\n=== Environment Variables ===");
console.log("URUBUTOPAY_SERVICE_CODE_PER_ARTICLE:", process.env.URUBUTOPAY_SERVICE_CODE_PER_ARTICLE);
console.log("URUBUTOPAY_INITIATE_SERVICE_CODE_PER_ARTICLE:", process.env.URUBUTOPAY_INITIATE_SERVICE_CODE_PER_ARTICLE);
console.log("URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE:", process.env.URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE);
console.log("URUBUTOPAY_SERVICE_ID_PER_ARTICLE:", process.env.URUBUTOPAY_SERVICE_ID_PER_ARTICLE);
console.log("URUBUTOPAY_MERCHANT_CODE:", process.env.URUBUTOPAY_MERCHANT_CODE);
