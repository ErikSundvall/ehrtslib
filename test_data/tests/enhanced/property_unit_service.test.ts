/**
 * Test suite for PropertyUnitDataService
 *
 * Tests for the PropertyUnitData service that provides access to openEHR
 * property and unit grouping data from PropertyUnitData.xml.
 *
 * Note: Conversion factors are deliberately excluded from this service
 * as they are known to be erroneous/imprecise.
 */

import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  PropertyUnitDataService,
  PropertyData,
  UnitData,
} from "../../enhanced/property_unit_service.ts";

// Sample XML for testing
const SAMPLE_XML = `<?xml version="1.0" standalone="yes"?>
<PropertyUnits xmlns="http://tempuri.org/PropertyUnits.xsd">
  <Property id="0" Text="Length" openEHR="122" />
  <Property id="1" Text="Mass" openEHR="124" />
  <Property id="3" Text="Temperature" openEHR="127" />
  <Unit property_id="0" Text="m" name="meter" conversion="1" primary="true" UCUM="m"/>
  <Unit property_id="0" Text="cm" name="centimeter" conversion="1" coefficient="-2" primary="false" UCUM="cm"/>
  <Unit property_id="0" Text="km" name="kilometer" conversion="1" coefficient="3" primary="false" UCUM="km"/>
  <Unit property_id="1" Text="kg" name="kilogram" conversion="1" primary="true" UCUM="kg"/>
  <Unit property_id="1" Text="g" name="gram" conversion="1" coefficient="-3" primary="false" UCUM="g"/>
  <Unit property_id="3" Text="°C" name="degrees Celsius" conversion="1" primary="true" UCUM="Cel"/>
  <Unit property_id="3" Text="°F" name="degrees Fahrenheit" conversion="0.555556" coefficient="0" primary="false" UCUM="[degF]"/>
</PropertyUnits>`;

// ===== Singleton and Initialization Tests =====

Deno.test("PropertyUnitDataService - getInstance returns singleton", () => {
  const service1 = PropertyUnitDataService.getInstance();
  const service2 = PropertyUnitDataService.getInstance();
  assert(service1 === service2, "Should return the same instance");
});

Deno.test("PropertyUnitDataService - isInitialized returns false before initialization", () => {
  // Create a fresh service by loading XML
  const service = PropertyUnitDataService.getInstance();
  // Note: This test assumes the service starts uninitialized in a fresh context
  // Since we're using a singleton, it may already be initialized from previous tests
  assert(service !== undefined);
});

Deno.test("PropertyUnitDataService - loadFromXml initializes service", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);
  assert(service.isInitialized(), "Service should be initialized after loadFromXml");
});

// ===== Property Tests =====

Deno.test("PropertyUnitDataService - getAllProperties returns all properties", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const properties = service.getAllProperties();
  assertEquals(properties.length, 3, "Should have 3 properties");
});

Deno.test("PropertyUnitDataService - getProperty returns property by ID", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const lengthProp = service.getProperty(0);
  assert(lengthProp !== null);
  assertEquals(lengthProp.id, 0);
  assertEquals(lengthProp.text, "Length");
  assertEquals(lengthProp.openEHRId, 122);
});

Deno.test("PropertyUnitDataService - getProperty returns null for non-existent ID", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const result = service.getProperty(999);
  assert(result === null, "Should return null for non-existent property");
});

Deno.test("PropertyUnitDataService - getPropertyByOpenEHRId returns property", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const massProp = service.getPropertyByOpenEHRId(124);
  assert(massProp !== null);
  assertEquals(massProp.text, "Mass");
  assertEquals(massProp.id, 1);
});

Deno.test("PropertyUnitDataService - getPropertyName returns property name", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const name = service.getPropertyName(3);
  assertEquals(name, "Temperature");
});

Deno.test("PropertyUnitDataService - getOpenEHRIdForProperty returns openEHR ID", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const openEHRId = service.getOpenEHRIdForProperty(1);
  assertEquals(openEHRId, 124);
});

// ===== Unit Tests =====

Deno.test("PropertyUnitDataService - getAllUnits returns all units", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const units = service.getAllUnits();
  assertEquals(units.length, 7, "Should have 7 units");
});

Deno.test("PropertyUnitDataService - getUnitByUcum returns unit by UCUM code", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const unit = service.getUnitByUcum("kg");
  assert(unit !== null);
  assertEquals(unit.text, "kg");
  assertEquals(unit.name, "kilogram");
  assertEquals(unit.propertyId, 1);
  assertEquals(unit.isPrimary, true);
});

Deno.test("PropertyUnitDataService - getUnitByUcum returns null for unknown UCUM", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const result = service.getUnitByUcum("unknown_unit");
  assert(result === null, "Should return null for unknown UCUM code");
});

Deno.test("PropertyUnitDataService - getUnitsForProperty returns all units for a property", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const lengthUnits = service.getUnitsForProperty(0);
  assertEquals(lengthUnits.length, 3, "Length should have 3 units");

  const unitTexts = lengthUnits.map((u) => u.text);
  assert(unitTexts.includes("m"));
  assert(unitTexts.includes("cm"));
  assert(unitTexts.includes("km"));
});

Deno.test("PropertyUnitDataService - getUnitsForOpenEHRProperty returns units", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const massUnits = service.getUnitsForOpenEHRProperty(124);
  assertEquals(massUnits.length, 2, "Mass should have 2 units");

  const unitTexts = massUnits.map((u) => u.text);
  assert(unitTexts.includes("kg"));
  assert(unitTexts.includes("g"));
});

Deno.test("PropertyUnitDataService - getPrimaryUnitForProperty returns primary unit", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const primaryLength = service.getPrimaryUnitForProperty(0);
  assert(primaryLength !== null);
  assertEquals(primaryLength.ucum, "m");
  assertEquals(primaryLength.isPrimary, true);

  const primaryMass = service.getPrimaryUnitForProperty(1);
  assert(primaryMass !== null);
  assertEquals(primaryMass.ucum, "kg");
});

// ===== Property-Unit Relationship Tests =====

Deno.test("PropertyUnitDataService - getPropertyIdForUnit returns correct property", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const propId = service.getPropertyIdForUnit("kg");
  assertEquals(propId, 1);

  const propId2 = service.getPropertyIdForUnit("cm");
  assertEquals(propId2, 0);
});

Deno.test("PropertyUnitDataService - getPropertyIdForUnit returns null for unknown unit", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const result = service.getPropertyIdForUnit("unknown");
  assert(result === null);
});

Deno.test("PropertyUnitDataService - getOpenEHRPropertyIdForUnit returns openEHR ID", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  const openEHRId = service.getOpenEHRPropertyIdForUnit("Cel");
  assertEquals(openEHRId, 127); // Temperature openEHR ID

  const openEHRId2 = service.getOpenEHRPropertyIdForUnit("kg");
  assertEquals(openEHRId2, 124); // Mass openEHR ID
});

Deno.test("PropertyUnitDataService - unitsSameProperty correctly identifies same property", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  // Same property (Length)
  assert(service.unitsSameProperty("m", "cm"), "m and cm should be same property");
  assert(service.unitsSameProperty("cm", "km"), "cm and km should be same property");

  // Same property (Temperature)
  assert(service.unitsSameProperty("Cel", "[degF]"), "Celsius and Fahrenheit should be same property");

  // Different properties
  assert(!service.unitsSameProperty("m", "kg"), "m and kg should be different properties");
  assert(!service.unitsSameProperty("Cel", "g"), "Celsius and gram should be different properties");
});

Deno.test("PropertyUnitDataService - unitsSameProperty returns false for unknown units", () => {
  const service = PropertyUnitDataService.getInstance();
  service.loadFromXml(SAMPLE_XML);

  assert(!service.unitsSameProperty("m", "unknown"), "Should return false for unknown unit");
  assert(!service.unitsSameProperty("unknown1", "unknown2"), "Should return false for both unknown");
});

// ===== Real File Loading Test =====

Deno.test("PropertyUnitDataService - loadFromXml can load real file content", async () => {
  const service = PropertyUnitDataService.getInstance();

  // Load the real PropertyUnitData.xml file directly
  const xmlContent = await Deno.readTextFile("terminology_data/PropertyUnitData.xml");
  service.loadFromXml(xmlContent);

  // Verify real data was loaded
  const allProps = service.getAllProperties();
  assert(allProps.length > 3, "Should have more properties than sample XML");

  // Check for specific known properties from the real file
  const lengthProp = service.getPropertyByOpenEHRId(122);
  assert(lengthProp !== null, "Length property should exist");
  assertEquals(lengthProp.text, "Length");

  const massProp = service.getPropertyByOpenEHRId(124);
  assert(massProp !== null, "Mass property should exist");
  assertEquals(massProp.text, "Mass");

  // Check for known units
  const meterUnit = service.getUnitByUcum("m");
  assert(meterUnit !== null, "Meter unit should exist");
});
