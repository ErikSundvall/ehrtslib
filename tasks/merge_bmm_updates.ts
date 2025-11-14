// tasks/merge_bmm_updates.ts
//
// Utility to assist in merging BMM updates into enhanced files.
// Reads a comparison report and generates TODO comments and stubs.
//
// Usage:
//   deno run --allow-read --allow-write tasks/merge_bmm_updates.ts <comparison_file> <enhanced_file>
//
// Example:
//   deno run --allow-read --allow-write tasks/merge_bmm_updates.ts \
//     bmm_comparison_openehr_base_1.2.0_to_1.3.0.md \
//     enhanced/openehr_base.ts
//
// This tool will:
// 1. Parse the comparison report
// 2. Read the enhanced file
// 3. Add TODO comments for new classes/methods
// 4. Insert stub implementations where needed
// 5. Save a backup of the original file
//
// Note: This is semi-automatic. Manual review and testing is still required!

interface Change {
    type: "addClass" | "addMethod" | "addProperty" | "modifyMethod" | "modifyProperty" | "removeClass" | "removeMethod" | "removeProperty";
    className?: string;
    memberName?: string;
    description?: string;
}

async function parseComparisonReport(reportPath: string): Promise<Change[]> {
    const content = await Deno.readTextFile(reportPath);
    const changes: Change[] = [];
    
    const lines = content.split('\n');
    let currentClass: string | undefined;
    let currentSection: string | undefined;
    
    for (const line of lines) {
        // Detect class headers (### ClassName)
        if (line.startsWith('### ')) {
            currentClass = line.substring(4).trim();
            continue;
        }
        
        // Detect section headers
        if (line.includes('**Added Classes')) {
            currentSection = 'addClass';
            currentClass = undefined;
            continue;
        } else if (line.includes('**Added Properties')) {
            currentSection = 'addProperty';
            continue;
        } else if (line.includes('**Added Methods')) {
            currentSection = 'addMethod';
            continue;
        } else if (line.includes('**Modified Properties')) {
            currentSection = 'modifyProperty';
            continue;
        } else if (line.includes('**Modified Methods')) {
            currentSection = 'modifyMethod';
            continue;
        } else if (line.includes('**Removed Properties')) {
            currentSection = 'removeProperty';
            continue;
        } else if (line.includes('**Removed Methods')) {
            currentSection = 'removeMethod';
            continue;
        } else if (line.includes('**Removed Classes')) {
            currentSection = 'removeClass';
            currentClass = undefined;
            continue;
        }
        
        // Parse list items
        if (line.trim().startsWith('- `') && currentSection) {
            const match = line.match(/- `([^`]+)`/);
            if (match) {
                const item = match[1];
                
                if (currentSection === 'addClass') {
                    changes.push({
                        type: 'addClass',
                        className: item,
                        description: line
                    });
                } else if (currentSection === 'removeClass') {
                    changes.push({
                        type: 'removeClass',
                        className: item,
                        description: line
                    });
                } else if (currentClass) {
                    // It's a member of a class
                    const memberName = item.replace(/\(\)$/, ''); // Remove () from methods
                    changes.push({
                        type: currentSection as any,
                        className: currentClass,
                        memberName,
                        description: line
                    });
                }
            }
        }
    }
    
    return changes;
}

function generateTodoComments(changes: Change[]): string {
    let output = '\n// ============================================\n';
    output += '// TODO: BMM Update Required\n';
    output += `// Generated: ${new Date().toISOString()}\n`;
    output += '// ============================================\n\n';
    
    const addedClasses = changes.filter(c => c.type === 'addClass');
    const modifiedClasses = new Map<string, Change[]>();
    const removedClasses = changes.filter(c => c.type === 'removeClass');
    
    // Group modifications by class
    for (const change of changes) {
        if (change.className && change.type !== 'addClass' && change.type !== 'removeClass') {
            if (!modifiedClasses.has(change.className)) {
                modifiedClasses.set(change.className, []);
            }
            modifiedClasses.get(change.className)!.push(change);
        }
    }
    
    if (addedClasses.length > 0) {
        output += '// NEW CLASSES TO ADD:\n';
        for (const change of addedClasses) {
            output += `// - ${change.className}\n`;
            output += `//   Action: Copy class stub from /generated and implement\n`;
        }
        output += '\n';
    }
    
    if (modifiedClasses.size > 0) {
        output += '// CLASSES TO UPDATE:\n';
        for (const [className, classChanges] of modifiedClasses) {
            output += `// ${className}:\n`;
            for (const change of classChanges) {
                if (change.type === 'addProperty') {
                    output += `//   - Add property: ${change.memberName}\n`;
                } else if (change.type === 'addMethod') {
                    output += `//   - Add method: ${change.memberName}()\n`;
                } else if (change.type === 'modifyProperty') {
                    output += `//   - Update property: ${change.memberName} (type changed)\n`;
                } else if (change.type === 'modifyMethod') {
                    output += `//   - Update method: ${change.memberName}() (signature changed)\n`;
                } else if (change.type === 'removeProperty') {
                    output += `//   - Consider removing property: ${change.memberName}\n`;
                } else if (change.type === 'removeMethod') {
                    output += `//   - Consider removing method: ${change.memberName}()\n`;
                }
            }
            output += '\n';
        }
    }
    
    if (removedClasses.length > 0) {
        output += '// CLASSES REMOVED FROM BMM:\n';
        for (const change of removedClasses) {
            output += `// - ${change.className}\n`;
            output += `//   Action: Consider deprecating or removing\n`;
        }
        output += '\n';
    }
    
    output += '// After making changes:\n';
    output += '// 1. Remove these TODO comments\n';
    output += '// 2. Update file header with new BMM version\n';
    output += '// 3. Run tests: deno test\n';
    output += '// 4. Verify backward compatibility\n';
    output += '// ============================================\n\n';
    
    return output;
}

// Main execution
if (import.meta.main) {
    const args = Deno.args;
    
    if (args.length < 2) {
        console.error("Usage: deno run --allow-read --allow-write tasks/merge_bmm_updates.ts <comparison_file> <enhanced_file>");
        console.error("\nExample:");
        console.error("  deno run --allow-read --allow-write tasks/merge_bmm_updates.ts \\");
        console.error("    bmm_comparison_openehr_base_1.2.0_to_1.3.0.md \\");
        console.error("    enhanced/openehr_base.ts");
        Deno.exit(1);
    }
    
    const comparisonFile = args[0];
    const enhancedFile = args[1];
    
    console.log(`Reading comparison report: ${comparisonFile}`);
    const changes = await parseComparisonReport(comparisonFile);
    
    console.log(`Found ${changes.length} changes to process`);
    
    if (changes.length === 0) {
        console.log("No changes found. Enhanced file is up to date!");
        Deno.exit(0);
    }
    
    console.log("\nReading enhanced file:", enhancedFile);
    const enhancedContent = await Deno.readTextFile(enhancedFile);
    
    // Create backup
    const backupFile = `${enhancedFile}.backup.${Date.now()}`;
    await Deno.writeTextFile(backupFile, enhancedContent);
    console.log(`Created backup: ${backupFile}`);
    
    // Generate TODO comments
    const todoComments = generateTodoComments(changes);
    
    // Insert TODO comments after the file header
    const lines = enhancedContent.split('\n');
    let insertIndex = 0;
    
    // Find the end of the header (first line after comments that's not a comment or import)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('import')) {
            insertIndex = i;
            break;
        }
    }
    
    lines.splice(insertIndex, 0, todoComments);
    const updatedContent = lines.join('\n');
    
    // Write updated file
    await Deno.writeTextFile(enhancedFile, updatedContent);
    
    console.log(`\n✅ Updated ${enhancedFile} with TODO comments`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the TODO comments in ${enhancedFile}`);
    console.log(`2. Copy relevant stubs from /generated if needed`);
    console.log(`3. Implement new methods and properties`);
    console.log(`4. Update modified signatures`);
    console.log(`5. Run tests: deno test`);
    console.log(`6. Remove TODO comments once changes are complete`);
    console.log(`\nIf you need to revert: cp ${backupFile} ${enhancedFile}`);
}
