// Test script to verify the payment initiation fix
const testPayload = {
  plan_id: "plan_annual",
  amount: 20000,
  user_id: "test-user-id",
  email: "niyoeri6@gmail.com",
  name: "Eric",
  phone: "250788616703",
  channelName: "MOMO"
};

console.log("Testing payment initiation with fixed payload...");
console.log("Payload:", JSON.stringify(testPayload, null, 2));

// You can test this by making a POST request to:
// http://localhost:3001/api/payments/initiate
// with the above payload

fetch('http://localhost:3001/api/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log("Response:", data);
})
.catch(error => {
  console.error("Error:", error);
});
