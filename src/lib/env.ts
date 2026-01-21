/**
 * Environment Variable Validation and Management
 * 
 * Validates required environment variables at startup
 * Provides type-safe access to environment variables
 * Ensures no hardcoded secrets in codebase
 */

import { logger } from './logger';

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  NODE_ENV: 'development',
  LOG_LEVEL: 'INFO',
  RATE_LIMIT_MAX: '100',
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  MAX_REQUEST_SIZE: '10485760', // 10MB
  SESSION_MAX_AGE: '86400', // 24 hours
  ALLOWED_ORIGINS: 'http://localhost:3000',
} as const;

/**
 * Sensitive environment variables (never log these)
 */
const SENSITIVE_ENV_VARS = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'AUTH0_CLIENT_SECRET',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_SECRET',
  'SENDGRID_API_KEY',
  'TWILIO_AUTH_TOKEN',
] as const;

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  // Database
  MONGODB_URI: string;

  // Authentication
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  AUTH0_CLIENT_ID?: string;
  AUTH0_CLIENT_SECRET?: string;
  AUTH0_ISSUER?: string;

  // AI
  GOOGLE_GENERATIVE_AI_API_KEY?: string;

  // File Storage
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;

  // Payment
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;

  // Email
  SENDGRID_API_KEY?: string;
  SENDER_EMAIL?: string;

  // SMS
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;

  // Application
  NODE_ENV: string;
  LOG_LEVEL: string;
  RATE_LIMIT_MAX: string;
  RATE_LIMIT_WINDOW_MS: string;
  MAX_REQUEST_SIZE: string;
  SESSION_MAX_AGE: string;
  ALLOWED_ORIGINS: string;
}

/**
 * Check if an environment variable is sensitive
 */
function isSensitiveEnvVar(key: string): boolean {
  return SENSITIVE_ENV_VARS.includes(key as typeof SENSITIVE_ENV_VARS[number]);
}

/**
 * Validate required environment variables
 */
function validateRequiredEnvVars(): string[] {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}

/**
 * Get environment configuration with validation
 */
export function getEnvConfig(): EnvConfig {
  // Validate required variables
  const missing = validateRequiredEnvVars();

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error('Environment validation failed', new Error(error));
    throw new Error(error);
  }

  // Build configuration object
  const config: Record<string, string | undefined> = {};

  // Add required variables
  for (const varName of REQUIRED_ENV_VARS) {
    config[varName] = process.env[varName];
  }

  // Add optional variables with defaults
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    config[varName] = process.env[varName] || defaultValue;
  }

  // Add all other environment variables
  for (const key in process.env) {
    if (!config[key] && process.env[key]) {
      config[key] = process.env[key];
    }
  }

  return config as unknown as EnvConfig;
}

/**
 * Safely log environment configuration (redacts sensitive values)
 */
export function logEnvConfig(): void {
  const config = getEnvConfig();
  const safeConfig: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (isSensitiveEnvVar(key)) {
      safeConfig[key] = '[REDACTED]';
    } else {
      safeConfig[key] = value;
    }
  }

  logger.info('Environment configuration loaded', safeConfig);
}

/**
 * Get a required environment variable (throws if missing)
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    const error = `Required environment variable missing: ${key}`;
    logger.error(error);
    throw new Error(error);
  }

  return value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get database URI (with validation)
 */
export function getDatabaseUri(): string {
  const uri = getRequiredEnv('MONGODB_URI');

  // Validate format
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('Invalid MONGODB_URI format');
  }

  return uri;
}

/**
 * Get NextAuth configuration
 */
export function getNextAuthConfig() {
  return {
    secret: getRequiredEnv('NEXTAUTH_SECRET'),
    url: getRequiredEnv('NEXTAUTH_URL'),
  };
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  return {
    max: parseInt(getOptionalEnv('RATE_LIMIT_MAX', '100'), 10),
    windowMs: parseInt(getOptionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  };
}

/**
 * Get allowed origins for CORS
 */
export function getAllowedOrigins(): string[] {
  const origins = getOptionalEnv('ALLOWED_ORIGINS', 'http://localhost:3000');
  return origins.split(',').map(o => o.trim());
}

/**
 * Validate environment at startup
 */
export function validateEnvironment(): void {
  try {
    getEnvConfig();
    logEnvConfig();
    logger.info('Environment validation passed');
  } catch (error) {
    logger.error('Environment validation failed', error);
    throw error;
  }
}

// Validate on import (fail fast if misconfigured)
if (typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('FATAL: Environment validation failed. Application cannot start.', error);
    process.exit(1);
  }
}

const env = {
  getEnvConfig,
  getRequiredEnv,
  getOptionalEnv,
  isProduction,
  isDevelopment,
  getDatabaseUri,
  getNextAuthConfig,
  getRateLimitConfig,
  getAllowedOrigins,
  validateEnvironment,
};

export default env;
