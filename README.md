# Nexveil Auth - Node.js SDK

Official Node.js SDK for **Nexveil** authentication and license verification system.

Secure, hardware-bound license verification with dual signature validation to prevent tampering and MITM attacks.

## Features

✅ **Dual Signature Verification** - Client signs requests, server signs responses  
✅ **Hardware ID Binding** - Automatic or custom HWID generation  
✅ **Replay Attack Prevention** - Cryptographic nonces and timestamps  
✅ **MITM Protection** - Response signature validation  
✅ **Cross-Platform** - Windows, Linux, macOS support  
✅ **Zero Dependencies** - Uses only Node.js built-ins  
✅ **TypeScript Ready** - Type definitions included  

## Installation

```bash
npm install nexveil-auth
```

## Quick Start

```javascript
const NexveilAuth = require('nexveil-auth');

// Initialize with your app credentials
const auth = new NexveilAuth({
  appName: 'MyApp', //your app/item name
  secret1: 'your_64_char_hex_secret_1',
  secret2: 'your_64_char_hex_secret_2',
  secret3: 'your_64_char_hex_secret_3',
  apiUrl: 'https://api.nexveil.com' // Optional, defaults to production
});

// Verify a license key
async function checkLicense(licenseKey) {
  try {
    const result = await auth.verify(licenseKey);
    
    if (result.success) {
      console.log('✅ License valid!');
      console.log('Expires:', result.data.key.expiresAt);
      console.log('App version:', result.data.app.version);
      
      // Start your application
      startApp();
    } else {
      console.log('❌ License invalid:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
    process.exit(1);
  }
}

checkLicense('USER-LICENSE-KEY-HERE');
```

## Configuration Options

### Constructor Parameters

```javascript
const auth = new NexveilAuth({
  // Required
  appName: 'MyApp',              // Your app name registered in Nexveil
  secret1: '64_char_hex...',     // First secret (from app metadata)
  secret2: '64_char_hex...',     // Second secret (from app metadata)
  secret3: '64_char_hex...',     // Third secret (from app metadata)
  
  // Optional
  apiUrl: 'https://...',         // API base URL (default: production)
  autoHWID: true,                // Auto-generate HWID (default: true)
  customHWID: null,              // Custom HWID override (default: null)
  strictSSL: true                // Enforce strict SSL (default: true)
});
```

### Getting Your Secrets

The three secrets are stored in your app's metadata in the Nexveil dashboard:

1. Go to your Nexveil dashboard
2. Select your application
3. Navigate to Settings → Security
4. Copy the three 64-character hex secrets

**⚠️ IMPORTANT:** Keep these secrets secure! Store them in environment variables, not in your source code.

## API Reference

### `verify(key)`

Verify a license key.

**Parameters:**
- `key` (string) - The license key to verify

**Returns:** `Promise<Object>`

```javascript
{
  success: true,           // Boolean - verification succeeded
  code: 'KEY_VALID',       // String - response code
  message: 'Success',      // String - human-readable message
  signature: 'abc123...',  // String - server signature
  isActivated: false,      // Boolean - true if key was just activated
  isValid: true,           // Boolean - key is valid (activated or valid)
  timestamp: '2024-...',   // String - verification timestamp
  data: {                  // Object - additional data
    key: {
      expiresAt: '2025-01-01T00:00:00Z',
      activatedAt: '2024-06-15T10:30:00Z',
      note: 'Premium tier'
    },
    app: {
      version: '1.2.3'
    }
  }
}
```

**Response Codes:**
- `KEY_VALID` - License is valid (already activated)
- `KEY_ACTIVATED` - License just activated (first use)
- `KEY_NOT_FOUND` - License key doesn't exist
- `KEY_EXPIRED` - License has expired
- `KEY_REVOKED` - License has been revoked
- `KEY_DISABLED` - License disabled by administrator
- `HWID_MISMATCH` - Hardware ID doesn't match
- `USER_BANNED` - User or device is banned
- `PROJECT_MISMATCH` - Key doesn't belong to this app
- `SIGNATURE_INVALID` - Request signature invalid
- `TIMESTAMP_EXPIRED` - Request timestamp out of range
- `SERVER_ERROR` - Internal server error

### `verifyOrThrow(key)`

Verify a license key and throw an error if invalid.

```javascript
try {
  const result = await auth.verifyOrThrow('LICENSE-KEY');
  // Key is valid, continue
  startApp();
} catch (error) {
  // Key is invalid, handle error
  console.error(error.message);
  process.exit(1);
}
```

### `getHWID()`

Get the current hardware ID.

```javascript
const hwid = auth.getHWID();
console.log('Hardware ID:', hwid);
```

### `setHWID(hwid)`

Set a custom hardware ID.

```javascript
auth.setHWID('custom-hwid-here');
```

### `generateHWID()`

Manually generate a hardware ID based on system characteristics.

```javascript
const hwid = auth.generateHWID();
console.log('Generated HWID:', hwid);
```

### `getLastVerification()`

Get the last verification result.

```javascript
const last = auth.getLastVerification();
if (last && last.success) {
  console.log('Last verified:', last.timestamp);
}
```

### `isAuthenticated()`

Check if the last verification was successful.

```javascript
if (auth.isAuthenticated()) {
  console.log('User is authenticated');
}
```

### `clearCache()`

Clear cached verification data.

```javascript
auth.clearCache();
```

## Hardware ID (HWID)

The SDK automatically generates a unique hardware ID based on system characteristics:

- CPU model
- Hostname
- Platform and architecture
- Network MAC addresses
- Platform-specific IDs:
  - **Windows:** Machine GUID
  - **Linux:** Machine ID
  - **macOS:** Hardware UUID

### Custom HWID

You can provide your own HWID logic:

```javascript
const auth = new NexveilAuth({
  appName: 'MyApp',
  secret1: '...',
  secret2: '...',
  secret3: '...',
  autoHWID: false,
  customHWID: 'my-custom-hwid'
});

// Or set it later
auth.setHWID('my-custom-hwid');
```

## Environment Variables

For production, store secrets in environment variables:

```javascript
require('dotenv').config();

const auth = new NexveilAuth({
  appName: process.env.NEXVEIL_APP_NAME,
  secret1: process.env.NEXVEIL_SECRET_1,
  secret2: process.env.NEXVEIL_SECRET_2,
  secret3: process.env.NEXVEIL_SECRET_3
});
```

`.env` file:
```env
NEXVEIL_APP_NAME=MyApp
NEXVEIL_SECRET_1=your_64_char_hex_secret_1
NEXVEIL_SECRET_2=your_64_char_hex_secret_2
NEXVEIL_SECRET_3=your_64_char_hex_secret_3
```

## Complete Example

```javascript
const NexveilAuth = require('nexveil-auth');
require('dotenv').config();

class Application {
  constructor() {
    this.auth = new NexveilAuth({
      appName: process.env.NEXVEIL_APP_NAME,
      secret1: process.env.NEXVEIL_SECRET_1,
      secret2: process.env.NEXVEIL_SECRET_2,
      secret3: process.env.NEXVEIL_SECRET_3
    });
    
    this.isRunning = false;
  }

  async start(licenseKey) {
    console.log('Starting application...');
    console.log('Hardware ID:', this.auth.getHWID());

    try {
      // Verify license
      const result = await this.auth.verifyOrThrow(licenseKey);
      
      console.log('✅ Authentication successful!');
      
      if (result.isActivated) {
        console.log('🎉 License activated for the first time!');
      }
      
      if (result.data?.key?.expiresAt) {
        const expires = new Date(result.data.key.expiresAt);
        console.log(`📅 License expires: ${expires.toLocaleDateString()}`);
      } else {
        console.log('📅 License: Lifetime');
      }
      
      // Start your app
      this.run();
      
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      console.log('Please contact support or purchase a license.');
      process.exit(1);
    }
  }

  run() {
    this.isRunning = true;
    console.log('Application running...');
    
    // Your app logic here
    
    // Optional: Periodic re-verification
    setInterval(async () => {
      try {
        await this.auth.verify(process.env.LICENSE_KEY);
        console.log('License re-verified successfully');
      } catch (error) {
        console.error('License verification failed:', error.message);
        this.shutdown();
      }
    }, 60 * 60 * 1000); // Every hour
  }

  shutdown() {
    console.log('Shutting down...');
    this.isRunning = false;
    process.exit(0);
  }
}

// Run the application
const app = new Application();
const licenseKey = process.argv[2] || process.env.LICENSE_KEY;

if (!licenseKey) {
  console.error('Usage: node app.js <LICENSE_KEY>');
  console.error('   Or: Set LICENSE_KEY environment variable');
  process.exit(1);
}

app.start(licenseKey);
```

## Security Best Practices

### 1. **Never Hardcode Secrets**
```javascript
// ❌ BAD
const auth = new NexveilAuth({
  secret1: 'abc123...',  // Visible in source code!
  ...
});

// ✅ GOOD
const auth = new NexveilAuth({
  secret1: process.env.NEXVEIL_SECRET_1,
  ...
});
```

### 2. **Obfuscate Your Application**

Use tools like `pkg` or `nexe` to compile your Node.js app into a binary:

```bash
npm install -g pkg
pkg app.js --targets node18-win-x64
```

### 3. **Implement Periodic Re-verification**

```javascript
setInterval(async () => {
  const result = await auth.verify(licenseKey);
  if (!result.success) {
    console.log('License no longer valid');
    process.exit(1);
  }
}, 3600000); // Every hour
```

### 4. **Handle Errors Gracefully**

```javascript
try {
  await auth.verifyOrThrow(key);
} catch (error) {
  // Don't expose internal error details to users
  console.log('License verification failed. Please contact support.');
  process.exit(1);
}
```

## Error Handling

All methods throw descriptive errors:

```javascript
try {
  const auth = new NexveilAuth({
    appName: 'MyApp',
    secret1: 'invalid'  // Too short!
  });
} catch (error) {
  console.error(error.message);
  // "Nexveil: secret1 must be a 64-character hex string"
}
```

Common errors:
- `Nexveil: Configuration object is required`
- `Nexveil: Missing required field: appName`
- `Nexveil: secret1 must be a 64-character hex string`
- `Nexveil: License key must be a non-empty string`
- `Nexveil: HWID not set. Enable autoHWID or provide customHWID`
- `Nexveil: Server signature verification failed - response may be tampered`
- `Nexveil: KEY_EXPIRED - License key has expired`

## How It Works

### Security Flow

1. **Client generates signature:**
   ```
   SHA256(nonce + secret1 + key + secret2 + timestamp + secret3 + hwid)
   ```

2. **Client sends request** with signature, nonce, timestamp, HWID

3. **Server validates:**
   - Timestamp (prevents replay attacks)
   - Nonce format (ensures crypto-grade randomness)
   - Client signature (verifies request authenticity)
   - License key status
   - HWID binding

4. **Server generates signature:**
   ```
   SHA256(client_nonce + secret3 + response_code)
   ```

5. **Client validates server signature** (prevents MITM)

6. **Client trusts response** if signature matches

## TypeScript Support

Type definitions coming soon! For now, you can create `index.d.ts`:

```typescript
declare module 'nexveil-auth' {
  interface NexveilConfig {
    appName: string;
    secret1: string;
    secret2: string;
    secret3: string;
    apiUrl?: string;
    autoHWID?: boolean;
    customHWID?: string;
    strictSSL?: boolean;
  }

  interface VerificationResult {
    success: boolean;
    code: string;
    message: string;
    signature: string;
    isActivated: boolean;
    isValid: boolean;
    timestamp: string;
    data: {
      key: {
        expiresAt?: string;
        activatedAt?: string;
        note?: string;
      };
      app: {
        version?: string;
      };
    } | null;
  }

  class NexveilAuth {
    constructor(config: NexveilConfig);
    verify(key: string): Promise<VerificationResult>;
    verifyOrThrow(key: string): Promise<VerificationResult>;
    getHWID(): string;
    setHWID(hwid: string): void;
    generateHWID(): string;
    getLastVerification(): VerificationResult | null;
    isAuthenticated(): boolean;
    clearCache(): void;
  }

  export = NexveilAuth;
}
```

## Support

- **Documentation:** https://docs.nexveil.net
- **Issues:** https://github.com/venoxcc/nexveil-auth/issues
- **Discord:** https://discord.gg/NvjjV7CCG7

## License

MIT License - see LICENSE file for details

---

Made with ❤️ by the Nexveil team