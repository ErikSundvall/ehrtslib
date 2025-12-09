/**
 * Basic COMPOSITION Example
 * 
 * This example demonstrates how to manually create an openEHR COMPOSITION
 * object tree for recording blood pressure using ehrtslib.
 * 
 * Note: This is a manual construction approach. Future phases will add
 * template-based validation and simplified creation methods via the AM package.
 */

import * as openehr_rm from "../openehr_rm.ts";
import * as openehr_base from "../openehr_base.ts";

/**
 * Create a simple blood pressure COMPOSITION
 * 
 * This creates a COMPOSITION containing an OBSERVATION for blood pressure
 * with systolic and diastolic values.
 */
function createBloodPressureComposition(): openehr_rm.COMPOSITION {
  // Create the root COMPOSITION
  const composition = new openehr_rm.COMPOSITION();
  
  // Set basic COMPOSITION properties
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  
  // Set name
  const compositionName = new openehr_rm.DV_TEXT();
  compositionName.value = "Blood Pressure Recording";
  composition.name = compositionName;
  
  // Set UID
  const uid = new openehr_base.OBJECT_VERSION_ID();
  uid.value = "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1";
  composition.uid = uid;
  
  // Set language
  const language = new openehr_base.CODE_PHRASE();
  const languageTermId = new openehr_base.TERMINOLOGY_ID();
  languageTermId.value = "ISO_639-1";
  language.terminology_id = languageTermId;
  language.code_string = "en";
  composition.language = language;
  
  // Set territory
  const territory = new openehr_base.CODE_PHRASE();
  const territoryTermId = new openehr_base.TERMINOLOGY_ID();
  territoryTermId.value = "ISO_3166-1";
  territory.terminology_id = territoryTermId;
  territory.code_string = "GB";
  composition.territory = territory;
  
  // Set category (event = 433)
  const category = new openehr_rm.DV_CODED_TEXT();
  category.value = "event";
  const categoryCode = new openehr_base.CODE_PHRASE();
  const categoryTermId = new openehr_base.TERMINOLOGY_ID();
  categoryTermId.value = "openehr";
  categoryCode.terminology_id = categoryTermId;
  categoryCode.code_string = "433";
  category.defining_code = categoryCode;
  composition.category = category;
  
  // Set composer (the person who created this composition)
  const composer = new openehr_rm.PARTY_IDENTIFIED();
  const composerName = new openehr_rm.DV_TEXT();
  composerName.value = "Dr. Smith";
  composer.name = composerName;
  composition.composer = composer;
  
  // Set archetype_details
  const archetypeDetails = new openehr_rm.ARCHETYPED();
  const archetypeId = new openehr_base.ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-COMPOSITION.encounter.v1";
  archetypeDetails.archetype_id = archetypeId;
  archetypeDetails.rm_version = "1.1.0";
  composition.archetype_details = archetypeDetails;
  
  // Create context
  const context = new openehr_rm.EVENT_CONTEXT();
  const startTime = new openehr_rm.DV_DATE_TIME();
  startTime.value = "2024-12-08T14:30:00";
  context.start_time = startTime;
  
  const setting = new openehr_rm.DV_CODED_TEXT();
  setting.value = "other care";
  const settingCode = new openehr_base.CODE_PHRASE();
  const settingTermId = new openehr_base.TERMINOLOGY_ID();
  settingTermId.value = "openehr";
  settingCode.terminology_id = settingTermId;
  settingCode.code_string = "238";
  setting.defining_code = settingCode;
  context.setting = setting;
  
  composition.context = context;
  
  // Create the blood pressure OBSERVATION
  const observation = createBloodPressureObservation();
  
  // Add observation to composition content
  composition.content = [observation];
  
  return composition;
}

/**
 * Create a blood pressure OBSERVATION
 */
function createBloodPressureObservation(): openehr_rm.OBSERVATION {
  const observation = new openehr_rm.OBSERVATION();
  
  observation.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  
  // Set name
  const name = new openehr_rm.DV_TEXT();
  name.value = "Blood Pressure";
  observation.name = name;
  
  // Set language
  const language = new openehr_base.CODE_PHRASE();
  const languageTermId = new openehr_base.TERMINOLOGY_ID();
  languageTermId.value = "ISO_639-1";
  language.terminology_id = languageTermId;
  language.code_string = "en";
  observation.language = language;
  
  // Set encoding
  const encoding = new openehr_base.CODE_PHRASE();
  const encodingTermId = new openehr_base.TERMINOLOGY_ID();
  encodingTermId.value = "IANA_character-sets";
  encoding.terminology_id = encodingTermId;
  encoding.code_string = "UTF-8";
  observation.encoding = encoding;
  
  // Set subject
  const subject = new openehr_rm.PARTY_SELF();
  observation.subject = subject;
  
  // Create HISTORY for the data
  const history = new openehr_rm.HISTORY();
  history.archetype_node_id = "at0001";
  
  const historyName = new openehr_rm.DV_TEXT();
  historyName.value = "Event Series";
  history.name = historyName;
  
  const origin = new openehr_rm.DV_DATE_TIME();
  origin.value = "2024-12-08T14:30:00";
  history.origin = origin;
  
  // Create POINT_EVENT for a single measurement
  const event = new openehr_rm.POINT_EVENT();
  event.archetype_node_id = "at0002";
  
  const eventName = new openehr_rm.DV_TEXT();
  eventName.value = "Blood Pressure Measurement";
  event.name = eventName;
  
  const eventTime = new openehr_rm.DV_DATE_TIME();
  eventTime.value = "2024-12-08T14:30:00";
  event.time = eventTime;
  
  // Create ITEM_TREE for the data
  const itemTree = new openehr_rm.ITEM_TREE();
  itemTree.archetype_node_id = "at0003";
  
  const itemTreeName = new openehr_rm.DV_TEXT();
  itemTreeName.value = "Blood Pressure";
  itemTree.name = itemTreeName;
  
  // Create ELEMENT for systolic blood pressure
  const systolicElement = new openehr_rm.ELEMENT();
  systolicElement.archetype_node_id = "at0004";
  
  const systolicName = new openehr_rm.DV_TEXT();
  systolicName.value = "Systolic";
  systolicElement.name = systolicName;
  
  const systolicValue = new openehr_rm.DV_QUANTITY();
  systolicValue.magnitude = 120.0;
  systolicValue.units = "mm[Hg]";
  systolicElement.value = systolicValue;
  
  // Create ELEMENT for diastolic blood pressure
  const diastolicElement = new openehr_rm.ELEMENT();
  diastolicElement.archetype_node_id = "at0005";
  
  const diastolicName = new openehr_rm.DV_TEXT();
  diastolicName.value = "Diastolic";
  diastolicElement.name = diastolicName;
  
  const diastolicValue = new openehr_rm.DV_QUANTITY();
  diastolicValue.magnitude = 80.0;
  diastolicValue.units = "mm[Hg]";
  diastolicElement.value = diastolicValue;
  
  // Assemble the tree
  itemTree.items = [systolicElement, diastolicElement];
  event.data = itemTree;
  history.events = [event];
  observation.data = history;
  
  return observation;
}

/**
 * Print a summary of the COMPOSITION
 */
function printCompositionSummary(composition: openehr_rm.COMPOSITION): void {
  console.log("\n=== COMPOSITION Summary ===");
  console.log(`Name: ${composition.name?.value}`);
  console.log(`UID: ${composition.uid?.value}`);
  console.log(`Language: ${composition.language?.code_string}`);
  console.log(`Territory: ${composition.territory?.code_string}`);
  console.log(`Category: ${composition.category?.value}`);
  console.log(`Composer: ${composition.composer?.name?.value}`);
  console.log(`Context Start Time: ${composition.context?.start_time?.value}`);
  console.log(`Setting: ${composition.context?.setting?.value}`);
  
  if (composition.content && composition.content.length > 0) {
    console.log(`\nContent (${composition.content.length} items):`);
    composition.content.forEach((item, index) => {
      if (item instanceof openehr_rm.OBSERVATION) {
        console.log(`  ${index + 1}. OBSERVATION: ${item.name?.value}`);
        
        if (item.data instanceof openehr_rm.HISTORY) {
          const history = item.data;
          console.log(`     Events: ${history.events?.length || 0}`);
          
          if (history.events && history.events.length > 0) {
            const event = history.events[0];
            console.log(`     First Event Time: ${event.time?.value}`);
            
            if (event.data instanceof openehr_rm.ITEM_TREE) {
              const tree = event.data;
              console.log(`     Data Items: ${tree.items?.length || 0}`);
              
              if (tree.items) {
                tree.items.forEach((element) => {
                  if (element instanceof openehr_rm.ELEMENT) {
                    const value = element.value;
                    if (value instanceof openehr_rm.DV_QUANTITY) {
                      console.log(`       - ${element.name?.value}: ${value.magnitude} ${value.units}`);
                    }
                  }
                });
              }
            }
          }
        }
      }
    });
  }
  
  console.log("\n=== End Summary ===\n");
}

// Main execution
if (import.meta.main) {
  console.log("Creating a simple blood pressure COMPOSITION...\n");
  
  const composition = createBloodPressureComposition();
  printCompositionSummary(composition);
  
  console.log("✓ COMPOSITION created successfully!");
  console.log("\nThis demonstrates manual construction of an openEHR COMPOSITION.");
  console.log("Future phases will add template validation and simplified creation methods.");
}
