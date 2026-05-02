// Test annual plan with same service code as per-article
const testPayload = {
  plan_id: "plan_annual",
  amount: 20000,
  user_id: "cmlr36t68000bi8r12dkddrv6",
  email: "niyoeri6@gmail.com", 
  name: "Eric",
  phone: "250788616703",
  channelName: "MOMO"
};

console.log("Testing annual plan with subscription-9644 service code...");
console.log("Payload:", JSON.stringify(testPayload, null, 2));

// This would normally require authentication, but let's see what happens
fetch('http://localhost:3000/api/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(data => {
  console.log("Response:", JSON.stringify(data, null, 2));
  if (data.error && data.error.includes("service code")) {
    console.log("❌ Still getting service code error");
  } else if (data.error) {
    console.log("⚠️ Different error (progress!)");
  } else {
    console.log("✅ Success! Payment initiated");
  }
})
.catch(error => {
  console.error("Network error:", error);
});
