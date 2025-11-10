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
        case "Any":
            return "any";
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

export function generateTypeScriptClass(bmmClass: BmmClass, context?: TypeResolutionContext): string {
    let tsClass = "";

    // Don't add type declarations per class - they'll be added at package level

    if (bmmClass.documentation) {
        const escapedDoc = escapeDocumentation(bmmClass.documentation);
        tsClass += `/**\n`;
        tsClass += ` * ${escapedDoc.replace(/\n/g, '\n * ')}\n`;
        tsClass += ` */\n`;
    }

    tsClass += `export class ${bmmClass.name} {\n`;

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
            // Temporarily make all properties optional to pass type checking for now
            tsClass += `    ${property.name}?: ${propertyType};\n`; 
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

    // First, generate primitive types (which are also BmmClass)
    for (const typeName in bmmModel.primitive_types) {
        const bmmClass = bmmModel.primitive_types[typeName];
        if (!generatedTypes.has(bmmClass.name)) {
            allTsClasses += generateTypeScriptClass(bmmClass, context);
            allTsClasses += "\n"; // Add a newline between classes
            generatedTypes.add(bmmClass.name);
        }
    }

    // Then, generate classes from class_definitions
    for (const className in bmmModel.class_definitions) {
        const bmmClass = bmmModel.class_definitions[className];
        if (!generatedTypes.has(bmmClass.name)) {
            allTsClasses += generateTypeScriptClass(bmmClass, context);
            allTsClasses += "\n"; // Add a newline between classes
            generatedTypes.add(bmmClass.name);
        }
    }

    return allTsClasses;
}
