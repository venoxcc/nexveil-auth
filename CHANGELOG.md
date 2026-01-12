# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

### Added
- Initial release of NexVeil Auth SDK
- License key verification with dual signature validation
- Automatic hardware ID (HWID) generation
- Support for custom HWID
- Cross-platform support (Windows, Linux, macOS)
- `verify()` method for license verification
- `verifyOrThrow()` method for throwing on verification failure
- `getHWID()` method to retrieve current HWID
- `setHWID()` method to set custom HWID
- `generateHWID()` method for manual HWID generation
- `getLastVerification()` to retrieve last verification result
- `isAuthenticated()` to check authentication state
- `clearCache()` to clear cached verification data
- Comprehensive error handling
- TypeScript type definitions
- Zero external dependencies
- Replay attack prevention via timestamps
- MITM attack prevention via signature validation
- Cryptographically secure nonce generation
- Support for environment variables
- Detailed documentation and examples

### Security
- SHA-256 signature validation (client → server and server → client)
- Timing-safe comparison for signatures
- Hardware ID binding for device-specific licensing
- Secure nonce generation using crypto.randomBytes()
- Timestamp validation with 5-minute clock skew tolerance

## [Unreleased]

### Planned
- nothing specific yet...