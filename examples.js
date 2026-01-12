const NexveilAuth = require('./index.js');

// ═══════════════════════════════════════════════════════════
// Example 1: Basic Usage
// ═══════════════════════════════════════════════════════════

console.log('Example 1: Basic License Verification\n');

const auth = new NexveilAuth({
  appName: 'MyAwesomeApp',
  secret1: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  secret2: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
  secret3: 'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  // apiUrl: 'https://api.nexveil.net' // Production (default)
});

async function verifyLicense(licenseKey) {
  try {
    console.log('Verifying license...');
    console.log('Hardware ID:', auth.getHWID());
    
    const result = await auth.verify(licenseKey);
    
    if (result.success) {
      console.log('✅ License is VALID!');
      console.log('Response:', result.code);
      
      if (result.isActivated) {
        console.log('🎉 This is your first activation!');
      }
      
      return true;
    } else {
      console.log('❌ License verification failed');
      console.log('Error:', result.code, '-', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error during verification:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// Example 2: Using Environment Variables (Recommended)
// ═══════════════════════════════════════════════════════════

console.log('\n\nExample 2: Using Environment Variables\n');

// Create .env file with:
// NEXVEIL_APP_NAME=MyApp
// NEXVEIL_SECRET_1=...
// NEXVEIL_SECRET_2=...
// NEXVEIL_SECRET_3=...
// LICENSE_KEY=...

// require('dotenv').config(); // Uncomment if using dotenv

const authEnv = new NexveilAuth({
  appName: process.env.NEXVEIL_APP_NAME || 'MyApp',
  secret1: process.env.NEXVEIL_SECRET_1 || '0'.repeat(64),
  secret2: process.env.NEXVEIL_SECRET_2 || '0'.repeat(64),
  secret3: process.env.NEXVEIL_SECRET_3 || '0'.repeat(64)
});

console.log('SDK initialized with environment variables');

// ═══════════════════════════════════════════════════════════
// Example 3: Complete Application Setup
// ═══════════════════════════════════════════════════════════

console.log('\n\nExample 3: Complete Application Setup\n');

class MyApplication {
  constructor() {
    this.auth = new NexveilAuth({
      appName: 'MyApp',
      secret1: process.env.NEXVEIL_SECRET_1 || '0'.repeat(64),
      secret2: process.env.NEXVEIL_SECRET_2 || '0'.repeat(64),
      secret3: process.env.NEXVEIL_SECRET_3 || '0'.repeat(64)
    });
    
    this.isLicensed = false;
  }

  async initialize(licenseKey) {
    console.log('Initializing application...');
    
    try {
      // Verify license
      const result = await this.auth.verifyOrThrow(licenseKey);
      
      console.log('✅ License verified!');
      
      if (result.isActivated) {
        console.log('🎉 Welcome! Your license has been activated.');
      }
      
      // Check expiration
      if (result.data?.key?.expiresAt) {
        const expiryDate = new Date(result.data.key.expiresAt);
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`📅 License expires in ${daysLeft} days`);
      } else {
        console.log('📅 Lifetime license');
      }
      
      this.isLicensed = true;
      
      // Start periodic verification (every hour)
      this.startPeriodicVerification(licenseKey);
      
      return true;
      
    } catch (error) {
      console.error('❌ License verification failed:', error.message);
      console.log('Please purchase a valid license or contact support.');
      return false;
    }
  }

  startPeriodicVerification(licenseKey) {
    setInterval(async () => {
      try {
        const result = await this.auth.verify(licenseKey);
        if (!result.success) {
          console.error('⚠️ License is no longer valid!');
          this.shutdown();
        } else {
          console.log('✅ License re-verified');
        }
      } catch (error) {
        console.error('⚠️ License verification error:', error.message);
      }
    }, 60 * 60 * 1000); // Every hour
  }

  run() {
    if (!this.isLicensed) {
      console.error('Cannot run - no valid license');
      return;
    }
    
    console.log('🚀 Application running...');
    // Your application logic here
  }

  shutdown() {
    console.log('🛑 Shutting down application...');
    this.isLicensed = false;
    process.exit(0);
  }
}

// Usage
const app = new MyApplication();

// Get license key from command line or environment
const licenseKey = process.argv[2] || process.env.LICENSE_KEY;

if (licenseKey) {
  app.initialize(licenseKey).then(success => {
    if (success) {
      app.run();
    } else {
      process.exit(1);
    }
  });
} else {
  console.log('Usage: node example.js <LICENSE_KEY>');
  console.log('   Or: Set LICENSE_KEY environment variable');
}

// ═══════════════════════════════════════════════════════════
// Example 4: Custom HWID
// ═══════════════════════════════════════════════════════════

console.log('\n\nExample 4: Custom Hardware ID\n');

const authCustomHWID = new NexveilAuth({
  appName: 'MyApp',
  secret1: '0'.repeat(64),
  secret2: '0'.repeat(64),
  secret3: '0'.repeat(64),
  autoHWID: false,
  customHWID: 'my-custom-unique-identifier'
});

console.log('Custom HWID:', authCustomHWID.getHWID());

// Or set it later
authCustomHWID.setHWID('another-custom-id');
console.log('Updated HWID:', authCustomHWID.getHWID());

// ═══════════════════════════════════════════════════════════
// Example 5: Error Handling
// ═══════════════════════════════════════════════════════════

console.log('\n\nExample 5: Comprehensive Error Handling\n');

async function robustVerification(licenseKey) {
  const auth = new NexveilAuth({
    appName: 'MyApp',
    secret1: '0'.repeat(64),
    secret2: '0'.repeat(64),
    secret3: '0'.repeat(64)
  });

  try {
    const result = await auth.verify(licenseKey);
    
    switch (result.code) {
      case 'KEY_VALID':
      case 'KEY_ACTIVATED':
        console.log('✅ License active');
        return true;
        
      case 'KEY_EXPIRED':
        console.error('❌ License has expired');
        console.log('Please renew your license');
        return false;
        
      case 'KEY_REVOKED':
        console.error('❌ License has been revoked');
        console.log('Reason:', result.message);
        return false;
        
      case 'HWID_MISMATCH':
        console.error('❌ License is bound to another device');
        console.log('Please contact support to reset your license');
        return false;
        
      case 'USER_BANNED':
        console.error('❌ Your account has been banned');
        console.log('Please contact support');
        return false;
        
      default:
        console.error('❌ License verification failed:', result.code);
        console.log(result.message);
        return false;
    }
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    
    // Network error, server down, etc.
    if (error.message.includes('fetch')) {
      console.log('Unable to reach licensing server');
      console.log('Please check your internet connection');
    }
    
    return false;
  }
}

console.log('See function: robustVerification()');