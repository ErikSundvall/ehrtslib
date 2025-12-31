/**
 * TypeRegistry provides a bidirectional mapping between openEHR type names
 * and TypeScript class constructors. This is essential for deserialization
 * where we need to instantiate the correct class based on type information
 * in the serialized data (e.g., _type field in JSON or xsi:type in XML).
 */
export class TypeRegistry {
  private static typeNameToConstructor = new Map<string, new () => any>();
  private static constructorToTypeName = new Map<new () => any, string>();
  private static instanceToTypeName = new WeakMap<object, string>();
  
  /**
   * Register a class with its openEHR type name
   * @param typeName - The openEHR type name (e.g., "COMPOSITION", "DV_TEXT")
   * @param constructor - The class constructor
   */
  static register(typeName: string, constructor: new () => any): void {
    this.typeNameToConstructor.set(typeName, constructor);
    this.constructorToTypeName.set(constructor, typeName);
  }
  
  /**
   * Get constructor for a type name
   * @param typeName - The openEHR type name
   * @returns The constructor function or undefined if not found
   */
  static getConstructor(typeName: string): (new () => any) | undefined {
    return this.typeNameToConstructor.get(typeName);
  }
  
  /**
   * Get type name for a constructor
   * @param constructor - The class constructor
   * @returns The type name or undefined if not found
   */
  static getTypeName(constructor: new () => any): string | undefined {
    return this.constructorToTypeName.get(constructor);
  }
  
  /**
   * Get type name from an object instance
   * @param obj - The object instance
   * @returns The type name or undefined if not found
   */
  static getTypeNameFromInstance(obj: any): string | undefined {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }
    
    // Check if we have a cached type name for this instance
    const cached = this.instanceToTypeName.get(obj);
    if (cached) {
      return cached;
    }
    
    // Try to get from constructor
    const typeName = this.constructorToTypeName.get(obj.constructor);
    if (typeName) {
      // Cache it for faster future lookups
      this.instanceToTypeName.set(obj, typeName);
      return typeName;
    }
    
    // Try to get from constructor.name (as fallback, uppercase)
    if (obj.constructor && obj.constructor.name) {
      return obj.constructor.name.toUpperCase();
    }
    
    return undefined;
  }
  
  /**
   * Check if a type is registered
   * @param typeName - The openEHR type name
   * @returns true if the type is registered
   */
  static hasType(typeName: string): boolean {
    return this.typeNameToConstructor.has(typeName);
  }
  
  /**
   * Get all registered type names
   * @returns Array of all registered type names
   */
  static getAllTypeNames(): string[] {
    return Array.from(this.typeNameToConstructor.keys());
  }
  
  /**
   * Clear all registrations (useful for testing)
   */
  static clear(): void {
    this.typeNameToConstructor.clear();
    this.constructorToTypeName.clear();
  }
  
  /**
   * Register all classes from a module
   * Scans the module exports and registers all classes that appear to be RM types
   * @param moduleExports - The module exports object (e.g., import * as rm from './openehr_rm.ts')
   * @throws Error if moduleExports contains values that are not functions with prototypes (class constructors)
   */
  static registerModule(moduleExports: Record<string, any>): void {
    for (const [name, value] of Object.entries(moduleExports)) {
      // Check if it's a function with prototype (class constructor)
      if (typeof value === 'function' && value.prototype) {
        // Register using the exported name as the type name
        this.register(name, value);
      } else {
        // Throw error for non-class exports to catch module import issues early
        throw new Error(
          `Cannot register '${name}': expected a class constructor but got ${typeof value}. ` +
          `Only class constructors can be registered. ` +
          `If importing from a module, ensure it exports only class definitions. ` +
          `Example: import * as rm from './openehr_rm.ts' where openehr_rm.ts exports only classes.`
        );
      }
    }
  }
}
