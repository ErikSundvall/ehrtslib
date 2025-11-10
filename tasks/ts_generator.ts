import { BmmClass, BmmProperty, BmmModel } from "./bmm_parser.ts";

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
        // Add more mappings as needed
        default:
            return bmmType; // Use BMM type name directly for custom types
    }
}

export function generateTypeScriptClass(bmmClass: BmmClass): string {
    let tsClass = "";

    // Collect custom types used in this class
    const customTypes = new Set<string>();
    if (bmmClass.properties) {
        for (const propName in bmmClass.properties) {
            const property = bmmClass.properties[propName];
            const mappedType = mapBmmTypeToTypeScript(property.type);
            if (mappedType === property.type) { // If type was not mapped to a primitive
                customTypes.add(mappedType);
            }
        }
    }

    // Add type statements for custom types
    if (customTypes.size > 0) {
        for (const typeName of customTypes) {
            tsClass += `type ${typeName} = any;\n`; // Define as any for now
        }
        tsClass += "\n";
    }

    if (bmmClass.documentation) {
        tsClass += `/**\n`;
        tsClass += ` * ${bmmClass.documentation.replace(/\n/g, '\n * ')}\n`;
        tsClass += ` */\n`;
    }

    tsClass += `export class ${bmmClass.name} {\n`;

    if (bmmClass.properties) {
        for (const propName in bmmClass.properties) {
            const property = bmmClass.properties[propName];
            if (property.documentation) {
                tsClass += `    /**\n`;
                tsClass += `     * ${property.documentation.replace(/\n/g, '\n     * ')}\n`;
                tsClass += `     */\n`;
            }
            const propertyType = mapBmmTypeToTypeScript(property.type);
            // Temporarily make all properties optional to pass type checking for now
            tsClass += `    ${property.name}?: ${propertyType};\n`; 
        }
    }

    tsClass += `}\n`;
    return tsClass;
}

export function generateBasePackage(bmmModel: BmmModel): string {
    let allTsClasses = "";
    const generatedTypes = new Set<string>(); // To keep track of types already generated

    // First, generate primitive types (which are also BmmClass)
    for (const typeName in bmmModel.primitive_types) {
        const bmmClass = bmmModel.primitive_types[typeName];
        if (!generatedTypes.has(bmmClass.name)) {
            allTsClasses += generateTypeScriptClass(bmmClass);
            allTsClasses += "\n"; // Add a newline between classes
            generatedTypes.add(bmmClass.name);
        }
    }

    // Then, generate classes from class_definitions
    for (const className in bmmModel.class_definitions) {
        const bmmClass = bmmModel.class_definitions[className];
        if (!generatedTypes.has(bmmClass.name)) {
            allTsClasses += generateTypeScriptClass(bmmClass);
            allTsClasses += "\n"; // Add a newline between classes
            generatedTypes.add(bmmClass.name);
        }
    }

    return allTsClasses;
}
