require('dotenv').config();

console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);