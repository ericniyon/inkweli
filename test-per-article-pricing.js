// Test script to check per-article pricing configuration
// This will help identify if UrubutoPay expects a different amount

console.log('='.repeat(60));
console.log('PER-ARTICLE PRICING CONFIGURATION TEST');
console.log('='.repeat(60));

console.log('\n1. CURRENT CONFIGURATION:');
const CONFIG = {
  // From constants.ts
  constants_price: 10000,
  service_code: 'per-article-package-1777494222439',
  payment_url: 'https://urubutopay.rw/pwl/per-article-package-1777494222439',
  
  // From database (seed.ts)
  database_price: 10000,
  plan_id: 'plan_per_article',
  
  // Error indicates provider expects different amount
  error_status: 409,
  error_message: 'Payment cannot be processed. Please pay the full amount'
};

console.log('Constants Price:', CONFIG.constants_price, 'RWF');
console.log('Database Price:', CONFIG.database_price, 'RWF');
console.log('Service Code:', CONFIG.service_code);
console.log('Payment URL:', CONFIG.payment_url);

console.log('\n2. POSSIBLE URUBUTOPAY CONFIGURATION MISMATCH:');
console.log('UrubutoPay might have the per-article service configured with:');
console.log('- Different price (not 10,000 RWF)');
console.log('- Different currency');
console.log('- Different service code');
console.log('- Inactive service');

console.log('\n3. COMMON PRICING SCENARIOS:');
const scenarios = [
  { amount: 5000, description: 'Half price - maybe service configured for 5,000 RWF' },
  { amount: 15000, description: 'Higher price - maybe service configured for 15,000 RWF' },
  { amount: 20000, description: 'Same as annual - service might be misconfigured' },
  { amount: 100, description: 'Test amount - to see if any payment works' }
];

scenarios.forEach((scenario, index) => {
  console.log(`Scenario ${index + 1}: ${scenario.amount} RWF - ${scenario.description}`);
});

console.log('\n4. DEBUGGING APPROACH:');
console.log('Step 1: Test with different amounts to find what UrubutoPay expects');
console.log('Step 2: Check UrubutoPay portal for actual service configuration');
console.log('Step 3: Compare with working annual plan configuration');
console.log('Step 4: Update configuration to match UrubutoPay expectations');

console.log('\n5. IMMEDIATE TEST - TRY DIFFERENT AMOUNTS:');
const testAmounts = [5000, 15000, 20000, 100];
testAmounts.forEach(amount => {
  console.log(`Test with ${amount} RWF to see if provider accepts it`);
});

console.log('\n6. MANUAL VERIFICATION:');
console.log('Visit UrubutoPay portal to check service configuration:');
console.log(CONFIG.payment_url);
console.log('This should show the actual price configured for the service');

console.log('\n7. WORKING ANNUAL PLAN COMPARISON:');
const annualConfig = {
  price: 20000,
  service_code: 'annual-package-1777494294743',
  works: true
};

console.log('Annual Plan Price:', annualConfig.price, 'RWF (WORKS)');
console.log('Annual Service Code:', annualConfig.service_code);
console.log('Per-Article Price:', CONFIG.constants_price, 'RWF (FAILS)');
console.log('Per-Article Service Code:', CONFIG.service_code);

console.log('\n='.repeat(60));
console.log('RECOMMENDED ACTIONS');
console.log('='.repeat(60));
console.log('1. Check the actual service configuration at the payment URL');
console.log('2. Try payment with different amounts to find the correct price');
console.log('3. Update constants/database to match UrubutoPay configuration');
console.log('4. Test again with the correct amount');

console.log('\nQuick Test:');
console.log('Try per-article payment with 20,000 RWF (same as annual)');
console.log('If it works, the issue is price configuration mismatch');
