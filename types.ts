export interface CertInfo {
  id: string;
  subject: Record<string, string>;
  issuer: Record<string, string>;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string; // SHA-1 usually
  fingerprint256: string; // SHA-256
  spkiFingerprint: string; // HPKP Pin (SHA-256 of Public Key Info)
  isSelfSigned: boolean;
  rawPem: string;
  type: 'Leaf' | 'Intermediate' | 'Root' | 'Unknown';
  subjectAltNames: string[]; // Subject Alternative Names (SAN)
  keyUsage: string[]; // Key usage extensions
  extendedKeyUsage: string[]; // Extended key usage
  basicConstraints?: {
    cA: boolean;
    pathLenConstraint?: number;
  };
}

export interface VerificationResult {
  isValid: boolean;
  messages: string[];
}

export enum Tab {
  LAB = 'LAB',
  MATCHER = 'MATCHER',
  COMMANDS = 'COMMANDS',
  DOMAIN_INTEL = 'DOMAIN_INTEL'
}

export interface DomainInfo {
  hostname: string;
  port: number;
  certificate?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysUntilExpiry: number;
    isExpired: boolean;
    serialNumber: string;
    fingerprint: string;
    subjectAltNames: string[];
  };
  tlsVersion?: string;
  cipherSuite?: string;
  error?: string;
}