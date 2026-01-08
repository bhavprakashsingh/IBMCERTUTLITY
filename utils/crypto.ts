// @ts-ignore
import forge from 'https://esm.sh/node-forge@1.3.1';
import { CertInfo } from '../types';

export const parseCertificateChain = (pem: string): CertInfo[] => {
  const certs: CertInfo[] = [];
  
  if (!pem || pem.trim().length === 0) {
    throw new Error('Empty PEM input provided');
  }
  
  // Extract all PEM blocks
  const matches = pem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g);
  
  if (!matches || matches.length === 0) {
    throw new Error('No valid PEM certificate blocks found in input');
  }

  try {
    const forgeCerts = matches.map((certPem, index) => {
        try {
            return forge.pki.certificateFromPem(certPem);
        } catch (e) {
            console.warn(`Failed to parse certificate block ${index + 1}:`, e);
            return null;
        }
    }).filter(Boolean);

    if (forgeCerts.length === 0) {
      throw new Error('All certificate blocks failed to parse');
    }

    forgeCerts.forEach((cert: any, index: number) => {
      try {
      const fingerprint = forge.md.sha1.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex();
      const fingerprint256 = forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex();
      
      // Calculate SPKI Pin (HPKP)
      // 1. Get Public Key ASN.1
      const publicKey = cert.publicKey;
      const spkiAsn1 = forge.pki.publicKeyToAsn1(publicKey);
      const spkiDer = forge.asn1.toDer(spkiAsn1);
      
      // 2. SHA-256 of SPKI
      const spkiDigest = forge.md.sha256.create().update(spkiDer.getBytes()).digest();
      const spkiPin = forge.util.encode64(spkiDigest.getBytes());

      // Attributes
      const subject = cert.subject.attributes.reduce((acc: any, attr: any) => {
        acc[attr.shortName || attr.name] = attr.value;
        return acc;
      }, {});

      const issuer = cert.issuer.attributes.reduce((acc: any, attr: any) => {
        acc[attr.shortName || attr.name] = attr.value;
        return acc;
      }, {});

      const isSelfSigned = JSON.stringify(subject) === JSON.stringify(issuer);

      // Extract Subject Alternative Names (SAN)
      const subjectAltNames: string[] = [];
      const sanExt = cert.getExtension('subjectAltName');
      if (sanExt && sanExt.altNames) {
        sanExt.altNames.forEach((altName: any) => {
          if (altName.type === 2) { // DNS name
            subjectAltNames.push(`DNS:${altName.value}`);
          } else if (altName.type === 7) { // IP address
            subjectAltNames.push(`IP:${altName.ip}`);
          } else if (altName.type === 6) { // URI
            subjectAltNames.push(`URI:${altName.value}`);
          } else if (altName.type === 1) { // Email
            subjectAltNames.push(`Email:${altName.value}`);
          }
        });
      }

      // Extract Key Usage
      const keyUsage: string[] = [];
      const keyUsageExt = cert.getExtension('keyUsage');
      if (keyUsageExt) {
        if (keyUsageExt.digitalSignature) keyUsage.push('Digital Signature');
        if (keyUsageExt.nonRepudiation) keyUsage.push('Non Repudiation');
        if (keyUsageExt.keyEncipherment) keyUsage.push('Key Encipherment');
        if (keyUsageExt.dataEncipherment) keyUsage.push('Data Encipherment');
        if (keyUsageExt.keyAgreement) keyUsage.push('Key Agreement');
        if (keyUsageExt.keyCertSign) keyUsage.push('Certificate Sign');
        if (keyUsageExt.cRLSign) keyUsage.push('CRL Sign');
        if (keyUsageExt.encipherOnly) keyUsage.push('Encipher Only');
        if (keyUsageExt.decipherOnly) keyUsage.push('Decipher Only');
      }

      // Extract Extended Key Usage
      const extendedKeyUsage: string[] = [];
      const extKeyUsageExt = cert.getExtension('extKeyUsage');
      if (extKeyUsageExt) {
        if (extKeyUsageExt.serverAuth) extendedKeyUsage.push('TLS Web Server Authentication');
        if (extKeyUsageExt.clientAuth) extendedKeyUsage.push('TLS Web Client Authentication');
        if (extKeyUsageExt.codeSigning) extendedKeyUsage.push('Code Signing');
        if (extKeyUsageExt.emailProtection) extendedKeyUsage.push('Email Protection');
        if (extKeyUsageExt.timeStamping) extendedKeyUsage.push('Time Stamping');
        if (extKeyUsageExt.ocspSigning) extendedKeyUsage.push('OCSP Signing');
      }

      // Extract Basic Constraints
      let basicConstraints: { cA: boolean; pathLenConstraint?: number } | undefined;
      const basicConstraintsExt = cert.getExtension('basicConstraints');
      if (basicConstraintsExt) {
        basicConstraints = {
          cA: basicConstraintsExt.cA || false,
          pathLenConstraint: basicConstraintsExt.pathLenConstraint
        };
      }

      // Determine Type (Heuristic)
      let type: 'Leaf' | 'Intermediate' | 'Root' = 'Intermediate';
      if (index === 0 && !isSelfSigned) type = 'Leaf';
      else if (isSelfSigned) type = 'Root';
      // If it's the last one and not self-signed, it might be a root that is just missing the self-signature in the chain provided, or a cross-sign.
      // But typically Last = Root if self-signed.
      
      certs.push({
        id: crypto.randomUUID(),
        subject,
        issuer,
        serialNumber: cert.serialNumber,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        fingerprint: fingerprint.match(/.{1,2}/g)?.join(':').toUpperCase() || '',
        fingerprint256: fingerprint256.match(/.{1,2}/g)?.join(':').toUpperCase() || '',
        spkiFingerprint: spkiPin,
        isSelfSigned,
        rawPem: matches[index],
        type,
        subjectAltNames,
        keyUsage,
        extendedKeyUsage,
        basicConstraints
      });
      } catch (error) {
        console.error(`Error processing certificate ${index + 1}:`, error);
        // Continue processing other certificates
      }
    });

  } catch (error) {
    console.error("Failed to parse certificates:", error);
    throw error;
  }

  if (certs.length === 0) {
    throw new Error('No certificates could be successfully parsed');
  }

  return certs;
};

export const verifyChainLocally = (certs: CertInfo[]): { valid: boolean; logs: string[] } => {
  const logs: string[] = [];
  let valid = true;

  if (certs.length === 0) {
    return { valid: false, logs: ['No certificates to verify.'] };
  }

  const now = new Date();

  certs.forEach((cert, i) => {
    // Check Dates
    if (now < cert.validFrom) {
      valid = false;
      logs.push(`[${cert.type}] Cert ${cert.subject.CN} is not yet valid (Future date).`);
    }
    if (now > cert.validTo) {
      valid = false;
      logs.push(`[${cert.type}] Cert ${cert.subject.CN} has EXPIRED.`);
    } else {
        logs.push(`[${cert.type}] Cert ${cert.subject.CN} is within validity period.`);
    }

    // Check Chain Linkage
    if (i < certs.length - 1) {
      const child = cert;
      const parent = certs[i + 1];
      
      // Simple Name Check
      // Note: This is a loose check. Real verification requires crypto signature check.
      // We assume the user pasted the chain in order (Leaf -> Inter -> Root)
      const childIssuerCN = child.issuer.CN;
      const parentSubjectCN = parent.subject.CN;

      if (childIssuerCN !== parentSubjectCN) {
         valid = false;
         logs.push(`[Broken Chain] ${child.subject.CN} claims issuer is ${childIssuerCN}, but next cert is ${parentSubjectCN}.`);
      } else {
          logs.push(`[Link Verified] ${child.subject.CN} is issued by ${parent.subject.CN}.`);
      }
    }
  });

  if (certs[certs.length - 1].isSelfSigned) {
      logs.push(`[Root] Chain terminates with a self-signed root: ${certs[certs.length-1].subject.CN}.`);
  } else {
      logs.push(`[Warning] Chain does not end with a self-signed root certificate (Incomplete chain?).`);
  }

  return { valid, logs };
};

export const matchCertificateAndKey = (certPem: string, keyPem: string): {
  matches: boolean;
  message: string;
  details?: {
    certModulus: string;
    keyModulus: string;
  };
} => {
  try {
    // Parse certificate
    const certMatch = certPem.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
    if (!certMatch) {
      throw new Error('Invalid certificate format. No valid PEM certificate block found.');
    }

    const cert = forge.pki.certificateFromPem(certMatch[0]);
    const certPublicKey = cert.publicKey as any;

    // Parse private key - support both PKCS#8 and PKCS#1 formats
    let privateKey: any;
    
    // Try PKCS#8 format first (-----BEGIN PRIVATE KEY-----)
    const pkcs8Match = keyPem.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);
    if (pkcs8Match) {
      try {
        privateKey = forge.pki.privateKeyFromPem(pkcs8Match[0]);
      } catch (e) {
        throw new Error('Failed to parse PKCS#8 private key. The key may be encrypted or corrupted.');
      }
    } else {
      // Try PKCS#1 format (-----BEGIN RSA PRIVATE KEY-----)
      const pkcs1Match = keyPem.match(/-----BEGIN RSA PRIVATE KEY-----[\s\S]+?-----END RSA PRIVATE KEY-----/);
      if (pkcs1Match) {
        try {
          privateKey = forge.pki.privateKeyFromPem(pkcs1Match[0]);
        } catch (e) {
          throw new Error('Failed to parse PKCS#1 RSA private key. The key may be encrypted or corrupted.');
        }
      } else {
        throw new Error('Invalid private key format. Expected PEM format with BEGIN PRIVATE KEY or BEGIN RSA PRIVATE KEY header.');
      }
    }

    // Extract modulus from both keys
    // For RSA keys, the modulus (n) is the unique identifier
    const certModulus = certPublicKey.n.toString(16).toUpperCase();
    const keyModulus = privateKey.n.toString(16).toUpperCase();

    // Compare moduli
    const matches = certModulus === keyModulus;

    if (matches) {
      return {
        matches: true,
        message: 'The certificate and private key are a matching pair. The public key in the certificate was derived from this private key.',
        details: {
          certModulus,
          keyModulus
        }
      };
    } else {
      return {
        matches: false,
        message: 'The certificate and private key do NOT match. The public key modulus values are different, indicating these are not a pair.',
        details: {
          certModulus,
          keyModulus
        }
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while matching certificate and key.');
  }
};