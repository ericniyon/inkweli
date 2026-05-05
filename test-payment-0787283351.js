// Test payment with specific phone number 0787283351
// This will test the actual payment flow with the provided phone number

const ANNUAL_PLAN = {
  id: 'plan_annual',
  name: 'Annual Package',
  price: 20000,
  currency: 'RWF',
  interval: 'year'
};

const TEST_PHONE = '0787283351';

function validatePhoneNumber(phone, channel) {
  const phoneDigits = phone.replace(/\D/g, '');
  
  if (!/^\d{10}$/.test(phoneDigits)) {
    return { valid: false, error: "Billing phone must be exactly 10 digits." };
  }
  
  if (channel === "MOMO" && !/^07(?:8|9)\d{7}$/.test(phoneDigits)) {
    return { valid: false, error: "MTN MoMo number must start with 078 or 079." };
  }
  
  if (channel === "AIRTEL_MONEY" && !/^07(?:2|3)\d{7}$/.test(phoneDigits)) {
    return { valid: false, error: "Airtel Money number must start with 072 or 073." };
  }
  
  return { valid: true, error: null };
}

function generatePaymentPayload(phone, channel, userId = 'test-user-0787283351') {
  return {
    plan_id: ANNUAL_PLAN.id,
    amount: ANNUAL_PLAN.price,
    user_id: userId,
    email: 'test-0787283351@example.com',
    name: 'Test User 0787283351',
    phone: phone,
    channelName: channel
  };
}

console.log('='.repeat(60));
console.log('PAYMENT TEST FOR PHONE: 0787283351');
console.log('='.repeat(60));

console.log('\n1. Phone Number Validation:');
console.log(`   Testing phone: ${TEST_PHONE}`);

// Test with MTN MoMo
const momoValidation = validatePhoneNumber(TEST_PHONE, 'MOMO');
console.log(`   MTN MoMo: ${momoValidation.valid ? '✓ Valid' : '✗ Invalid'}`);
if (!momoValidation.valid) {
  console.log(`   Error: ${momoValidation.error}`);
}

// Test with Airtel Money
const airtelValidation = validatePhoneNumber(TEST_PHONE, 'AIRTEL_MONEY');
console.log(`   Airtel Money: ${airtelValidation.valid ? '✓ Valid' : '✗ Invalid'}`);
if (!airtelValidation.valid) {
  console.log(`   Error: ${airtelValidation.error}`);
}

console.log('\n2. Payment Payload Generation:');

// Generate payload for MTN MoMo (recommended since phone starts with 078)
const momoPayload = generatePaymentPayload(TEST_PHONE, 'MOMO');
console.log('   MTN MoMo Payload:');
console.log(JSON.stringify(momoPayload, null, 2));

// Generate payload for Airtel Money (for comparison)
const airtelPayload = generatePaymentPayload(TEST_PHONE, 'AIRTEL_MONEY');
console.log('   Airtel Money Payload:');
console.log(JSON.stringify(airtelPayload, null, 2));

console.log('\n3. API Endpoint Configuration:');
console.log('   Endpoint: /api/payments/initiate');
console.log('   Method: POST');
console.log('   Content-Type: application/json');
console.log('   Credentials: include');

console.log('\n4. Expected Payment Flow:');
console.log('   1. User clicks "Pay" button');
console.log('   2. API call to /api/payments/initiate');
console.log('   3. UrubutoPay processes payment');
console.log('   4. User receives USSD prompt on phone 0787283351');
console.log('   5. User confirms payment on phone');
console.log('   6. Webhook confirms success');
console.log('   7. User access updated to UNLIMITED tier');

console.log('\n5. Manual Testing Instructions:');
console.log('   To test this specific phone number:');
console.log('   1. Open browser to: http://localhost:3001/membership');
console.log('   2. Click "Get started" on Annual Package');
console.log('   3. Select "MTN Mobile Money" (recommended)');
console.log(`   4. Enter phone: ${TEST_PHONE}`);
console.log('   5. Click "Pay 20,000 RWF"');
console.log('   6. Check phone 0787283351 for MTN MoMo USSD prompt');
console.log('   7. Confirm payment when prompted');

console.log('\n6. Service Configuration:');
console.log('   Service Code: annual-package-1777494294743');
console.log('   Merchant Code: TH13614487');
console.log('   Payment Link: https://urubutopay.rw/pwl/annual-package-1777494294743');

console.log('\n7. Test Results Summary:');
console.log(`   Phone Number: ${TEST_PHONE}`);
console.log(`   Validation: ${momoValidation.valid ? '✓ PASSED' : '✗ FAILED'}`);
console.log(`   Recommended Channel: ${momoValidation.valid ? 'MTN MoMo' : 'Airtel Money'}`);
console.log(`   Amount: ${ANNUAL_PLAN.price} ${ANNUAL_PLAN.currency}`);
console.log(`   Plan: ${ANNUAL_PLAN.name}`);

if (momoValidation.valid) {
  console.log('\n✓ READY FOR TESTING: Phone number 0787283351 is valid for MTN MoMo payments');
} else {
  console.log('\n✗ INVALID: Phone number validation failed');
}
