// Debug script for per-article payment 409 error
// This will help identify the pricing mismatch issue

console.log('='.repeat(60));
console.log('PER-ARTICLE PAYMENT 409 ERROR DEBUG');
console.log('='.repeat(60));

const ERROR_RESPONSE = {
  error: "Payment provider rejected the initiation request",
  details: {
    status: 409,
    message: "Payment cannot be processed. Please pay the full amount",
    timestamp: "2026-05-05 10:55:42"
  }
};

console.log('\n1. ERROR ANALYSIS:');
console.log('HTTP Status:', ERROR_RESPONSE.details.status);
console.log('Error Message:', ERROR_RESPONSE.details.message);
console.log('Error Type:', ERROR_RESPONSE.error);

console.log('\n2. PER-ARTICLE PLAN CONFIGURATION:');
const PER_ARTICLE_PLAN = {
  id: 'plan_per_article',
  name: 'Per Article Package',
  price: 10000,
  currency: 'RWF',
  interval: 'article',
  paymentUrl: 'https://urubutopay.rw/pwl/per-article-package-1777494222439',
  serviceCode: 'per-article-package-1777494222439'
};

console.log('Plan ID:', PER_ARTICLE_PLAN.id);
console.log('Plan Name:', PER_ARTICLE_PLAN.name);
console.log('Expected Price:', PER_ARTICLE_PLAN.price, PER_ARTICLE_PLAN.currency);
console.log('Service Code:', PER_ARTICLE_PLAN.serviceCode);
console.log('Payment URL:', PER_ARTICLE_PLAN.paymentUrl);

console.log('\n3. COMPARISON WITH ANNUAL PLAN:');
const ANNUAL_PLAN = {
  id: 'plan_annual',
  name: 'Annual Package',
  price: 20000,
  currency: 'RWF',
  serviceCode: 'annual-package-1777494294743'
};

console.log('Annual Plan Price:', ANNUAL_PLAN.price, ANNUAL_PLAN.currency);
console.log('Per-Article Plan Price:', PER_ARTICLE_PLAN.price, PER_ARTICLE_PLAN.currency);
console.log('Price Difference:', ANNUAL_PLAN.price - PER_ARTICLE_PLAN.price, 'RWF');

console.log('\n4. POTENTIAL CAUSES FOR 409 ERROR:');
console.log('a) Client sending wrong amount (not 10,000 RWF)');
console.log('b) UrubutoPay expecting different amount for per-article service');
console.log('c) Service code configuration mismatch');
console.log('d) Database vs constants price mismatch');
console.log('e) Currency or formatting issues');

console.log('\n5. EXPECTED PAYLOAD FOR PER-ARTICLE:');
const expectedPerArticlePayload = {
  plan_id: 'plan_per_article',
  amount: 10000,
  currency: 'RWF',
  service_code: 'per-article-package-1777494222439',
  paymentLinkId: 'per-article-package-1777494222439',
  payment_channel: 'WALLET',
  payment_channel_name: 'MOMO',
  payer_to_be_charged: 'YES',
  need_instant_wallet_settlement: 'YES'
};

console.log('Expected Payload:');
console.log(JSON.stringify(expectedPerArticlePayload, null, 2));

console.log('\n6. DEBUGGING STEPS:');
console.log('1. Check what amount client is actually sending');
console.log('2. Verify database plan configuration');
console.log('3. Check UrubutoPay service configuration');
console.log('4. Compare with working annual plan payload');
console.log('5. Look for hardcoded amounts or overrides');

console.log('\n7. CODE AREAS TO CHECK:');
console.log('- payments-initiate.ts (line 227: amountToCharge = planPrice)');
console.log('- constants.ts (SUBSCRIPTION_PLANS configuration)');
console.log('- Database subscription_plans table');
console.log('- PaymentDialog component (amount field)');

console.log('\n8. IMMEDIATE ACTIONS:');
console.log('a) Add logging to show actual amount being sent');
console.log('b) Check database plan configuration');
console.log('c) Verify service code mapping');
console.log('d) Test with explicit amount override');

console.log('\n='.repeat(60));
console.log('NEXT STEPS');
console.log('='.repeat(60));
console.log('1. Check database for per-article plan configuration');
console.log('2. Add debug logging to payments-initiate.ts');
console.log('3. Verify the planPrice calculation');
console.log('4. Test fix with correct amount');
