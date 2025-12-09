/**
 * Simple Observation Example
 * 
 * This example shows a minimal COMPOSITION with a single OBSERVATION
 * recording body temperature - demonstrating different data values
 * from the blood pressure example.
 */

import * as openehr_rm from "../openehr_rm.ts";
import * as openehr_base from "../openehr_base.ts";

/**
 * Create a simple temperature recording COMPOSITION
 */
function createTemperatureComposition(): openehr_rm.COMPOSITION {
  // Create the root COMPOSITION
  const composition = new openehr_rm.COMPOSITION();
  
  // Set basic properties
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  
  const compositionName = new openehr_rm.DV_TEXT();
  compositionName.value = "Temperature Recording";
  composition.name = compositionName;
  
  // Set UID
  const uid = new openehr_base.OBJECT_VERSION_ID();
  uid.value = "9949182c-82ad-4088-a07f-48ead4180516::uk.nhs.example::1";
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
  
  // Set category (event)
  const category = new openehr_rm.DV_CODED_TEXT();
  category.value = "event";
  const categoryCode = new openehr_base.CODE_PHRASE();
  const categoryTermId = new openehr_base.TERMINOLOGY_ID();
  categoryTermId.value = "openehr";
  categoryCode.terminology_id = categoryTermId;
  categoryCode.code_string = "433";
  category.defining_code = categoryCode;
  composition.category = category;
  
  // Set composer
  const composer = new openehr_rm.PARTY_IDENTIFIED();
  const composerName = new openehr_rm.DV_TEXT();
  composerName.value = "Nurse Johnson";
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
  startTime.value = "2024-12-08T15:45:00";
  context.start_time = startTime;
  
  const setting = new openehr_rm.DV_CODED_TEXT();
  setting.value = "primary care";
  const settingCode = new openehr_base.CODE_PHRASE();
  const settingTermId = new openehr_base.TERMINOLOGY_ID();
  settingTermId.value = "openehr";
  settingCode.terminology_id = settingTermId;
  settingCode.code_string = "235";
  setting.defining_code = settingCode;
  context.setting = setting;
  
  composition.context = context;
  
  // Create the temperature OBSERVATION
  const observation = createTemperatureObservation();
  
  // Add observation to composition content
  composition.content = [observation];
  
  return composition;
}

/**
 * Create a body temperature OBSERVATION
 */
function createTemperatureObservation(): openehr_rm.OBSERVATION {
  const observation = new openehr_rm.OBSERVATION();
  
  observation.archetype_node_id = "openEHR-EHR-OBSERVATION.body_temperature.v2";
  
  // Set name
  const name = new openehr_rm.DV_TEXT();
  name.value = "Body Temperature";
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
  historyName.value = "History";
  history.name = historyName;
  
  const origin = new openehr_rm.DV_DATE_TIME();
  origin.value = "2024-12-08T15:45:00";
  history.origin = origin;
  
  // Create POINT_EVENT
  const event = new openehr_rm.POINT_EVENT();
  event.archetype_node_id = "at0002";
  
  const eventName = new openehr_rm.DV_TEXT();
  eventName.value = "Any event";
  event.name = eventName;
  
  const eventTime = new openehr_rm.DV_DATE_TIME();
  eventTime.value = "2024-12-08T15:45:00";
  event.time = eventTime;
  
  // Create ITEM_TREE for the data
  const itemTree = new openehr_rm.ITEM_TREE();
  itemTree.archetype_node_id = "at0003";
  
  const itemTreeName = new openehr_rm.DV_TEXT();
  itemTreeName.value = "Tree";
  itemTree.name = itemTreeName;
  
  // Create ELEMENT for temperature
  const temperatureElement = new openehr_rm.ELEMENT();
  temperatureElement.archetype_node_id = "at0004";
  
  const temperatureName = new openehr_rm.DV_TEXT();
  temperatureName.value = "Temperature";
  temperatureElement.name = temperatureName;
  
  const temperatureValue = new openehr_rm.DV_QUANTITY();
  temperatureValue.magnitude = 37.2;
  temperatureValue.units = "Cel";  // UCUM syntax for Celsius
  temperatureElement.value = temperatureValue;
  
  // Assemble the tree
  itemTree.items = [temperatureElement];
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
  console.log(`Composer: ${composition.composer?.name?.value}`);
  
  if (composition.content && composition.content.length > 0) {
    composition.content.forEach((item) => {
      if (item instanceof openehr_rm.OBSERVATION) {
        console.log(`\nObservation: ${item.name?.value}`);
        
        if (item.data instanceof openehr_rm.HISTORY) {
          const history = item.data;
          if (history.events && history.events.length > 0) {
            const event = history.events[0];
            
            if (event.data instanceof openehr_rm.ITEM_TREE) {
              const tree = event.data;
              if (tree.items) {
                tree.items.forEach((element) => {
                  if (element instanceof openehr_rm.ELEMENT) {
                    const value = element.value;
                    if (value instanceof openehr_rm.DV_QUANTITY) {
                      console.log(`  ${element.name?.value}: ${value.magnitude} ${value.units}`);
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
  console.log("Creating a simple temperature COMPOSITION...\n");
  
  const composition = createTemperatureComposition();
  printCompositionSummary(composition);
  
  console.log("✓ COMPOSITION created successfully!");
}
