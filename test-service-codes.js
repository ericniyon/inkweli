// Test script to find the correct service code
const testServiceCodes = [
  'annual-package-1777494294743',  // Current (not working)
  'annual-package-1773437434609',  // From earlier error
  'subscription-9644',              // Used for per-article
  'annual-package',                // Simple version
  'annual',                        // Even simpler
];

console.log('Test these service codes with UrubutoPay:');
console.log('1. Contact UrubutoPay support to verify which service code is active');
console.log('2. Try accessing these URLs directly:');
testServiceCodes.forEach(code => {
  console.log(`   https://urubutopay.rw/pwl/${code}`);
});
console.log('\n3. Check your UrubutoPay merchant portal for active service codes');
console.log('4. The working service code should return a valid payment page, not a 404 or error');
