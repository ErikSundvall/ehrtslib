/**
 * PropertyUnitData Service
 *
 * This module provides access to openEHR property and unit grouping data from
 * PropertyUnitData.xml. It deliberately excludes conversion factors from the XML
 * file as they are known to be erroneous/imprecise.
 *
 * For unit validation and conversion, use the MEASUREMENT_SERVICE which integrates
 * with the ucum-lhc library.
 *
 * References:
 * - openEHR Discourse discussion: https://discourse.openehr.org/t/propertyunitdata-xml-and-conversion-information/4968
 * - PropertyUnitData.xml: https://github.com/openEHR/specifications-TERM/blob/master/computable/XML/PropertyUnitData.xml
 */

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";

/**
 * Represents an openEHR property (e.g., Mass, Length, Temperature)
 */
export interface PropertyData {
  /** Internal ID in PropertyUnitData.xml */
  id: number;
  /** Display name (e.g., "Mass", "Length") */
  text: string;
  /** openEHR terminology ID for this property */
  openEHRId: number;
}

/**
 * Represents a unit associated with a property
 * Note: Conversion factors are deliberately excluded
 */
export interface UnitData {
  /** Reference to parent property ID */
  propertyId: number;
  /** Display text (e.g., "kg", "°C") */
  text: string;
  /** Full name (e.g., "kilogram", "degrees Celsius") */
  name: string;
  /** UCUM code for this unit */
  ucum: string;
  /** Whether this is the primary/default unit for the property */
  isPrimary: boolean;
}

/**
 * Service for accessing openEHR property and unit grouping data.
 *
 * This service loads data from PropertyUnitData.xml but deliberately excludes
 * conversion factors. For actual unit conversions, use ucum-lhc library.
 *
 * Usage:
 * ```typescript
 * const service = PropertyUnitDataService.getInstance();
 * await service.initialize();
 *
 * // Get property ID for a unit
 * const propId = service.getPropertyIdForUnit("kg"); // returns 1 (Mass property)
 *
 * // Get all units for a property
 * const massUnits = service.getUnitsForProperty(1);
 *
 * // Get openEHR ID for a property
 * const openehrId = service.getOpenEHRIdForProperty(1); // returns 124
 * ```
 */
export class PropertyUnitDataService {
  private static instance: PropertyUnitDataService;

  private properties: Map<number, PropertyData> = new Map();
  private propertiesByOpenEHRId: Map<number, PropertyData> = new Map();
  private units: UnitData[] = [];
  private unitsByProperty: Map<number, UnitData[]> = new Map();
  private unitsByUcum: Map<string, UnitData> = new Map();
  private initialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PropertyUnitDataService {
    if (!PropertyUnitDataService.instance) {
      PropertyUnitDataService.instance = new PropertyUnitDataService();
    }
    return PropertyUnitDataService.instance;
  }

  /**
   * Initialize the service by loading PropertyUnitData.xml
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load from local file first
      const xmlContent = await Deno.readTextFile(
        "terminology_data/PropertyUnitData.xml"
      );
      this.parseXml(xmlContent);
      this.initialized = true;
    } catch (_localError) {
      // If local file not found, try to fetch from GitHub
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/openEHR/specifications-TERM/master/computable/XML/PropertyUnitData.xml"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch PropertyUnitData.xml: ${response.status}`);
        }
        const xmlContent = await response.text();
        this.parseXml(xmlContent);
        this.initialized = true;
      } catch (fetchError) {
        console.warn("Failed to load PropertyUnitData.xml:", fetchError);
      }
    }
  }

  /**
   * Load data from XML content string
   */
  public loadFromXml(xmlContent: string): void {
    this.parseXml(xmlContent);
    this.initialized = true;
  }

  /**
   * Parse PropertyUnitData.xml content
   * Note: Deliberately ignores conversion and coefficient attributes
   */
  private parseXml(xmlContent: string): void {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");

    if (!doc) {
      throw new Error("Failed to parse PropertyUnitData.xml");
    }

    // Clear existing data
    this.properties.clear();
    this.propertiesByOpenEHRId.clear();
    this.units = [];
    this.unitsByProperty.clear();
    this.unitsByUcum.clear();

    // Parse properties
    const propertyElements = Array.from(
      doc.querySelectorAll("Property")
    ) as any[];
    for (const propEl of propertyElements) {
      const id = parseInt(propEl.getAttribute("id") || "0", 10);
      const text = propEl.getAttribute("Text") || "";
      const openEHRId = parseInt(propEl.getAttribute("openEHR") || "0", 10);

      const property: PropertyData = { id, text, openEHRId };
      this.properties.set(id, property);
      if (openEHRId > 0) {
        this.propertiesByOpenEHRId.set(openEHRId, property);
      }
      this.unitsByProperty.set(id, []);
    }

    // Parse units (excluding conversion factors)
    const unitElements = Array.from(doc.querySelectorAll("Unit")) as any[];
    for (const unitEl of unitElements) {
      const propertyId = parseInt(unitEl.getAttribute("property_id") || "0", 10);
      const text = unitEl.getAttribute("Text") || "";
      const name = unitEl.getAttribute("name") || "";
      const ucum = unitEl.getAttribute("UCUM") || text;
      const isPrimary = unitEl.getAttribute("primary") === "true";

      // NOTE: We deliberately skip conversion and coefficient attributes
      // as they are known to be erroneous/imprecise

      const unit: UnitData = { propertyId, text, name, ucum, isPrimary };
      this.units.push(unit);

      // Index by property
      const propertyUnits = this.unitsByProperty.get(propertyId) || [];
      propertyUnits.push(unit);
      this.unitsByProperty.set(propertyId, propertyUnits);

      // Index by UCUM code
      if (ucum) {
        this.unitsByUcum.set(ucum, unit);
      }
    }
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get property ID for a UCUM unit code
   */
  public getPropertyIdForUnit(ucumUnit: string): number | null {
    const unit = this.unitsByUcum.get(ucumUnit);
    return unit?.propertyId ?? null;
  }

  /**
   * Get openEHR property ID for a UCUM unit code
   */
  public getOpenEHRPropertyIdForUnit(ucumUnit: string): number | null {
    const unit = this.unitsByUcum.get(ucumUnit);
    if (!unit) return null;
    const property = this.properties.get(unit.propertyId);
    return property?.openEHRId ?? null;
  }

  /**
   * Get all units for a property (by internal ID)
   */
  public getUnitsForProperty(propertyId: number): UnitData[] {
    return this.unitsByProperty.get(propertyId) ?? [];
  }

  /**
   * Get all units for a property (by openEHR ID)
   */
  public getUnitsForOpenEHRProperty(openEHRId: number): UnitData[] {
    const property = this.propertiesByOpenEHRId.get(openEHRId);
    if (!property) return [];
    return this.unitsByProperty.get(property.id) ?? [];
  }

  /**
   * Get property data by internal ID
   */
  public getProperty(propertyId: number): PropertyData | null {
    return this.properties.get(propertyId) ?? null;
  }

  /**
   * Get property data by openEHR ID
   */
  public getPropertyByOpenEHRId(openEHRId: number): PropertyData | null {
    return this.propertiesByOpenEHRId.get(openEHRId) ?? null;
  }

  /**
   * Get all properties
   */
  public getAllProperties(): PropertyData[] {
    return Array.from(this.properties.values());
  }

  /**
   * Get unit data by UCUM code
   */
  public getUnitByUcum(ucumCode: string): UnitData | null {
    return this.unitsByUcum.get(ucumCode) ?? null;
  }

  /**
   * Get all units
   */
  public getAllUnits(): UnitData[] {
    return [...this.units];
  }

  /**
   * Get primary unit for a property
   */
  public getPrimaryUnitForProperty(propertyId: number): UnitData | null {
    const units = this.unitsByProperty.get(propertyId);
    if (!units) return null;
    return units.find((u) => u.isPrimary) ?? units[0] ?? null;
  }

  /**
   * Get property name by ID
   */
  public getPropertyName(propertyId: number): string | null {
    return this.properties.get(propertyId)?.text ?? null;
  }

  /**
   * Get openEHR ID for property
   */
  public getOpenEHRIdForProperty(propertyId: number): number | null {
    return this.properties.get(propertyId)?.openEHRId ?? null;
  }

  /**
   * Check if two units belong to the same property
   */
  public unitsSameProperty(ucum1: string, ucum2: string): boolean {
    const prop1 = this.getPropertyIdForUnit(ucum1);
    const prop2 = this.getPropertyIdForUnit(ucum2);
    if (prop1 === null || prop2 === null) return false;
    return prop1 === prop2;
  }
}

/**
 * Downloads the latest PropertyUnitData.xml from GitHub
 */
export async function downloadPropertyUnitData(
  targetPath: string = "terminology_data/PropertyUnitData.xml"
): Promise<void> {
  const url =
    "https://raw.githubusercontent.com/openEHR/specifications-TERM/master/computable/XML/PropertyUnitData.xml";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PropertyUnitData.xml: ${response.status}`);
  }
  const content = await response.text();
  await Deno.writeTextFile(targetPath, content);
  console.log(`Downloaded PropertyUnitData.xml to ${targetPath}`);
}
