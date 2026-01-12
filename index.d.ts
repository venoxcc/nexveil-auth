// Type definitions for nexveil-auth
// Project: https://github.com/nexveil/nexveil-auth
// Definitions by: Nexveil Team

declare module 'nexveil-auth' {
  /**
   * Configuration options for NexveilAuth
   */
  export interface NexveilConfig {
    /**
     * Application name registered in Nexveil dashboard
     */
    appName: string;

    /**
     * First secret key (64-character hex string from app metadata)
     */
    secret1: string;

    /**
     * Second secret key (64-character hex string from app metadata)
     */
    secret2: string;

    /**
     * Third secret key (64-character hex string from app metadata)
     */
    secret3: string;

    /**
     * API base URL
     * @default 'https://api.nexveil.net'
     */
    apiUrl?: string;

    /**
     * Automatically generate hardware ID
     * @default true
     */
    autoHWID?: boolean;

    /**
     * Custom hardware ID override
     * @default null
     */
    customHWID?: string | null;

    /**
     * Enforce strict SSL certificate validation
     * @default true
     */
    strictSSL?: boolean;
  }

  /**
   * License key information
   */
  export interface KeyData {
    /**
     * ISO 8601 timestamp of when the key expires (null for lifetime)
     */
    expiresAt?: string | null;

    /**
     * ISO 8601 timestamp of when the key was first activated
     */
    activatedAt?: string | null;

    /**
     * Optional note attached to the key
     */
    note?: string | null;
  }

  /**
   * Application information
   */
  export interface AppData {
    /**
     * Current application version
     */
    version?: string;
  }

  /**
   * Verification result data
   */
  export interface VerificationData {
    /**
     * License key details
     */
    key: KeyData;

    /**
     * Application details
     */
    app: AppData;
  }

  /**
   * License verification result
   */
  export interface VerificationResult {
    /**
     * Whether the verification was successful
     */
    success: boolean;

    /**
     * Response code from the server
     * @example 'KEY_VALID', 'KEY_EXPIRED', 'KEY_NOT_FOUND'
     */
    code: string;

    /**
     * Human-readable message
     */
    message: string;

    /**
     * Server signature (SHA-256 hash)
     */
    signature: string;

    /**
     * Whether the key was just activated
     */
    isActivated: boolean;

    /**
     * Whether the key is valid (activated or already valid)
     */
    isValid: boolean;

    /**
     * ISO 8601 timestamp of verification
     */
    timestamp: string;

    /**
     * Additional data about the key and app (null if verification failed)
     */
    data: VerificationData | null;
  }

  /**
   *  Nexveil Authentication SDK
   */
  export default class NexveilAuth {
    /**
     * Create a new  Nexveil authentication client
     * @param config - Configuration options
     * @throws {Error} If configuration is invalid
     */
    constructor(config:  NexveilConfig);

    /**
     * Verify a license key
     * @param key - License key to verify
     * @returns Promise resolving to verification result
     * @throws {Error} If verification request fails
     */
    verify(key: string): Promise<VerificationResult>;

    /**
     * Verify a license key and throw an error if invalid
     * @param key - License key to verify
     * @returns Promise resolving to verification result (only if successful)
     * @throws {Error} If verification fails or key is invalid
     */
    verifyOrThrow(key: string): Promise<VerificationResult>;

    /**
     * Get the current hardware ID
     * @returns Hardware ID string
     * @throws {Error} If HWID generation fails
     */
    getHWID(): string;

    /**
     * Set a custom hardware ID
     * @param hwid - Custom hardware ID
     * @throws {Error} If HWID is invalid
     */
    setHWID(hwid: string): void;

    /**
     * Generate a hardware ID based on system characteristics
     * @returns Generated hardware ID
     * @throws {Error} If HWID generation fails
     */
    generateHWID(): string;

    /**
     * Get the last verification result
     * @returns Last verification result or null if never verified
     */
    getLastVerification(): VerificationResult | null;

    /**
     * Check if the last verification was successful
     * @returns True if authenticated, false otherwise
     */
    isAuthenticated(): boolean;

    /**
     * Clear cached verification data
     */
    clearCache(): void;
  }
}