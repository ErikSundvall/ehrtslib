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

function mapBmmTypeToTypeScript(bmmType: string): string {
    switch (bmmType) {
        case "String":
            return "string";
        case "Integer":
            return "number";
        case "Boolean":
            return "boolean";
        case "Double":
            return "number";
        case "Real":
            return "number";
        case "Character":
            return "string";
        case "Octet":
            return "number"; // Or Uint8Array, depending on desired representation
        case "UUID":
            return "string";
        case "Uri":
            return "string";
        // Note: "Any" is NOT mapped to "any" - it's a proper class in openEHR
        // that provides reference equality semantics, not the TypeScript any type
        // Add more mappings as needed
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

    if (bmmClass.properties) {
        for (const propName in bmmClass.properties) {
            const property = bmmClass.properties[propName];
            if (property.documentation) {
                const escapedDoc = escapeDocumentation(property.documentation);
                tsClass += `    /**\n`;
                tsClass += `     * ${escapedDoc.replace(/\n/g, '\n     * ')}\n`;
                tsClass += `     */\n`;
            }
            
            const propertyType = resolveTypeReference(property.type, context);
            
            // Check if this property overrides an ancestor's property
            // The 'override' keyword is required in TypeScript when a derived class
            // redefines a property from a base class to maintain type safety
            const ancestorProperty = bmmModel 
                ? findPropertyInAncestors(propName, bmmClass, bmmModel)
                : undefined;
            
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
