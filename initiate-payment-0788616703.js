// Initiate payment for annual package with phone 0788616703
// This script validates the phone number and provides payment initiation instructions

console.log('='.repeat(60));
console.log('PAYMENT INITIATION FOR 0788616703');
console.log('='.repeat(60));

const PAYMENT_DATA = {
  plan_id: 'plan_annual',
  amount: 20000,
  user_id: 'test-user-0788616703',
  email: 'test-0788616703@example.com',
  name: 'Test User 0788616703',
  phone: '0788616703',
  channelName: 'MOMO'
};

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

console.log('\n1. PHONE NUMBER VALIDATION:');
console.log(`   Testing phone: 0788616703`);

// Test with MTN MoMo
const momoValidation = validatePhoneNumber('0788616703', 'MOMO');
console.log(`   MTN MoMo: ${momoValidation.valid ? '✓ Valid' : '✗ Invalid'}`);
if (!momoValidation.valid) {
  console.log(`   Error: ${momoValidation.error}`);
}

// Test with Airtel Money
const airtelValidation = validatePhoneNumber('0788616703', 'AIRTEL_MONEY');
console.log(`   Airtel Money: ${airtelValidation.valid ? '✓ Valid' : '✗ Invalid'}`);
if (!airtelValidation.valid) {
  console.log(`   Error: ${airtelValidation.error}`);
}

console.log('\n2. PAYMENT DETAILS:');
console.log(JSON.stringify(PAYMENT_DATA, null, 2));

console.log('\n='.repeat(60));
console.log('BROWSER PAYMENT INITIATION INSTRUCTIONS');
console.log('='.repeat(60));

console.log('\nSTEP 1: OPEN MEMBERSHIP PAGE');
console.log('   URL: http://localhost:3001/membership');
console.log('   Action: Navigate to this URL in your browser');

console.log('\nSTEP 2: SELECT ANNUAL PACKAGE');
console.log('   Action: Click "Get started" button on Annual Package');
console.log('   Expected: Payment dialog opens with "Complete payment" title');

console.log('\nSTEP 3: CHOOSE PAYMENT METHOD');
console.log('   Action: Select "MTN Mobile Money" (recommended for 078 numbers)');
console.log('   Expected: MTN MoMo option is highlighted');

console.log('\nSTEP 4: ENTER PHONE NUMBER');
console.log('   Action: Type "0788616703" in the billing phone field');
console.log('   Expected: Phone number is accepted (valid MTN MoMo format)');

console.log('\nSTEP 5: INITIATE PAYMENT');
console.log('   Action: Click "Pay 20,000 RWF" button');
console.log('   Expected: Shows processing state, then payment initiation');

console.log('\nSTEP 6: COMPLETE PAYMENT');
console.log('   Action: Check phone 0788616703 for MTN MoMo USSD prompt');
console.log('   Expected: Enter PIN and confirm payment on phone');

console.log('\n='.repeat(60));
console.log('EXPECTED OUTCOMES');
console.log('='.repeat(60));

console.log('\n✓ SUCCESSFUL PAYMENT FLOW:');
console.log('   1. Payment dialog shows processing state');
console.log('   2. API call to /api/payments/initiate succeeds');
console.log('   3. Phone 0788616703 receives MTN MoMo USSD');
console.log('   4. User confirms payment with PIN');
console.log('   5. Webhook confirms payment success');
console.log('   6. User access upgraded to UNLIMITED tier');

console.log('\n✗ POSSIBLE ERRORS:');
console.log('   - Phone validation error (unlikely for 0788616703)');
console.log('   - Network/API connection issues');
console.log('   - UrubutoPay service unavailable');
console.log('   - Insufficient funds on phone');

console.log('\n='.repeat(60));
console.log('SERVICE CONFIGURATION');
console.log('='.repeat(60));

console.log('\nService Code: annual-package-1777494294743');
console.log('Merchant Code: TH13614487');
console.log('Payment Link: https://urubutopay.rw/pwl/annual-package-1777494294743');
console.log('API Endpoint: http://localhost:3001/api/payments/initiate');

console.log('\n='.repeat(60));
console.log('PAYMENT INITIATION STATUS');
console.log('='.repeat(60));

if (momoValidation.valid) {
  console.log('\n📱 Phone 0788616703 is validated and ready');
  console.log('💰 Amount: 20,000 RWF (Annual Package)');
  console.log('📡 Channel: MTN Mobile Money');
  console.log('🌐 Server: http://localhost:3001');
  console.log('\n✅ READY TO INITIATE PAYMENT');
  console.log('Follow the steps above to initiate the payment now!');
} else {
  console.log('\n❌ PHONE VALIDATION FAILED');
  console.log('Please check the phone number and try again');
}
