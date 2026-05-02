// Debug script to test payment initiation with detailed logging
const testPayload = {
  plan_id: "plan_annual",
  amount: 20000,
  user_id: "cmlr36t68000bi8r12dkddrv6", // Using the user_id from error
  email: "niyoeri6@gmail.com",
  name: "Eric",
  phone: "250788616703",
  channelName: "MOMO"
};

console.log("Testing payment initiation with debug payload...");
console.log("Payload:", JSON.stringify(testPayload, null, 2));

// Make the request to see debug logs
fetch('http://localhost:3001/api/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'next-auth.session-token=debug' // Add session cookie if needed
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log("Response:", JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error("Error:", error);
});
