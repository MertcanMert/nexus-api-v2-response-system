/*
  This file is responsible for validating **all environment variables defined in the .env file**
  before the application starts.

  It uses Joi as a schema validation layer to ensure that every configuration value:
  - Exists when required
  - Has the correct data type (string, number, boolean, etc.)
  - Conforms to the expected format and constraints

  Validation is executed during the application bootstrap phase.
  The content of the .env file is read via process.env and validated against a single,
  centralized Joi schema defined in this file.

  If any environment variable is missing, has an invalid type, or contains an unexpected value:
  - A clear and descriptive validation error is thrown
  - The application fails fast and does NOT start

  This guarantees that the application never runs with an invalid or incomplete configuration.

  Benefits:
  - Prevents runtime errors caused by misconfigured environment variables
  - Enforces a single source of truth for configuration validation
  - Improves security by catching missing secrets or invalid URLs early
  - Makes configuration changes explicit and safe

  In short:
  env.validation.ts ensures that the application configuration is valid, predictable,
  and safe before any business logic is executed.
*/

import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application Settings
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().required(),
  GLOBAL_PREFIX: Joi.string().required(),
  FALLBACK_LANGUAGE: Joi.string().valid('tr', 'en').required(),
  I18N_PATH: Joi.string().required(),
});
