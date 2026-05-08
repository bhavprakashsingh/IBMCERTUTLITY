import express from 'express';
import https from 'https';
import http from 'http';
import cors from 'cors';
import tls from 'tls';
import forge from 'node-forge';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Certificate chain fetcher is running' });
});

// Fetch certificate chain from a hostname
app.post('/api/fetch-chain', async (req, res) => {
  const { hostname, port = 443 } = req.body;

  if (!hostname) {
    return res.status(400).json({ 
      error: 'Hostname is required',
      message: 'Please provide a hostname to fetch certificates from'
    });
  }

  try {
    console.log(`Fetching certificate chain from ${hostname}:${port}`);

    const options = {
      host: hostname,
      port: port,
      method: 'GET',
      rejectUnauthorized: false, // Accept self-signed certificates
      requestCert: true,
      agent: false
    };

    // Create TLS connection to get certificates
    const socket = tls.connect(options, () => {
      const peerCert = socket.getPeerCertificate(true);
      
      if (!peerCert || Object.keys(peerCert).length === 0) {
        socket.destroy();
        return res.status(404).json({
          error: 'No certificate found',
          message: `Could not retrieve certificate from ${hostname}:${port}`
        });
      }

      // Extract certificate chain
      const chain = [];
      let currentCert = peerCert;

      while (currentCert && Object.keys(currentCert).length > 0) {
        if (currentCert.raw) {
          // Convert DER to PEM format
          const pemCert = convertDerToPem(currentCert.raw);
          chain.push({
            pem: pemCert,
            subject: currentCert.subject,
            issuer: currentCert.issuer,
            valid_from: currentCert.valid_from,
            valid_to: currentCert.valid_to,
            fingerprint: currentCert.fingerprint,
            serialNumber: currentCert.serialNumber,
            subjectaltname: currentCert.subjectaltname
          });
        }

        // Move to issuer certificate
        if (currentCert.issuerCertificate && 
            currentCert.issuerCertificate !== currentCert && 
            currentCert.issuerCertificate.fingerprint !== currentCert.fingerprint) {
          currentCert = currentCert.issuerCertificate;
        } else {
          break; // Reached root or self-signed
        }
      }

      socket.destroy();

      console.log(`Successfully fetched ${chain.length} certificate(s) from ${hostname}:${port}`);

      res.json({
        success: true,
        hostname,
        port,
        certificateCount: chain.length,
        certificates: chain,
        fullChainPem: chain.map(cert => cert.pem).join('\n')
      });
    });

    socket.on('error', (error) => {
      console.error(`Error connecting to ${hostname}:${port}:`, error.message);
      res.status(500).json({
        error: 'Connection failed',
        message: `Failed to connect to ${hostname}:${port}. ${error.message}`,
        details: error.code
      });
    });

    socket.setTimeout(10000); // 10 second timeout
    socket.on('timeout', () => {
      socket.destroy();
      res.status(408).json({
        error: 'Connection timeout',
        message: `Connection to ${hostname}:${port} timed out after 10 seconds`
      });
    });

  } catch (error) {
    console.error('Error fetching certificate chain:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Domain information endpoint - Get certificate details for a domain
app.post('/api/domain-info', async (req, res) => {
  const { hostname, port = 443 } = req.body;

  if (!hostname) {
    return res.status(400).json({
      error: 'Hostname is required',
      message: 'Please provide a hostname to check'
    });
  }

  try {
    console.log(`Fetching domain info for ${hostname}:${port}`);

    const options = {
      host: hostname,
      port: port,
      method: 'GET',
      rejectUnauthorized: false, // Accept self-signed certificates
      requestCert: true,
      agent: false,
      servername: hostname // SNI support
    };

    // Create TLS connection to get certificate
    const socket = tls.connect(options, () => {
      const peerCert = socket.getPeerCertificate(false);
      const tlsVersion = socket.getProtocol();
      const cipherSuite = socket.getCipher();
      
      if (!peerCert || Object.keys(peerCert).length === 0) {
        socket.destroy();
        return res.status(404).json({
          error: 'No certificate found',
          message: `Could not retrieve certificate from ${hostname}:${port}`
        });
      }

      // Calculate days until expiry
      const validTo = new Date(peerCert.valid_to);
      const now = new Date();
      const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
      const isExpired = daysUntilExpiry < 0;

      // Extract subject alternative names
      const subjectAltNames = [];
      if (peerCert.subjectaltname) {
        const sans = peerCert.subjectaltname.split(', ');
        sans.forEach(san => {
          const parts = san.split(':');
          if (parts.length > 1) {
            subjectAltNames.push(parts[1]);
          }
        });
      }

      // Get subject CN
      const subjectCN = peerCert.subject?.CN || 'N/A';
      
      // Get issuer CN
      const issuerCN = peerCert.issuer?.CN || 'N/A';

      socket.destroy();

      console.log(`Successfully retrieved certificate info for ${hostname}:${port}`);

      res.json({
        hostname,
        port,
        certificate: {
          subject: subjectCN,
          issuer: issuerCN,
          validFrom: peerCert.valid_from,
          validTo: peerCert.valid_to,
          daysUntilExpiry,
          isExpired,
          serialNumber: peerCert.serialNumber,
          fingerprint: peerCert.fingerprint256 || peerCert.fingerprint,
          subjectAltNames
        },
        tlsVersion: tlsVersion || 'Unknown',
        cipherSuite: cipherSuite ? `${cipherSuite.name} (${cipherSuite.version})` : 'Unknown'
      });
    });

    socket.on('error', (error) => {
      console.error(`Error connecting to ${hostname}:${port}:`, error.message);
      res.status(500).json({
        error: 'Connection failed',
        message: `Failed to connect to ${hostname}:${port}. ${error.message}`,
        details: error.code
      });
    });

    socket.setTimeout(10000); // 10 second timeout
    socket.on('timeout', () => {
      socket.destroy();
      res.status(408).json({
        error: 'Connection timeout',
        message: `Connection to ${hostname}:${port} timed out after 10 seconds`
      });
    });

  } catch (error) {
    console.error('Error fetching domain info:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Helper function to convert DER to PEM format
function convertDerToPem(der) {
  try {
    // Handle empty or invalid input
    if (!der || der.length === 0) {
      throw new Error('Empty or invalid DER data');
    }
    
    const base64 = der.toString('base64');
    
    // Check if base64 conversion was successful
    if (!base64 || base64.length === 0) {
      throw new Error('Failed to convert DER to base64');
    }
    
    // Split into 64-character lines
    const lines = base64.match(/.{1,64}/g);
    if (!lines) {
      throw new Error('Failed to format base64 data');
    }
    
    const pem = lines.join('\n');
    return `-----BEGIN CERTIFICATE-----\n${pem}\n-----END CERTIFICATE-----`;
  } catch (error) {
    console.error('Error in convertDerToPem:', error.message);
    throw new Error(`Failed to convert DER to PEM: ${error.message}`);
  }
}

// Fetch issuer certificate from AIA extension
app.get('/api/fetch-issuer-chain', (req, res) => {
  res.json({
    message: 'This endpoint requires POST method with leafCertPem in the request body',
    usage: {
      method: 'POST',
      url: '/api/fetch-issuer-chain',
      body: {
        leafCertPem: 'Your certificate in PEM format'
      }
    }
  });
});

// Helper function to fetch chain from crt.sh
async function fetchChainFromCrtSh(cert) {
  try {
    // Get certificate fingerprint (SHA-256)
    const md = forge.md.sha256.create();
    md.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
    const fingerprint = md.digest().toHex().toUpperCase();
    
    console.log(`Trying crt.sh fallback with fingerprint: ${fingerprint}`);
    
    // Query crt.sh for the certificate
    const crtShUrl = `https://crt.sh/?q=${fingerprint}&output=json`;
    
    return new Promise((resolve, reject) => {
      https.get(crtShUrl, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          try {
            // Check if response is HTML (certificate not found)
            if (data.trim().startsWith('<')) {
              reject(new Error('Certificate not found in CT logs'));
              return;
            }
            
            const results = JSON.parse(data);
            if (results && results.length > 0) {
              // Get the issuer CA ID
              const issuerCaId = results[0].issuer_ca_id;
              console.log(`Found issuer CA ID: ${issuerCaId}`);
              resolve(issuerCaId);
            } else {
              reject(new Error('No results from crt.sh'));
            }
          } catch (e) {
            reject(new Error('Certificate not found in CT logs'));
          }
        });
      }).on('error', reject);
    });
  } catch (error) {
    throw error;
  }
}

// Helper function to get issuer DN from certificate
function getIssuerInfo(cert) {
  const issuer = cert.issuer.attributes.map(a => `${a.shortName}=${a.value}`).join(', ');
  return issuer;
}

// Helper function to try fetching root certificate from common CA stores
async function tryFetchRootCertificate(issuerCN) {
  console.log(`Attempting to fetch root certificate for: ${issuerCN}`);
  
  // Common root certificate URLs from major Certificate Authorities
  const rootCertUrls = {
    // DigiCert
    'DigiCert Global Root CA': 'http://cacerts.digicert.com/DigiCertGlobalRootCA.crt',
    'DigiCert Global Root G2': 'http://cacerts.digicert.com/DigiCertGlobalRootG2.crt',
    'DigiCert Global Root G3': 'http://cacerts.digicert.com/DigiCertGlobalRootG3.crt',
    'DigiCert High Assurance EV Root CA': 'http://cacerts.digicert.com/DigiCertHighAssuranceEVRootCA.crt',
    'DigiCert Assured ID Root CA': 'http://cacerts.digicert.com/DigiCertAssuredIDRootCA.crt',
    'DigiCert Assured ID Root G2': 'http://cacerts.digicert.com/DigiCertAssuredIDRootG2.crt',
    'DigiCert Assured ID Root G3': 'http://cacerts.digicert.com/DigiCertAssuredIDRootG3.crt',
    'DigiCert Trusted Root G4': 'http://cacerts.digicert.com/DigiCertTrustedRootG4.crt',
    
    // GeoTrust
    'GeoTrust Global CA': 'http://cacerts.geotrust.com/GeoTrustGlobalCA.crt',
    'GeoTrust Primary Certification Authority': 'http://cacerts.geotrust.com/GeoTrustPCA.crt',
    'GeoTrust Primary Certification Authority - G2': 'http://cacerts.geotrust.com/GeoTrustPCA-G2.crt',
    'GeoTrust Primary Certification Authority - G3': 'http://cacerts.geotrust.com/GeoTrustPCA-G3.crt',
    'GeoTrust Universal CA': 'http://cacerts.geotrust.com/GeoTrustUniversalCA.crt',
    
    // Let's Encrypt
    'ISRG Root X1': 'https://letsencrypt.org/certs/isrgrootx1.der',
    'ISRG Root X2': 'https://letsencrypt.org/certs/isrg-root-x2.der',
    
    // GlobalSign
    'GlobalSign Root CA': 'http://secure.globalsign.com/cacert/root-r1.crt',
    'GlobalSign Root CA - R2': 'http://secure.globalsign.com/cacert/root-r2.crt',
    'GlobalSign Root CA - R3': 'http://secure.globalsign.com/cacert/root-r3.crt',
    'GlobalSign Root CA - R6': 'http://secure.globalsign.com/cacert/root-r6.crt',
    'GlobalSign ECC Root CA - R4': 'http://secure.globalsign.com/cacert/root-r4.crt',
    'GlobalSign ECC Root CA - R5': 'http://secure.globalsign.com/cacert/root-r5.crt',
    
    // Sectigo (formerly Comodo)
    'AAA Certificate Services': 'http://crt.comodoca.com/AAAcertificateservices.crt',
    'USERTrust RSA Certification Authority': 'http://crt.usertrust.com/USERTrustRSACertificationAuthority.crt',
    'USERTrust ECC Certification Authority': 'http://crt.usertrust.com/USERTrustECCCertificationAuthority.crt',
    'Sectigo Public Server Authentication Root R46': 'http://crt.sectigo.com/SectigoPublicServerAuthenticationRootR46.crt',
    'Sectigo Public Server Authentication Root E46': 'http://crt.sectigo.com/SectigoPublicServerAuthenticationRootE46.crt',
    
    // IdenTrust
    'IdenTrust Commercial Root CA 1': 'http://validation.identrust.com/roots/dstrootcax3.p7c',
    'IdenTrust Public Sector Root CA 1': 'http://validation.identrust.com/roots/dstrootcax3.p7c',
    'DST Root CA X3': 'https://letsencrypt.org/certs/trustid-x3-root.pem.txt',
    
    // Entrust
    'Entrust Root Certification Authority': 'http://web.entrust.com/root-certificates/entrust_root_ca.cer',
    'Entrust Root Certification Authority - G2': 'http://web.entrust.com/root-certificates/entrust_g2_ca.cer',
    'Entrust Root Certification Authority - G4': 'http://web.entrust.com/root-certificates/entrust_g4_ca.cer',
    'Entrust.net Certification Authority (2048)': 'http://web.entrust.com/root-certificates/entrust_2048_ca.cer',
    
    // Baltimore CyberTrust (now DigiCert)
    'Baltimore CyberTrust Root': 'http://cacerts.digicert.com/BaltimoreCyberTrustRoot.crt',
    
    // Amazon Trust Services
    'Amazon Root CA 1': 'https://www.amazontrust.com/repository/AmazonRootCA1.cer',
    'Amazon Root CA 2': 'https://www.amazontrust.com/repository/AmazonRootCA2.cer',
    'Amazon Root CA 3': 'https://www.amazontrust.com/repository/AmazonRootCA3.cer',
    'Amazon Root CA 4': 'https://www.amazontrust.com/repository/AmazonRootCA4.cer',
    'Starfield Services Root Certificate Authority - G2': 'https://www.amazontrust.com/repository/SFSRootCAG2.cer',
    
    // Microsoft
    'Microsoft RSA Root Certificate Authority 2017': 'https://www.microsoft.com/pki/mscorp/cps/MicRooCerAut2011_2011_03_22.crt',
    'Microsoft ECC Root Certificate Authority 2017': 'https://www.microsoft.com/pkiops/certs/MicRooCerAut2011_2011_03_22.crt',
    
    // Google Trust Services
    'GTS Root R1': 'https://pki.goog/repo/certs/gtsr1.der',
    'GTS Root R2': 'https://pki.goog/repo/certs/gtsr2.der',
    'GTS Root R3': 'https://pki.goog/repo/certs/gtsr3.der',
    'GTS Root R4': 'https://pki.goog/repo/certs/gtsr4.der',
    
    // Certum
    'Certum Trusted Network CA': 'http://www.certum.pl/certum_trusted_network_ca.cer',
    'Certum Trusted Network CA 2': 'http://www.certum.pl/certum_trusted_network_ca_2.cer',
    
    // SwissSign
    'SwissSign Gold CA - G2': 'http://www.swisssign.com/download/SwissSign_Gold_CA_-_G2.crt',
    'SwissSign Silver CA - G2': 'http://www.swisssign.com/download/SwissSign_Silver_CA_-_G2.crt',
    
    // QuoVadis
    'QuoVadis Root CA 2': 'http://trust.quovadisglobal.com/qvrca2.crt',
    'QuoVadis Root CA 3': 'http://trust.quovadisglobal.com/qvrca3.crt',
    'QuoVadis Root CA 2 G3': 'http://trust.quovadisglobal.com/qvrca2g3.crt',
    'QuoVadis Root CA 3 G3': 'http://trust.quovadisglobal.com/qvrca3g3.crt'
  };
  
  // Try exact match first
  if (rootCertUrls[issuerCN]) {
    console.log(`Found known root certificate URL for ${issuerCN}`);
    try {
      const url = rootCertUrls[issuerCN];
      const protocol = url.startsWith('https') ? https : http;
      
      return await new Promise((resolve, reject) => {
        protocol.get(url, (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);
              
              // Check if we got valid data
              if (!buffer || buffer.length === 0) {
                reject(new Error('Empty response from CA server'));
                return;
              }
              
              // Check if response is HTML (error page)
              const contentType = response.headers['content-type'] || '';
              if (contentType.includes('text/html')) {
                reject(new Error('Received HTML instead of certificate'));
                return;
              }
              
              const pem = convertDerToPem(buffer);
              resolve(pem);
            } catch (error) {
              reject(new Error(`Failed to process certificate: ${error.message}`));
            }
          });
        }).on('error', reject);
      });
    } catch (error) {
      console.log(`Failed to fetch root from known URL: ${error.message}`);
    }
  }
  
  // Try partial match
  for (const [name, url] of Object.entries(rootCertUrls)) {
    if (issuerCN.includes(name) || name.includes(issuerCN)) {
      console.log(`Trying partial match: ${name}`);
      try {
        const protocol = url.startsWith('https') ? https : http;
        return await new Promise((resolve, reject) => {
          protocol.get(url, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              try {
                const buffer = Buffer.concat(chunks);
                
                // Check if we got valid data
                if (!buffer || buffer.length === 0) {
                  reject(new Error('Empty response from CA server'));
                  return;
                }
                
                // Check if response is HTML (error page)
                const contentType = response.headers['content-type'] || '';
                if (contentType.includes('text/html')) {
                  reject(new Error('Received HTML instead of certificate'));
                  return;
                }
                
                const pem = convertDerToPem(buffer);
                resolve(pem);
              } catch (error) {
                reject(new Error(`Failed to process certificate: ${error.message}`));
              }
            });
          }).on('error', reject);
        });
      } catch (error) {
        console.log(`Failed to fetch from ${url}: ${error.message}`);
      }
    }
  }
  
  return null;
}

app.post('/api/fetch-issuer-chain', async (req, res) => {
  const { leafCertPem } = req.body;

  if (!leafCertPem) {
    return res.status(400).json({
      error: 'Leaf certificate PEM is required',
      message: 'Please provide a leaf certificate to fetch its issuer chain'
    });
  }

  try {
    console.log('Fetching issuer chain for provided leaf certificate');

    // Parse the leaf certificate
    const cert = forge.pki.certificateFromPem(leafCertPem);
    
    // Get Authority Information Access extension
    const aiaExt = cert.getExtension('authorityInfoAccess');
    
    let caIssuersUrl = null;
    
    // Try to get AIA extension first
    if (aiaExt && aiaExt.value) {
      console.log('AIA Extension found:', typeof aiaExt.value);
      
      // Check if value is a string (raw format) or array (parsed format)
      if (typeof aiaExt.value === 'string') {
        // Extract URL from raw string - look for http:// or https://
        const urlMatch = aiaExt.value.match(/https?:\/\/[^\s\x00-\x1f]+\.crt/);
        if (urlMatch) {
          caIssuersUrl = urlMatch[0];
          console.log('Extracted CA Issuers URL from raw string:', caIssuersUrl);
        }
      } else if (Array.isArray(aiaExt.value)) {
        // Parse AIA extension value (structured format)
        for (const accessDescription of aiaExt.value) {
          if (accessDescription.accessMethod === '1.3.6.1.5.5.7.48.2') { // id-ad-caIssuers
            caIssuersUrl = accessDescription.accessLocation.value;
            console.log('Extracted CA Issuers URL from structured format:', caIssuersUrl);
            break;
          }
        }
      }
    }

    // If no AIA extension or no CA Issuers URL, try crt.sh fallback
    if (!caIssuersUrl) {
      console.log('No AIA extension found, trying crt.sh fallback...');
      
      try {
        // Try to fetch from crt.sh
        await fetchChainFromCrtSh(cert);
        
        // If we get here, we found something in crt.sh
        const issuerInfo = getIssuerInfo(cert);
        return res.status(404).json({
          error: 'AIA extension not available',
          message: 'This certificate does not contain an AIA extension. The certificate was found in Certificate Transparency logs, but automatic chain building requires the AIA extension.',
          issuer: issuerInfo,
          suggestion: 'Search for the issuer certificate manually or provide the complete certificate chain.',
          crtShLink: `https://crt.sh/?q=${cert.serialNumber}`
        });
      } catch (crtShError) {
        console.log('crt.sh fallback also failed:', crtShError.message);
        
        // Get issuer information to help user
        const issuerInfo = getIssuerInfo(cert);
        const subjectCN = cert.subject.attributes.find(a => a.shortName === 'CN')?.value || 'Unknown';
        
        return res.status(404).json({
          error: 'Cannot fetch issuer chain automatically',
          message: 'This certificate does not contain an AIA extension and was not found in Certificate Transparency logs.',
          certificate: {
            subject: subjectCN,
            issuer: issuerInfo
          },
          suggestion: 'Please provide the complete certificate chain manually. You can obtain it from the server where this certificate is deployed.',
          help: 'If you know the domain, you can fetch the chain using: openssl s_client -connect domain.com:443 -showcerts'
        });
      }
    }

    console.log(`Found CA Issuers URL: ${caIssuersUrl}`);

    // Fetch the issuer certificate
    const parsedUrl = new URL(caIssuersUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const fetchCert = () => new Promise((resolve, reject) => {
      protocol.get(caIssuersUrl, (response) => {
        const chunks = [];
        
        response.on('data', (chunk) => chunks.push(chunk));
        
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Convert DER to PEM
          const derCert = buffer.toString('binary');
          const pemCert = convertDerToPem(buffer);
          
          resolve(pemCert);
        });
      }).on('error', reject);
    });

    const issuerPem = await fetchCert();
    
    // Now recursively fetch the chain
    const chain = [leafCertPem];
    let currentPem = issuerPem;
    let depth = 0;
    const maxDepth = 10; // Prevent infinite loops

    while (depth < maxDepth) {
      chain.push(currentPem);
      console.log(`Added certificate ${chain.length} to chain`);
      
      try {
        const currentCert = forge.pki.certificateFromPem(currentPem);
        
        // Check if self-signed (root certificate)
        const subject = currentCert.subject.attributes.map(a => `${a.shortName}=${a.value}`).join(',');
        const issuer = currentCert.issuer.attributes.map(a => `${a.shortName}=${a.value}`).join(',');
        
        console.log(`Certificate ${chain.length}:`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Issuer: ${issuer}`);
        
        if (subject === issuer) {
          console.log('✓ Reached self-signed root certificate');
          break;
        }
        
        console.log('  Not self-signed, looking for next issuer...');

        // Try to fetch next issuer
        const nextAiaExt = currentCert.getExtension('authorityInfoAccess');
        if (!nextAiaExt || !nextAiaExt.value) {
          console.log('No more AIA extensions found');
          break;
        }

        let nextCaIssuersUrl = null;
        
        // Parse AIA extension (handle both string and array formats)
        if (typeof nextAiaExt.value === 'string') {
          // Extract URL from raw string
          const urlMatch = nextAiaExt.value.match(/https?:\/\/[^\s\x00-\x1f]+\.crt/);
          if (urlMatch) {
            nextCaIssuersUrl = urlMatch[0];
            console.log('Extracted next CA Issuers URL from raw string:', nextCaIssuersUrl);
          }
        } else if (Array.isArray(nextAiaExt.value)) {
          // Structured format
          for (const accessDescription of nextAiaExt.value) {
            if (accessDescription.accessMethod === '1.3.6.1.5.5.7.48.2') {
              nextCaIssuersUrl = accessDescription.accessLocation.value;
              console.log('Extracted next CA Issuers URL from structured format:', nextCaIssuersUrl);
              break;
            }
          }
        }

        if (!nextCaIssuersUrl) {
          console.log('No more CA Issuers URLs found in AIA extension');
          
          // Try to fetch root certificate from known CA stores
          const issuerCN = currentCert.issuer.attributes.find(a => a.shortName === 'CN')?.value;
          if (issuerCN) {
            console.log(`Trying to fetch root certificate for issuer: ${issuerCN}`);
            try {
              const rootPem = await tryFetchRootCertificate(issuerCN);
              if (rootPem) {
                console.log('✓ Successfully fetched root certificate from known CA store');
                chain.push(rootPem);
                break;
              }
            } catch (error) {
              console.log(`Failed to fetch root certificate: ${error.message}`);
            }
          }
          
          break;
        }

        console.log(`Fetching next issuer from: ${nextCaIssuersUrl}`);
        
        const nextIssuerPem = await new Promise((resolve, reject) => {
          protocol.get(nextCaIssuersUrl, (response) => {
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const buffer = Buffer.concat(chunks);
              resolve(convertDerToPem(buffer));
            });
          }).on('error', reject);
        });

        currentPem = nextIssuerPem;
        depth++;
      } catch (error) {
        console.log('✗ Error fetching next certificate:', error.message);
        console.log('  Stopping chain fetch at depth', depth);
        break;
      }
    }

    if (depth >= maxDepth) {
      console.log(`⚠ Reached maximum depth (${maxDepth}), stopping chain fetch`);
    }

    console.log(`\n✓ Successfully built chain with ${chain.length} certificate(s)`);
    
    // Log final chain summary
    for (let i = 0; i < chain.length; i++) {
      try {
        const c = forge.pki.certificateFromPem(chain[i]);
        const cn = c.subject.attributes.find(a => a.shortName === 'CN')?.value || 'Unknown';
        const isSelfSigned = c.subject.attributes.map(a => `${a.shortName}=${a.value}`).join(',') ===
                            c.issuer.attributes.map(a => `${a.shortName}=${a.value}`).join(',');
        console.log(`  ${i + 1}. ${cn} ${isSelfSigned ? '(ROOT - Self-signed)' : ''}`);
      } catch (e) {
        console.log(`  ${i + 1}. [Parse error]`);
      }
    }

    res.json({
      success: true,
      certificateCount: chain.length,
      fullChainPem: chain.join('\n'),
      certificates: chain
    });

  } catch (error) {
    console.error('Error fetching issuer chain:', error);
    res.status(500).json({
      error: 'Failed to fetch issuer chain',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Certificate Chain Fetcher Backend`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API endpoints:`);
  console.log(`   - POST /api/domain-info - Get domain certificate information`);
  console.log(`   - POST /api/fetch-chain - Fetch chain from server`);
  console.log(`   - POST /api/fetch-issuer-chain - Auto-complete chain from leaf cert\n`);
});

// Made with Bob
