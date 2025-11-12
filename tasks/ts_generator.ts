import { BmmClass, BmmProperty, BmmModel } from "./bmm_parser.ts";

export interface TypeResolutionContext {
    localTypes: Set<string>;  // Types defined in current package
    importedPackages: { [alias: string]: Set<string> };  // alias -> set of types from that package
}

// Escape documentation strings for use in JSDoc comments
function escapeDocumentation(doc: string): string {
    return doc
        .replace(/\*\//g, '*\\/') // Escape closing comment markers
        .replace(/`/g, '\\`');     // Escape backticks that could break JSDoc
}

/**
 * Maps BMM type names to TypeScript types.
 * 
 * IMPORTANT: We do NOT map String/Integer/Boolean/Uri/UUID to TypeScript primitives.
 * These are wrapper classes in openEHR that:
 * - Have a `value` property holding the primitive
 * - Include validation logic (e.g., Integer checks Number.isInteger())
 * - Implement BMM-defined methods (e.g., String.is_empty(), Integer.add())
 * - Maintain the openEHR type hierarchy (e.g., Uri extends String)
 * 
 * Only truly numeric types without additional semantics (Double, Real, Character, Octet)
 * are mapped to TypeScript primitives for simplicity.
 * 
 * @param bmmType - The BMM type name
 * @returns The corresponding TypeScript type
 */
function mapBmmTypeToTypeScript(bmmType: string): string {
    switch (bmmType) {
        // Numeric types that are simple wrappers without validation - map to primitives
        case "Double":
        case "Real":
            return "number";
        case "Character":
            return "string";
        case "Octet":
            return "number";
        
        // String, Integer, Boolean, Uri, UUID are kept as wrapper classes
        // They have validation, methods, and maintain type hierarchy
        // case "String": return "string";  // REMOVED - keep as wrapper class
        // case "Integer": return "number"; // REMOVED - keep as wrapper class  
        // case "Boolean": return "boolean"; // REMOVED - keep as wrapper class
        // case "UUID": return "string";    // REMOVED - extends String
        // case "Uri": return "string";     // REMOVED - extends String
        
        // Note: "Any" is NOT mapped to "any" - it's a proper class in openEHR
        // that provides reference equality semantics, not the TypeScript any type
        
        default:
            return bmmType; // Use BMM type name directly for custom types
    }
}

function resolveTypeReference(bmmType: string, context?: TypeResolutionContext): string {
    const mappedType = mapBmmTypeToTypeScript(bmmType);
    
    // If it mapped to a TypeScript primitive, return it
    if (mappedType !== bmmType) {
        return mappedType;
    }
    
    // If no context provided, return as-is (for backward compatibility)
    if (!context) {
        return bmmType;
    }
    
    // Check if it's a local type
    if (context.localTypes.has(bmmType)) {
        return bmmType;
    }
    
    // Check if it's from an imported package
    for (const [alias, types] of Object.entries(context.importedPackages)) {
        if (types.has(bmmType)) {
            return `${alias}.${bmmType}`;
        }
    }
    
    // Unknown type - return as-is (will be treated as 'any' in final type declaration)
    return bmmType;
}

// Check if a type name is valid for TypeScript type declaration
function isValidTypeName(typeName: string | undefined | null): boolean {
    // Filter out null/undefined
    if (!typeName) {
        return false;
    }
    
    // Filter out empty or whitespace-only names
    if (!typeName.trim()) {
        return false;
    }
    
    // Filter out invalid type names
    const invalidNames = ['undefined', 'any', 'unknown', 'never', 'void', 'null'];
    if (invalidNames.includes(typeName.toLowerCase())) {
        return false;
    }
    
    // Allow single-letter generic type parameters (T, U, V, etc.) - they will be declared as 'any'
    // Don't filter them out
    
    return true;
}

/**
 * Helper function to check if a property exists in any ancestor class.
 * Returns the ancestor property if found, undefined otherwise.
 * 
 * This is used to determine if the TypeScript 'override' keyword should be added
 * to a property declaration, which is required when a child class redefines a property
 * from a parent class (either with the same type or a narrower/compatible type).
 * 
 * @param propertyName - The name of the property to check
 * @param bmmClass - The class being generated
 * @param bmmModel - The complete BMM model containing all class definitions
 * @returns The ancestor's property definition if found, undefined otherwise
 */
function findPropertyInAncestors(
    propertyName: string, 
    bmmClass: BmmClass, 
    bmmModel: BmmModel
): BmmProperty | undefined {
    if (!bmmClass.ancestors || bmmClass.ancestors.length === 0) {
        return undefined;
    }
    
    // Check each direct ancestor
    for (const ancestorName of bmmClass.ancestors) {
        // Look up the ancestor class in all possible locations
        const ancestorClass = bmmModel.class_definitions?.[ancestorName] 
            || bmmModel.primitive_types?.[ancestorName];
        
        if (!ancestorClass) {
            continue; // Ancestor not found in this model (might be in another package)
        }
        
        // Check if the property exists in this ancestor
        if (ancestorClass.properties?.[propertyName]) {
            return ancestorClass.properties[propertyName];
        }
        
        // Recursively check this ancestor's ancestors
        const foundInGrandparent = findPropertyInAncestors(propertyName, ancestorClass, bmmModel);
        if (foundInGrandparent) {
            return foundInGrandparent;
        }
    }
    
    return undefined;
}

/**
 * Checks if a BMM class is a primitive wrapper type that needs special handling.
 * These types wrap TypeScript primitives and provide validation and methods.
 * 
 * @param bmmClass - The BMM class to check
 * @returns true if this is a primitive wrapper type
 */
function isPrimitiveWrapperType(bmmClass: BmmClass): boolean {
    const primitiveWrappers = ['String', 'Integer', 'Boolean', 'Integer64', 'Byte'];
    return primitiveWrappers.includes(bmmClass.name);
}

/**
 * Checks if a type name is a primitive wrapper type.
 * 
 * @param typeName - The type name to check
 * @returns true if this is a primitive wrapper type name
 */
function isWrapperTypeName(typeName: string): boolean {
    const primitiveWrappers = ['String', 'Integer', 'Boolean', 'Integer64', 'Byte'];
    return primitiveWrappers.includes(typeName);
}

/**
 * Gets the TypeScript primitive type that corresponds to a wrapper class.
 * 
 * @param wrapperClassName - The wrapper class name (e.g., 'String', 'Integer')
 * @returns The corresponding TypeScript primitive type
 */
function getPrimitiveTypeForWrapper(wrapperClassName: string): string {
    switch (wrapperClassName) {
        case 'String':
            return 'string';
        case 'Integer':
        case 'Integer64':
        case 'Byte':
            return 'number';
        case 'Boolean':
            return 'boolean';
        default:
            return 'any';
    }
}

/**
 * Generates validation code for a primitive wrapper type.
 * This ensures type safety (e.g., Integer validates it's actually an integer).
 * 
 * @param wrapperClassName - The wrapper class name
 * @param valueParam - The parameter name to validate
 * @returns TypeScript code for validation
 */
function generateValidationCode(wrapperClassName: string, valueParam: string): string {
    switch (wrapperClassName) {
        case 'Integer':
        case 'Integer64':
            return `if (${valueParam} !== undefined && ${valueParam} !== null && !Number.isInteger(${valueParam})) {
            throw new Error(\`${wrapperClassName} value must be an integer, got: \${${valueParam}}\`);
        }`;
        case 'Byte':
            return `if (${valueParam} !== undefined && ${valueParam} !== null && (!Number.isInteger(${valueParam}) || ${valueParam} < 0 || ${valueParam} > 255)) {
            throw new Error(\`Byte value must be an integer between 0 and 255, got: \${${valueParam}}\`);
        }`;
        default:
            return ''; // No validation needed for String and Boolean
    }
}

export function generateTypeScriptClass(
    bmmClass: BmmClass, 
    context?: TypeResolutionContext,
    bmmModel?: BmmModel
): string {
    let tsClass = "";

    // Don't add type declarations per class - they'll be added at package level

    if (bmmClass.documentation) {
        const escapedDoc = escapeDocumentation(bmmClass.documentation);
        tsClass += `/**\n`;
        tsClass += ` * ${escapedDoc.replace(/\n/g, '\n * ')}\n`;
        tsClass += ` */\n`;
    }

    // Start building the class declaration
    // Handle abstract classes - TypeScript uses 'abstract' keyword
    const abstractModifier = bmmClass.is_abstract ? "abstract " : "";
    tsClass += `export ${abstractModifier}class ${bmmClass.name}`;
    
    // Add generic parameters if present
    // Generic parameters in BMM are defined in 'generic_parameter_defs'
    // Example: class Container<T extends Any> { ... }
    if (bmmClass.generic_parameter_defs) {
        const genericParams = Object.values(bmmClass.generic_parameter_defs)
            .map(param => {
                // If the generic parameter has a constraint (conforms_to_type),
                // generate it as "T extends ConstraintType", otherwise just "T"
                if (param.conforms_to_type) {
                    const constraintType = resolveTypeReference(param.conforms_to_type, context);
                    return `${param.name} extends ${constraintType}`;
                }
                return param.name;
            })
            .join(", ");
        tsClass += `<${genericParams}>`;
    }
    
    // Add extends clause if the class has ancestors
    // BMM uses 'ancestors' array to specify parent classes
    // In TypeScript, we can only extend one class, so we take the first ancestor
    if (bmmClass.ancestors && bmmClass.ancestors.length > 0) {
        const parentClass = bmmClass.ancestors[0];
        const parentResolved = resolveTypeReference(parentClass, context);
        
        // Check if parent resolves to a TypeScript primitive type
        // TypeScript doesn't allow extending primitive types (string, number, boolean, etc.)
        // If a BMM class extends String/Integer/Boolean (which map to primitives),
        // we skip the extends clause - the class becomes a wrapper type instead
        const primitiveTypes = ['string', 'number', 'boolean'];
        if (!primitiveTypes.includes(parentResolved)) {
            // If the parent class also has generic parameters, we need to apply them
            // For now, we'll check if the parent has generics and use the child's generic params
            const parentBmmClass = bmmModel?.class_definitions?.[parentClass] 
                || bmmModel?.primitive_types?.[parentClass];
            
            if (parentBmmClass?.generic_parameter_defs) {
                // Parent class has generics - apply the child's generic params to match
                // This handles cases like: class Point_interval<T> extends Interval<T>
                const parentGenericParams = Object.keys(parentBmmClass.generic_parameter_defs);
                const childGenericParams = bmmClass.generic_parameter_defs 
                    ? Object.keys(bmmClass.generic_parameter_defs) 
                    : [];
                
                // Map parent generic params to child's (assuming same order/names)
                const appliedParams = parentGenericParams
                    .map((_, i) => childGenericParams[i] || parentGenericParams[i])
                    .join(", ");
                
                tsClass += ` extends ${parentResolved}<${appliedParams}>`;
            } else {
                tsClass += ` extends ${parentResolved}`;
            }
        }
    }
    
    tsClass += ` {\n`;

    // Special handling for primitive wrapper types (String, Integer, Boolean, etc.)
    // These classes wrap TypeScript primitives and provide validation and openEHR semantics
    if (isPrimitiveWrapperType(bmmClass)) {
        const primitiveType = getPrimitiveTypeForWrapper(bmmClass.name);
        const validationCode = generateValidationCode(bmmClass.name, 'val');
        
        // Add the 'value' property that holds the actual primitive value
        tsClass += `    /**\n`;
        tsClass += `     * The underlying primitive value.\n`;
        tsClass += `     */\n`;
        tsClass += `    value?: ${primitiveType};\n\n`;
        
        // Add constructor that accepts a primitive value
        tsClass += `    /**\n`;
        tsClass += `     * Creates a new ${bmmClass.name} instance.\n`;
        tsClass += `     * @param val - The primitive value to wrap\n`;
        tsClass += `     */\n`;
        tsClass += `    constructor(val?: ${primitiveType}) {\n`;
        if (bmmClass.ancestors && bmmClass.ancestors.length > 0) {
            tsClass += `        super();\n`;
        }
        if (validationCode) {
            tsClass += `        ${validationCode}\n`;
        }
        tsClass += `        this.value = val;\n`;
        tsClass += `    }\n\n`;
        
        // Add static factory method for convenient creation
        tsClass += `    /**\n`;
        tsClass += `     * Creates a ${bmmClass.name} instance from a primitive value.\n`;
        tsClass += `     * @param val - The primitive value to wrap\n`;
        tsClass += `     * @returns A new ${bmmClass.name} instance\n`;
        tsClass += `     */\n`;
        tsClass += `    static from(val?: ${primitiveType}): ${bmmClass.name} {\n`;
        tsClass += `        return new ${bmmClass.name}(val);\n`;
        tsClass += `    }\n\n`;
        
        // Add is_equal method implementation for value equality
        tsClass += `    /**\n`;
        tsClass += `     * Compares this ${bmmClass.name} with another for value equality.\n`;
        tsClass += `     * @param other - The object to compare with\n`;
        tsClass += `     * @returns true if the values are equal\n`;
        tsClass += `     */\n`;
        tsClass += `    is_equal(other: any): boolean {\n`;
        tsClass += `        if (other instanceof ${bmmClass.name}) {\n`;
        tsClass += `            return this.value === other.value;\n`;
        tsClass += `        }\n`;
        tsClass += `        return false;\n`;
        tsClass += `    }\n\n`;
    }

    if (bmmClass.properties) {
        for (const propName in bmmClass.properties) {
            const property = bmmClass.properties[propName];
            const propertyType = resolveTypeReference(property.type, context);
            
            // Check if this property overrides an ancestor's property
            const ancestorProperty = bmmModel 
                ? findPropertyInAncestors(propName, bmmClass, bmmModel)
                : undefined;
            
            // Check if the property type is a primitive wrapper (String, Integer, Boolean)
            // Apply dual getter/setter pattern if:
            // 1. Property type is a wrapper type AND
            // 2. Either NOT overriding OR ancestor also had a wrapper type
            const isWrapperProperty = isWrapperTypeName(property.type) && 
                (!ancestorProperty || (ancestorProperty && isWrapperTypeName(ancestorProperty.type)));
            
            if (isWrapperProperty) {
                // Generate dual getter/setter pattern for wrapper types
                // This allows: person.name = "John" (primitive) while maintaining type safety
                
                const primitiveType = getPrimitiveTypeForWrapper(property.type);
                const backingField = `_${property.name}`;
                const overrideModifier = ancestorProperty ? 'override ' : '';
                
                // Only generate the backing field if this is NOT an override
                // Use 'protected' instead of 'private' so derived classes can access it
                if (!ancestorProperty) {
                    // Protected backing field that holds the wrapper instance
                    tsClass += `    /**\n`;
                    tsClass += `     * Internal storage for ${property.name}\n`;
                    tsClass += `     * @protected\n`;
                    tsClass += `     */\n`;
                    tsClass += `    protected ${backingField}?: ${propertyType};\n\n`;
                }
                
                // Default getter returns primitive value (convenient for most use)
                if (property.documentation) {
                    const escapedDoc = escapeDocumentation(property.documentation);
                    tsClass += `    /**\n`;
                    tsClass += `     * ${escapedDoc.replace(/\n/g, '\n     * ')}\n`;
                    tsClass += `     */\n`;
                }
                tsClass += `    ${overrideModifier}get ${property.name}(): ${primitiveType} | undefined {\n`;
                tsClass += `        return this.${backingField}?.value;\n`;
                tsClass += `    }\n\n`;
                
                // Typed getter with $ prefix returns wrapper (for accessing methods)
                tsClass += `    /**\n`;
                tsClass += `     * Gets the ${propertyType} wrapper object for ${property.name}.\n`;
                tsClass += `     * Use this to access ${propertyType} methods.\n`;
                tsClass += `     */\n`;
                tsClass += `    ${overrideModifier}get $${property.name}(): ${propertyType} | undefined {\n`;
                tsClass += `        return this.${backingField};\n`;
                tsClass += `    }\n\n`;
                
                // Setter accepts both primitive and wrapper
                tsClass += `    /**\n`;
                tsClass += `     * Sets ${property.name} from either a primitive value or ${propertyType} wrapper.\n`;
                tsClass += `     */\n`;
                tsClass += `    ${overrideModifier}set ${property.name}(val: ${primitiveType} | ${propertyType} | undefined) {\n`;
                tsClass += `        if (val === undefined || val === null) {\n`;
                tsClass += `            this.${backingField} = undefined;\n`;
                tsClass += `        } else if (typeof val === '${primitiveType}') {\n`;
                tsClass += `            this.${backingField} = ${propertyType}.from(val);\n`;
                tsClass += `        } else {\n`;
                tsClass += `            this.${backingField} = val;\n`;
                tsClass += `        }\n`;
                tsClass += `    }\n\n`;
            } else {
                // Standard property generation for non-wrapper types
                if (property.documentation) {
                    const escapedDoc = escapeDocumentation(property.documentation);
                    tsClass += `    /**\n`;
                    tsClass += `     * ${escapedDoc.replace(/\n/g, '\n     * ')}\n`;
                    tsClass += `     */\n`;
                }
                
                let propertyDecl = `    `;
                
                if (ancestorProperty) {
                    // Add 'override' keyword for properties that override ancestor properties
                    propertyDecl += `override `;
                }
                
                propertyDecl += `${property.name}?: ${propertyType}`;
                
                // Add initializer for override properties that change the type
                // TypeScript requires an initializer when narrowing types in overrides
                // (e.g., LOCATABLE_REF.id narrows OBJECT_ID to UID_BASED_ID)
                if (ancestorProperty && ancestorProperty.type !== property.type) {
                    propertyDecl += ` = undefined`;
                }
                
                propertyDecl += `;\n`;
                tsClass += propertyDecl;
            }
        }
    }

    // Generate BMM-defined methods from the functions section
    // These are methods like String.is_empty(), Integer.add(), etc.
    if (bmmClass.functions) {
        for (const funcName in bmmClass.functions) {
            const func = bmmClass.functions[funcName];
            
            // Add documentation if available
            if (func.documentation) {
                const escapedDoc = escapeDocumentation(func.documentation);
                tsClass += `    /**\n`;
                tsClass += `     * ${escapedDoc.replace(/\n/g, '\n     * ')}\n`;
                
                // Add parameter documentation
                if (func.parameters) {
                    for (const paramName in func.parameters) {
                        const param = func.parameters[paramName];
                        tsClass += `     * @param ${paramName} - ${param.documentation || 'Parameter'}\n`;
                    }
                }
                
                // Add return documentation
                if (func.result) {
                    tsClass += `     * @returns Result value\n`;
                }
                
                tsClass += `     */\n`;
            }
            
            // Build parameter list
            // Sanitize parameter names: replace hyphens with underscores for valid JavaScript identifiers
            let params = '';
            if (func.parameters) {
                const paramList = Object.keys(func.parameters).map(paramName => {
                    const param = func.parameters![paramName];
                    const paramType = resolveTypeReference(param.type, context);
                    // Replace hyphens and other invalid characters with underscores
                    const sanitizedName = paramName.replace(/[^a-zA-Z0-9_$]/g, '_');
                    return `${sanitizedName}: ${paramType}`;
                });
                params = paramList.join(', ');
            }
            
            // Determine return type
            let returnType = 'void';
            if (func.result) {
                returnType = resolveTypeReference(func.result.type, context);
            }
            
            // Generate method signature - mark as abstract if specified
            const abstractPrefix = func.is_abstract ? 'abstract ' : '';
            tsClass += `    ${abstractPrefix}${funcName}(${params}): ${returnType}`;
            
            // For abstract methods, just add semicolon
            // For concrete methods, add stub implementation marked as TODO
            if (func.is_abstract) {
                tsClass += `;\n\n`;
            } else {
                tsClass += ` {\n`;
                tsClass += `        // TODO: Implement ${funcName} behavior\n`;
                tsClass += `        // This will be covered in Phase 3 (see ROADMAP.md)\n`;
                tsClass += `        throw new Error("Method ${funcName} not yet implemented.");\n`;
                tsClass += `    }\n\n`;
            }
        }
    }

    tsClass += `}\n`;
    return tsClass;
}

export function generateBasePackage(
    bmmModel: BmmModel, 
    context?: TypeResolutionContext
): string {
    const generatedTypes = new Set<string>(); // To keep track of types already generated

    // Build local types set from this model if no context provided
    if (!context) {
        const localTypes = new Set<string>();
        for (const typeName in bmmModel.primitive_types) {
            localTypes.add(bmmModel.primitive_types[typeName].name);
        }
        for (const className in bmmModel.class_definitions) {
            localTypes.add(bmmModel.class_definitions[className].name);
        }
        context = { localTypes, importedPackages: {} };
    }

    // Collect all unknown types used across all classes in this package
    const unknownTypes = new Set<string>();
    
    const allClasses = [
        ...Object.values(bmmModel.primitive_types || {}),
        ...Object.values(bmmModel.class_definitions || {})
    ];
    
    for (const bmmClass of allClasses) {
        if (bmmClass.properties) {
            for (const propName in bmmClass.properties) {
                const property = bmmClass.properties[propName];
                const resolvedType = resolveTypeReference(property.type, context);
                const mappedType = mapBmmTypeToTypeScript(property.type);
                
                // If it's not a primitive, not resolved to an import, and not local
                if (mappedType === property.type && resolvedType === property.type) {
                    if (!context.localTypes.has(property.type) && isValidTypeName(property.type)) {
                        unknownTypes.add(property.type);
                    }
                }
            }
        }
    }

    // Generate type declarations for unknown types at the top
    let allTsClasses = "";
    if (unknownTypes.size > 0) {
        allTsClasses += "// Unknown types - defined as 'any' for now\n";
        const sortedUnknownTypes = Array.from(unknownTypes).sort();
        for (const typeName of sortedUnknownTypes) {
            allTsClasses += `type ${typeName} = any;\n`;
        }
        allTsClasses += "\n";
    }

    // Topologically sort classes so base classes are generated before derived classes
    // This prevents "Cannot access 'X' before initialization" errors
    // (allClasses is already declared above when collecting unknown types)
    
    /**
     * Perform a topological sort of classes based on inheritance.
     * Classes with no ancestors come first, followed by classes that depend on them.
     * This ensures base classes are defined before derived classes in the output.
     */
    function topologicalSort(classes: BmmClass[]): BmmClass[] {
        const sorted: BmmClass[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const classMap = new Map<string, BmmClass>();
        
        // Build a map for quick lookup
        for (const cls of classes) {
            classMap.set(cls.name, cls);
        }
        
        function visit(className: string) {
            if (visited.has(className)) return;
            if (visiting.has(className)) {
                // Circular dependency - just continue (shouldn't happen in well-formed BMM)
                return;
            }
            
            const cls = classMap.get(className);
            if (!cls) return; // Class not in this package
            
            visiting.add(className);
            
            // Visit ancestors first (dependencies)
            if (cls.ancestors) {
                for (const ancestor of cls.ancestors) {
                    visit(ancestor);
                }
            }
            
            visiting.delete(className);
            visited.add(className);
            sorted.push(cls);
        }
        
        // Visit all classes
        for (const cls of classes) {
            visit(cls.name);
        }
        
        return sorted;
    }
    
    const sortedClasses = topologicalSort(allClasses);
    
    // Generate classes in dependency order
    for (const bmmClass of sortedClasses) {
        if (!generatedTypes.has(bmmClass.name)) {
            allTsClasses += generateTypeScriptClass(bmmClass, context, bmmModel);
            allTsClasses += "\n"; // Add a newline between classes
            generatedTypes.add(bmmClass.name);
        }
    }

    return allTsClasses;
}
