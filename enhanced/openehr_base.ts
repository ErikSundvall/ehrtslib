// Enhanced implementation based on BMM schema: base v1.3.0
// BMM Version: 2.4
// Schema Revision: 1.3.0.2
// Description: openEHR base types.
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json
// Last synced with BMM: 2025-11-14
//
// ✅ ENHANCED IMPLEMENTATION
// This file contains fully implemented methods and additional functionality beyond the BMM specification.
// It is safe to edit this file - your changes will not be overwritten by the generator.
//
// The generator outputs to /generated directory. To update this file for a new BMM version:
// 1. Run generator to update /generated/openehr_base.ts
// 2. Compare changes using: deno run --allow-read tasks/compare_bmm_versions.ts
// 3. Manually merge relevant changes into this file
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

// Import Temporal API polyfill for date/time operations
// See: https://tc39.es/proposal-temporal/ and https://docs.deno.com/api/web/temporal
import { Temporal as TemporalAPI } from "./temporal_polyfill.ts";

// Unknown types - defined as 'any' for now
type T = any;

// Type alias for function predicates used in container operations
type Operation<T = any> = (v: T) => Boolean;

/**
 * Abstract ancestor class for all other classes. Usually maps to a type like \`Any\` or \`Object\` in an object-oriented technology. Defined here to provide value and reference equality semantics.
 */
export abstract class Any {
  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  abstract is_equal(other: Any): Boolean;

  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other: Any): Boolean {
    // Reference equality - same object
    return new Boolean(this === other);
  }

  /**
   * Create new instance of a type.
   * @param a_type - Parameter
   * @returns Result value
   */
  instance_of(a_type: String): Any {
    // This is a factory method that would need runtime type information
    // For now, just throw an error
    throw new Error("Method instance_of not yet implemented.");
  }

  /**
   * Type name of an object as a string. May include generic parameters, as in \`"Interval<Time>"\`.
   * @param an_object - Parameter
   * @returns Result value
   */
  type_of(an_object: Any): String {
    // Get constructor name
    const typeName = an_object.constructor.name;
    return String.from(typeName);
  }

  /**
   * True if current object not equal to \`_other_\`. Returns not \`_equal_()\`.
   * @param other - Parameter
   * @returns Result value
   */
  not_equal(other: Any): Boolean {
    // Use reference equality (not is_equal)
    return new Boolean(!this.equal(other).value);
  }
}

/**
 * Abstract ancestor of container types whose items are addressable in some way.
 */
export abstract class Container<T extends Any> extends Any {
  /**
   * Test for membership of a value.
   * @param v - Parameter
   * @returns Result value
   */
  abstract has(v: T): Boolean;

  /**
   * Number of items in container.
   * @returns Result value
   */
  abstract count(): Integer;

  /**
   * True if container is empty.
   * @returns Result value
   */
  abstract is_empty(): Boolean;

  /**
   * Existential quantifier applied to container, taking one agent argument \`_test_\` whose signature is \`(v:T): Boolean\`.
   * @param test - Parameter
   * @returns Result value
   */
  abstract there_exists(test: Operation<T>): Boolean;

  /**
   * Universal quantifier applied to container, taking one agent argument \`_test_\` whose signature is \`(v:T): Boolean\`.
   * @param test - Parameter
   * @returns Result value
   */
  abstract for_all(test: Operation<T>): Boolean;

  /**
   * Return a List all items matching the predicate function \`_test_\` which has signature \`(v:T): Boolean\`. If no matches, an empty List is returned.
   * @param test - Parameter
   * @returns Result value
   */
  matching(test: Operation<T>): T {
    // TODO: Implement matching behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method matching not yet implemented.");
  }

  /**
   * Return first item matching the predicate function \`_test_\` which has signature \`(v:T): Boolean\`, or Void if no match.
   * @param test - Parameter
   * @returns Result value
   */
  select(test: Operation<T>): T {
    // TODO: Implement select behavior
    // This will be covered in Phase 3 (see ROADMAP.md)
    throw new Error("Method select not yet implemented.");
  }
}

/**
 * Type representing a keyed table of values. V is the value type, and K the type of the keys.
 */
export class Hash<K extends Ordered, V> extends Container<K> {
  private _map: Map<string, { key: K; value: V }> = new Map();

  /**
   * Constructor that optionally accepts initial entries.
   * @param entries - Optional array of [key, value] pairs
   */
  constructor(entries?: [K, V][]) {
    super();
    if (entries) {
      for (const [key, value] of entries) {
        this.put(key, value);
      }
    }
  }

  /**
   * Test for presence of \`_a_key_\`.
   * @param a_key - Parameter
   * @returns Result value
   */
  has_key(a_key: K): Boolean {
    const keyStr = this._keyToString(a_key);
    return new Boolean(this._map.has(keyStr));
  }

  /**
   * Return item for key \`_a_key_\`.
   * @param a_key - Parameter
   * @returns Result value
   */
  item(a_key: K): V {
    const keyStr = this._keyToString(a_key);
    const entry = this._map.get(keyStr);
    if (!entry) {
      throw new Error(`Key not found: ${keyStr}`);
    }
    return entry.value;
  }

  /**
   * Test for membership of a value (key in this case).
   */
  has(v: K): Boolean {
    return this.has_key(v);
  }

  /**
   * Return the number of items in the hash.
   */
  count(): Integer {
    const int = new Integer();
    int.value = this._map.size;
    return int;
  }

  /**
   * Check if the hash is empty.
   */
  is_empty(): Boolean {
    return new Boolean(this._map.size === 0);
  }

  /**
   * Test if all items satisfy a condition.
   */
  for_all(test: Operation<K>): Boolean {
    for (const entry of this._map.values()) {
      if (!test(entry.key).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }

  /**
   * Test if any item satisfies a condition.
   */
  there_exists(test: Operation<K>): Boolean {
    for (const entry of this._map.values()) {
      if (test(entry.key).value) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Check value equality with another object.
   */
  is_equal(other: Any): Boolean {
    if (!(other instanceof Hash)) {
      return new Boolean(false);
    }
    if (this._map.size !== other._map.size) {
      return new Boolean(false);
    }
    for (const [keyStr, entry] of this._map.entries()) {
      const otherEntry = other._map.get(keyStr);
      if (!otherEntry) {
        return new Boolean(false);
      }
      if (!entry.key.is_equal(otherEntry.key).value) {
        return new Boolean(false);
      }
      // Value comparison depends on type
      if (entry.value instanceof Any) {
        if (!entry.value.is_equal(otherEntry.value as Any).value) {
          return new Boolean(false);
        }
      } else if (entry.value !== otherEntry.value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }

  /**
   * Put a key-value pair into the hash.
   */
  put(key: K, value: V): void {
    const keyStr = this._keyToString(key);
    this._map.set(keyStr, { key, value });
  }

  /**
   * Helper to convert key to string for Map storage.
   */
  private _keyToString(key: K): string {
    if (key instanceof String) {
      return key.value || "";
    }
    // For other Ordered types, use a generic string representation
    return JSON.stringify(key);
  }
}

/**
 * Ordered container that may contain duplicates.
 */
export class List<T extends Any> extends Container<T> {
  private _items: T[] = [];

  /**
   * Test for membership of a value.
   */
  has(v: T): Boolean {
    for (const item of this._items) {
      if (item.is_equal(v).value === true) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Return the number of items in the list.
   */
  count(): Integer {
    const int = new Integer();
    int.value = this._items.length;
    return int;
  }

  /**
   * Check if the list is empty.
   */
  is_empty(): Boolean {
    return new Boolean(this._items.length === 0);
  }

  /**
   * Test if all items satisfy a condition.
   */
  for_all(test: Operation<T>): Boolean {
    for (const item of this._items) {
      if (!test(item).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }

  /**
   * Test if any item satisfies a condition.
   */
  there_exists(test: Operation<T>): Boolean {
    for (const item of this._items) {
      if (test(item).value) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Get the item at index i (0-based).
   */
  item(i: Integer): T {
    const idx = i.value;
    if (idx === undefined || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    return this._items[idx];
  }

  /**
   * Return first element.
   * @returns Result value
   */
  first(): T {
    if (this._items.length === 0) {
      throw new Error("Cannot get first item of empty list");
    }
    return this._items[0];
  }

  /**
   * Return last element.
   * @returns Result value
   */
  last(): T {
    if (this._items.length === 0) {
      throw new Error("Cannot get last item of empty list");
    }
    return this._items[this._items.length - 1];
  }

  /**
   * Add an item to the end of the list.
   */
  append(v: T): void {
    this._items.push(v);
  }

  /**
   * Add an item to the beginning of the list.
   */
  prepend(v: T): void {
    this._items.unshift(v);
  }

  /**
   * Append all items from another list.
   */
  extend(other: List<T>): void {
    const otherCount = other.count().value;
    if (otherCount !== undefined) {
      for (let i = 0; i < otherCount; i++) {
        const idx = new Integer();
        idx.value = i;
        this._items.push(other.item(idx));
      }
    }
  }

  /**
   * Remove the item at index i.
   */
  remove(i: Integer): void {
    const idx = i.value;
    if (idx === undefined || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    this._items.splice(idx, 1);
  }

  /**
   * Find the index of the first occurrence of a value.
   * Returns -1 if not found.
   */
  index_of(v: T): Integer {
    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].is_equal(v).value === true) {
        const idx = new Integer();
        idx.value = i;
        return idx;
      }
    }
    const idx = new Integer();
    idx.value = -1;
    return idx;
  }

  /**
   * Check value equality with another object.
   */
  is_equal(other: Any): Boolean {
    if (!(other instanceof List)) {
      return new Boolean(false);
    }
    if (this._items.length !== other._items.length) {
      return new Boolean(false);
    }
    for (let i = 0; i < this._items.length; i++) {
      if (!this._items[i].is_equal(other._items[i]).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }
}

/**
 * Unordered container that may not contain duplicates.
 */
export class Set<T extends Any> extends Container<T> {
  private _items: T[] = [];

  /**
   * Test for membership of a value.
   */
  has(v: T): Boolean {
    for (const item of this._items) {
      if (item.is_equal(v).value === true) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Return the number of items in the set.
   */
  count(): Integer {
    const int = new Integer();
    int.value = this._items.length;
    return int;
  }

  /**
   * Check if the set is empty.
   */
  is_empty(): Boolean {
    return new Boolean(this._items.length === 0);
  }

  /**
   * Test if all items satisfy a condition.
   */
  for_all(test: Operation<T>): Boolean {
    for (const item of this._items) {
      if (!test(item).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }

  /**
   * Test if any item satisfies a condition.
   */
  there_exists(test: Operation<T>): Boolean {
    for (const item of this._items) {
      if (test(item).value) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Add an item to the set if it doesn't already exist.
   */
  add(v: T): void {
    if (!this.has(v).value) {
      this._items.push(v);
    }
  }

  /**
   * Remove an item from the set.
   */
  remove(v: T): void {
    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].is_equal(v).value === true) {
        this._items.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Check value equality with another object.
   */
  is_equal(other: Any): Boolean {
    if (!(other instanceof Set)) {
      return new Boolean(false);
    }
    if (this._items.length !== other._items.length) {
      return new Boolean(false);
    }
    // Check if all items in this set are in the other set
    for (const item of this._items) {
      if (!other.has(item).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }
}

/**
 * Container whose storage is assumed to be contiguous.
 */
export class Array<T extends Any> extends Container<T> {
  private _items: T[] = [];

  /**
   * Test for membership of a value.
   */
  has(v: T): Boolean {
    for (const item of this._items) {
      if (item.is_equal(v).value === true) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Return the number of items in the array.
   */
  count(): Integer {
    const int = new Integer();
    int.value = this._items.length;
    return int;
  }

  /**
   * Check if the array is empty.
   */
  is_empty(): Boolean {
    return new Boolean(this._items.length === 0);
  }

  /**
   * Test if all items satisfy a condition.
   */
  for_all(test: Operation<T>): Boolean {
    for (const item of this._items) {
      if (!test(item).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }

  /**
   * Test if any item satisfies a condition.
   */
  there_exists(test: Operation<T>): Boolean {
    for (const item of this._items) {
      if (test(item).value) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }

  /**
   * Return item for key  \`_a_key_\`.
   * @param a_key - Parameter
   * @returns Result value
   */
  item(a_key: Integer): T {
    const idx = a_key.value;
    if (idx === undefined || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    return this._items[idx];
  }

  /**
   * Check value equality with another object.
   */
  is_equal(other: Any): Boolean {
    if (!(other instanceof Array)) {
      return new Boolean(false);
    }
    if (this._items.length !== other._items.length) {
      return new Boolean(false);
    }
    for (let i = 0; i < this._items.length; i++) {
      if (!this._items[i].is_equal(other._items[i]).value) {
        return new Boolean(false);
      }
    }
    return new Boolean(true);
  }

  /**
   * Set the item at index i.
   */
  put(i: Integer, v: T): void {
    const idx = i.value;
    if (idx === undefined || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    this._items[idx] = v;
  }

  /**
   * Append an item to the array.
   */
  append(v: T): void {
    this._items.push(v);
  }
}

/**
 * Abstract parent class of ordered types i.e. types on which the '<' operator is defined.
 */
export abstract class Ordered extends Any {
  /**
   * Arithmetic value comparison. Returns True if current object is less than \`_other_\`. This operator is effected and/or redefined in descendants to provide the appropriate ordering semantics for concrete types.
   *
   * In conjunction with \`=\`, enables the definition of the related functions \`_greater_than_()\` etc.
   * @param other - Parameter
   * @returns Result value
   */
  abstract less_than(other: Ordered): Boolean;

  /**
   * True if current object less than or equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than_or_equal(other: Ordered): Boolean {
    return new Boolean(
      this.less_than(other).value || this.is_equal(other).value,
    );
  }

  /**
   * True if current object greater than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  greater_than(other: Ordered): Boolean {
    return new Boolean(
      !this.less_than(other).value && !this.is_equal(other).value,
    );
  }

  /**
   * True if current object greater than or equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  greater_than_or_equal(other: Ordered): Boolean {
    return new Boolean(!this.less_than(other).value);
  }
}

/**
 * Type representing minimal interface of built-in String type, as used to represent textual data in any natural or formal language.
 */
export class String extends Ordered {
  /**
   * The underlying primitive value.
   */
  value?: string;

  /**
   * Creates a new String instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: string) {
    super();
    this.value = val;
  }

  /**
   * Creates a String instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new String instance
   */
  static from(val?: string): String {
    return new String(val);
  }

  /**
   * Compares this String with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other: any): Boolean {
    if (other instanceof String) {
      return new Boolean(this.value === other.value);
    }
    return new Boolean(false);
  }

  /**
   * True if string is empty, i.e. equal to "".
   * @returns Result value
   */
  is_empty(): Boolean {
    return new Boolean((this.value || "").length === 0);
  }

  /**
   * Number of characters in string.
   * @returns Result value
   */
  count(): Integer {
    const int = new Integer();
    int.value = (this.value || "").length;
    return int;
  }

  /**
   * True if string can be parsed as an integer.
   * @returns Result value
   */
  is_integer(): Boolean {
    const val = this.value || "";
    const num = Number(val);
    return new Boolean(
      !isNaN(num) && Number.isInteger(num) && val.trim() !== "",
    );
  }

  /**
   * Return the integer corresponding to the integer value represented in this string.
   * @returns Result value
   */
  as_integer(): Integer {
    const num = parseInt(this.value || "", 10);
    if (isNaN(num)) {
      throw new Error(`Cannot parse "${this.value}" as integer`);
    }
    return Integer.from(num);
  }

  /**
   * Concatenation operator - causes \`_other_\` to be appended to this string.
   * @param other - Parameter
   * @returns Result value
   */
  append(other: String): String {
    return String.from((this.value || "") + (other.value || ""));
  }

  /**
   * Convert string to lowercase.
   * @returns Result value
   */
  as_lower(): String {
    return String.from((this.value || "").toLowerCase());
  }

  /**
   * Convert string to uppercase.
   * @returns Result value
   */
  as_upper(): String {
    return String.from((this.value || "").toUpperCase());
  }

  /**
   * Lexical comparison of string content based on ordering in relevant character set.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: Ordered): Boolean {
    if (!(other instanceof String)) {
      throw new Error("Cannot compare String with non-String");
    }
    return new Boolean((this.value || "") < (other.value || ""));
  }

  /**
   * Return True if this String contains \`_other_\` (case-sensitive).
   * @param other - Parameter
   * @returns Result value
   */
  contains(other: String): Boolean {
    return new Boolean((this.value || "").includes(other.value || ""));
  }

  /**
   * Extract a substring (1-based indexing in openEHR).
   * @param start - Start index (1-based)
   * @param end - End index (1-based)
   * @returns Result value
   */
  substring(start: Integer, end: Integer): String {
    const startIdx = (start.value || 1) - 1; // Convert to 0-based
    const endIdx = end.value || (this.value || "").length;
    return String.from((this.value || "").substring(startIdx, endIdx));
  }

  /**
   * Find the index of a substring (1-based indexing in openEHR).
   * @param pattern - Pattern to find
   * @param from - Start index (1-based)
   * @returns Result value (1-based index or -1 if not found)
   */
  index_of(pattern: String, from: Integer): Integer {
    const startIdx = (from.value || 1) - 1; // Convert to 0-based
    const foundIdx = (this.value || "").indexOf(pattern.value || "", startIdx);
    const result = new Integer();
    result.value = foundIdx === -1 ? -1 : foundIdx + 1; // Convert back to 1-based
    return result;
  }

  /**
   * Split string by delimiter.
   * @param delimiter - Delimiter to split by
   * @returns Result value
   */
  split(delimiter: String): List<String> {
    const parts = (this.value || "").split(delimiter.value || "");
    const list = new List<String>();
    for (const part of parts) {
      list.append(String.from(part));
    }
    return list;
  }
}

/**
 * A kind of String constrained to obey the syntax of RFC 3986.
 */
export class Uri extends String {
}

/**
 * Abstract parent class of numeric types, which are types which have various arithmetic and comparison operators defined.
 */
export abstract class Numeric extends Any {
  /**
   * Sum with \`_other_\` (commutative). Actual type of result depends on arithmetic balancing rules.
   * @param other - Parameter
   * @returns Result value
   */
  abstract add(other: Numeric): Numeric;

  /**
   * Result of subtracting \`_other_\`. Actual type of result depends on arithmetic balancing rules.
   * @param other - Parameter
   * @returns Result value
   */
  abstract subtract(other: Numeric): Numeric;

  /**
   * Product by \`_other_\`. Actual type of result depends on arithmetic balancing rules.
   * @param other - Parameter
   * @returns Result value
   */
  abstract multiply(other: Numeric): Numeric;

  /**
   * Divide by\`_other_\`. Actual type of result depends on arithmetic balancing rules.
   * @param other - Parameter
   * @returns Result value
   */
  abstract divide(other: Numeric): Numeric;

  /**
   * Expontiation of this by \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  abstract exponent(other: Numeric): Numeric;

  /**
   * Generate negative of current value.
   * @returns Result value
   */
  abstract negative(): Numeric;
}

/**
 * Abstract notional parent class of ordered, numeric types, which are types with both the \`_less_than_()\` and arithmetic functions defined.
 */
export abstract class Ordered_Numeric extends Ordered {
}

/**
 * Type representing minimal interface of built-in Integer type.
 */
export class Integer extends Ordered_Numeric {
  /**
   * The underlying primitive value.
   */
  value?: number;

  /**
   * Creates a new Integer instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: number) {
    super();
    if (val !== undefined && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer value must be an integer, got: ${val}`);
    }
    this.value = val;
  }

  /**
   * Creates a Integer instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Integer instance
   */
  static from(val?: number): Integer {
    return new Integer(val);
  }

  /**
   * Compares this Integer with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other: any): Boolean {
    if (other instanceof Integer) {
      return new Boolean(this.value === other.value);
    }
    return new Boolean(false);
  }

  /**
   * Lexical comparison for integers.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: Ordered): Boolean {
    if (!(other instanceof Integer)) {
      throw new Error("Cannot compare Integer with non-Integer");
    }
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return new Boolean(thisVal < otherVal);
  }

  /**
   * Integer addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: Integer): Integer {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return Integer.from(thisVal + otherVal);
  }

  /**
   * Integer subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: Integer): Integer {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return Integer.from(thisVal - otherVal);
  }

  /**
   * Integer multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other: Integer): Integer {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return Integer.from(thisVal * otherVal);
  }

  /**
   * Integer division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other: Integer): number {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / otherVal;
  }

  /**
   * Integer modulo.
   * @param other - Parameter
   * @returns Result value
   */
  modulo(other: Integer): Integer {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Modulo by zero");
    }
    return Integer.from(thisVal % otherVal);
  }

  /**
   * Generate negative of current value.
   * @returns Result value
   */
  negative(): Integer {
    return Integer.from(-(this.value || 0));
  }

  /**
   * Integer exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other: number): number {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }

  // modulo, less_than, negative, and is_equal are implemented above

  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  override equal(other: Integer): Boolean {
    // Reference equality - same object
    return new Boolean(this === other);
  }
}

/**
 * Type used to represent double-precision decimal numbers. Corresponds to a double-precision floating point value in most languages.
 */
export class Double extends Ordered_Numeric {
  /**
   * The underlying primitive value.
   */
  value?: number;

  /**
   * Creates a new Double instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: number) {
    super();
    this.value = val;
  }

  /**
   * Creates a Double instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Double instance
   */
  static from(val?: number): Double {
    return new Double(val);
  }

  /**
   * Return the greatest integer no greater than the value of this object.
   * @returns Result value
   */
  floor(): Integer {
    const thisVal = this.value || 0;
    return Integer.from(Math.floor(thisVal));
  }

  /**
   * Double-precision real number addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: number): number {
    const thisVal = this.value || 0;
    return thisVal + other;
  }

  /**
   * Double-precision real number subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: number): number {
    const thisVal = this.value || 0;
    return thisVal - other;
  }

  /**
   * Double-precision real number multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other: number): number {
    const thisVal = this.value || 0;
    return thisVal * other;
  }

  /**
   * Double-precision real number division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other: number): number {
    const thisVal = this.value || 0;
    if (other === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / other;
  }

  /**
   * Double-precision real number exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other: number): number {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }

  /**
   * Returns True if current Double is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  override less_than(other: Ordered): Boolean {
    if (other instanceof Double) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean(thisVal < otherVal);
    }
    return new Boolean(false);
  }

  /**
   * Generate negative of current Double value.
   * @returns Result value
   */
  negative(): number {
    const thisVal = this.value || 0;
    return -thisVal;
  }

  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (other instanceof Double) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean(thisVal === otherVal);
    }
    return new Boolean(false);
  }
}

/**
 * Type representing minimal interface of built-in Octet type.
 */
export class Octet extends Ordered {
  /**
   * The underlying primitive value.
   */
  value?: number;

  /**
   * Creates a new Octet instance.
   * @param val - The primitive value to wrap (0-255)
   */
  constructor(val?: number) {
    super();
    if (val !== undefined && val !== null && 
        (!Number.isInteger(val) || val < 0 || val > 255)) {
      throw new Error(`Octet value must be an integer between 0 and 255, got: ${val}`);
    }
    this.value = val;
  }

  /**
   * Creates an Octet instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Octet instance
   */
  static from(val?: number): Octet {
    return new Octet(val);
  }

  /**
   * Returns True if current Octet is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  override less_than(other: Ordered): Boolean {
    if (other instanceof Octet) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean(thisVal < otherVal);
    }
    return new Boolean(false);
  }

  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (other instanceof Octet) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean(thisVal === otherVal);
    }
    return new Boolean(false);
  }
}

/**
 * Type representing minimal interface of built-in Character type.
 */
export class Character extends Ordered {
  /**
   * The underlying primitive value.
   */
  value?: string;

  /**
   * Creates a new Character instance.
   * @param val - The primitive value to wrap (single character)
   */
  constructor(val?: string) {
    super();
    if (val !== undefined && val !== null && val.length !== 1) {
      throw new Error(`Character value must be a single character, got: ${val}`);
    }
    this.value = val;
  }

  /**
   * Creates a Character instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Character instance
   */
  static from(val?: string): Character {
    return new Character(val);
  }

  /**
   * Returns True if current Character is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  override less_than(other: Ordered): Boolean {
    if (other instanceof Character) {
      const thisVal = this.value || "";
      const otherVal = other.value || "";
      return new Boolean(thisVal < otherVal);
    }
    return new Boolean(false);
  }

  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (other instanceof Character) {
      const thisVal = this.value || "";
      const otherVal = other.value || "";
      return new Boolean(thisVal === otherVal);
    }
    return new Boolean(false);
  }
}

/**
 * Type representing minimal interface of built-in Boolean type.
 */
export class Boolean extends Any {
  /**
   * The underlying primitive value.
   */
  value?: boolean;

  /**
   * Creates a new Boolean instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: boolean) {
    super();
    this.value = val;
  }

  /**
   * Creates a Boolean instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Boolean instance
   */
  static from(val?: boolean): Boolean {
    return new Boolean(val);
  }

  /**
   * Compares this Boolean with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other: any): Boolean {
    if (other instanceof Boolean) {
      return new Boolean(this.value === other.value);
    }
    return new Boolean(false);
  }

  /**
   * Logical conjunction of this with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  conjunction(other: Boolean): Boolean {
    return new Boolean((this.value === true) && (other.value === true));
  }

  /**
   * Boolean semi-strict conjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  semistrict_conjunction(other: Boolean): Boolean {
    // Semi-strict: only evaluate other if this is true
    if (this.value !== true) {
      return new Boolean(false);
    }
    return new Boolean(other.value === true);
  }

  /**
   * Boolean disjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  disjunction(other: Boolean): Boolean {
    return new Boolean((this.value === true) || (other.value === true));
  }

  /**
   * Boolean semi-strict disjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  semistrict_disjunction(other: Boolean): Boolean {
    // Semi-strict: only evaluate other if this is false
    if (this.value === true) {
      return new Boolean(true);
    }
    return new Boolean(other.value === true);
  }

  /**
   * Boolean exclusive or with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  exclusive_disjunction(other: Boolean): Boolean {
    return new Boolean((this.value === true) !== (other.value === true));
  }

  /**
   * Boolean implication of \`_other_\` (semi-strict)
   * @param other - Parameter
   * @returns Result value
   */
  implication(other: Boolean): Boolean {
    // A implies B is equivalent to (not A) or B
    if (this.value !== true) {
      return new Boolean(true);
    }
    return new Boolean(other.value === true);
  }

  /**
   * Boolean negation of the current value.
   * @returns Result value
   */
  negation(): Boolean {
    return new Boolean(this.value !== true);
  }
}

/**
 * Type used to represent decimal numbers. Corresponds to a single-precision floating point value in most languages.
 */
export class Real extends Ordered_Numeric {
  /**
   * The underlying primitive value.
   */
  value?: number;

  /**
   * Creates a new Real instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: number) {
    super();
    this.value = val;
  }

  /**
   * Creates a Real instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Real instance
   */
  static from(val?: number): Real {
    return new Real(val);
  }

  /**
   * Return the greatest integer no greater than the value of this object.
   * @returns Result value
   */
  floor(): Integer {
    const thisVal = this.value || 0;
    return Integer.from(Math.floor(thisVal));
  }

  /**
   * Real number addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: number): number {
    const thisVal = this.value || 0;
    return thisVal + other;
  }

  /**
   * Real number subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: number): number {
    const thisVal = this.value || 0;
    return thisVal - other;
  }

  /**
   * Real number multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other: number): number {
    const thisVal = this.value || 0;
    return thisVal * other;
  }

  /**
   * Real number division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other: number): number {
    const thisVal = this.value || 0;
    if (other === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / other;
  }

  /**
   * Real number exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other: number): number {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }

  /**
   * Returns True if current Real is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: number): Boolean {
    const thisVal = this.value || 0;
    return new Boolean(thisVal < other);
  }

  /**
   * Generate negative of current Real value.
   * @returns Result value
   */
  negative(): number {
    const thisVal = this.value || 0;
    return -thisVal;
  }

  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other: number): Boolean {
    const thisVal = this.value || 0;
    return new Boolean(thisVal === other);
  }

  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other: number): Boolean {
    // For primitives, reference and value equality are the same
    return this.is_equal(other);
  }
}

/**
 * Type representing minimal interface of built-in Integer64 type.
 */
export class Integer64 extends Ordered_Numeric {
  /**
   * The underlying primitive value.
   */
  value?: number;

  /**
   * Creates a new Integer64 instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: number) {
    super();
    if (val !== undefined && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer64 value must be an integer, got: ${val}`);
    }
    this.value = val;
  }

  /**
   * Creates a Integer64 instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Integer64 instance
   */
  static from(val?: number): Integer64 {
    return new Integer64(val);
  }

  /**
   * Compares this Integer64 with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other: any): Boolean {
    if (other instanceof Integer64) {
      return new Boolean(this.value === other.value);
    }
    return new Boolean(false);
  }

  /**
   * Lexical comparison for large integers.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other: Ordered): Boolean {
    if (!(other instanceof Integer64)) {
      throw new Error("Cannot compare Integer64 with non-Integer64");
    }
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return new Boolean(thisVal < otherVal);
  }

  /**
   * Large integer addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other: Integer): Integer64 {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return Integer64.from(thisVal + otherVal);
  }

  /**
   * Large integer subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other: Integer): Integer64 {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return Integer64.from(thisVal - otherVal);
  }

  /**
   * Large integer multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other: Integer): Integer64 {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return Integer64.from(thisVal * otherVal);
  }

  /**
   * Large integer division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other: Integer): number {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Division by zero");
    }
    return thisVal / otherVal;
  }

  /**
   * Large integer exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other: number): number {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }

  /**
   * Large integer modulus.
   * @param mod - Parameter
   * @returns Result value
   */
  modulo(mod: Integer): Integer64 {
    const thisVal = this.value || 0;
    const modVal = mod.value || 1;
    if (modVal === 0) {
      throw new Error("Modulo by zero");
    }
    return Integer64.from(thisVal % modVal);
  }

  /**
   * Generate negative of current Integer value.
   * @returns Result value
   */
  negative(): Integer64 {
    return Integer64.from(-(this.value || 0));
  }

  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other: Integer64): Boolean {
    // Reference equality - same object
    return new Boolean(this === other);
  }
}

export class Byte extends Ordered {
  /**
   * The underlying primitive value.
   */
  value?: number;

  /**
   * Creates a new Byte instance.
   * @param val - The primitive value to wrap
   */
  constructor(val?: number) {
    super();
    if (
      val !== undefined && val !== null &&
      (!Number.isInteger(val) || val < 0 || val > 255)
    ) {
      throw new Error(
        `Byte value must be an integer between 0 and 255, got: ${val}`,
      );
    }
    this.value = val;
  }

  /**
   * Creates a Byte instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Byte instance
   */
  static from(val?: number): Byte {
    return new Byte(val);
  }

  /**
   * Compares this Byte with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other: any): boolean {
    if (other instanceof Byte) {
      return this.value === other.value;
    }
    return false;
  }
}

/**
 * Abstract ancestor of time-related classes.
 */
export abstract class Temporal extends Ordered {
}

/**
 * Definitions for date/time classes. Note that the timezone limits are set by where the international dateline is. Thus, time in New Zealand is quoted using \`+12:00\`, not \`-12:00\`.
 */
export class Time_Definitions {
  /**
   * True if \`y >= 0\`.
   *
   * TODO: Verify if this validation is sufficient. The openEHR specification
   * states y >= 0 is correct (no negative years, only 4-digit years assumed),
   * but this may need additional validation for:
   * - Maximum year value (e.g., 9999 for 4-digit constraint)
   * - Whether year 0 is historically/calendrically valid
   * See corresponding TODO in tasks/instructions/base/Time_Definitions.md
   *
   * @param y - Parameter
   * @returns Result value
   */
  valid_year(y: Integer): Boolean {
    const val = y.value || 0;
    return new Boolean(val >= 0);
  }

  /**
   * True if \`m >= 1 and m <= months_in_year\`.
   * @param m - Parameter
   * @returns Result value
   */
  valid_month(m: Integer): Boolean {
    const val = m.value || 0;
    return new Boolean(val >= 1 && val <= 12);
  }

  /**
   * True if \`d >= 1 and d <= days_in_month (m, y)\`.
   * @param y - Parameter
   * @param m - Parameter
   * @param d - Parameter
   * @returns Result value
   */
  valid_day(y: Integer, m: Integer, d: Integer): Boolean {
    const dVal = d.value || 0;
    const mVal = m.value || 1;
    const yVal = y.value || 0;

    if (dVal < 1) return new Boolean(false);

    // Days in each month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Check for leap year
    const isLeapYear = (yVal % 4 === 0 && yVal % 100 !== 0) ||
      (yVal % 400 === 0);
    if (isLeapYear && mVal === 2) {
      return new Boolean(dVal <= 29);
    }

    return new Boolean(dVal <= (daysInMonth[mVal - 1] || 31));
  }

  /**
   * True if \`(h >= 0 and h < Hours_in_day) or (h = Hours_in_day and m = 0 and s = 0)\` .
   * @param h - Parameter
   * @param m - Parameter
   * @param s - Parameter
   * @returns Result value
   */
  valid_hour(h: Integer, m: Integer, s: Integer): Boolean {
    const hVal = h.value || 0;
    const mVal = m.value || 0;
    const sVal = s.value || 0;

    // Normal hours: 0-23
    if (hVal >= 0 && hVal < 24) return new Boolean(true);

    // Special case: 24:00:00 is valid
    if (hVal === 24 && mVal === 0 && sVal === 0) return new Boolean(true);

    return new Boolean(false);
  }

  /**
   * True if \`m >= 0 and m < Minutes_in_hour\`.
   * @param m - Parameter
   * @returns Result value
   */
  valid_minute(m: Integer): Boolean {
    const val = m.value || 0;
    return new Boolean(val >= 0 && val < 60);
  }

  /**
   * True if \`s >= 0 and s < Seconds_in_minute\` .
   * @param s - Parameter
   * @returns Result value
   */
  valid_second(s: Integer): Boolean {
    const val = s.value || 0;
    return new Boolean(val >= 0 && val < 60);
  }

  /**
   * True if \`fs >= 0.0\` and \`fs < 1.0\` .
   * @param fs - Parameter
   * @returns Result value
   */
  valid_fractional_second(fs: number): Boolean {
    return new Boolean(fs >= 0.0 && fs < 1.0);
  }

  /**
   * String is a valid ISO 8601 date, i.e. takes the complete form:
   *
   * * \`YYYY-MM-DD\` (extended, preferred) or one of the partial forms \`YYYY-MM\` or \`YYYY\`
   * * \`YYYYMMDD\` (compact) or a partial variant \`YYYYMM\`.
   *
   * Where:
   *
   * * \`YYYY\` is the string form of any positive number in the range \`0000\` - \`9999\` (zero-filled to four digits)
   * * \`MM\` is \`01\` - \`12\` (zero-filled to two digits)
   * * \`DD\` is \`01\` - \`31\` (zero-filled to two digits)
   *
   * The combinations of \`YYYY\`, \`MM\`, \`DD\` numbers must be correct with respect to the Gregorian calendar.
   * @param s - Parameter
   * @returns Result value
   */
  valid_iso8601_date(s: String): Boolean {
    const val = s.value || "";

    // Extended format: YYYY-MM-DD, YYYY-MM, or YYYY
    const extendedPattern =
      /^(\d{4})(-((0[1-9]|1[0-2])(-([0-2]\d|3[01]))?)?)?$/;

    // Compact format: YYYYMMDD, YYYYMM, or YYYY
    const compactPattern = /^(\d{4})((0[1-9]|1[0-2])([0-2]\d|3[01])?)?$/;

    return new Boolean(
      extendedPattern.test(val) || compactPattern.test(val),
    );
  }

  /**
   * String is a valid ISO 8601 date, i.e. takes the form:
   *
   * * \`hh:mm:ss[(,|.)s+][Z|±hh[:mm]]\` (extended)
   * * \`hhmmss[(,|.)s+][Z|±hh[mm]]\` (compact)
   * * or one of the partial forms:
   * ** \`hh:mm\` (extended)
   * ** \`hhmm\` or \`hh\` (compact)
   *
   * with an additional optional timezone indicator of:
   *
   * * \`Z\` or \`±hh[:mm]\` (extended)  \`±hh[mm]\` (compact)
   *
   * Where:
   *
   * * \`hh\` is "00" - "23" (0-filled to two digits)
   * * \`mm\` is "00" - "59" (0-filled to two digits)
   * * \`ss\` is "00" - "60" (0-filled to two digits)
   * * \`[(,|.)s+]\` is an optional string consisting of a comma or decimal point followed by numeric string of 1 or more digits, representing a fractional second
   * * \`Z\` is a literal meaning UTC (modern replacement for GMT), i.e. timezone \`+0000\`
   *
   * @param s - Parameter
   * @returns Result value
   */
  valid_iso8601_time(s: String): Boolean {
    const val = s.value || "";

    // Pattern for ISO 8601 time with optional fractional seconds and timezone
    const timePattern =
      /^([01]\d|2[0-3]):?([0-5]\d)?:?([0-5]\d|60)?([.,]\d+)?(Z|[+-]([01]\d|2[0-3]):?([0-5]\d)?)?$/;

    return new Boolean(timePattern.test(val));
  }

  /**
   * String is a valid ISO 8601 date-time, i.e. takes the form:
   *
   * * \`YYYY-MM-DDThh:mm:ss[(,|.)s+][Z|±hh[:mm]]\` (extended)
   * * \`YYYYMMDDThhmmss[(,|.)s+][Z|±hh[mm]]\` (compact)
   * * or one of the partial forms:
   * ** \`YYYY-MM-DDThh:mm\` or \`YYYY-MM-DDThh\` (extended)
   * ** \`YYYYMMDDThhmm\` or \`YYYYMMDDThh\` (compact)
   * @param s - Parameter
   * @returns Result value
   */
  valid_iso8601_date_time(s: String): Boolean {
    const val = s.value || "";

    // Pattern for ISO 8601 date-time
    const dateTimePattern =
      /^(\d{4})-?(0[1-9]|1[0-2])-?([0-2]\d|3[01])T([01]\d|2[0-3]):?([0-5]\d)?:?([0-5]\d|60)?([.,]\d+)?(Z|[+-]([01]\d|2[0-3]):?([0-5]\d)?)?$/;

    return new Boolean(dateTimePattern.test(val));
  }

  /**
   * String is a valid ISO 8601 duration, i.e. takes the form:
   *
   * * \`P[nnY][nnM][nnW][nnD][T[nnH][nnM][nnS]]\`
   *
   * Where each nn represents a number of years, months, etc. \`nnW\` represents a number of 7-day weeks.
   *
   * Note: allowing the \`W\` designator in the same expression as other designators is an exception to the published standard, but necessary in clinical information (typically for representing pregnancy duration).
   * @param s - Parameter
   * @returns Result value
   */
  valid_iso8601_duration(s: String): Boolean {
    const val = s.value || "";

    // Pattern for ISO 8601 duration: P[nY][nM][nW][nD][T[nH][nM][nS]]
    const durationPattern =
      /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/;

    // Must start with P and have at least one component
    return new Boolean(durationPattern.test(val) && val.length > 1);
  }
}

/**
 * Abstract ancestor type of ISO 8601 types, defining interface for 'extended' and 'partial' concepts from ISO 8601.
 */
export abstract class Iso8601_type extends Temporal {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: String;

  /**
   * Representation of all descendants is a single String.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value(): String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * True if this date time is partial, i.e. if trailing end (right hand) value(s) is/are missing.
   * @returns Result value
   */
  abstract is_partial(): Boolean;

  /**
   * True if this ISO8601 string is in the 'extended' form, i.e. uses \`'-'\` and / or \`':'\` separators. This is the preferred format.
   * @returns Result value
   */
  abstract is_extended(): Boolean;
}

/**
 * Represents an ISO 8601 date/time, including partial and extended forms. Value may be:
 *
 * * \`YYYY-MM-DDThh:mm:ss[(,|.)sss][Z | ±hh[:mm]]\` (extended, preferred) or
 * * \`YYYYMMDDThhmmss[(,|.)sss][Z | ±hh[mm]]\` (compact)
 * * or a partial variant.
 *
 * See \`_valid_iso8601_date_time()_\` for validity.
 *
 * Note that this class includes 2 deviations from ISO 8601:2004:
 *
 * * for partial date/times, any part of the date/time up to the month may be missing, not just seconds and minutes as in the standard;
 * * the time \`24:00:00\` is not allowed, since it would mean the date was really on the next day.
 */
export class Iso8601_date_time extends Iso8601_type {
  /**
   * Extract the year part of the date as an Integer.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  year(): Integer {
    const val = this.value || "";
    try {
      // Try full date-time first
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.year);
    } catch {
      try {
        // Try just date part if full parse fails
        const match = val.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
        if (match && match[1]) {
          return Integer.from(parseInt(match[1], 10));
        }
      } catch {
        // Fall through
      }
    }
    return Integer.from(0);
  }

  /**
   * Extract the month part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  month(): Integer {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.month);
    } catch {
      try {
        const match = val.match(/^(\d{4})-?(\d{2})?/);
        if (match && match[2]) {
          return Integer.from(parseInt(match[2], 10));
        }
      } catch {
        // Fall through
      }
    }
    return Integer.from(0);
  }

  /**
   * Extract the day part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  day(): Integer {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.day);
    } catch {
      try {
        const match = val.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
        if (match && match[3]) {
          return Integer.from(parseInt(match[3], 10));
        }
      } catch {
        // Fall through
      }
    }
    return Integer.from(0);
  }

  /**
   * Extract the hour part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  hour(): Integer {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.hour);
    } catch {
      // Return 0 if parsing fails or no time component
    }
    return Integer.from(0);
  }

  /**
   * Extract the minute part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  minute(): Integer {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.minute);
    } catch {
      // Return 0 if parsing fails or no time component
    }
    return Integer.from(0);
  }

  /**
   * Extract the integral seconds part of the date/time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  second(): Integer {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.second);
    } catch {
      // Return 0 if parsing fails or no time component
    }
    return Integer.from(0);
  }

  /**
   * Extract the fractional seconds part of the date/time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  fractional_second(): number {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      // Temporal stores subsecond precision in millisecond, microsecond, and nanosecond fields
      // Convert to fractional seconds: milliseconds / 1000
      return dt.millisecond / 1000 + dt.microsecond / 1000000 +
        dt.nanosecond / 1000000000;
    } catch {
      // Return 0.0 if parsing fails
    }
    return 0.0;
  }

  /**
   * Timezone; may be Void.
   *
   * Uses Temporal API to extract timezone information.
   * @returns Result value
   */
  timezone(): Iso8601_timezone {
    const val = this.value || "";
    // Match timezone: Z or ±hh:mm or ±hhmm
    const match = val.match(/(Z|[+-]\d{2}:?\d{2})$/);
    if (match) {
      const tz = new Iso8601_timezone();
      tz.value = match[1];
      return tz;
    }
    throw new Error("No timezone present in date-time");
  }

  /**
   * Indicates whether month in year is unknown.
   * @returns Result value
   */
  month_unknown(): Boolean {
    return new Boolean(this.month().value === 0);
  }

  /**
   * Indicates whether day in month is unknown.
   * @returns Result value
   */
  day_unknown(): Boolean {
    return new Boolean(this.day().value === 0);
  }

  /**
   * Indicates whether minute in hour is known.
   * @returns Result value
   */
  minute_unknown(): Boolean {
    const val = this.value || "";
    // Check if time part exists with minutes
    return new Boolean(!val.includes("T") || this.minute().value === 0);
  }

  /**
   * Indicates whether minute in hour is known.
   * @returns Result value
   */
  second_unknown(): Boolean {
    const val = this.value || "";
    // Check if seconds are present in the string
    const hasSeconds = /T\d{2}:?\d{2}:?\d{2}/.test(val);
    return new Boolean(!hasSeconds);
  }

  /**
   * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
   * @returns Result value
   */
  is_decimal_sign_comma(): Boolean {
    const val = this.value || "";
    return new Boolean(val.includes(","));
  }

  /**
   * True if this date time is partial, i.e. if seconds or more is missing.
   * @returns Result value
   */
  is_partial(): Boolean {
    return this.second_unknown();
  }

  /**
   * True if this date/time uses \`'-'\`, \`':'\` separators.
   * @returns Result value
   */
  is_extended(): Boolean {
    const val = this.value || "";
    // Extended format uses '-' in date part and ':' in time part
    return new Boolean(val.includes("-") || val.includes(":"));
  }

  /**
   * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
   * @returns Result value
   */
  has_fractional_second(): Boolean {
    const val = this.value || "";
    // Check for comma or period after seconds
    return new Boolean(/T\d{2}:?\d{2}:?\d{2}[,.]/.test(val));
  }

  /**
   * Return the string value in extended format.
   *
   * Uses Temporal API to parse and format in extended ISO 8601 format.
   * @returns Result value
   */
  as_string(): String {
    const val = this.value || "";
    try {
      // Parse with Temporal and convert to extended format string
      const dt = TemporalAPI.PlainDateTime.from(val);
      return String.from(dt.toString());
    } catch {
      // If parsing fails, return original value
      return String.from(val);
    }
  }

  /**
   * Arithmetic addition of a duration to a date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff: Iso8601_duration): Iso8601_date_time {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = dt.add(dur);
      const newDateTime = new Iso8601_date_time();
      newDateTime.value = result.toString();
      return newDateTime;
    } catch (e) {
      throw new Error(`Failed to add duration to date_time: ${e}`);
    }
  }

  /**
   * Arithmetic subtraction of a duration from a date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff: Iso8601_duration): Iso8601_date_time {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = dt.subtract(dur);
      const newDateTime = new Iso8601_date_time();
      newDateTime.value = result.toString();
      return newDateTime;
    } catch (e) {
      throw new Error(`Failed to subtract duration from date_time: ${e}`);
    }
  }

  /**
   * Difference of two date/times.
   * @param a_date_time - Parameter
   * @returns Result value
   */
  diff(a_date_time: Iso8601_date_time): Iso8601_duration {
    const val = this.value || "";
    const otherVal = a_date_time.value || "";
    try {
      const dt1 = TemporalAPI.PlainDateTime.from(val);
      const dt2 = TemporalAPI.PlainDateTime.from(otherVal);
      const diff = dt1.since(dt2);
      const duration = new Iso8601_duration();
      duration.value = diff.toString();
      return duration;
    } catch (e) {
      throw new Error(`Failed to calculate difference: ${e}`);
    }
  }

  /**
   * Addition of nominal duration represented by \`_a_diff_\`. See \`Iso8601_date._add_nominal_()\` for semantics.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add_nominal(a_diff: Iso8601_duration): Iso8601_date {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = dt.add(dur);
      const newDateTime = new Iso8601_date();
      newDateTime.value = result.toPlainDate().toString();
      return newDateTime;
    } catch (e) {
      throw new Error(`Failed to add nominal duration: ${e}`);
    }
  }

  /**
   * Subtraction of nominal duration represented by \`_a_diff_\`. See \`_add_nominal_()\` for semantics.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract_nominal(a_diff: Iso8601_duration): Iso8601_date {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = dt.subtract(dur);
      const newDateTime = new Iso8601_date();
      newDateTime.value = result.toPlainDate().toString();
      return newDateTime;
    } catch (e) {
      throw new Error(`Failed to subtract nominal duration: ${e}`);
    }
  }
}

/**
 * Represents an ISO 8601 duration, which may have multiple parts from years down to seconds. The \`_value_\` attribute is a String in the format:
 *
 * * \`P[nnY][nnM][nnW][nnD][T[nnH][nnM][nnS]]\`
 *
 * NOTE: two deviations from ISO 8601 are supported, the first, to allow a negative sign, and the second allowing the 'W' designator to be mixed with other designators.
 */
export class Iso8601_duration extends Iso8601_type {
  /**
   * Helper method to convert openEHR duration with weeks to standard ISO 8601.
   * OpenEHR allows weeks to be mixed with other designators, but Temporal API doesn't.
   * This converts weeks to days (1W = 7D).
   * @param value - Duration string that may contain weeks
   * @returns Duration string with weeks converted to days
   */
  static normalizeWeeks(value: string): string {
    // Match weeks designator: nW or nnnW
    const weeksMatch = value.match(/(\d+(?:\.\d+)?)W/);
    if (!weeksMatch) return value;

    const weeks = parseFloat(weeksMatch[1]);
    const days = weeks * 7;

    // Remove the weeks component
    let normalized = value.replace(/\d+(?:\.\d+)?W/, "");

    // Add days to existing days or insert days
    const daysMatch = normalized.match(/(\d+(?:\.\d+)?)D/);
    if (daysMatch) {
      const existingDays = parseFloat(daysMatch[1]);
      const totalDays = existingDays + days;
      normalized = normalized.replace(/\d+(?:\.\d+)?D/, `${totalDays}D`);
    } else {
      // Insert days before T (time) or at end if no time component
      if (normalized.includes("T")) {
        normalized = normalized.replace("T", `${days}DT`);
      } else {
        // Add days before the end
        normalized = normalized.replace(/P(.*)$/, `P$1${days}D`);
      }
    }

    return normalized;
  }

  /**
   * Returns True.
   * @returns Result value
   */
  is_extended(): Boolean {
    return new Boolean(true);
  }

  /**
   * Returns False.
   * @returns Result value
   */
  is_partial(): Boolean {
    return new Boolean(false);
  }

  /**
   * Number of years in the \`_value_\`, i.e. the number preceding the \`'Y'\` in the \`'YMD'\` part, if one exists.
   * @returns Result value
   */
  years(): Integer {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return Integer.from(dur.years || 0);
    } catch {
      return Integer.from(0);
    }
  }

  /**
   * Number of months in the \`_value_\`, i.e. the value preceding the \`'M'\` in the \`'YMD'\` part, if one exists.
   * @returns Result value
   */
  months(): Integer {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return Integer.from(dur.months || 0);
    } catch {
      return Integer.from(0);
    }
  }

  /**
   * Number of days in the \`_value_\`, i.e. the number preceding the \`'D'\` in the \`'YMD'\` part, if one exists.
   * Note: This returns only the D component, not converted weeks.
   * @returns Result value
   */
  days(): Integer {
    const val = this.value || "";
    try {
      // Normalize weeks to days for parsing, then extract days
      const normalized = Iso8601_duration.normalizeWeeks(val);
      const dur = TemporalAPI.Duration.from(normalized);
      return Integer.from(dur.days || 0);
    } catch {
      // Fallback: try to extract days directly
      const daysMatch = val.match(/(\d+(?:\.\d+)?)D/);
      if (daysMatch) {
        return Integer.from(Math.floor(parseFloat(daysMatch[1])));
      }
      return Integer.from(0);
    }
  }

  /**
   * Number of hours in the \`_value_\`, i.e. the number preceding the \`'H'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  hours(): Integer {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return Integer.from(dur.hours || 0);
    } catch {
      return Integer.from(0);
    }
  }

  /**
   * Number of minutes in the \`_value_\`, i.e. the number preceding the \`'M'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  minutes(): Integer {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return Integer.from(dur.minutes || 0);
    } catch {
      return Integer.from(0);
    }
  }

  /**
   * Number of seconds in the \`_value_\`, i.e. the integer number preceding the \`'S'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  seconds(): Integer {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return Integer.from(dur.seconds || 0);
    } catch {
      return Integer.from(0);
    }
  }

  /**
   * Fractional seconds in the \`_value_\`, i.e. the decimal part of the number preceding the \`'S'\` in the \`'HMS'\` part, if one exists.
   * @returns Result value
   */
  fractional_seconds(): number {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return (dur.milliseconds || 0) / 1000 +
        (dur.microseconds || 0) / 1000000 + (dur.nanoseconds || 0) / 1000000000;
    } catch {
      return 0.0;
    }
  }

  /**
   * Number of weeks in the \`_value_\`, i.e. the value preceding the \`W\`, if one exists.
   * @returns Result value
   */
  weeks(): Integer {
    const val = this.value || "";
    // Extract weeks directly from the string since openEHR allows mixed W with other designators
    const weeksMatch = val.match(/(\d+(?:\.\d+)?)W/);
    if (weeksMatch) {
      return Integer.from(Math.floor(parseFloat(weeksMatch[1])));
    }
    return Integer.from(0);
  }

  /**
   * True if this time has a decimal part indicated by ',' (comma) rather than '.' (period).
   * @returns Result value
   */
  is_decimal_sign_comma(): Boolean {
    const val = this.value || "";
    return new Boolean(val.includes(","));
  }

  /**
   * Total number of seconds equivalent (including fractional) of entire duration. Where non-definite elements such as year and month (i.e. 'Y' and 'M') are included, the corresponding 'average' durations from \`Time_definitions\` are used to compute the result.
   * @returns Result value
   */
  to_seconds(): number {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      // Note: For year/month, we use approximate values (not calendar-aware)
      const totalSeconds = (dur.years || 0) * 31536000 +
        (dur.months || 0) * 2592000 +
        (dur.weeks || 0) * 604800 + (dur.days || 0) * 86400 +
        (dur.hours || 0) * 3600 + (dur.minutes || 0) * 60 + (dur.seconds || 0) +
        (dur.milliseconds || 0) / 1000 + (dur.microseconds || 0) / 1000000 +
        (dur.nanoseconds || 0) / 1000000000;
      return totalSeconds;
    } catch {
      return 0.0;
    }
  }

  /**
   * Return the duration string value.
   * @returns Result value
   */
  as_string(): String {
    const val = this.value || "";
    try {
      // Parse and normalize the duration string
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(val),
      );
      return String.from(dur.toString());
    } catch {
      // If parsing fails, return original value
      return String.from(val);
    }
  }

  /**
   * Arithmetic addition of a duration to a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
   * @param a_val - Parameter
   * @returns Result value
   */
  add(a_val: Iso8601_duration): Iso8601_duration {
    const val = this.value || "";
    const otherVal = a_val.value || "";
    try {
      const dur1 = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(val),
      );
      const dur2 = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(otherVal),
      );
      const result = dur1.add(dur2);
      const newDuration = new Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e) {
      throw new Error(`Failed to add durations: ${e}`);
    }
  }

  /**
   * Arithmetic subtraction of a duration from a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
   * @param a_val - Parameter
   * @returns Result value
   */
  subtract(a_val: Iso8601_duration): Iso8601_duration {
    const val = this.value || "";
    const otherVal = a_val.value || "";
    try {
      const dur1 = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(val),
      );
      const dur2 = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(otherVal),
      );
      const result = dur1.subtract(dur2);
      const newDuration = new Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e) {
      throw new Error(`Failed to subtract durations: ${e}`);
    }
  }

  /**
   * Arithmetic multiplication a duration by a number.
   * @param a_val - Parameter
   * @returns Result value
   */
  multiply(a_val: number): Iso8601_duration {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(val),
      );
      // Multiply each component of the duration
      const result = dur.add(dur.negated()).add({
        years: dur.years * a_val,
        months: dur.months * a_val,
        weeks: dur.weeks * a_val,
        days: dur.days * a_val,
        hours: dur.hours * a_val,
        minutes: dur.minutes * a_val,
        seconds: dur.seconds * a_val,
        milliseconds: dur.milliseconds * a_val,
        microseconds: dur.microseconds * a_val,
        nanoseconds: dur.nanoseconds * a_val,
      });
      const newDuration = new Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e) {
      throw new Error(`Failed to multiply duration: ${e}`);
    }
  }

  /**
   * Arithmetic division of a duration by a number.
   * @param a_val - Parameter
   * @returns Result value
   */
  divide(a_val: number): Iso8601_duration {
    if (a_val === 0) {
      throw new Error("Division by zero");
    }
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(val),
      );
      // Divide each component of the duration
      const result = dur.add(dur.negated()).add({
        years: dur.years / a_val,
        months: dur.months / a_val,
        weeks: dur.weeks / a_val,
        days: dur.days / a_val,
        hours: dur.hours / a_val,
        minutes: dur.minutes / a_val,
        seconds: dur.seconds / a_val,
        milliseconds: dur.milliseconds / a_val,
        microseconds: dur.microseconds / a_val,
        nanoseconds: dur.nanoseconds / a_val,
      });
      const newDuration = new Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e) {
      throw new Error(`Failed to divide duration: ${e}`);
    }
  }

  /**
   * Generate negative of current duration value.
   * @returns Result value
   */
  negative(): Iso8601_duration {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(val),
      );
      const result = dur.negated();
      const newDuration = new Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e) {
      throw new Error(`Failed to negate duration: ${e}`);
    }
  }
}

/**
 * Represents an ISO 8601 time, including partial and extended forms. Value may be:
 *
 * * \`hh:mm:ss[(,|.)sss][Z|±hh[:mm]]\` (extended, preferred) or
 * * \`hhmmss[(,|.)sss][Z|±hh[mm]]\` (compact)
 * * or a partial invariant.
 *
 * See \`_valid_iso8601_time()_\` for validity.
 *
 * NOTE: A small deviation to the ISO 8601:2004 standard in this class is that the time \`24:00:00\` is not allowed, for consistency with \`Iso8601_date_time\`.
 */
export class Iso8601_time extends Iso8601_type {
  /**
   * Extract the hour part of the date/time as an Integer.
   * @returns Result value
   */
  hour(): Integer {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return Integer.from(time.hour);
    } catch {
      // Try to parse just hour from partial time
      const match = val.match(/^(\d{2})/);
      if (match) {
        return Integer.from(parseInt(match[1], 10));
      }
    }
    return Integer.from(0);
  }

  /**
   * Extract the minute part of the time as an Integer, or return 0 if not present.
   * @returns Result value
   */
  minute(): Integer {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return Integer.from(time.minute);
    } catch {
      // Return 0 if parsing fails or no minute component
    }
    return Integer.from(0);
  }

  /**
   * Extract the integral seconds part of the time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
   * @returns Result value
   */
  second(): Integer {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return Integer.from(time.second);
    } catch {
      // Return 0 if parsing fails or no second component
    }
    return Integer.from(0);
  }

  /**
   * Extract the fractional seconds part of the time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
   * @returns Result value
   */
  fractional_second(): number {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      // Temporal stores subsecond precision in millisecond, microsecond, and nanosecond fields
      return time.millisecond / 1000 + time.microsecond / 1000000 +
        time.nanosecond / 1000000000;
    } catch {
      // Return 0.0 if parsing fails
    }
    return 0.0;
  }

  /**
   * Timezone; may be Void.
   * @returns Result value
   */
  timezone(): Iso8601_timezone {
    const val = this.value || "";
    const match = val.match(/(Z|[+-]\d{2}:?\d{2})$/);
    if (match) {
      const tz = new Iso8601_timezone();
      tz.value = match[1];
      return tz;
    }
    throw new Error("No timezone present in time");
  }

  /**
   * Indicates whether minute is unknown. If so, the time is of the form “hh”.
   * @returns Result value
   */
  minute_unknown(): Boolean {
    const val = this.value || "";
    const hasMinutes = /^\d{2}:?\d{2}/.test(val);
    return new Boolean(!hasMinutes);
  }

  /**
   * Indicates whether second is unknown. If so and month is known, the time is of the form \`"hh:mm"\` or \`"hhmm"\`.
   * @returns Result value
   */
  second_unknown(): Boolean {
    const val = this.value || "";
    const hasSeconds = /^\d{2}:?\d{2}:?\d{2}/.test(val);
    return new Boolean(!hasSeconds);
  }

  /**
   * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
   * @returns Result value
   */
  is_decimal_sign_comma(): Boolean {
    const val = this.value || "";
    return new Boolean(val.includes(","));
  }

  /**
   * True if this time is partial, i.e. if seconds or more is missing.
   * @returns Result value
   */
  is_partial(): Boolean {
    return this.second_unknown();
  }

  /**
   * True if this time uses \`'-'\`, \`':'\` separators.
   * @returns Result value
   */
  is_extended(): Boolean {
    const val = this.value || "";
    return new Boolean(val.includes(":"));
  }

  /**
   * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
   * @returns Result value
   */
  has_fractional_second(): Boolean {
    const val = this.value || "";
    return new Boolean(/\d{2}[,.]/.test(val));
  }

  /**
   * Return string value in extended format.
   * @returns Result value
   */
  as_string(): String {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return String.from(time.toString());
    } catch {
      return String.from(val);
    }
  }

  /**
   * Arithmetic addition of a duration to a time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff: Iso8601_duration): Iso8601_time {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = time.add(dur);
      const newTime = new Iso8601_time();
      newTime.value = result.toString();
      return newTime;
    } catch (e) {
      throw new Error(`Failed to add duration to time: ${e}`);
    }
  }

  /**
   * Arithmetic subtraction of a duration from a time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff: Iso8601_duration): Iso8601_time {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = time.subtract(dur);
      const newTime = new Iso8601_time();
      newTime.value = result.toString();
      return newTime;
    } catch (e) {
      throw new Error(`Failed to subtract duration from time: ${e}`);
    }
  }

  /**
   * Difference of two times.
   * @param a_time - Parameter
   * @returns Result value
   */
  diff(a_time: Iso8601_time): Iso8601_duration {
    const val = this.value || "";
    const otherVal = a_time.value || "";
    try {
      const time1 = TemporalAPI.PlainTime.from(val);
      const time2 = TemporalAPI.PlainTime.from(otherVal);
      const diff = time1.since(time2);
      const duration = new Iso8601_duration();
      duration.value = diff.toString();
      return duration;
    } catch (e) {
      throw new Error(`Failed to calculate time difference: ${e}`);
    }
  }
}

/**
 * Represents an ISO 8601 date, including partial and extended forms. Value may be:
 *
 * * \`YYYY-MM-DD\` (extended, preferred)
 * * \`YYYYMMDD\` (compact)
 * * a partial invariant.
 *
 * See \`Time_definitions._valid_iso8601_date()_\` for validity.
 */
export class Iso8601_date extends Iso8601_type {
  /**
   * Extract the year part of the date as an Integer.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  year(): Integer {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return Integer.from(date.year);
    } catch {
      // Try to parse just year from partial date (YYYY)
      const match = val.match(/^(\d{4})/);
      if (match) {
        return Integer.from(parseInt(match[1], 10));
      }
    }
    return Integer.from(0);
  }

  /**
   * Extract the month part of the date as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  month(): Integer {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return Integer.from(date.month);
    } catch {
      // Try PlainYearMonth for partial dates
      try {
        const ym = TemporalAPI.PlainYearMonth.from(val);
        return Integer.from(ym.month);
      } catch {
        // Return 0 if no month present
      }
    }
    return Integer.from(0);
  }

  /**
   * Extract the day part of the date as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  day(): Integer {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return Integer.from(date.day);
    } catch {
      // Return 0 if parsing fails or no day component
    }
    return Integer.from(0);
  }

  /**
   * Timezone; may be Void.
   *
   * NOTE: ISO 8601 dates typically don't have timezones, but this checks for them.
   * @returns Result value
   */
  timezone(): Iso8601_timezone {
    const val = this.value || "";
    // Match timezone: Z or ±hh:mm or ±hhmm (rare for pure dates)
    const match = val.match(/(Z|[+-]\d{2}:?\d{2})$/);
    if (match) {
      const tz = new Iso8601_timezone();
      tz.value = match[1];
      return tz;
    }
    throw new Error("No timezone present in date");
  }

  /**
   * Indicates whether month in year is unknown. If so, the date is of the form \`"YYYY"\`.
   * @returns Result value
   */
  month_unknown(): Boolean {
    return new Boolean(this.month().value === 0);
  }

  /**
   * Indicates whether day in month is unknown. If so, and month is known, the date is of the form \`"YYYY-MM"\` or \`"YYYYMM"\`.
   * @returns Result value
   */
  day_unknown(): Boolean {
    return new Boolean(this.day().value === 0);
  }

  /**
   * True if this date is partial, i.e. if days or more is missing.
   * @returns Result value
   */
  is_partial(): Boolean {
    return this.day_unknown();
  }

  /**
   * True if this date uses \`'-'\` separators.
   * @returns Result value
   */
  is_extended(): Boolean {
    const val = this.value || "";
    return new Boolean(val.includes("-"));
  }

  /**
   * Return string value in extended format.
   *
   * Uses Temporal API to parse and format in extended ISO 8601 format.
   * @returns Result value
   */
  as_string(): String {
    const val = this.value || "";
    try {
      // Try full date first
      const date = TemporalAPI.PlainDate.from(val);
      return String.from(date.toString());
    } catch {
      try {
        // Try year-month
        const ym = TemporalAPI.PlainYearMonth.from(val);
        return String.from(ym.toString());
      } catch {
        // Return original if parsing fails
        return String.from(val);
      }
    }
  }

  /**
   * Arithmetic addition of a duration to a date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff: Iso8601_duration): Iso8601_date {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = date.add(dur);
      const newDate = new Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e) {
      throw new Error(`Failed to add duration to date: ${e}`);
    }
  }

  /**
   * Arithmetic subtraction of a duration from a date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract(a_diff: Iso8601_duration): Iso8601_date {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      const result = date.subtract(dur);
      const newDate = new Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e) {
      throw new Error(`Failed to subtract duration from date: ${e}`);
    }
  }

  /**
   * Difference of two dates.
   * @param a_date - Parameter
   * @returns Result value
   */
  diff(a_date: Iso8601_date): Iso8601_duration {
    const val = this.value || "";
    const otherVal = a_date.value || "";
    try {
      const date1 = TemporalAPI.PlainDate.from(val);
      const date2 = TemporalAPI.PlainDate.from(otherVal);
      const diff = date1.since(date2);
      const duration = new Iso8601_duration();
      duration.value = diff.toString();
      return duration;
    } catch (e) {
      throw new Error(`Failed to calculate date difference: ${e}`);
    }
  }

  /**
   * Addition of nominal duration represented by \`_a_diff_\`. For example, a duration of \`'P1Y'\` means advance to the same date next year, with the exception of the date 29 February in a leap year, to which the addition of a nominal year will result in 28 February of the following year. Similarly, \`'P1M'\` is understood here as a nominal month, the addition of which will result in one of:
   *
   * * the same day in the following month, if it exists, or;
   * * one or two days less where the following month is shorter, or;
   * * in the case of adding a month to the date 31 Jan, the result will be 28 Feb in a non-leap year (i.e. three less) and 29 Feb in a leap year (i.e. two less).
   * @param a_diff - Parameter
   * @returns Result value
   */
  add_nominal(a_diff: Iso8601_duration): Iso8601_date {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      // Use Temporal's constrain overflow to get calendar semantics
      const result = date.add(dur, { overflow: "constrain" });
      const newDate = new Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e) {
      throw new Error(`Failed to add nominal duration to date: ${e}`);
    }
  }

  /**
   * Subtraction of nominal duration represented by \`_a_diff_\`. See \`_add_nominal_()\` for semantics.
   * @param a_diff - Parameter
   * @returns Result value
   */
  subtract_nominal(a_diff: Iso8601_duration): Iso8601_date {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal),
      );
      // Use Temporal's constrain overflow to get calendar semantics
      const result = date.subtract(dur, { overflow: "constrain" });
      const newDate = new Iso8601_date();
      newDate.value = result.toString();
      return newDate;
    } catch (e) {
      throw new Error(`Failed to subtract nominal duration from date: ${e}`);
    }
  }

  /**
   * Compares this date with another for ordering.
   * @param other - The object to compare with
   * @returns true if this date is less than the other
   */
  override less_than(other: Ordered): Boolean {
    if (!(other instanceof Iso8601_date)) {
      return new Boolean(false);
    }
    
    const val = this.value || "";
    const otherVal = other.value || "";
    
    try {
      const date1 = TemporalAPI.PlainDate.from(val);
      const date2 = TemporalAPI.PlainDate.from(otherVal);
      return new Boolean(TemporalAPI.PlainDate.compare(date1, date2) < 0);
    } catch {
      // Fallback to string comparison if parsing fails
      return new Boolean(val < otherVal);
    }
  }

  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (!(other instanceof Iso8601_date)) {
      return new Boolean(false);
    }
    
    const val = this.value || "";
    const otherVal = other.value || "";
    
    try {
      const date1 = TemporalAPI.PlainDate.from(val);
      const date2 = TemporalAPI.PlainDate.from(otherVal);
      return new Boolean(TemporalAPI.PlainDate.compare(date1, date2) === 0);
    } catch {
      // Fallback to string comparison if parsing fails
      return new Boolean(val === otherVal);
    }
  }
}

/**
 * Interval abstraction, featuring upper and lower limits that may be open or closed, included or not included.
 */
export abstract class Interval<T extends Ordered> extends Any {
  /**
   * Lower bound.
   */
  lower?: T;
  /**
   * Upper bound.
   */
  upper?: T;
  /**
   * Internal storage for lower_unbounded
   * @protected
   */
  protected _lower_unbounded?: Boolean;

  /**
   * True if \`_lower_\` boundary open (i.e. = \`-infinity\`).
   */
  get lower_unbounded(): boolean | undefined {
    return this._lower_unbounded?.value;
  }

  /**
   * Gets the Boolean wrapper object for lower_unbounded.
   * Use this to access Boolean methods.
   */
  get $lower_unbounded(): Boolean | undefined {
    return this._lower_unbounded;
  }

  /**
   * Sets lower_unbounded from either a primitive value or Boolean wrapper.
   */
  set lower_unbounded(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._lower_unbounded = undefined;
    } else if (typeof val === "boolean") {
      this._lower_unbounded = Boolean.from(val);
    } else {
      this._lower_unbounded = val;
    }
  }

  /**
   * Internal storage for upper_unbounded
   * @protected
   */
  protected _upper_unbounded?: Boolean;

  /**
   * True if \`_upper_\` boundary open (i.e. = \`+infinity\`).
   */
  get upper_unbounded(): boolean | undefined {
    return this._upper_unbounded?.value;
  }

  /**
   * Gets the Boolean wrapper object for upper_unbounded.
   * Use this to access Boolean methods.
   */
  get $upper_unbounded(): Boolean | undefined {
    return this._upper_unbounded;
  }

  /**
   * Sets upper_unbounded from either a primitive value or Boolean wrapper.
   */
  set upper_unbounded(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._upper_unbounded = undefined;
    } else if (typeof val === "boolean") {
      this._upper_unbounded = Boolean.from(val);
    } else {
      this._upper_unbounded = val;
    }
  }

  /**
   * Internal storage for lower_included
   * @protected
   */
  protected _lower_included?: Boolean;

  /**
   * True if \`_lower_\` boundary value included in range, if \`not _lower_unbounded_\`.
   */
  get lower_included(): boolean | undefined {
    return this._lower_included?.value;
  }

  /**
   * Gets the Boolean wrapper object for lower_included.
   * Use this to access Boolean methods.
   */
  get $lower_included(): Boolean | undefined {
    return this._lower_included;
  }

  /**
   * Sets lower_included from either a primitive value or Boolean wrapper.
   */
  set lower_included(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._lower_included = undefined;
    } else if (typeof val === "boolean") {
      this._lower_included = Boolean.from(val);
    } else {
      this._lower_included = val;
    }
  }

  /**
   * Internal storage for upper_included
   * @protected
   */
  protected _upper_included?: Boolean;

  /**
   * True if \`_upper_\` boundary value included in range if \`not _upper_unbounded_\`.
   */
  get upper_included(): boolean | undefined {
    return this._upper_included?.value;
  }

  /**
   * Gets the Boolean wrapper object for upper_included.
   * Use this to access Boolean methods.
   */
  get $upper_included(): Boolean | undefined {
    return this._upper_included;
  }

  /**
   * Sets upper_included from either a primitive value or Boolean wrapper.
   */
  set upper_included(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._upper_included = undefined;
    } else if (typeof val === "boolean") {
      this._upper_included = Boolean.from(val);
    } else {
      this._upper_included = val;
    }
  }

  /**
   * True if the value \`e\` is properly contained in this Interval.
   * @param e - Parameter
   * @returns Result value
   */
  abstract has(e: T): Boolean;

  /**
   * True if there is any overlap between intervals represented by Current and \`_other_\`. True if at least one limit of \`_other_\` is strictly inside the limits of this interval.
   * @param other - Parameter
   * @returns Result value
   */
  abstract intersects(other: Interval<T>): Boolean;

  /**
   * True if current interval properly contains \`_other_\`? True if all points of \`_other_\` are inside the current interval.
   * @param other - Parameter
   * @returns Result value
   */
  abstract contains(other: Interval<T>): Boolean;

  /**
   * True if current object's interval is semantically same as \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (!(other instanceof Interval)) {
      return new Boolean(false);
    }
    
    const otherInterval = other as Interval<T>;
    
    // Compare lower bounds
    if (this.lower_unbounded !== otherInterval.lower_unbounded) {
      return new Boolean(false);
    }
    if (!this.lower_unbounded) {
      if (this.lower === undefined || otherInterval.lower === undefined) {
        return new Boolean(false);
      }
      if (!this.lower.is_equal(otherInterval.lower).value) {
        return new Boolean(false);
      }
      if (this.lower_included !== otherInterval.lower_included) {
        return new Boolean(false);
      }
    }
    
    // Compare upper bounds
    if (this.upper_unbounded !== otherInterval.upper_unbounded) {
      return new Boolean(false);
    }
    if (!this.upper_unbounded) {
      if (this.upper === undefined || otherInterval.upper === undefined) {
        return new Boolean(false);
      }
      if (!this.upper.is_equal(otherInterval.upper).value) {
        return new Boolean(false);
      }
      if (this.upper_included !== otherInterval.upper_included) {
        return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }
}

/**
 * Type representing a 'proper' Interval, i.e. any two-sided or one-sided interval.
 */
export class Proper_interval<T extends Ordered> extends Interval<T> {
  /**
   * True if the value \`e\` is properly contained in this Interval.
   * @param e - Parameter
   * @returns Result value
   */
  override has(e: T): Boolean {
    // Check lower bound
    if (!this.lower_unbounded && this.lower !== undefined) {
      const cmp = e.less_than(this.lower);
      if (cmp.value === true) return new Boolean(false);
      
      if (!this.lower_included) {
        const eq = e.is_equal(this.lower);
        if (eq.value === true) return new Boolean(false);
      }
    }
    
    // Check upper bound
    if (!this.upper_unbounded && this.upper !== undefined) {
      const cmp = this.upper.less_than(e);
      if (cmp.value === true) return new Boolean(false);
      
      if (!this.upper_included) {
        const eq = e.is_equal(this.upper);
        if (eq.value === true) return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }

  /**
   * True if there is any overlap between intervals represented by Current and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  override intersects(other: Interval<T>): Boolean {
    // Check if one interval is completely before the other
    if (!this.upper_unbounded && this.upper !== undefined &&
        !other.lower_unbounded && other.lower !== undefined) {
      if (this.upper.less_than(other.lower).value) {
        return new Boolean(false);
      }
      // Check boundary conditions
      if (this.upper.is_equal(other.lower).value &&
          (!this.upper_included || !other.lower_included)) {
        return new Boolean(false);
      }
    }
    
    if (!other.upper_unbounded && other.upper !== undefined &&
        !this.lower_unbounded && this.lower !== undefined) {
      if (other.upper.less_than(this.lower).value) {
        return new Boolean(false);
      }
      // Check boundary conditions
      if (other.upper.is_equal(this.lower).value &&
          (!other.upper_included || !this.lower_included)) {
        return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }

  /**
   * True if current interval properly contains \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  override contains(other: Interval<T>): Boolean {
    // Check lower bound containment
    if (!other.lower_unbounded && other.lower !== undefined) {
      if (this.lower_unbounded) {
        // This is unbounded below, so it contains other's lower
      } else if (this.lower === undefined) {
        return new Boolean(false);
      } else {
        if (this.lower.less_than(other.lower).value) {
          // OK
        } else if (this.lower.is_equal(other.lower).value) {
          // Equal bounds - check inclusion
          if (!this.lower_included && other.lower_included) {
            return new Boolean(false);
          }
        } else {
          return new Boolean(false);
        }
      }
    }
    
    // Check upper bound containment
    if (!other.upper_unbounded && other.upper !== undefined) {
      if (this.upper_unbounded) {
        // This is unbounded above, so it contains other's upper
      } else if (this.upper === undefined) {
        return new Boolean(false);
      } else {
        if (other.upper.less_than(this.upper).value) {
          // OK
        } else if (this.upper.is_equal(other.upper).value) {
          // Equal bounds - check inclusion
          if (!this.upper_included && other.upper_included) {
            return new Boolean(false);
          }
        } else {
          return new Boolean(false);
        }
      }
    }
    
    return new Boolean(true);
  }
}

/**
 * An Interval of Integer, used to represent multiplicity, cardinality and optionality in models.
 */
export class Multiplicity_interval extends Proper_interval<Integer> {
  /**
   * True if this interval imposes no constraints, i.e. is set to \`0..*\`.
   * @returns Result value
   */
  is_open(): Boolean {
    // Check if lower = 0 and upper is unbounded
    const lowerVal = this.lower?.value || 0;
    return new Boolean(
      lowerVal === 0 && this.upper_unbounded === true,
    );
  }

  /**
   * True if this interval expresses optionality, i.e. \`0..1\`.
   * @returns Result value
   */
  is_optional(): Boolean {
    // Check if lower = 0 and upper = 1
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean(
      lowerVal === 0 && upperVal === 1,
    );
  }

  /**
   * True if this interval expresses mandation, i.e. \`1..1\`.
   * @returns Result value
   */
  is_mandatory(): Boolean {
    // Check if lower = 1 and upper = 1
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean(
      lowerVal === 1 && upperVal === 1,
    );
  }

  /**
   * True if this interval is set to \`0..0\`.
   * @returns Result value
   */
  is_prohibited(): Boolean {
    // Check if lower = 0 and upper = 0
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean(
      lowerVal === 0 && upperVal === 0,
    );
  }
}

/**
 * Express constraints on the cardinality of container objects which are the values of multiply-valued attributes, including uniqueness and ordering, providing the means to state that a container acts like a logical list, set or bag.
 */
export class Cardinality {
  /**
   * The interval of this cardinality.
   */
  interval?: Multiplicity_interval;
  /**
   * Internal storage for is_ordered
   * @protected
   */
  protected _is_ordered?: Boolean;

  /**
   * True if the members of the container attribute to which this cardinality refers are ordered.
   */
  get is_ordered(): boolean | undefined {
    return this._is_ordered?.value;
  }

  /**
   * Gets the Boolean wrapper object for is_ordered.
   * Use this to access Boolean methods.
   */
  get $is_ordered(): Boolean | undefined {
    return this._is_ordered;
  }

  /**
   * Sets is_ordered from either a primitive value or Boolean wrapper.
   */
  set is_ordered(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_ordered = undefined;
    } else if (typeof val === "boolean") {
      this._is_ordered = Boolean.from(val);
    } else {
      this._is_ordered = val;
    }
  }

  /**
   * Internal storage for is_unique
   * @protected
   */
  protected _is_unique?: Boolean;

  /**
   * True if the members of the container attribute to which this cardinality refers are unique.
   */
  get is_unique(): boolean | undefined {
    return this._is_unique?.value;
  }

  /**
   * Gets the Boolean wrapper object for is_unique.
   * Use this to access Boolean methods.
   */
  get $is_unique(): Boolean | undefined {
    return this._is_unique;
  }

  /**
   * Sets is_unique from either a primitive value or Boolean wrapper.
   */
  set is_unique(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_unique = undefined;
    } else if (typeof val === "boolean") {
      this._is_unique = Boolean.from(val);
    } else {
      this._is_unique = val;
    }
  }

  /**
   * True if the semantics of this cardinality represent a bag, i.e. unordered, non-unique membership.
   * @returns Result value
   */
  is_bag(): Boolean {
    // Bag: unordered and non-unique
    return new Boolean(
      this.is_ordered !== true && this.is_unique !== true,
    );
  }

  /**
   * True if the semantics of this cardinality represent a list, i.e. ordered, non-unique membership.
   * @returns Result value
   */
  is_list(): Boolean {
    // List: ordered and non-unique
    return new Boolean(
      this.is_ordered === true && this.is_unique !== true,
    );
  }

  /**
   * True if the semantics of this cardinality represent a set, i.e. unordered, unique membership.
   * @returns Result value
   */
  is_set(): Boolean {
    // Set: unordered and unique
    return new Boolean(
      this.is_ordered !== true && this.is_unique === true,
    );
  }
}

/**
 * Primitive type representing a standalone reference to a terminology concept, in the form of a terminology identifier, optional version, and a code or code string from the terminology.
 */
export class Terminology_code extends Any {
  /**
   * Internal storage for terminology_id
   * @protected
   */
  protected _terminology_id?: String;

  /**
   * The archetype environment namespace identifier used to identify a terminology. Typically a value like \`"snomed_ct"\` that is mapped elsewhere to the full URI identifying the terminology.
   */
  get terminology_id(): string | undefined {
    return this._terminology_id?.value;
  }

  /**
   * Gets the String wrapper object for terminology_id.
   * Use this to access String methods.
   */
  get $terminology_id(): String | undefined {
    return this._terminology_id;
  }

  /**
   * Sets terminology_id from either a primitive value or String wrapper.
   */
  set terminology_id(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._terminology_id = undefined;
    } else if (typeof val === "string") {
      this._terminology_id = String.from(val);
    } else {
      this._terminology_id = val;
    }
  }

  /**
   * Internal storage for terminology_version
   * @protected
   */
  protected _terminology_version?: String;

  /**
   * Optional string value representing terminology version, typically a date or dotted numeric.
   */
  get terminology_version(): string | undefined {
    return this._terminology_version?.value;
  }

  /**
   * Gets the String wrapper object for terminology_version.
   * Use this to access String methods.
   */
  get $terminology_version(): String | undefined {
    return this._terminology_version;
  }

  /**
   * Sets terminology_version from either a primitive value or String wrapper.
   */
  set terminology_version(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._terminology_version = undefined;
    } else if (typeof val === "string") {
      this._terminology_version = String.from(val);
    } else {
      this._terminology_version = val;
    }
  }

  /**
   * Internal storage for code_string
   * @protected
   */
  protected _code_string?: String;

  /**
   * A terminology code or post-coordinated code expression, if supported by the terminology. The code may refer to a single term, a value set consisting of multiple terms, or some other entity representable within the terminology.
   */
  get code_string(): string | undefined {
    return this._code_string?.value;
  }

  /**
   * Gets the String wrapper object for code_string.
   * Use this to access String methods.
   */
  get $code_string(): String | undefined {
    return this._code_string;
  }

  /**
   * Sets code_string from either a primitive value or String wrapper.
   */
  set code_string(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._code_string = undefined;
    } else if (typeof val === "string") {
      this._code_string = String.from(val);
    } else {
      this._code_string = val;
    }
  }

  /**
   * The URI reference that may be used as a concrete key into a notional terminology service for queries that can obtain the term text, definition, and other associated elements.
   */
  uri?: Uri;

  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (!(other instanceof Terminology_code)) {
      return new Boolean(false);
    }
    
    // Compare terminology_id
    const termIdMatch = (this.terminology_id === other.terminology_id) ||
      (this._terminology_id !== undefined && other._terminology_id !== undefined &&
       this._terminology_id.is_equal(other._terminology_id).value);
    
    // Compare code_string
    const codeMatch = (this.code_string === other.code_string) ||
      (this._code_string !== undefined && other._code_string !== undefined &&
       this._code_string.is_equal(other._code_string).value);
    
    // Compare terminology_version (optional)
    const versionMatch = (this.terminology_version === other.terminology_version) ||
      (this._terminology_version === undefined && other._terminology_version === undefined) ||
      (this._terminology_version !== undefined && other._terminology_version !== undefined &&
       this._terminology_version.is_equal(other._terminology_version).value);
    
    return new Boolean(termIdMatch && codeMatch && versionMatch);
  }
}

/**
 * Leaf type representing a standalone term from a terminology, which consists of the term text and the code, i.e. a concept reference.
 */
export class Terminology_term extends Any {
  /**
   * Reference to the terminology concept formally representing this term.
   */
  concept?: Terminology_code;
  /**
   * Internal storage for text
   * @protected
   */
  protected _text?: String;

  /**
   * Text of term.
   */
  get text(): string | undefined {
    return this._text?.value;
  }

  /**
   * Gets the String wrapper object for text.
   * Use this to access String methods.
   */
  get $text(): String | undefined {
    return this._text;
  }

  /**
   * Sets text from either a primitive value or String wrapper.
   */
  set text(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._text = undefined;
    } else if (typeof val === "string") {
      this._text = String.from(val);
    } else {
      this._text = val;
    }
  }

  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (!(other instanceof Terminology_term)) {
      return new Boolean(false);
    }
    
    // Compare text
    const textMatch = (this.text === other.text) ||
      (this._text !== undefined && other._text !== undefined &&
       this._text.is_equal(other._text).value);
    
    // Compare concept
    const conceptMatch = (this.concept === undefined && other.concept === undefined) ||
      (this.concept !== undefined && other.concept !== undefined &&
       this.concept.is_equal(other.concept).value);
    
    return new Boolean(textMatch && conceptMatch);
  }
}

/**
 * Ancestor class of identifiers of informational objects. Ids may be completely meaningless, in which case their only job is to refer to something, or may carry some information to do with the identified object.
 *
 * Object ids are used inside an object to identify that object. To identify another object in another service, use an \`OBJECT_REF\`, or else use a UID for local objects identified by UID. If none of the subtypes is suitable, direct instances of this class may be used.
 */
export abstract class OBJECT_ID {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: String;

  /**
   * The value of the id in the form defined below.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value(): String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = String.from(val);
    } else {
      this._value = val;
    }
  }
}

/**
 * Identifier for archetypes. Ideally these would identify globally unique archetypes.
 *
 * Lexical form: \`rm_originator  '-' rm_name  '-' rm_entity  '.' concept_name {  '-' specialisation }*  '.v' number\`.
 */
export class ARCHETYPE_ID extends OBJECT_ID {
  /**
   * Globally qualified reference model entity, e.g.  \`"openehr-EHR-OBSERVATION"\`.
   * @returns Result value
   */
  qualified_rm_entity(): String {
    const val = this.value || "";
    const dotIndex = val.indexOf(".");
    if (dotIndex === -1) {
      throw new Error("Invalid ARCHETYPE_ID format: no '.' found");
    }
    return String.from(val.substring(0, dotIndex));
  }

  /**
   * Name of the concept represented by this archetype, including specialisation, e.g. \`"Biochemistry_result-cholesterol"\`.
   * @returns Result value
   */
  domain_concept(): String {
    const val = this.value || "";
    const dotIndex = val.indexOf(".");
    const vIndex = val.lastIndexOf(".v");

    if (dotIndex === -1 || vIndex === -1 || vIndex <= dotIndex) {
      throw new Error("Invalid ARCHETYPE_ID format");
    }

    return String.from(val.substring(dotIndex + 1, vIndex));
  }

  /**
   * Organisation originating the reference model on which this archetype is based, e.g. \`"openEHR"\`, \`"CEN"\`, \`"HL7"\`.
   * @returns Result value
   */
  rm_originator(): String {
    const qualified = this.qualified_rm_entity().value || "";
    const parts = qualified.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid qualified_rm_entity format");
    }
    return String.from(parts[0]);
  }

  /**
   * Name of the reference model, e.g. \`"RIM"\`,  \`"EHR"\`,  \`"EN13606"\`.
   * @returns Result value
   */
  rm_name(): String {
    const qualified = this.qualified_rm_entity().value || "";
    const parts = qualified.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid qualified_rm_entity format");
    }
    return String.from(parts[1]);
  }

  /**
   * Name of the ontological level within the reference model to which this archetype is targeted, e.g. for openEHR:  \`"FOLDER"\`, \`"COMPOSITION"\`, \`"SECTION"\`, \`"OBSERVATION"\`.
   * @returns Result value
   */
  rm_entity(): String {
    const qualified = this.qualified_rm_entity().value || "";
    const parts = qualified.split("-");
    if (parts.length < 3) {
      throw new Error("Invalid qualified_rm_entity format");
    }
    return String.from(parts[2]);
  }

  /**
   * Name of specialisation of concept, if this archetype is a specialisation of another archetype, e.g. \`"cholesterol"\`.
   * @returns Result value
   */
  specialisation(): String {
    const concept = this.domain_concept().value || "";
    const hyphenIndex = concept.indexOf("-");

    if (hyphenIndex === -1) {
      return String.from("");
    }

    return String.from(concept.substring(hyphenIndex + 1));
  }

  /**
   * Version of this archetype.
   *
   * @returns Result value
   */
  version_id(): String {
    const val = this.value || "";
    const vIndex = val.lastIndexOf(".v");

    if (vIndex === -1) {
      throw new Error("Invalid ARCHETYPE_ID format: no '.v' found");
    }

    // Return everything after '.v'
    return String.from(val.substring(vIndex + 2));
  }
}

/**
 * Generic identifier type for identifiers whose format is otherwise unknown to openEHR. Includes an attribute for naming the identification scheme (which may well be local).
 */
export class GENERIC_ID extends OBJECT_ID {
  /**
   * Internal storage for scheme
   * @protected
   */
  protected _scheme?: String;

  /**
   * Name of the scheme to which this identifier conforms. Ideally this name will be recognisable globally but realistically it may be a local ad hoc scheme whose name is not controlled or standardised in any way.
   */
  get scheme(): string | undefined {
    return this._scheme?.value;
  }

  /**
   * Gets the String wrapper object for scheme.
   * Use this to access String methods.
   */
  get $scheme(): String | undefined {
    return this._scheme;
  }

  /**
   * Sets scheme from either a primitive value or String wrapper.
   */
  set scheme(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._scheme = undefined;
    } else if (typeof val === "string") {
      this._scheme = String.from(val);
    } else {
      this._scheme = val;
    }
  }
}

/**
 * Abstract model of UID-based identifiers consisting of a root part and an optional extension; lexical form: \`root '::' extension\`.
 */
export abstract class UID_BASED_ID extends OBJECT_ID {
  /**
   * The identifier of the conceptual namespace in which the object exists, within the identification scheme. Returns the part to the left of the first '::' separator, if any, or else the whole string.
   * @returns Result value
   */
  root(): UID {
    const val = this.value || "";
    const separatorIndex = val.indexOf("::");
    const rootValue = separatorIndex === -1
      ? val
      : val.substring(0, separatorIndex);

    // Try to determine UID type and create appropriate instance
    // For now, create a generic UUID or ISO_OID based on format
    if (rootValue.includes("-")) {
      // Looks like UUID
      const uuid = new UUID();
      uuid.value = rootValue;
      return uuid;
    } else if (rootValue.match(/^\d+(\.\d+)*$/)) {
      // Looks like ISO OID
      const oid = new ISO_OID();
      oid.value = rootValue;
      return oid;
    } else {
      // Default to INTERNET_ID
      const internetId = new INTERNET_ID();
      internetId.value = rootValue;
      return internetId;
    }
  }

  /**
   * Optional local identifier of the object within the context of the root identifier. Returns the part to the right of the first '::' separator if any, or else any empty String.
   * @returns Result value
   */
  extension(): String {
    const val = this.value || "";
    const separatorIndex = val.indexOf("::");
    if (separatorIndex === -1) {
      return String.from("");
    }
    return String.from(val.substring(separatorIndex + 2));
  }

  /**
   * True if not \`_extension_.is_empty()\`.
   * @returns Result value
   */
  has_extension(): Boolean {
    return new Boolean(!this.extension().is_empty().value);
  }
}

/**
 * Concrete type corresponding to hierarchical identifiers of the form defined by \`UID_BASED_ID\`.
 */
export class HIER_OBJECT_ID extends UID_BASED_ID {
}

/**
 * Class describing a reference to another object, which may exist locally or be maintained outside the current namespace, e.g. in another service. Services are usually external, e.g. available in a LAN (including on the same host) or the internet via Corba, SOAP, or some other distributed protocol. However, in small systems they may be part of the same executable as the data containing the Id.
 */
export class OBJECT_REF {
  /**
   * Internal storage for namespace
   * @protected
   */
  protected _namespace?: String;

  /**
   * Namespace to which this identifier belongs in the local system context (and possibly in any other openEHR compliant environment) e.g.  terminology ,  demographic . These names are not yet standardised. Legal values for \`_namespace_\` are:
   *
   * * \`"local"\`
   * * \`"unknown"\`
   * * a string matching the standard regex \`[a-zA-Z][a-zA-Z0-9_.:\/&?=+-]*\`.
   *
   * Note that the first two are just special values of the regex, and will be matched by it.
   */
  get namespace(): string | undefined {
    return this._namespace?.value;
  }

  /**
   * Gets the String wrapper object for namespace.
   * Use this to access String methods.
   */
  get $namespace(): String | undefined {
    return this._namespace;
  }

  /**
   * Sets namespace from either a primitive value or String wrapper.
   */
  set namespace(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._namespace = undefined;
    } else if (typeof val === "string") {
      this._namespace = String.from(val);
    } else {
      this._namespace = val;
    }
  }

  /**
   * Internal storage for type
   * @protected
   */
  protected _type?: String;

  /**
   * Name of the  class (concrete or abstract) of object to which this identifier type refers, e.g. \`PARTY\`, \`PERSON\`,  \`GUIDELINE\`  etc. These class names are from the relevant reference model. The type name \`ANY\` can be used to indicate that any type is accepted (e.g. if the type is unknown).
   */
  get type(): string | undefined {
    return this._type?.value;
  }

  /**
   * Gets the String wrapper object for type.
   * Use this to access String methods.
   */
  get $type(): String | undefined {
    return this._type;
  }

  /**
   * Sets type from either a primitive value or String wrapper.
   */
  set type(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._type = undefined;
    } else if (typeof val === "string") {
      this._type = String.from(val);
    } else {
      this._type = val;
    }
  }

  /**
   * Globally unique id of an object, regardless of where it is stored.
   */
  id?: OBJECT_ID;

  /**
   * Compare two OBJECT_REF instances for equality.
   * @param other - The other OBJECT_REF to compare with
   * @returns Boolean indicating if they are equal
   */
  is_equal(other: any): Boolean {
    if (!(other instanceof OBJECT_REF)) {
      return new Boolean(false);
    }

    // Compare namespace
    if (this.namespace !== other.namespace) {
      return new Boolean(false);
    }

    // Compare type
    if (this.type !== other.type) {
      return new Boolean(false);
    }

    // Compare id
    if (this.id && other.id) {
      if (this.id instanceof Any && other.id instanceof Any) {
        return this.id.is_equal(other.id);
      }
    } else if (!this.id && !other.id) {
      return new Boolean(true);
    } else {
      return new Boolean(false);
    }

    return new Boolean(true);
  }
}

/**
 * Reference to a \`LOCATABLE\` instance inside the top-level content structure inside a \`VERSION<T>\` identified by the \`_id_\` attribute. The \`_path_\` attribute is applied to the object that \`VERSION._data_\` points to.
 */
export class LOCATABLE_REF extends OBJECT_REF {
  /**
   * Internal storage for path
   * @protected
   */
  protected _path?: String;

  /**
   * The path to an instance, as an absolute path with respect to the object found at \`VERSION._data_\`. An empty path means that the object referred to by \`_id_\` is being specified.
   */
  get path(): string | undefined {
    return this._path?.value;
  }

  /**
   * Gets the String wrapper object for path.
   * Use this to access String methods.
   */
  get $path(): String | undefined {
    return this._path;
  }

  /**
   * Sets path from either a primitive value or String wrapper.
   */
  set path(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._path = undefined;
    } else if (typeof val === "string") {
      this._path = String.from(val);
    } else {
      this._path = val;
    }
  }

  /**
   * Globally unique id of an object, regardless of where it is stored.
   */
  override id?: UID_BASED_ID = undefined;
  /**
   * A URI form of the reference, created by concatenating the following:
   *
   * * scheme, e.g. \`ehr:\`, derived from \`_namespace_\`
   * * \`_id.value_\`
   * * \`/\` + \`_path_\`, where \`_path_\` is non-empty
   *
   * @returns Result value
   */
  as_uri(): String {
    const namespace = this.namespace || "";
    const idValue = this.id?.value || "";
    const path = this.path || "";
    
    let uri = `${namespace}:${idValue}`;
    if (path && path.length > 0) {
      uri += `/${path}`;
    }
    
    return String.from(uri);
  }
}

/**
 * Globally unique identifier for one version of a versioned object; lexical form: \`object_id  '::' creating_system_id  '::' version_tree_id\`.
 */
export class OBJECT_VERSION_ID extends UID_BASED_ID {
  /**
   * Unique identifier for logical object of which this identifier identifies one version; normally the \`_object_id_\` will be the unique identifier of the version container containing the version referred to by this \`OBJECT_VERSION_ID\` instance.
   * @returns Result value
   */
  object_id(): UID {
    const val = this.value || "";
    const parts = val.split("::");
    if (parts.length !== 3) {
      throw new Error("OBJECT_VERSION_ID must have 3 parts separated by '::'");
    }
    // Create a UUID from the first part
    const uid = new UUID();
    uid.value = parts[0];
    return uid;
  }

  /**
   * Identifier of the system that created the Version corresponding to this Object version id.
   * @returns Result value
   */
  creating_system_id(): UID {
    const val = this.value || "";
    const parts = val.split("::");
    if (parts.length !== 3) {
      throw new Error("OBJECT_VERSION_ID must have 3 parts separated by '::'");
    }
    // Create an INTERNET_ID from the second part
    const uid = new INTERNET_ID();
    uid.value = parts[1];
    return uid;
  }

  /**
   * Tree identifier of this version with respect to other versions in the same version tree, as either 1 or 3 part dot-separated numbers, e.g.  1 ,  2.1.4 .
   * @returns Result value
   */
  version_tree_id(): VERSION_TREE_ID {
    const val = this.value || "";
    const parts = val.split("::");
    if (parts.length !== 3) {
      throw new Error("OBJECT_VERSION_ID must have 3 parts separated by '::'");
    }
    const versionTreeId = new VERSION_TREE_ID();
    versionTreeId.value = parts[2];
    return versionTreeId;
  }

  /**
   * True if this version identifier represents a branch.
   * @returns Result value
   */
  is_branch(): Boolean {
    return this.version_tree_id().is_branch();
  }
}

/**
 * Identifier for parties in a demographic or identity service. There are typically a number of subtypes of the \`PARTY\` class, including \`PERSON\`, \`ORGANISATION\`, etc. Abstract supertypes are allowed if the referenced object is of a type not known by the current implementation of this class (in other words, if the demographic model is changed by the addition of a new \`PARTY\` or \`ACTOR\` subtypes, valid \`PARTY_REFs\` can still be constructed to them).
 */
export class PARTY_REF extends OBJECT_REF {
}

/**
 * Identifier for terminologies such as accessed via a terminology query service. In this class, the value attribute identifies the Terminology in the terminology service, e.g.  SNOMED-CT . A terminology is assumed to be in a particular language, which must be explicitly specified.
 *
 * Lexical form: \`name [  '(' version  ')' ]\`.
 */
export class TERMINOLOGY_ID extends OBJECT_ID {
  /**
   * Return the terminology id (which includes the  version  in some cases). Distinct names correspond to distinct (i.e. non-compatible) terminologies. Thus the names  \`"ICD10AM"\` and \`"ICD10"\` refer to distinct terminologies.
   * @returns Result value
   */
  name(): String {
    const val = this.value || "";
    // Format: name[(version)]
    const parenIndex = val.indexOf("(");
    if (parenIndex > 0) {
      return String.from(val.substring(0, parenIndex));
    }
    return String.from(val);
  }

  /**
   * Version of this terminology, if versioning supported, else the empty string.
   * @returns Result value
   */
  version_id(): String {
    const val = this.value || "";
    // Format: name[(version)]
    const parenIndex = val.indexOf("(");
    if (parenIndex > 0) {
      const closeParenIndex = val.indexOf(")");
      if (closeParenIndex > parenIndex) {
        return String.from(val.substring(parenIndex + 1, closeParenIndex));
      }
    }
    return String.from("");
  }
}

/**
 * Version tree identifier for one version. Lexical form:
 *
 * \`trunk_version [  '.' branch_number  '.' branch_version ]\`
 */
export class VERSION_TREE_ID {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: String;

  /**
   * String form of this identifier.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value(): String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = String.from(val);
    } else {
      this._value = val;
    }
  }

  /**
   * Trunk version number; numbering starts at 1.
   * @returns Result value
   */
  trunk_version(): String {
    const val = this.value || "";
    const parts = val.split(".");
    return String.from(parts[0]);
  }

  /**
   * True if this version identifier represents a branch, i.e. has \`_branch_number()_\` and \`_branch_version()_\` parts.
   * @returns Result value
   */
  is_branch(): Boolean {
    const val = this.value || "";
    const parts = val.split(".");
    return new Boolean(parts.length === 3);
  }

  /**
   * Number of branch from the trunk point; numbering starts at 1.
   * @returns Result value
   */
  branch_number(): String {
    const val = this.value || "";
    const parts = val.split(".");
    if (parts.length === 3) {
      return String.from(parts[1]);
    }
    throw new Error("Not a branch version");
  }

  /**
   * Version of the branch; numbering starts at 1.
   * @returns Result value
   */
  branch_version(): String {
    const val = this.value || "";
    const parts = val.split(".");
    if (parts.length === 3) {
      return String.from(parts[2]);
    }
    throw new Error("Not a branch version");
  }
}

/**
 * Abstract parent of classes representing unique identifiers which identify information entities in a durable way. UIDs only ever identify one IE in time or space and are never re-used.
 */
export abstract class UID {
  /**
   * Internal storage for value
   * @protected
   */
  protected _value?: String;

  /**
   * The value of the id.
   */
  get value(): string | undefined {
    return this._value?.value;
  }

  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value(): String | undefined {
    return this._value;
  }

  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = String.from(val);
    } else {
      this._value = val;
    }
  }
}

/**
 * Model of the DCE Universal Unique Identifier or UUID which takes the form of hexadecimal integers separated by hyphens, following the pattern 8-4-4-4-12 as defined by the Open Group, CDE 1.1 Remote Procedure Call specification, Appendix A. Also known as a GUID.
 */
export class UUID extends UID {
}

/**
 * Model of a reverse internet domain, as used to uniquely identify an internet domain. In the form of a dot-separated string in the reverse order of a domain name, specified by https://www.rfc-editor.org/info/rfc1034[IETF RFC 1034^].
 */
export class INTERNET_ID extends UID {
}

/**
 * Model of ISO's Object Identifier (oid) as defined by the standard ISO/IEC 8824. Oids are formed from integers separated by dots. Each non-leaf node in an Oid starting from the left corresponds to an assigning authority, and identifies that authority's namespace, inside which the remaining part of the identifier is locally unique.
 */
export class ISO_OID extends UID {
}

/**
 * Identifier for templates. Lexical form to be determined.
 */
export class TEMPLATE_ID extends OBJECT_ID {
}

/**
 * Reference to access group in an access control service.
 */
export class ACCESS_GROUP_REF extends OBJECT_REF {
}

/**
 * Defines globally used constant values.
 */
export class BASIC_DEFINITIONS {
}

/**
 * Inheritance class to provide access to constants defined in other packages.
 */
export class OPENEHR_DEFINITIONS extends BASIC_DEFINITIONS {
}

/**
 * An enumeration of three values that may commonly occur in constraint models.
 *
 * Use as the type of any attribute within this model, which expresses constraint on some attribute in a class in a reference model. For example to indicate validity
 * of Date/Time fields.
 */
export class VALIDITY_KIND extends String {
}

/**
 * Status of a versioned artefact, as one of a number of possible values: uncontrolled, prerelease, release, build.
 */
export class VERSION_STATUS extends String {
}

export abstract class Comparable {
}

/**
 * ISO8601 timezone string, in format:
 *
 * * \`Z | ±hh[mm]\`
 *
 * where:
 *
 * * \`hh\` is "00" - "23" (0-filled to two digits)
 * * \`mm\` is "00" - "59" (0-filled to two digits)
 * * \`Z\` is a literal meaning UTC (modern replacement for GMT), i.e. timezone \`+0000\`
 */
export class Iso8601_timezone extends Iso8601_type {
  /**
   * Extract the hour part of timezone, as an Integer in the range \`00 - 14\`.
   * @returns Result value
   */
  hour(): Integer {
    const val = this.value || "";
    if (val === "Z") return Integer.from(0);
    const match = val.match(/([+-])(\d{2}):?(\d{2})/);
    if (match) {
      return Integer.from(parseInt(match[2], 10));
    }
    return Integer.from(0);
  }

  /**
   * Extract the minute part of timezone, as an Integer, usually either 0 or 30.
   * @returns Result value
   */
  minute(): Integer {
    const val = this.value || "";
    if (val === "Z") return Integer.from(0);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match && match[3]) {
      return Integer.from(parseInt(match[3], 10));
    }
    return Integer.from(0);
  }

  /**
   * Direction of timezone expresssed as +1 or -1.
   * @returns Result value
   */
  sign(): Integer {
    const val = this.value || "";
    if (val === "Z") return Integer.from(1); // UTC is positive
    const match = val.match(/([+-])/);
    if (match) {
      return Integer.from(match[1] === "+" ? 1 : -1);
    }
    return Integer.from(1);
  }

  /**
   * Indicates whether minute part known.
   * @returns Result value
   */
  minute_unknown(): Boolean {
    const val = this.value || "";
    if (val === "Z") return new Boolean(false); // Z always has minutes (00)
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    // Minutes are unknown if not specified
    return new Boolean(!match || !match[3]);
  }

  /**
   * True if this time zone is partial, i.e. if minutes is missing.
   * @returns Result value
   */
  is_partial(): Boolean {
    return this.minute_unknown();
  }

  /**
   * True if this time-zone uses ‘:’ separators.
   * @returns Result value
   */
  is_extended(): Boolean {
    const val = this.value || "";
    return new Boolean(val.includes(":"));
  }

  /**
   * True if timezone is UTC, i.e. \`+0000\` or \`Z\`.
   * @returns Result value
   */
  is_gmt(): Boolean {
    const val = this.value || "";
    if (val === "Z") return new Boolean(true);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      return new Boolean(hours === 0 && minutes === 0);
    }
    return new Boolean(false);
  }

  /**
   * Return timezone string in extended format.
   * @returns Result value
   */
  as_string(): String {
    const val = this.value || "";
    if (val === "Z") return String.from("Z");
    
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const sign = match[1];
      const hours = match[2];
      const minutes = match[3] || "00";
      // Return in extended format with colon
      return String.from(`${sign}${hours}:${minutes}`);
    }
    return String.from(val);
  }

  /**
   * Compares this timezone with another for ordering.
   * Timezones are ordered by their offset from UTC in minutes.
   * @param other - The object to compare with
   * @returns true if this timezone is less than the other
   */
  override less_than(other: Ordered): Boolean {
    if (!(other instanceof Iso8601_timezone)) {
      return new Boolean(false);
    }
    
    // Calculate total offset in minutes for this timezone
    const thisOffset = this.sign().value * (this.hour().value * 60 + this.minute().value);
    // Calculate total offset in minutes for other timezone
    const otherOffset = other.sign().value * (other.hour().value * 60 + other.minute().value);
    
    return new Boolean(thisOffset < otherOffset);
  }

  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  override is_equal(other: Any): Boolean {
    if (!(other instanceof Iso8601_timezone)) {
      return new Boolean(false);
    }
    
    // Compare by offset in minutes
    const thisOffset = this.sign().value * (this.hour().value * 60 + this.minute().value);
    const otherOffset = other.sign().value * (other.hour().value * 60 + other.minute().value);
    
    return new Boolean(thisOffset === otherOffset);
  }
}

/**
 * Type representing an Interval that happens to be a point value. Provides an efficient representation that is substitutable for \`Interval<T>\` where needed.
 */
export class Point_interval<T extends Ordered> extends Interval<T> {
  /**
   * Lower boundary open (i.e. = -infinity).
   */
  override get lower_unbounded(): boolean | undefined {
    return this._lower_unbounded?.value;
  }

  /**
   * Gets the Boolean wrapper object for lower_unbounded.
   * Use this to access Boolean methods.
   */
  override get $lower_unbounded(): Boolean | undefined {
    return this._lower_unbounded;
  }

  /**
   * Sets lower_unbounded from either a primitive value or Boolean wrapper.
   */
  override set lower_unbounded(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._lower_unbounded = undefined;
    } else if (typeof val === "boolean") {
      this._lower_unbounded = Boolean.from(val);
    } else {
      this._lower_unbounded = val;
    }
  }

  /**
   * Upper boundary open (i.e. = +infinity).
   */
  override get upper_unbounded(): boolean | undefined {
    return this._upper_unbounded?.value;
  }

  /**
   * Gets the Boolean wrapper object for upper_unbounded.
   * Use this to access Boolean methods.
   */
  override get $upper_unbounded(): Boolean | undefined {
    return this._upper_unbounded;
  }

  /**
   * Sets upper_unbounded from either a primitive value or Boolean wrapper.
   */
  override set upper_unbounded(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._upper_unbounded = undefined;
    } else if (typeof val === "boolean") {
      this._upper_unbounded = Boolean.from(val);
    } else {
      this._upper_unbounded = val;
    }
  }

  /**
   * Lower boundary value included in range if not \`_lower_unbounded_\`.
   */
  override get lower_included(): boolean | undefined {
    return this._lower_included?.value;
  }

  /**
   * Gets the Boolean wrapper object for lower_included.
   * Use this to access Boolean methods.
   */
  override get $lower_included(): Boolean | undefined {
    return this._lower_included;
  }

  /**
   * Sets lower_included from either a primitive value or Boolean wrapper.
   */
  override set lower_included(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._lower_included = undefined;
    } else if (typeof val === "boolean") {
      this._lower_included = Boolean.from(val);
    } else {
      this._lower_included = val;
    }
  }

  /**
   * Upper boundary value included in range if not \`_upper_unbounded_\`.
   */
  override get upper_included(): boolean | undefined {
    return this._upper_included?.value;
  }

  /**
   * Gets the Boolean wrapper object for upper_included.
   * Use this to access Boolean methods.
   */
  override get $upper_included(): Boolean | undefined {
    return this._upper_included;
  }

  /**
   * Sets upper_included from either a primitive value or Boolean wrapper.
   */
  override set upper_included(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._upper_included = undefined;
    } else if (typeof val === "boolean") {
      this._upper_included = Boolean.from(val);
    } else {
      this._upper_included = val;
    }
  }

  /**
   * True if the value \`v\` equals this point value.
   * @param v - Parameter
   * @returns Result value
   */
  override has(v: T): Boolean {
    if (this.lower === undefined) {
      return new Boolean(false);
    }
    return this.lower.is_equal(v);
  }

  /**
   * A point interval never intersects with any other interval (it's a single point).
   * @param other - Parameter
   * @returns Result value
   */
  override intersects(other: Interval<T>): Boolean {
    if (this.lower === undefined) {
      return new Boolean(false);
    }
    // A point intersects if the other interval contains this point
    return other.has(this.lower);
  }

  /**
   * A point interval can only contain another interval if that interval is also the same point.
   * @param other - Parameter
   * @returns Result value
   */
  override contains(other: Interval<T>): Boolean {
    if (this.lower === undefined) {
      return new Boolean(false);
    }
    // Only contains if other is a point at the same location
    if (other instanceof Point_interval) {
      return this.is_equal(other);
    }
    // Cannot contain a proper interval
    return new Boolean(false);
  }
}

/**
 * A fully coordinated (i.e. all coordination has been performed) term from a terminology service (as distinct from a particular terminology).
 *
 * Retain for LEGACY only, while ADL1.4 requires CODE_PHRASE.
 */
export class CODE_PHRASE {
  /**
   * Identifier of the distinct terminology from which the code_string (or its elements) was extracted.
   */
  terminology_id?: TERMINOLOGY_ID;
  /**
   * Internal storage for code_string
   * @protected
   */
  protected _code_string?: String;

  /**
   * The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context.
   */
  get code_string(): string | undefined {
    return this._code_string?.value;
  }

  /**
   * Gets the String wrapper object for code_string.
   * Use this to access String methods.
   */
  get $code_string(): String | undefined {
    return this._code_string;
  }

  /**
   * Sets code_string from either a primitive value or String wrapper.
   */
  set code_string(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._code_string = undefined;
    } else if (typeof val === "string") {
      this._code_string = String.from(val);
    } else {
      this._code_string = val;
    }
  }

  /**
   * Internal storage for preferred_term
   * @protected
   */
  protected _preferred_term?: String;

  /**
   * Optional attribute to carry preferred term corresponding to the code or expression in \`_code_string_\`. Typical use in integration situations which create mappings, and representing data for which both a (non-preferred) actual term and a preferred term are both required.
   */
  get preferred_term(): string | undefined {
    return this._preferred_term?.value;
  }

  /**
   * Gets the String wrapper object for preferred_term.
   * Use this to access String methods.
   */
  get $preferred_term(): String | undefined {
    return this._preferred_term;
  }

  /**
   * Sets preferred_term from either a primitive value or String wrapper.
   */
  set preferred_term(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._preferred_term = undefined;
    } else if (typeof val === "string") {
      this._preferred_term = String.from(val);
    } else {
      this._preferred_term = val;
    }
  }

  /**
   * Factory method to create a CODE_PHRASE.
   * @param terminologyId - The terminology identifier
   * @param codeString - The code string
   * @returns A new CODE_PHRASE instance
   */
  static from(terminologyId: string, codeString: string): CODE_PHRASE {
    const codePhrase = new CODE_PHRASE();

    const termId = new TERMINOLOGY_ID();
    termId.value = terminologyId;
    codePhrase.terminology_id = termId;

    codePhrase.code_string = codeString;

    return codePhrase;
  }

  /**
   * Compare two CODE_PHRASE objects for equality.
   * @param other - The other object to compare with
   * @returns Boolean indicating if they are equal
   */
  is_equal(other: any): Boolean {
    if (!(other instanceof CODE_PHRASE)) {
      return new Boolean(false);
    }

    // Compare terminology IDs
    if (!this.terminology_id || !other.terminology_id) {
      return new Boolean(this.terminology_id === other.terminology_id);
    }
    if (this.terminology_id.value !== other.terminology_id.value) {
      return new Boolean(false);
    }

    // Compare code strings
    if (this.code_string !== other.code_string) {
      return new Boolean(false);
    }

    return new Boolean(true);
  }
}

/**
 * Abstract idea of an online resource created by a human author.
 */
export abstract class AUTHORED_RESOURCE {
  /**
   * Unique identifier of the family of archetypes having the same interface identifier (same major version).
   */
  uid?: UUID;
  /**
   * Language in which this resource was initially authored. Although there is no language primacy of resources overall, the language of original authoring is required to ensure natural language translations can preserve quality. Language is relevant in both the description and ontology sections.
   */
  original_language?: Terminology_code;
  /**
   * Description and lifecycle information of the resource.
   */
  description?: RESOURCE_DESCRIPTION;
  /**
   * Internal storage for is_controlled
   * @protected
   */
  protected _is_controlled?: Boolean;

  /**
   * True if this resource is under any kind of change control (even file copying), in which case revision history is created.
   */
  get is_controlled(): boolean | undefined {
    return this._is_controlled?.value;
  }

  /**
   * Gets the Boolean wrapper object for is_controlled.
   * Use this to access Boolean methods.
   */
  get $is_controlled(): Boolean | undefined {
    return this._is_controlled;
  }

  /**
   * Sets is_controlled from either a primitive value or Boolean wrapper.
   */
  set is_controlled(val: boolean | Boolean | undefined) {
    if (val === undefined || val === null) {
      this._is_controlled = undefined;
    } else if (typeof val === "boolean") {
      this._is_controlled = Boolean.from(val);
    } else {
      this._is_controlled = val;
    }
  }

  /**
   * Annotations on individual items within the resource, keyed by path. The inner table takes the form of a Hash table of String values keyed by String tags.
   */
  annotations?: RESOURCE_ANNOTATIONS;
  /**
   * List of details for each natural translation made of this resource, keyed by language code. For each translation listed here, there must be corresponding sections in all language-dependent parts of the resource. The \`_original_language_\` does not appear in this list.
   */
  translations?: undefined;
  /**
   * Most recent revision in revision_history if is_controlled else  (uncontrolled) .
   * @returns Result value
   */
  current_revision(): String {
    // If not controlled, return "(uncontrolled)"
    if (!this.is_controlled) {
      return String.from("(uncontrolled)");
    }
    // Otherwise would need to get from revision_history
    // For now, return placeholder as revision_history is not defined in this abstract class
    return String.from("1.0.0");
  }

  /**
   * Total list of languages available in this resource, derived from original_language and translations.
   * @returns Result value
   */
  languages_available(): String {
    // Return original language code if available
    // In a full implementation, would also include translations
    if (this.original_language?.code_string) {
      return String.from(this.original_language.code_string);
    }
    return String.from("");
  }
}

/**
 * Defines the descriptive meta-data of a resource.
 */
export class RESOURCE_DESCRIPTION {
  /**
   * Original author of this resource, with all relevant details, including organisation.
   */
  original_author?: undefined;
  /**
   * Internal storage for original_namespace
   * @protected
   */
  protected _original_namespace?: String;

  /**
   * Namespace of original author's organisation, in reverse internet form, if applicable.
   */
  get original_namespace(): string | undefined {
    return this._original_namespace?.value;
  }

  /**
   * Gets the String wrapper object for original_namespace.
   * Use this to access String methods.
   */
  get $original_namespace(): String | undefined {
    return this._original_namespace;
  }

  /**
   * Sets original_namespace from either a primitive value or String wrapper.
   */
  set original_namespace(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._original_namespace = undefined;
    } else if (typeof val === "string") {
      this._original_namespace = String.from(val);
    } else {
      this._original_namespace = val;
    }
  }

  /**
   * Internal storage for original_publisher
   * @protected
   */
  protected _original_publisher?: String;

  /**
   * Plain text name of organisation that originally published this artefact, if any.
   */
  get original_publisher(): string | undefined {
    return this._original_publisher?.value;
  }

  /**
   * Gets the String wrapper object for original_publisher.
   * Use this to access String methods.
   */
  get $original_publisher(): String | undefined {
    return this._original_publisher;
  }

  /**
   * Sets original_publisher from either a primitive value or String wrapper.
   */
  set original_publisher(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._original_publisher = undefined;
    } else if (typeof val === "string") {
      this._original_publisher = String.from(val);
    } else {
      this._original_publisher = val;
    }
  }

  /**
   * Other contributors to the resource, each listed in "name <email>"  form.
   */
  other_contributors?: undefined;
  /**
   * Lifecycle state of the resource, typically including states such as: initial, in_development, in_review, published, superseded, obsolete.
   */
  lifecycle_state?: Terminology_code;
  /**
   * Reference to owning resource.
   */
  parent_resource?: AUTHORED_RESOURCE;
  /**
   * Internal storage for custodian_namespace
   * @protected
   */
  protected _custodian_namespace?: String;

  /**
   * Namespace in reverse internet id form, of current custodian organisation.
   */
  get custodian_namespace(): string | undefined {
    return this._custodian_namespace?.value;
  }

  /**
   * Gets the String wrapper object for custodian_namespace.
   * Use this to access String methods.
   */
  get $custodian_namespace(): String | undefined {
    return this._custodian_namespace;
  }

  /**
   * Sets custodian_namespace from either a primitive value or String wrapper.
   */
  set custodian_namespace(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._custodian_namespace = undefined;
    } else if (typeof val === "string") {
      this._custodian_namespace = String.from(val);
    } else {
      this._custodian_namespace = val;
    }
  }

  /**
   * Internal storage for custodian_organisation
   * @protected
   */
  protected _custodian_organisation?: String;

  /**
   * Plain text name of current custodian organisation.
   */
  get custodian_organisation(): string | undefined {
    return this._custodian_organisation?.value;
  }

  /**
   * Gets the String wrapper object for custodian_organisation.
   * Use this to access String methods.
   */
  get $custodian_organisation(): String | undefined {
    return this._custodian_organisation;
  }

  /**
   * Sets custodian_organisation from either a primitive value or String wrapper.
   */
  set custodian_organisation(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._custodian_organisation = undefined;
    } else if (typeof val === "string") {
      this._custodian_organisation = String.from(val);
    } else {
      this._custodian_organisation = val;
    }
  }

  /**
   * Internal storage for copyright
   * @protected
   */
  protected _copyright?: String;

  /**
   * Optional copyright statement for the resource as a knowledge resource.
   */
  get copyright(): string | undefined {
    return this._copyright?.value;
  }

  /**
   * Gets the String wrapper object for copyright.
   * Use this to access String methods.
   */
  get $copyright(): String | undefined {
    return this._copyright;
  }

  /**
   * Sets copyright from either a primitive value or String wrapper.
   */
  set copyright(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._copyright = undefined;
    } else if (typeof val === "string") {
      this._copyright = String.from(val);
    } else {
      this._copyright = val;
    }
  }

  /**
   * Internal storage for licence
   * @protected
   */
  protected _licence?: String;

  /**
   * Licence of current artefact, in format "short licence name <URL of licence>", e.g. "Apache 2.0 License <http://www.apache.org/licenses/LICENSE-2.0.html>"
   */
  get licence(): string | undefined {
    return this._licence?.value;
  }

  /**
   * Gets the String wrapper object for licence.
   * Use this to access String methods.
   */
  get $licence(): String | undefined {
    return this._licence;
  }

  /**
   * Sets licence from either a primitive value or String wrapper.
   */
  set licence(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._licence = undefined;
    } else if (typeof val === "string") {
      this._licence = String.from(val);
    } else {
      this._licence = val;
    }
  }

  /**
   * List of acknowledgements of other IP directly referenced in this archetype, typically terminology codes, ontology ids etc. Recommended keys are the widely known name or namespace for the IP source, as shown in the following example:
   *
   * ----
   * ip_acknowledgements = <
   *     ["loinc"] = <"This content from LOINC® is copyright © 1995 Regenstrief Institute, Inc. and the LOINC Committee, and available at no cost under the license at http://loinc.org/terms-of-use">
   *     ["snomedct"] = <"Content from SNOMED CT® is copyright © 2007 IHTSDO <ihtsdo.org>">
   * >
   * ----
   */
  ip_acknowledgements?: undefined;
  /**
   * List of references of material on which this artefact is based, as a keyed list of strings. The keys should be in a standard citation format.
   */
  references?: undefined;
  /**
   * Internal storage for resource_package_uri
   * @protected
   */
  protected _resource_package_uri?: String;

  /**
   * URI of package to which this resource belongs.
   */
  get resource_package_uri(): string | undefined {
    return this._resource_package_uri?.value;
  }

  /**
   * Gets the String wrapper object for resource_package_uri.
   * Use this to access String methods.
   */
  get $resource_package_uri(): String | undefined {
    return this._resource_package_uri;
  }

  /**
   * Sets resource_package_uri from either a primitive value or String wrapper.
   */
  set resource_package_uri(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._resource_package_uri = undefined;
    } else if (typeof val === "string") {
      this._resource_package_uri = String.from(val);
    } else {
      this._resource_package_uri = val;
    }
  }

  /**
   * Details related to conversion process that generated this model from an original, if relevant, as a list of name/value pairs. Typical example with recommended tags:
   *
   * ----
   * conversion_details = <
   *     ["source_model"] = <"CEM model xyz <http://location.in.clinicalelementmodels.com>">
   *     ["tool"] = <"cem2adl v6.3.0">
   *     ["time"] = <"2014-11-03T09:05:00">
   * >
   * ----
   */
  conversion_details?: undefined;
  /**
   * Additional non-language-sensitive resource meta-data, as a list of name/value pairs.
   */
  other_details?: undefined;
  /**
   * Details of all parts of resource description that are natural language-dependent, keyed by language code.
   */
  details?: undefined;
}

/**
 * Class providing details of a natural language translation.
 */
export class TRANSLATION_DETAILS {
  /**
   * Language of the translation, coded using ISO 639-1 (2 character) language codes.
   */
  language?: Terminology_code;
  /**
   * Primary translator name and other demographic details.
   */
  author?: undefined;
  /**
   * Internal storage for accreditation
   * @protected
   */
  protected _accreditation?: String;

  /**
   * Accreditation of primary translator or group, usually a national translator's registration or association membership id.
   */
  get accreditation(): string | undefined {
    return this._accreditation?.value;
  }

  /**
   * Gets the String wrapper object for accreditation.
   * Use this to access String methods.
   */
  get $accreditation(): String | undefined {
    return this._accreditation;
  }

  /**
   * Sets accreditation from either a primitive value or String wrapper.
   */
  set accreditation(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._accreditation = undefined;
    } else if (typeof val === "string") {
      this._accreditation = String.from(val);
    } else {
      this._accreditation = val;
    }
  }

  /**
   * Any other meta-data.
   */
  other_details?: undefined;
  /**
   * Internal storage for version_last_translated
   * @protected
   */
  protected _version_last_translated?: String;

  /**
   * Version of this resource last time it was translated into the language represented by this \`TRANSLATION_DETAILS\` object.
   */
  get version_last_translated(): string | undefined {
    return this._version_last_translated?.value;
  }

  /**
   * Gets the String wrapper object for version_last_translated.
   * Use this to access String methods.
   */
  get $version_last_translated(): String | undefined {
    return this._version_last_translated;
  }

  /**
   * Sets version_last_translated from either a primitive value or String wrapper.
   */
  set version_last_translated(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._version_last_translated = undefined;
    } else if (typeof val === "string") {
      this._version_last_translated = String.from(val);
    } else {
      this._version_last_translated = val;
    }
  }

  /**
   * Additional contributors to this translation, each listed in the preferred format of the relevant organisation for the artefacts in question. A typical default is \`"name <email>"\` if nothing else is specified.
   */
  other_contributors?: undefined;
}

/**
 * Language-specific detail of resource description. When a resource is translated for use in another language environment, each \`RESOURCE_DESCRIPTION_ITEM\` needs to be copied and translated into the new language.
 */
export class RESOURCE_DESCRIPTION_ITEM {
  /**
   * The localised language in which the items in this description item are written. Coded using ISO 639-1 (2 character) language codes.
   */
  language?: Terminology_code;
  /**
   * Internal storage for purpose
   * @protected
   */
  protected _purpose?: String;

  /**
   * Purpose of the resource.
   */
  get purpose(): string | undefined {
    return this._purpose?.value;
  }

  /**
   * Gets the String wrapper object for purpose.
   * Use this to access String methods.
   */
  get $purpose(): String | undefined {
    return this._purpose;
  }

  /**
   * Sets purpose from either a primitive value or String wrapper.
   */
  set purpose(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._purpose = undefined;
    } else if (typeof val === "string") {
      this._purpose = String.from(val);
    } else {
      this._purpose = val;
    }
  }

  /**
   * Keywords which characterise this resource, used e.g. for indexing and searching.
   */
  keywords?: undefined;
  /**
   * Internal storage for use
   * @protected
   */
  protected _use?: String;

  /**
   * Description of the uses of the resource, i.e. contexts in which it could be used.
   */
  get use(): string | undefined {
    return this._use?.value;
  }

  /**
   * Gets the String wrapper object for use.
   * Use this to access String methods.
   */
  get $use(): String | undefined {
    return this._use;
  }

  /**
   * Sets use from either a primitive value or String wrapper.
   */
  set use(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._use = undefined;
    } else if (typeof val === "string") {
      this._use = String.from(val);
    } else {
      this._use = val;
    }
  }

  /**
   * Internal storage for misuse
   * @protected
   */
  protected _misuse?: String;

  /**
   * Description of any misuses of the resource, i.e. contexts in which it should not be used.
   */
  get misuse(): string | undefined {
    return this._misuse?.value;
  }

  /**
   * Gets the String wrapper object for misuse.
   * Use this to access String methods.
   */
  get $misuse(): String | undefined {
    return this._misuse;
  }

  /**
   * Sets misuse from either a primitive value or String wrapper.
   */
  set misuse(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._misuse = undefined;
    } else if (typeof val === "string") {
      this._misuse = String.from(val);
    } else {
      this._misuse = val;
    }
  }

  /**
   * URIs of original clinical document(s) or description of which resource is a formalisation, in the language of this description item; keyed by meaning.
   */
  original_resource_uri?: undefined;
  /**
   * Additional language-senstive resource metadata, as a list of name/value pairs.
   */
  other_details?: undefined;
}

/**
 * Object representing annotations on an archetype. These can be of various forms, with a documentation form defined so far, which has a multi-level tabular structure [ [ [String value, String key], path key], language key]. Example instance, showing the documentation structure.
 *
 * --------
 *     documentation = <
 *         ["en"] = <
 *            ["/data[id2]"] = <
 *                ["ui"] = <"passthrough">
 *            >
 *            ["/data[id2]/items[id3]"] = <
 *                ["design note"] = <"this is a design note on Statement">
 *                ["requirements note"] = <"this is a requirements note on Statement">
 *                ["medline ref"] = <"this is a medline ref on Statement">
 *            >
 *         >
 *     >
 * --------
 *
 * Other sub-structures might have different keys, e.g.  based on programming languages, UI toolkits etc.
 */
export class RESOURCE_ANNOTATIONS {
  /**
   * Documentary annotations in a multi-level keyed structure.
   */
  documentation?: undefined;
}
