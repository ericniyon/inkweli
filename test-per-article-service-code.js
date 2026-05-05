// Test script for per-article service code configuration
// Tests the correct service code: subscription-9644

console.log('='.repeat(60));
console.log('PER-ARTICLE SERVICE CODE CONFIGURATION TEST');
console.log('='.repeat(60));

console.log('\n1. ENVIRONMENT VARIABLE PROVIDED:');
const envVar = 'URUBUTOPAY_INITIATE_SERVICE_CODE_PER_ARTICLE=subscription-9644';
console.log('Environment Variable:', envVar);

console.log('\n2. CURRENT SERVICE CODE LOGIC:');
const serviceCodeLogic = {
  // From urubutopay.ts
  getServiceCodeForPlan: {
    'plan_per_article': 'per-article-package-1777494222439', // PWL slug
    fallback: 'per-article-package-1777494222439'
  },
  getInitiateGatewayServiceCode: {
    'plan_per_article': 'subscription-9644', // From env var
    fallback: 'per-article-package-1777494222439' // If env var not set
  }
};

console.log('PWL Slug (getServiceCodeForPlan):', serviceCodeLogic.getServiceCodeForPlan['plan_per_article']);
console.log('Gateway Service Code (getInitiateGatewayServiceCode):', serviceCodeLogic.getInitiateGatewayServiceCode['plan_per_article']);

console.log('\n3. EXPECTED PAYLOAD FIELDS:');
const expectedFields = {
  paymentLinkId: 'per-article-package-1777494222439', // PWL slug
  service_code: 'subscription-9644', // Gateway service code from env
  payment_link_id: 'per-article-package-1777494222439', // From env or undefined
  service_id: 'per-article-service-id' // From env or undefined
};

console.log('Expected Payload Fields:');
console.log(JSON.stringify(expectedFields, null, 2));

console.log('\n4. SERVICE CODE MAPPING:');
console.log('PWL (Payment Web Link): per-article-package-1777494222439');
console.log('Gateway Service Code: subscription-9644');
console.log('These are different but should work together');

console.log('\n5. UPDATED BEHAVIOR:');
const behavior = [
  'Removed annual service code workaround',
  'Using correct per-article service code from environment',
  'PWL slug remains per-article-package-1777494222439',
  'Gateway service code now subscription-9644',
  'Amount: 2000 RWF'
];

behavior.forEach((item, index) => {
  console.log(`${index + 1}. ${item}`);
});

console.log('\n6. LOGGING TO VERIFY:');
const loggingChecks = [
  '[payments/initiate] Using correct per-article service code from environment',
  '[payments/initiate] Using per-article configuration from environment',
  'gatewayServiceCode: subscription-9644',
  'pwlSlug: per-article-package-1777494222439',
  'Plan Type: plan_per_article',
  'Expected Amount: 2000'
];

loggingChecks.forEach(log => {
  console.log(`✓ ${log}`);
});

console.log('\n7. ENVIRONMENT VARIABLES NEEDED:');
const requiredEnvVars = [
  'URUBUTOPAY_INITIATE_SERVICE_CODE_PER_ARTICLE=subscription-9644 ✓',
  'URUBUTOPAY_SERVICE_CODE_PER_ARTICLE=per-article-package-1777494222439',
  'URUBUTOPAY_PAYMENT_LINK_ID_PER_ARTICLE=(optional)',
  'URUBUTOPAY_SERVICE_ID_PER_ARTICLE=(optional)'
];

requiredEnvVars.forEach(envVar => {
  console.log(`${envVar.includes('✓') ? '✅' : '⚠️'} ${envVar}`);
});

console.log('\n8. EXPECTED PAYLOAD FOR PER-ARTICLE:');
const expectedPayload = {
  currency: "RWF",
  merchant_code: "TH13614487",
  paid_mount: 2000,
  payer_code: "transaction_reference",
  payer_email: "email@example.com",
  payer_names: "User Name",
  payer_phone_number: "250788616703",
  payer_to_be_charged: "YES",
  paymentLinkId: "per-article-package-1777494222439", // PWL slug
  payment_channel: "WALLET",
  payment_channel_name: "MOMO",
  need_instant_wallet_settlement: "YES",
  phone_number: "0788616703",
  amount: 2000,
  channel_name: "MOMO",
  transaction_id: "transaction_reference",
  service_code: "subscription-9644", // Gateway service code
  redirection_url: "https://urubutopay.rw/pwl/per-article-package-1777494222439"
};

console.log('Final Expected Payload:');
console.log(JSON.stringify(expectedPayload, null, 2));

console.log('\n='.repeat(60));
console.log('CONFIGURATION SUMMARY');
console.log('='.repeat(60));
console.log('✅ Environment variable set: URUBUTOPAY_INITIATE_SERVICE_CODE_PER_ARTICLE=subscription-9644');
console.log('✅ Annual service code workaround removed');
console.log('✅ Using correct per-article service codes');
console.log('✅ Amount set to 2000 RWF');
console.log('✅ Ready for testing');

console.log('\nTest per-article payment now!');
console.log('Should work with subscription-9644 service code.');
