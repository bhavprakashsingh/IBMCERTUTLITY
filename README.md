<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# IBMSRE-CertMaster - SSL/TLS Toolkit

A comprehensive SSL/TLS certificate analyzer, chain verifier, and key pinning utility powered by local crypto engine.

## Features

### 🔐 Certificate Lab
- **Auto-Fetch Certificate Chains**: Automatically fetch complete certificate chains (leaf, intermediate, root) from any server
- **Certificate Chain Parsing**: Extract and analyze Leaf, Intermediate, and Root certificates from PEM format
- **Subject Alternative Names (SAN)**: View all DNS names, IP addresses, URIs, and email addresses in certificates
- **Key Usage Analysis**: Display key usage and extended key usage extensions
- **Basic Constraints**: View CA status and path length constraints
- **Chain Verification**: Validate certificate chains with detailed logging
- **HPKP Pin Generation**: Generate HTTP Public Key Pinning (HPKP) SHA-256 pins
- **Fingerprint Display**: View SHA-1 and SHA-256 certificate fingerprints
- **Certificate Export**: Download individual certificates or export all at once
- **Copy to Clipboard**: Quick copy for fingerprints and HPKP pins

### 🔑 Certificate & Key Matcher
- **Verify Key-Certificate Pairs**: Confirm if a private key matches a certificate
- **Modulus Comparison**: Compare public key modulus from certificate and private key
- **Support Multiple Formats**: Works with PKCS#8 and PKCS#1 (RSA) private key formats
- **Visual Feedback**: Clear match/no-match indication with detailed comparison
- **File Upload**: Upload certificate and key files or paste PEM content directly

### � Command Generator
- Generate OpenSSL commands for common certificate operations
- Quick reference for SSL/TLS command-line tools

## Run Locally

**Prerequisites:**  Node.js (v18 or higher recommended)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application:

   **Option A: Run frontend and backend together (recommended)**
   ```bash
   npm start
   ```
   This starts both the Vite dev server (port 5173) and the backend server (port 3001).

   **Option B: Run separately**
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend (required for auto-fetch feature)
   npm run server
   ```

3. Open your browser and navigate to `http://localhost:5173`

**Note**: The certificate chain auto-fetch feature requires the backend server to be running on port 3001.

## Usage

### Analyzing Certificates

#### Method 1: Auto-Fetch from Server (Recommended)
1. **Enter Hostname**: Type the hostname (e.g., `www.google.com`, `github.com`)
2. **Specify Port**: Default is 443 (HTTPS), change if needed
3. **Fetch Chain**: Click "Fetch Certificate Chain" to automatically retrieve the complete chain
4. **Auto-Analysis**: The chain is automatically parsed and analyzed

#### Method 2: Manual Upload/Paste
1. **Upload or Paste**: Either upload a `.pem`, `.crt`, or `.cer` file, or paste the certificate chain directly into the text area
2. **Process**: Click "PROCESS CHAIN & ANALYZE" to parse and verify the certificates

#### Review Results
3. **Review**: Examine the detailed information for each certificate including:
   - Subject and Issuer details
   - Validity dates
   - Subject Alternative Names (SAN)
   - Key usage and extended key usage
   - Basic constraints
   - HPKP pins and fingerprints
4. **Export**: Download individual certificates or export all at once

### Matching Certificate and Private Key

1. **Navigate**: Go to the "Key Matcher" tab
2. **Load Certificate**: Upload or paste your certificate in PEM format
3. **Load Private Key**: Upload or paste your private key (supports PKCS#8 and PKCS#1 formats)
4. **Verify**: Click "VERIFY MATCH" to check if they are a matching pair
5. **Review Results**: See clear match/no-match indication with modulus comparison details

### Certificate Information Displayed

- **Type Badge**: Identifies certificate as Leaf, Intermediate, or Root
- **Self-Signed Indicator**: Shows if a certificate is self-signed
- **Subject/Issuer**: Common Name (CN) and Organization (O)
- **Validity Period**: Not Before and Not After dates with expiration warnings
- **Serial Number**: Certificate serial number
- **Subject Alternative Names**: All DNS names, IPs, URIs, and emails
- **Key Usage**: Digital Signature, Key Encipherment, Certificate Sign, etc.
- **Extended Key Usage**: TLS Server/Client Auth, Code Signing, etc.
- **Basic Constraints**: CA status and path length constraints
- **HPKP Pin**: SHA-256 hash of the Subject Public Key Info (SPKI)
- **Fingerprints**: SHA-1 and SHA-256 certificate fingerprints

### Key Matching

The Key Matcher verifies if a private key corresponds to a certificate by:
- Extracting the public key modulus from the certificate
- Extracting the modulus from the private key
- Comparing both moduli - if they match, the key pair is valid
- Supporting both PKCS#8 (`BEGIN PRIVATE KEY`) and PKCS#1 (`BEGIN RSA PRIVATE KEY`) formats

### Chain Verification

The tool automatically verifies:
- Certificate validity dates
- Chain linkage (issuer-subject matching)
- Self-signed root detection
- Incomplete chain warnings

## Technology Stack

### Frontend
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **node-forge**: Client-side cryptography
- **Lucide React**: Beautiful icons

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **TLS Module**: Native Node.js TLS/SSL support for certificate fetching

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
