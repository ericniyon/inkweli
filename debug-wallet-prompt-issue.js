// Debug script to investigate the wallet prompt issue
// This will help identify why the mobile wallet prompt is not being sent

console.log('='.repeat(60));
console.log('WALLET PROMPT ISSUE DEBUG');
console.log('='.repeat(60));

const PAYMENT_RESPONSE = {
  status: 200,
  message: "payment initiated successfully",
  data: {
    payment_id: "19678153",
    payment_channel: "WALLET",
    payment_channel_name: "MOMO",
    internal_transaction_id: "11202605051053049220"
  },
  error: "Mobile wallet prompt was not sent. Please confirm your wallet number/network and try again."
};

console.log('\n1. ANALYZING THE RESPONSE:');
console.log('Status Code:', PAYMENT_RESPONSE.status);
console.log('Message:', PAYMENT_RESPONSE.message);
console.log('Error:', PAYMENT_RESPONSE.error);

console.log('\n2. RESPONSE STRUCTURE ANALYSIS:');
console.log('- Top-level status: 200 (OK)');
console.log('- Data object exists:', !!PAYMENT_RESPONSE.data);
console.log('- Payment channel:', PAYMENT_RESPONSE.data?.payment_channel);
console.log('- Channel name:', PAYMENT_RESPONSE.data?.payment_channel_name);
console.log('- Internal transaction ID:', PAYMENT_RESPONSE.data?.internal_transaction_id);

console.log('\n3. POTENTIAL ISSUES:');
console.log('a) Missing transaction_status field');
console.log('b) Phone number formatting issues');
console.log('c) Network/provider issues');
console.log('d) Service code configuration problems');

console.log('\n4. PHONE NUMBER FORMATTING CHECK:');
const TEST_PHONE = '0788616703';

// Simulate the phone number normalization functions from the code
function normalizeRwPayerPhone(raw) {
  const d = raw.trim().replace(/\s/g, "");
  if (!d) return d;
  if (d.startsWith("250")) return d;
  if (d.startsWith("0")) return `250${d.slice(1)}`;
  return d;
}

function toRwLocalMsisdn(raw) {
  const d = raw.trim().replace(/\D/g, "");
  if (!d) return d;
  if (d.startsWith("250") && d.length >= 12) return `0${d.slice(3)}`;
  if (d.startsWith("7") && d.length === 9) return `0${d}`;
  return d;
}

const phoneNorm = normalizeRwPayerPhone(TEST_PHONE);
const phoneLocal = toRwLocalMsisdn(phoneNorm);

console.log('Original phone:', TEST_PHONE);
console.log('Normalized (international):', phoneNorm);
console.log('Local format:', phoneLocal);
console.log('Expected wallet MSISDN:', phoneNorm);

console.log('\n5. PAYLOAD FIELDS FOR WALLET PROMPT:');
const expectedPayload = {
  currency: "RWF",
  merchant_code: "TH13614487",
  paid_mount: 20000,
  payer_code: "transaction_reference",
  payer_email: "email@example.com",
  payer_names: "User Name",
  payer_phone_number: phoneNorm, // Should be international format
  payer_to_be_charged: "YES",
  paymentLinkId: "annual-package-1777494294743",
  payment_channel: "WALLET",
  payment_channel_name: "MOMO",
  need_instant_wallet_settlement: "YES",
  phone_number: phoneLocal, // Should be local format for handset prompt
  amount: 20000,
  channel_name: "MOMO",
  transaction_id: "transaction_reference",
  service_code: "annual-package-1777494294743",
  redirection_url: "https://urubutopay.rw/pwl/annual-package-1777494294743"
};

console.log('Expected payload structure:');
console.log(JSON.stringify(expectedPayload, null, 2));

console.log('\n6. COMMON FIXES FOR WALLET PROMPT ISSUES:');
console.log('✓ Ensure payer_phone_number is in international format (2507...)');
console.log('✓ Ensure phone_number is in local format (078...)');
console.log('✓ Verify merchant_code is correct');
console.log('✓ Check service_code matches paymentLinkId');
console.log('✓ Ensure payment_channel is "WALLET"');
console.log('✓ Set payer_to_be_charged to "YES"');
console.log('✓ Include need_instant_wallet_settlement: "YES"');

console.log('\n7. DEBUGGING STEPS:');
console.log('1. Check server logs for the actual payload sent');
console.log('2. Verify UrubutoPay service configuration');
console.log('3. Test with different phone numbers');
console.log('4. Check if the issue is network-specific');
console.log('5. Verify service codes are properly configured');

console.log('\n8. IMMEDIATE ACTIONS:');
console.log('a) Add more detailed logging to payments-initiate.ts');
console.log('b) Check the actual response from UrubutoPay API');
console.log('c) Verify transaction_status field in response');
console.log('d) Test phone number with different formats');

console.log('\n='.repeat(60));
console.log('NEXT STEPS');
console.log('='.repeat(60));
console.log('1. Check if transaction_status is missing from response');
console.log('2. Verify phone number formatting in the actual request');
console.log('3. Add error handling for missing transaction_status');
console.log('4. Test with corrected payload if needed');
