// Test script to verify annual plan configuration
const testConfig = {
  service_code: 'annual-package-1777494294743',
  merchant_code: 'TH13614487',
  paymentLinkId: 'annual-package-1777494294743',
  test_url: 'https://urubutopay.rw/pwl/annual-package-1777494294743'
};

console.log('Annual Plan Configuration Test:');
console.log('================================');
console.log('Service Code:', testConfig.service_code);
console.log('Merchant Code:', testConfig.merchant_code);
console.log('Payment Link ID:', testConfig.paymentLinkId);
console.log('Test URL:', testConfig.test_url);
console.log('');
console.log('Expected API Payload for Annual Plan:');
console.log(JSON.stringify({
  service_code: testConfig.service_code,
  merchant_code: testConfig.merchant_code,
  paymentLinkId: testConfig.paymentLinkId,
  currency: 'RWF',
  payment_channel: 'WALLET',
  payer_to_be_charged: 'YES'
}, null, 2));
console.log('');
console.log('Manual Test Steps:');
console.log('1. Visit:', testConfig.test_url);
console.log('2. Verify the page loads correctly');
console.log('3. Check that merchant code matches your UrubutoPay account');
console.log('4. Test payment initiation with the above payload');
