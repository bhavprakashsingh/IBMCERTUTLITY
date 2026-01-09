// API Configuration
// This file centralizes API endpoint configuration for production deployment

// @ts-ignore - Vite env variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  FETCH_CHAIN: `${API_BASE_URL}/api/fetch-chain`,
  DOMAIN_INFO: `${API_BASE_URL}/api/domain-info`,
  FETCH_ISSUER_CHAIN: `${API_BASE_URL}/api/fetch-issuer-chain`,
};

export default API_ENDPOINTS;

// Made with Bob
