// Debug environment variables
console.log('Environment Variables Check:');
console.log('URUBUTOPAY_SERVICE_CODE_ANNUAL:', process.env.URUBUTOPAY_SERVICE_CODE_ANNUAL);
console.log('URUBUTOPAY_INITIATE_SERVICE_CODE_ANNUAL:', process.env.URUBUTOPAY_INITIATE_SERVICE_CODE_ANNUAL);

// Import and test the functions
const { getServiceCodeForPlan, getInitiateGatewayServiceCode } = require('./lib/urubutopay.ts');

console.log('\nFunction Results:');
console.log('getServiceCodeForPlan(plan_annual):', getServiceCodeForPlan('plan_annual'));
console.log('getInitiateGatewayServiceCode(plan_annual):', getInitiateGatewayServiceCode('plan_annual'));
