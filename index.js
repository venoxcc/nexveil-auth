const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Nexveil Authentication SDK
 * Secure license key verification system
 */
class NexveilAuth {
  /**
   * @param {Object} config - Configuration object
   * @param {string} config.appName - Application name registered in Nexveil
   * @param {string} config.secret1 - First secret key (64 char)
   * @param {string} config.secret2 - Second secret key (64 char)
   * @param {string} config.secret3 - Third secret key (64 char)
   * @param {string} [config.apiUrl] - API base URL (default: production)
   * @param {boolean} [config.autoHWID] - Auto-generate HWID (default: true)
   * @param {string} [config.customHWID] - Custom HWID override
   * @param {boolean} [config.strictSSL] - Enforce strict SSL (default: true)
   */
  constructor(config) {
    this.validateConfig(config);
    
    this.appName = config.appName;
    this.secret1 = config.secret1;
    this.secret2 = config.secret2;
    this.secret3 = config.secret3;
    this.apiUrl = config.apiUrl || 'https://api.nexveil.net';
    this.autoHWID = config.autoHWID !== false; // default true
    this.customHWID = config.customHWID || null;
    this.strictSSL = config.strictSSL !== false; // default true
    
    this._hwid = null;
    this._lastVerification = null;
  }

  /**
   * Validates configuration parameters
   * @private
   */
  validateConfig(config) {
    if (!config) {
      throw new Error('nexveil: Configuration object is required');
    }

    const required = ['appName', 'secret1', 'secret2', 'secret3'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`nexveil: Missing required field: ${field}`);
      }
    }

    // Validate secret format (exactly 64 characters, any content)
    const secretRegex = /^.{64}$/s;
    for (let i = 1; i <= 3; i++) {
      const secret = config[`secret${i}`];
      if (!secretRegex.test(secret)) {
        throw new Error(`nexveil: secret${i} must be exactly 64 characters`);
      }
    }

    // Validate app name
    if (typeof config.appName !== 'string' || config.appName.length === 0) {
      throw new Error('nexveil: appName must be a non-empty string');
    }
  }

  /**
   * SHA-256 hash function
   * @private
   */
  sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate hardware ID based on system characteristics
   * This creates a unique identifier for the machine
   * @returns {string} Hardware ID
   */
  generateHWID() {
    if (this.customHWID) {
      return this.customHWID;
    }

    if (this._hwid) {
      return this._hwid;
    }

    try {
      const components = [];

      // CPU info
      const cpus = os.cpus();
      if (cpus && cpus.length > 0) {
        components.push(cpus[0].model);
      }

      // Hostname
      components.push(os.hostname());

      // Platform and architecture
      components.push(os.platform());
      components.push(os.arch());

      // MAC addresses from network interfaces
      const interfaces = os.networkInterfaces();
      const macAddresses = [];
      
      for (const name in interfaces) {
        for (const iface of interfaces[name]) {
          if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macAddresses.push(iface.mac);
          }
        }
      }
      
      // Sort for consistency
      macAddresses.sort();
      components.push(...macAddresses);

      // Platform-specific identifiers
      try {
        if (os.platform() === 'win32') {
          // Windows: Get machine GUID
          const guid = execSync('wmic csproduct get uuid', { encoding: 'utf8' })
            .split('\n')[1]
            .trim();
          components.push(guid);
        } else if (os.platform() === 'linux') {
          // Linux: Get machine-id
          const machineId = execSync('cat /etc/machine-id || cat /var/lib/dbus/machine-id', { encoding: 'utf8' })
            .trim();
          components.push(machineId);
        } else if (os.platform() === 'darwin') {
          // macOS: Get hardware UUID
          const hwUUID = execSync('ioreg -d2 -c IOPlatformExpertDevice | awk -F\\" \'/IOPlatformUUID/{print $(NF-1)}\'', { encoding: 'utf8' })
            .trim();
          components.push(hwUUID);
        }
      } catch (err) {
        // Platform-specific commands might fail, continue with other components
        console.warn('Nexveil: Could not retrieve platform-specific ID');
      }

      // Create deterministic hash from components
      const combined = components.join('||');
      const hwid = this.sha256(combined);
      
      this._hwid = hwid;
      return hwid;
    } catch (error) {
      throw new Error(`Nexveil: Failed to generate HWID: ${error.message}`);
    }
  }

  /**
   * Get current HWID (generates if not exists)
   * @returns {string} Hardware ID
   */
  getHWID() {
    if (this.autoHWID) {
      return this.generateHWID();
    } else if (this.customHWID) {
      return this.customHWID;
    } else {
      throw new Error('Nexveil: HWID not set. Enable autoHWID or provide customHWID');
    }
  }

  /**
   * Set custom HWID
   * @param {string} hwid - Custom hardware ID
   */
  setHWID(hwid) {
    if (!hwid || typeof hwid !== 'string') {
      throw new Error('Nexveil: HWID must be a non-empty string');
    }
    this.customHWID = hwid;
    this._hwid = hwid;
  }

  /**
   * Verify a license key
   * @param {string} key - License key to verify
   * @returns {Promise<Object>} Verification result
   */
  async verify(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Nexveil: License key must be a non-empty string');
    }

    try {
      // Get HWID
      const clientHWID = this.getHWID();
      
      // Generate cryptographically secure nonce (64 hex chars = 32 bytes)
      const clientNonce = crypto.randomBytes(32).toString('hex');
      
      // Get current timestamp
      const clientTime = Date.now().toString();
      
      // ═══════════════════════════════════════════════════════════
      // STEP 1: CREATE CLIENT SIGNATURE
      // ═══════════════════════════════════════════════════════════
      // Formula: sha256(client_nonce + secret_n1 + key + secret_n2 + clientTime + secret_n3 + client_hwid)
      const clientSignature = this.sha256(
        clientNonce + this.secret1 + key + this.secret2 + clientTime + this.secret3 + clientHWID
      );
      
      const headers = {
        'Content-Type': 'application/json',
        'clienttime': clientTime,
        'externalsignature': clientSignature,
        'clientnonce': clientNonce,
        'clienthwid': clientHWID,
      };
      
      // ═══════════════════════════════════════════════════════════
      // STEP 2: SEND REQUEST TO SERVER
      // ═══════════════════════════════════════════════════════════
      const url = `${this.apiUrl}/wlv1/application/auth?key=${encodeURIComponent(key)}&app_name=${encodeURIComponent(this.appName)}`;
      
      const fetchOptions = {
        method: 'GET',
        headers: headers
      };

      // Handle SSL for local development
      if (!this.strictSSL && url.includes('localhost')) {
        // Note: In production, users should use https-proxy-agent for custom SSL handling
        fetchOptions.agent = null;
      }

      const response = await fetch(url, fetchOptions);
      
      if (!response.ok && response.status >= 500) {
        throw new Error(`nexveil: Server error (${response.status})`);
      }

      const data = await response.json();
      
      // ═══════════════════════════════════════════════════════════
      // STEP 3: VERIFY SERVER SIGNATURE (if present)
      // ═══════════════════════════════════════════════════════════
      // All server responses should include a signature for verification
      if (data.signature) {
        // Formula: sha256(client_nonce + secret_n3 + responseCode)
        const expectedServerSignature = this.sha256(clientNonce + this.secret3 + data.code);
        
        if (data.signature !== expectedServerSignature) {
          throw new Error('nexveil: Server signature verification failed - response may be tampered');
        }
      }
      
      // ═══════════════════════════════════════════════════════════
      // STEP 4: PROCESS AUTHENTICATION RESULT
      // ═══════════════════════════════════════════════════════════
      const result = {
        success: false,
        code: data.code || 'UNKNOWN_ERROR',
        message: data.message || 'Unknown error occurred',
        signature: data.signature || null,
        data: data.data || null,
        isActivated: data.code === 'KEY_ACTIVATED',
        isValid: data.code === 'KEY_VALID' || data.code === 'KEY_ACTIVATED',
        timestamp: new Date().toISOString()
      };

      if (result.isValid) {
        result.success = true;
        this._lastVerification = result;
      }

      return result;
    } catch (error) {
      if (error.message.includes('nexveil:')) {
        throw error;
      }
      throw new Error(`nexveil: Verification failed - ${error.message}`);
    }
  }

  /**
   * Verify key and throw error if invalid
   * @param {string} key - License key to verify
   * @returns {Promise<Object>} Verification result (only if successful)
   */
  async verifyOrThrow(key) {
    const result = await this.verify(key);
    
    if (!result.success) {
      throw new Error(`nexveil: ${result.code} - ${result.message}`);
    }
    
    return result;
  }

  /**
   * Get the last verification result
   * @returns {Object|null} Last verification result or null
   */
  getLastVerification() {
    return this._lastVerification;
  }

  /**
   * Check if last verification was successful
   * @returns {boolean} True if last verification succeeded
   */
  isAuthenticated() {
    return this._lastVerification && this._lastVerification.success;
  }

  /**
   * Clear cached verification data
   */
  clearCache() {
    this._lastVerification = null;
  }
}

module.exports = NexveilAuth;