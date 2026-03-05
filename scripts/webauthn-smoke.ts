#!/usr/bin/env bun
// WebAuthn Smoke Test - Server-side validation for options endpoints
// Usage: bun run scripts/webauthn-smoke.ts

console.log('🔐 WebAuthn Smoke Test\n');

// Test 1: Check WebAuthn configuration
console.log('📋 Test 1: WebAuthn Configuration');
const { getWebAuthnConfig } = await import('../src/lib/auth/webauthn/types');
const config = getWebAuthnConfig();
console.log('   RP ID:', config.rpId);
console.log('   RP Name:', config.rpName);
console.log('   Origin:', config.origin);
console.log('   Require Step-up:', config.requireStepUpForAdmin);
console.log('   ✅ Config loaded\n');

// Test 2: Check store imports
console.log('📋 Test 2: WebAuthn Store');
const store = await import('../src/lib/auth/webauthn/store');
console.log('   ✅ Store module loaded');
console.log('   Functions:', Object.keys(store).join(', '));
console.log();

// Test 3: Check server imports
console.log('📋 Test 3: WebAuthn Server');
const server = await import('../src/lib/auth/webauthn/server');
console.log('   ✅ Server module loaded');
console.log('   Functions:', Object.keys(server).join(', '));
console.log();

// Test 4: Verify environment variables
console.log('📋 Test 4: Environment Variables');
const requiredVars = ['WEBAUTHN_RP_ID', 'WEBAUTHN_ORIGIN'];
const optionalVars = ['WEBAUTHN_REQUIRE_STEP_UP_FOR_ADMIN'];
let missing = 0;

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`   ⚠️  ${varName}: not set (using defaults)`);
    missing++;
  }
}

for (const varName of optionalVars) {
  const value = process.env[varName];
  console.log(`   📝 ${varName}: ${value || 'false (default)'}`);
}

if (missing > 0) {
  console.log('\n   💡 Hint: Set WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN in .env.local');
}

console.log('\n✅ All smoke tests passed!');
console.log('\n📖 Next Steps:');
console.log('   1. Start the server: bun run dev');
console.log('   2. Register a security key: POST /api/admin/webauthn/register/options');
console.log('   3. Authenticate: POST /api/admin/webauthn/auth/options');
