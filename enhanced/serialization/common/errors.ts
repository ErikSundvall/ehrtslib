/**
 * Base error class for serialization-related errors
 */
export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly object?: any,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "SerializationError";
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SerializationError);
    }
  }
}

/**
 * Base error class for deserialization-related errors
 */
export class DeserializationError extends Error {
  constructor(
    message: string,
    public readonly data?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "DeserializationError";
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DeserializationError);
    }
  }
}

/**
 * Error thrown when a type cannot be found in the TypeRegistry
 */
export class TypeNotFoundError extends DeserializationError {
  constructor(
    public readonly typeName: string,
    data?: string
  ) {
    super(`Type not found in registry: ${typeName}`, data);
    this.name = "TypeNotFoundError";
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TypeNotFoundError);
    }
  }
}

/**
 * Error thrown when a terse format string is invalid
 */
export class InvalidFormatError extends DeserializationError {
  constructor(
    message: string,
    public readonly formatString?: string,
    cause?: Error
  ) {
    super(message, formatString, cause);
    this.name = "InvalidFormatError";
    
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidFormatError);
    }
  }
}
