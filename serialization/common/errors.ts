import type { JsonSourceLocation } from "./json_source_index.ts";

export type { JsonSourceLocation };

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
    if ((Error as ErrorConstructor & { captureStackTrace?: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace) {
      (Error as ErrorConstructor & { captureStackTrace: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace(this, SerializationError);
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
    public readonly cause?: Error,
    public readonly source?: JsonSourceLocation,
  ) {
    super(message);
    this.name = "DeserializationError";

    // Maintain proper stack trace in V8 environments
    if ((Error as ErrorConstructor & { captureStackTrace?: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace) {
      (Error as ErrorConstructor & { captureStackTrace: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace(this, DeserializationError);
    }
  }
}

/**
 * Error thrown when a type cannot be found in the TypeRegistry
 */
export class TypeNotFoundError extends DeserializationError {
  constructor(
    public readonly typeName: string,
    data?: string,
    source?: JsonSourceLocation,
  ) {
    super(`Type not found in registry: ${typeName}`, data, undefined, source);
    this.name = "TypeNotFoundError";
    
    // Maintain proper stack trace in V8 environments
    if ((Error as ErrorConstructor & { captureStackTrace?: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace) {
      (Error as ErrorConstructor & { captureStackTrace: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace(this, TypeNotFoundError);
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
    cause?: Error,
    source?: JsonSourceLocation,
  ) {
    super(message, formatString, cause, source);
    this.name = "InvalidFormatError";
    
    // Maintain proper stack trace in V8 environments
    if ((Error as ErrorConstructor & { captureStackTrace?: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace) {
      (Error as ErrorConstructor & { captureStackTrace: (targetObject: object, constructorOpt?: unknown) => void }).captureStackTrace(this, InvalidFormatError);
    }
  }
}
