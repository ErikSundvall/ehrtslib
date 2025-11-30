/**
 * UCUM Service Integration
 *
 * This module provides integration with the @lhncbc/ucum-lhc library for
 * UCUM validation and conversion. It wraps the library's functionality
 * and provides a consistent interface for use in the MEASUREMENT_SERVICE.
 *
 * The ucum-lhc library is the recommended solution for UCUM operations
 * per the openEHR community discussion:
 * https://discourse.openehr.org/t/propertyunitdata-xml-and-conversion-information/4968
 */

/**
 * Interface for UCUM validation result
 */
export interface UcumValidationResult {
  status: "valid" | "invalid" | "error";
  ucumCode?: string;
  msg?: string[];
}

/**
 * Interface for UCUM conversion result
 */
export interface UcumConversionResult {
  status: "succeeded" | "failed" | "error";
  toVal?: number;
  toUnits?: string;
  msg?: string[];
}

/**
 * UCUM Service wrapper around @lhncbc/ucum-lhc
 *
 * This provides a simpler interface and handles the library's singleton pattern.
 *
 * Usage:
 * ```typescript
 * const ucum = new UcumService();
 *
 * // Validate a unit string
 * const valid = ucum.validate("mg/dL");
 *
 * // Convert units
 * const result = ucum.convert(100, "Cel", "[degF]");
 *
 * // Check if two units are compatible (same dimension)
 * const compatible = ucum.areCompatible("m", "cm");
 * ```
 */
export class UcumService {
  private ucumUtils: any = null;
  private initialized = false;
  private initError: Error | null = null;

  /**
   * Initialize the UCUM service by loading ucum-lhc
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initError) throw this.initError;

    try {
      // Dynamic import for ucum-lhc
      // This allows the library to be optional
      const ucumLhc = await import("npm:@lhncbc/ucum-lhc");
      this.ucumUtils = ucumLhc.UcumLhcUtils.getInstance();
      this.initialized = true;
    } catch (error) {
      this.initError = error as Error;
      console.warn(
        "ucum-lhc library not available. MEASUREMENT_SERVICE will use fallback validation.",
        error
      );
    }
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Validate a UCUM unit string
   *
   * @param unitStr The unit string to validate
   * @param suggest Whether to provide suggestions for invalid units
   * @returns Validation result
   */
  validate(unitStr: string, suggest: boolean = false): UcumValidationResult {
    if (!this.initialized || !this.ucumUtils) {
      // Fallback validation for common units
      return this.fallbackValidate(unitStr);
    }

    try {
      const result = this.ucumUtils.validateUnitString(unitStr, suggest);
      return {
        status: result.status === "valid" ? "valid" : "invalid",
        ucumCode: result.ucumCode,
        msg: result.msg,
      };
    } catch (error) {
      return {
        status: "error",
        msg: [(error as Error).message],
      };
    }
  }

  /**
   * Convert a value from one unit to another
   *
   * @param value The value to convert
   * @param fromUnit Source unit
   * @param toUnit Target unit
   * @returns Conversion result
   */
  convert(
    value: number,
    fromUnit: string,
    toUnit: string
  ): UcumConversionResult {
    if (!this.initialized || !this.ucumUtils) {
      return {
        status: "error",
        msg: ["ucum-lhc library not available"],
      };
    }

    try {
      // Note: ucum-lhc API order is convertUnitTo(fromUnit, value, toUnit)
      const result = this.ucumUtils.convertUnitTo(fromUnit, value, toUnit);
      return {
        status: result.status === "succeeded" ? "succeeded" : "failed",
        toVal: result.toVal,
        toUnits: result.toUnits,
        msg: result.msg,
      };
    } catch (error) {
      return {
        status: "error",
        msg: [(error as Error).message],
      };
    }
  }

  /**
   * Check if two units are compatible (can be converted to each other)
   *
   * @param unit1 First unit
   * @param unit2 Second unit
   * @returns True if units are compatible
   */
  areCompatible(unit1: string, unit2: string): boolean {
    if (unit1 === unit2) return true;

    if (!this.initialized || !this.ucumUtils) {
      // Fallback: check using dimension groups
      return this.fallbackCompatibilityCheck(unit1, unit2);
    }

    try {
      // Note: ucum-lhc API order is convertUnitTo(fromUnit, value, toUnit)
      const result = this.ucumUtils.convertUnitTo(unit1, 1, unit2);
      return result.status === "succeeded";
    } catch {
      return false;
    }
  }

  /**
   * Convert a unit to its base units
   *
   * @param unitStr The unit to convert
   * @param value The value to convert (default 1)
   * @returns The base unit form
   */
  toBaseUnits(
    unitStr: string,
    value: number = 1
  ): { value: number; unit: string } | null {
    if (!this.initialized || !this.ucumUtils) {
      return null;
    }

    try {
      const result = this.ucumUtils.convertToBaseUnits(unitStr, value);
      if (result.status === "succeeded") {
        // The ucum-lhc library returns magnitude and unitToExp
        // unitToExp is an object like {"m": 1} for meters
        const unitToExp = result.unitToExp || {};
        const baseUnit = Object.keys(unitToExp).join(".");
        return {
          value: result.magnitude,
          unit: baseUnit,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Unicode micro symbol (\u03BC) - used in UCUM patterns
   * Note: UCUM officially uses ASCII 'u' for micro, but many systems use Unicode 'μ'
   */
  private static readonly MICRO_SYMBOL = "\u03BC"; // μ

  /**
   * Fallback validation when ucum-lhc is not available
   */
  private fallbackValidate(unitStr: string): UcumValidationResult {
    // Common valid UCUM units
    // Note: Includes both ASCII 'u' and Unicode 'μ' (\u03BC) for micro prefix compatibility
    const validUnits = new Set([
      // Mass (includes both 'ug' and 'μg' for micro prefix)
      "kg", "g", "mg", "ug", `${UcumService.MICRO_SYMBOL}g`, "ng", "pg",
      "[lb_av]", "[oz_av]",
      // Length (includes both 'um' and 'μm' for micro prefix)
      "m", "cm", "mm", "um", `${UcumService.MICRO_SYMBOL}m`, "nm", "km",
      "[in_i]", "[ft_i]", "[mi_i]",
      // Volume (includes both 'uL' and 'μL' for micro prefix)
      "L", "l", "dL", "dl", "mL", "ml", "uL", `${UcumService.MICRO_SYMBOL}L`,
      // Time
      "s", "min", "h", "d", "wk", "mo", "a",
      // Temperature
      "Cel", "K", "[degF]",
      // Pressure
      "Pa", "kPa", "bar", "mm[Hg]", "[psi]",
      // Common clinical
      "mmol/L", "mg/dL", "g/dL", "mL/min", "L/min",
      "kg/m2", "%", "1", "[pH]", "[IU]",
    ]);

    // Empty or "1" is dimensionless
    if (unitStr === "" || unitStr === "1") {
      return { status: "valid", ucumCode: unitStr };
    }

    if (validUnits.has(unitStr)) {
      return { status: "valid", ucumCode: unitStr };
    }

    // Basic pattern matching for UCUM-like strings
    // Note: The character class includes both 'u' and 'μ' (\u03BC) for micro prefix
    const microChar = UcumService.MICRO_SYMBOL;
    const ucumPatterns = [
      new RegExp(`^[yzafpnu${microChar}mcdhkMGTPEZY]?[a-zA-Z]+(\\d+)?$`),
      /^[a-zA-Z]+(\d*)\/[a-zA-Z]+(\d*)$/,
      /^[a-zA-Z]*\[[^\]]+\]$/,
      /^[a-zA-Z]+\{[^}]+\}$/,
    ];

    for (const pattern of ucumPatterns) {
      if (pattern.test(unitStr)) {
        return { status: "valid", ucumCode: unitStr };
      }
    }

    return { status: "invalid", msg: ["Unit not recognized"] };
  }

  /**
   * Fallback compatibility check using dimension groups
   */
  private fallbackCompatibilityCheck(unit1: string, unit2: string): boolean {
    // Note: Includes both 'u' (ASCII) and 'μ' (\u03BC Unicode) for micro prefix
    const micro = UcumService.MICRO_SYMBOL;
    const dimensionGroups: Record<string, string[]> = {
      length: ["m", "cm", "mm", "um", `${micro}m`, "nm", "km", "[in_i]", "[ft_i]", "[mi_i]"],
      mass: ["kg", "g", "mg", "ug", `${micro}g`, "ng", "pg", "[lb_av]", "[oz_av]"],
      volume: ["L", "l", "dL", "dl", "mL", "ml", "uL", `${micro}L`, "[gal_us]", "[pt_us]"],
      time: ["s", "min", "h", "d", "wk", "mo", "a"],
      temperature: ["Cel", "K", "[degF]"],
      pressure: ["Pa", "kPa", "bar", "mm[Hg]", "[psi]"],
    };

    const getDimension = (unit: string): string | null => {
      for (const [dim, units] of Object.entries(dimensionGroups)) {
        if (units.includes(unit)) return dim;
      }
      return null;
    };

    const dim1 = getDimension(unit1);
    const dim2 = getDimension(unit2);

    return dim1 !== null && dim2 !== null && dim1 === dim2;
  }
}

// Singleton instance
let ucumServiceInstance: UcumService | null = null;

/**
 * Get the singleton UCUM service instance
 */
export function getUcumService(): UcumService {
  if (!ucumServiceInstance) {
    ucumServiceInstance = new UcumService();
  }
  return ucumServiceInstance;
}
