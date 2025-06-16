require('dotenv').config();
const jwt = require('jsonwebtoken');

// Create a test JWT token
const testUser = {
  userId: 'user_1749874837193', // From the database query
  tenantId: 'tenant_1749874836546', // From the database query
  role: 'SUPER_ADMIN',
  email: 'admin@sweetspot.io'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET || 'dev-secret-key', {
  expiresIn: '1h'
});

console.log('Test JWT Token:');
console.log(token);
console.log('\nTest with:');
console.log(`curl -X GET "http://localhost:3001/api/leads" -H "Authorization: Bearer ${token}" | jq .`);