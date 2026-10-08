// base/_shared.ts
var TYPE_REGISTRY = /* @__PURE__ */ new Map();

// base/foundation_types/foundation_types.ts
var Any = class {
  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other) {
    return new Boolean2(this === other);
  }
  /**
   * Create new instance of a type.
   * Uses the type registry to look up constructors by name.
   * Types must be registered using registerType() before they can be instantiated.
   * 
   * **Security Note:** This method creates instances dynamically based on type name.
   * Do not use with untrusted input as it could instantiate arbitrary registered types.
   * Only use with type names from trusted sources (e.g., parsed from validated openEHR data).
   * 
   * @param a_type - The type name as a String
   * @returns A new instance of the specified type
   * @throws Error if the type is not registered
   */
  instance_of(a_type) {
    const typeName = a_type?.value?.toUpperCase() || "";
    const constructor = TYPE_REGISTRY.get(typeName);
    if (!constructor) {
      throw new Error(`Unknown type: ${a_type?.value}. Type must be registered using registerType() first.`);
    }
    return new constructor();
  }
  /**
   * Type name of an object as a string. May include generic parameters, as in \`"Interval<Time>"\`.
   * @param an_object - Parameter
   * @returns Result value
   */
  type_of(an_object) {
    const typeName = an_object.constructor.name;
    return String2.from(typeName);
  }
  /**
   * True if current object not equal to \`_other_\`. Returns not \`_equal_()\`.
   * @param other - Parameter
   * @returns Result value
   */
  not_equal(other) {
    return new Boolean2(!this.equal(other).value);
  }
};

// base/foundation_types/structure.ts
var Container = class extends Any {
};
var List = class _List extends Container {
  _items = [];
  /**
   * Test for membership of a value.
   */
  has(v) {
    for (const item of this._items) {
      if (item.is_equal(v).value === true) {
        return new Boolean2(true);
      }
    }
    return new Boolean2(false);
  }
  /**
   * Return the number of items in the list.
   */
  count() {
    const int = new Integer();
    int.value = this._items.length;
    return int;
  }
  /**
   * Check if the list is empty.
   */
  is_empty() {
    return new Boolean2(this._items.length === 0);
  }
  /**
   * Test if all items satisfy a condition.
   */
  for_all(test) {
    for (const item of this._items) {
      if (!test(item).value) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * Test if any item satisfies a condition.
   */
  there_exists(test) {
    for (const item of this._items) {
      if (test(item).value) {
        return new Boolean2(true);
      }
    }
    return new Boolean2(false);
  }
  /**
   * Get the item at index i (0-based).
   */
  item(i) {
    const idx = i.value;
    if (idx === void 0 || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    return this._items[idx];
  }
  /**
   * Return first element.
   * @returns Result value
   */
  first() {
    if (this._items.length === 0) {
      throw new Error("Cannot get first item of empty list");
    }
    return this._items[0];
  }
  /**
   * Return last element.
   * @returns Result value
   */
  last() {
    if (this._items.length === 0) {
      throw new Error("Cannot get last item of empty list");
    }
    return this._items[this._items.length - 1];
  }
  /**
   * Add an item to the end of the list.
   */
  append(v) {
    this._items.push(v);
  }
  /**
   * Add an item to the beginning of the list.
   */
  prepend(v) {
    this._items.unshift(v);
  }
  /**
   * Append all items from another list.
   */
  extend(other) {
    const otherCount = other.count().value;
    if (otherCount !== void 0) {
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
  remove(i) {
    const idx = i.value;
    if (idx === void 0 || idx < 0 || idx >= this._items.length) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    this._items.splice(idx, 1);
  }
  /**
   * Find the index of the first occurrence of a value.
   * Returns -1 if not found.
   */
  index_of(v) {
    for (let i = 0; i < this._items.length; i++) {
      if (this._items[i].is_equal(v).value === true) {
        const idx2 = new Integer();
        idx2.value = i;
        return idx2;
      }
    }
    const idx = new Integer();
    idx.value = -1;
    return idx;
  }
  /**
   * Check value equality with another object.
   */
  is_equal(other) {
    if (!(other instanceof _List)) {
      return new Boolean2(false);
    }
    if (this._items.length !== other._items.length) {
      return new Boolean2(false);
    }
    for (let i = 0; i < this._items.length; i++) {
      if (!this._items[i].is_equal(other._items[i]).value) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * Return a List of all items matching the predicate function.
   * @param test - Predicate function with signature (v: T) => Boolean
   * @returns List of matching items, empty list if no matches
   */
  matching(test) {
    const results = new _List();
    for (const item of this._items) {
      const testResult = test(item);
      if (testResult?.value === true) {
        results.append(item);
      }
    }
    return results;
  }
  /**
   * Return first item matching the predicate function, or undefined if no match.
   * @param test - Predicate function with signature (v: T) => Boolean
   * @returns First matching item or undefined
   */
  select(test) {
    for (const item of this._items) {
      const testResult = test(item);
      if (testResult?.value === true) {
        return item;
      }
    }
    return void 0;
  }
};

// base/foundation_types/primitive_types.ts
var Ordered = class extends Any {
  /**
   * True if current object less than or equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than_or_equal(other) {
    return new Boolean2(
      this.less_than(other).value || this.is_equal(other).value
    );
  }
  /**
   * True if current object greater than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  greater_than(other) {
    return new Boolean2(
      !this.less_than(other).value && !this.is_equal(other).value
    );
  }
  /**
   * True if current object greater than or equal to \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  greater_than_or_equal(other) {
    return new Boolean2(!this.less_than(other).value);
  }
};
var String2 = class _String extends Ordered {
  static {
    TYPE_REGISTRY.set("STRING", _String);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new String instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a String instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new String instance
   */
  static from(val) {
    return new _String(val);
  }
  /**
   * Compares this String with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _String) {
      return new Boolean2(this.value === other.value);
    }
    return new Boolean2(false);
  }
  /**
   * True if string is empty, i.e. equal to "".
   * @returns Result value
   */
  is_empty() {
    return new Boolean2((this.value || "").length === 0);
  }
  /**
   * Number of characters in string.
   * @returns Result value
   */
  count() {
    const int = new Integer();
    int.value = (this.value || "").length;
    return int;
  }
  /**
   * True if string can be parsed as an integer.
   * @returns Result value
   */
  is_integer() {
    const val = this.value || "";
    const num = Number(val);
    return new Boolean2(
      !isNaN(num) && Number.isInteger(num) && val.trim() !== ""
    );
  }
  /**
   * Return the integer corresponding to the integer value represented in this string.
   * @returns Result value
   */
  as_integer() {
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
  append(other) {
    return _String.from((this.value || "") + (other.value || ""));
  }
  /**
   * Convert string to lowercase.
   * @returns Result value
   */
  as_lower() {
    return _String.from((this.value || "").toLowerCase());
  }
  /**
   * Convert string to uppercase.
   * @returns Result value
   */
  as_upper() {
    return _String.from((this.value || "").toUpperCase());
  }
  /**
   * Lexical comparison of string content based on ordering in relevant character set.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (!(other instanceof _String)) {
      throw new Error("Cannot compare String with non-String");
    }
    return new Boolean2((this.value || "") < (other.value || ""));
  }
  /**
   * Return True if this String contains \`_other_\` (case-sensitive).
   * @param other - Parameter
   * @returns Result value
   */
  contains(other) {
    return new Boolean2((this.value || "").includes(other.value || ""));
  }
  /**
   * Extract a substring (1-based indexing in openEHR).
   * @param start - Start index (1-based)
   * @param end - End index (1-based)
   * @returns Result value
   */
  substring(start, end) {
    const startIdx = (start.value || 1) - 1;
    const endIdx = end.value || (this.value || "").length;
    return _String.from((this.value || "").substring(startIdx, endIdx));
  }
  /**
   * Find the index of a substring (1-based indexing in openEHR).
   * @param pattern - Pattern to find
   * @param from - Start index (1-based)
   * @returns Result value (1-based index or -1 if not found)
   */
  index_of(pattern, from) {
    const startIdx = (from.value || 1) - 1;
    const foundIdx = (this.value || "").indexOf(pattern.value || "", startIdx);
    const result = new Integer();
    result.value = foundIdx === -1 ? -1 : foundIdx + 1;
    return result;
  }
  /**
   * Split string by delimiter.
   * @param delimiter - Delimiter to split by
   * @returns Result value
   */
  split(delimiter) {
    const parts = (this.value || "").split(delimiter.value || "");
    const list = new List();
    for (const part of parts) {
      list.append(_String.from(part));
    }
    return list;
  }
};
var Ordered_Numeric = class extends Ordered {
};
var Integer = class _Integer extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("INTEGER", _Integer);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Integer instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer value must be an integer, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates a Integer instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Integer instance
   */
  static from(val) {
    return new _Integer(val);
  }
  /**
   * Compares this Integer with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Integer) {
      return new Boolean2(this.value === other.value);
    }
    return new Boolean2(false);
  }
  /**
   * Lexical comparison for integers.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (!(other instanceof _Integer)) {
      throw new Error("Cannot compare Integer with non-Integer");
    }
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return new Boolean2(thisVal < otherVal);
  }
  /**
   * Integer addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer.from(thisVal + otherVal);
  }
  /**
   * Integer subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer.from(thisVal - otherVal);
  }
  /**
   * Integer multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer.from(thisVal * otherVal);
  }
  /**
   * Integer division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
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
  modulo(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 1;
    if (otherVal === 0) {
      throw new Error("Modulo by zero");
    }
    return _Integer.from(thisVal % otherVal);
  }
  /**
   * Generate negative of current value.
   * @returns Result value
   */
  negative() {
    return _Integer.from(-(this.value || 0));
  }
  /**
   * Integer exponentiation.
   * @param other - Parameter
   * @returns Result value
   */
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  // modulo, less_than, negative, and is_equal are implemented above
  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other) {
    return new Boolean2(this === other);
  }
};
var Double = class _Double extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("DOUBLE", _Double);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Double instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a Double instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Double instance
   */
  static from(val) {
    return new _Double(val);
  }
  /**
   * Return the greatest integer no greater than the value of this object.
   * @returns Result value
   */
  floor() {
    const thisVal = this.value || 0;
    return Integer.from(Math.floor(thisVal));
  }
  /**
   * Double-precision real number addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    return thisVal + other;
  }
  /**
   * Double-precision real number subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    return thisVal - other;
  }
  /**
   * Double-precision real number multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    return thisVal * other;
  }
  /**
   * Double-precision real number division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
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
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  /**
   * Returns True if current Double is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Double) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Generate negative of current Double value.
   * @returns Result value
   */
  negative() {
    const thisVal = this.value || 0;
    return -thisVal;
  }
  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Double) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Octet = class _Octet extends Ordered {
  static {
    TYPE_REGISTRY.set("OCTET", _Octet);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Octet instance.
   * @param val - The primitive value to wrap (0-255)
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && (!Number.isInteger(val) || val < 0 || val > 255)) {
      throw new Error(`Octet value must be an integer between 0 and 255, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates an Octet instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Octet instance
   */
  static from(val) {
    return new _Octet(val);
  }
  /**
   * Returns True if current Octet is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Octet) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Octet) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Character = class _Character extends Ordered {
  static {
    TYPE_REGISTRY.set("CHARACTER", _Character);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Character instance.
   * @param val - The primitive value to wrap (single character)
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && val.length !== 1) {
      throw new Error(`Character value must be a single character, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates a Character instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Character instance
   */
  static from(val) {
    return new _Character(val);
  }
  /**
   * Returns True if current Character is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Character) {
      const thisVal = this.value || "";
      const otherVal = other.value || "";
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Character) {
      const thisVal = this.value || "";
      const otherVal = other.value || "";
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Boolean2 = class _Boolean extends Any {
  static {
    TYPE_REGISTRY.set("BOOLEAN", _Boolean);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Boolean instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a Boolean instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Boolean instance
   */
  static from(val) {
    return new _Boolean(val);
  }
  /**
   * Compares this Boolean with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Boolean) {
      return new _Boolean(this.value === other.value);
    }
    return new _Boolean(false);
  }
  /**
   * Logical conjunction of this with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  conjunction(other) {
    return new _Boolean(this.value === true && other.value === true);
  }
  /**
   * Boolean semi-strict conjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  semistrict_conjunction(other) {
    if (this.value !== true) {
      return new _Boolean(false);
    }
    return new _Boolean(other.value === true);
  }
  /**
   * Boolean disjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  disjunction(other) {
    return new _Boolean(this.value === true || other.value === true);
  }
  /**
   * Boolean semi-strict disjunction with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  semistrict_disjunction(other) {
    if (this.value === true) {
      return new _Boolean(true);
    }
    return new _Boolean(other.value === true);
  }
  /**
   * Boolean exclusive or with \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  exclusive_disjunction(other) {
    return new _Boolean(this.value === true !== (other.value === true));
  }
  /**
   * Boolean implication of \`_other_\` (semi-strict)
   * @param other - Parameter
   * @returns Result value
   */
  implication(other) {
    if (this.value !== true) {
      return new _Boolean(true);
    }
    return new _Boolean(other.value === true);
  }
  /**
   * Boolean negation of the current value.
   * @returns Result value
   */
  negation() {
    return new _Boolean(this.value !== true);
  }
};
var Real = class _Real extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("REAL", _Real);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Real instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    this.value = val;
  }
  /**
   * Creates a Real instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Real instance
   */
  static from(val) {
    return new _Real(val);
  }
  /**
   * Return the greatest integer no greater than the value of this object.
   * @returns Result value
   */
  floor() {
    const thisVal = this.value || 0;
    return Integer.from(Math.floor(thisVal));
  }
  /**
   * Real number addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    return thisVal + other;
  }
  /**
   * Real number subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    return thisVal - other;
  }
  /**
   * Real number multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    return thisVal * other;
  }
  /**
   * Real number division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
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
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  /**
   * Returns True if current Real is less than \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Real) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Generate negative of current Real value.
   * @returns Result value
   */
  negative() {
    const thisVal = this.value || 0;
    return -thisVal;
  }
  /**
   * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (other instanceof _Real) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};
var Integer64 = class _Integer64 extends Ordered_Numeric {
  static {
    TYPE_REGISTRY.set("INTEGER64", _Integer64);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Integer64 instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer64 value must be an integer, got: ${val}`);
    }
    this.value = val;
  }
  /**
   * Creates a Integer64 instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Integer64 instance
   */
  static from(val) {
    return new _Integer64(val);
  }
  /**
   * Compares this Integer64 with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Integer64) {
      return new Boolean2(this.value === other.value);
    }
    return new Boolean2(false);
  }
  /**
   * Lexical comparison for large integers.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (!(other instanceof _Integer64)) {
      throw new Error("Cannot compare Integer64 with non-Integer64");
    }
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return new Boolean2(thisVal < otherVal);
  }
  /**
   * Large integer addition.
   * @param other - Parameter
   * @returns Result value
   */
  add(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer64.from(thisVal + otherVal);
  }
  /**
   * Large integer subtraction.
   * @param other - Parameter
   * @returns Result value
   */
  subtract(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer64.from(thisVal - otherVal);
  }
  /**
   * Large integer multiplication.
   * @param other - Parameter
   * @returns Result value
   */
  multiply(other) {
    const thisVal = this.value || 0;
    const otherVal = other.value || 0;
    return _Integer64.from(thisVal * otherVal);
  }
  /**
   * Large integer division.
   * @param other - Parameter
   * @returns Result value
   */
  divide(other) {
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
  exponent(other) {
    const thisVal = this.value || 0;
    return Math.pow(thisVal, other);
  }
  /**
   * Large integer modulus.
   * @param mod - Parameter
   * @returns Result value
   */
  modulo(mod) {
    const thisVal = this.value || 0;
    const modVal = mod.value || 1;
    if (modVal === 0) {
      throw new Error("Modulo by zero");
    }
    return _Integer64.from(thisVal % modVal);
  }
  /**
   * Generate negative of current Integer value.
   * @returns Result value
   */
  negative() {
    return _Integer64.from(-(this.value || 0));
  }
  /**
   * Reference equality for reference types, value equality for value types.
   * @param other - Parameter
   * @returns Result value
   */
  equal(other) {
    return new Boolean2(this === other);
  }
};

// base/foundation_types/interval.ts
var Interval = class _Interval extends Any {
  /**
   * Lower bound.
   */
  lower;
  /**
   * Upper bound.
   */
  upper;
  /**
   * Internal storage for lower_unbounded
   * @protected
   */
  _lower_unbounded;
  /**
   * True if \`_lower_\` boundary open (i.e. = \`-infinity\`).
   */
  get lower_unbounded() {
    return this._lower_unbounded?.value;
  }
  /**
   * Gets the Boolean wrapper object for lower_unbounded.
   * Use this to access Boolean methods.
   */
  get $lower_unbounded() {
    return this._lower_unbounded;
  }
  /**
   * Sets lower_unbounded from either a primitive value or Boolean wrapper.
   */
  set lower_unbounded(val) {
    if (val === void 0 || val === null) {
      this._lower_unbounded = void 0;
    } else if (typeof val === "boolean") {
      this._lower_unbounded = Boolean2.from(val);
    } else {
      this._lower_unbounded = val;
    }
  }
  /**
   * Internal storage for upper_unbounded
   * @protected
   */
  _upper_unbounded;
  /**
   * True if \`_upper_\` boundary open (i.e. = \`+infinity\`).
   */
  get upper_unbounded() {
    return this._upper_unbounded?.value;
  }
  /**
   * Gets the Boolean wrapper object for upper_unbounded.
   * Use this to access Boolean methods.
   */
  get $upper_unbounded() {
    return this._upper_unbounded;
  }
  /**
   * Sets upper_unbounded from either a primitive value or Boolean wrapper.
   */
  set upper_unbounded(val) {
    if (val === void 0 || val === null) {
      this._upper_unbounded = void 0;
    } else if (typeof val === "boolean") {
      this._upper_unbounded = Boolean2.from(val);
    } else {
      this._upper_unbounded = val;
    }
  }
  /**
   * Internal storage for lower_included
   * @protected
   */
  _lower_included;
  /**
   * True if \`_lower_\` boundary value included in range, if \`not _lower_unbounded_\`.
   */
  get lower_included() {
    return this._lower_included?.value;
  }
  /**
   * Gets the Boolean wrapper object for lower_included.
   * Use this to access Boolean methods.
   */
  get $lower_included() {
    return this._lower_included;
  }
  /**
   * Sets lower_included from either a primitive value or Boolean wrapper.
   */
  set lower_included(val) {
    if (val === void 0 || val === null) {
      this._lower_included = void 0;
    } else if (typeof val === "boolean") {
      this._lower_included = Boolean2.from(val);
    } else {
      this._lower_included = val;
    }
  }
  /**
   * Internal storage for upper_included
   * @protected
   */
  _upper_included;
  /**
   * True if \`_upper_\` boundary value included in range if \`not _upper_unbounded_\`.
   */
  get upper_included() {
    return this._upper_included?.value;
  }
  /**
   * Gets the Boolean wrapper object for upper_included.
   * Use this to access Boolean methods.
   */
  get $upper_included() {
    return this._upper_included;
  }
  /**
   * Sets upper_included from either a primitive value or Boolean wrapper.
   */
  set upper_included(val) {
    if (val === void 0 || val === null) {
      this._upper_included = void 0;
    } else if (typeof val === "boolean") {
      this._upper_included = Boolean2.from(val);
    } else {
      this._upper_included = val;
    }
  }
  /**
   * True if current object's interval is semantically same as \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Interval)) {
      return new Boolean2(false);
    }
    const otherInterval = other;
    if (this.lower_unbounded !== otherInterval.lower_unbounded) {
      return new Boolean2(false);
    }
    if (!this.lower_unbounded) {
      if (this.lower === void 0 || otherInterval.lower === void 0) {
        return new Boolean2(false);
      }
      if (!this.lower.is_equal(otherInterval.lower).value) {
        return new Boolean2(false);
      }
      if (this.lower_included !== otherInterval.lower_included) {
        return new Boolean2(false);
      }
    }
    if (this.upper_unbounded !== otherInterval.upper_unbounded) {
      return new Boolean2(false);
    }
    if (!this.upper_unbounded) {
      if (this.upper === void 0 || otherInterval.upper === void 0) {
        return new Boolean2(false);
      }
      if (!this.upper.is_equal(otherInterval.upper).value) {
        return new Boolean2(false);
      }
      if (this.upper_included !== otherInterval.upper_included) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
};
var Proper_interval = class extends Interval {
  /**
   * True if the value \`e\` is properly contained in this Interval.
   * @param e - Parameter
   * @returns Result value
   */
  has(e) {
    if (!this.lower_unbounded && this.lower !== void 0) {
      const cmp = e.less_than(this.lower);
      if (cmp.value === true)
        return new Boolean2(false);
      if (!this.lower_included) {
        const eq = e.is_equal(this.lower);
        if (eq.value === true)
          return new Boolean2(false);
      }
    }
    if (!this.upper_unbounded && this.upper !== void 0) {
      const cmp = this.upper.less_than(e);
      if (cmp.value === true)
        return new Boolean2(false);
      if (!this.upper_included) {
        const eq = e.is_equal(this.upper);
        if (eq.value === true)
          return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * True if there is any overlap between intervals represented by Current and \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  intersects(other) {
    if (!this.upper_unbounded && this.upper !== void 0 && !other.lower_unbounded && other.lower !== void 0) {
      if (this.upper.less_than(other.lower).value) {
        return new Boolean2(false);
      }
      if (this.upper.is_equal(other.lower).value && (!this.upper_included || !other.lower_included)) {
        return new Boolean2(false);
      }
    }
    if (!other.upper_unbounded && other.upper !== void 0 && !this.lower_unbounded && this.lower !== void 0) {
      if (other.upper.less_than(this.lower).value) {
        return new Boolean2(false);
      }
      if (other.upper.is_equal(this.lower).value && (!other.upper_included || !this.lower_included)) {
        return new Boolean2(false);
      }
    }
    return new Boolean2(true);
  }
  /**
   * True if current interval properly contains \`_other_\`.
   * @param other - Parameter
   * @returns Result value
   */
  contains(other) {
    if (!other.lower_unbounded && other.lower !== void 0) {
      if (this.lower_unbounded) {
      } else if (this.lower === void 0) {
        return new Boolean2(false);
      } else {
        if (this.lower.less_than(other.lower).value) {
        } else if (this.lower.is_equal(other.lower).value) {
          if (!this.lower_included && other.lower_included) {
            return new Boolean2(false);
          }
        } else {
          return new Boolean2(false);
        }
      }
    }
    if (!other.upper_unbounded && other.upper !== void 0) {
      if (this.upper_unbounded) {
      } else if (this.upper === void 0) {
        return new Boolean2(false);
      } else {
        if (other.upper.less_than(this.upper).value) {
        } else if (this.upper.is_equal(other.upper).value) {
          if (!this.upper_included && other.upper_included) {
            return new Boolean2(false);
          }
        } else {
          return new Boolean2(false);
        }
      }
    }
    return new Boolean2(true);
  }
};
var Multiplicity_interval = class _Multiplicity_interval extends Proper_interval {
  static {
    TYPE_REGISTRY.set("MULTIPLICITY_INTERVAL", _Multiplicity_interval);
  }
  /**
   * True if this interval imposes no constraints, i.e. is set to `0..*`.
   * @returns Result value
   */
  is_open() {
    const lowerVal = this.lower?.value || 0;
    return new Boolean2(
      lowerVal === 0 && this.upper_unbounded === true
    );
  }
  /**
   * True if this interval expresses optionality, i.e. \`0..1\`.
   * @returns Result value
   */
  is_optional() {
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean2(
      lowerVal === 0 && upperVal === 1
    );
  }
  /**
   * True if this interval expresses mandation, i.e. \`1..1\`.
   * @returns Result value
   */
  is_mandatory() {
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean2(
      lowerVal === 1 && upperVal === 1
    );
  }
  /**
   * True if this interval is set to \`0..0\`.
   * @returns Result value
   */
  is_prohibited() {
    const lowerVal = this.lower?.value || 0;
    const upperVal = this.upper?.value || 0;
    return new Boolean2(
      lowerVal === 0 && upperVal === 0
    );
  }
};

// base/foundation_types/terminology.ts
var Terminology_code = class _Terminology_code extends Any {
  static {
    TYPE_REGISTRY.set("TERMINOLOGY_CODE", _Terminology_code);
  }
  /**
   * Internal storage for terminology_id
   * @protected
   */
  _terminology_id;
  /**
   * The archetype environment namespace identifier used to identify a terminology. Typically a value like \`"snomed_ct"\` that is mapped elsewhere to the full URI identifying the terminology.
   */
  get terminology_id() {
    return this._terminology_id?.value;
  }
  /**
   * Gets the String wrapper object for terminology_id.
   * Use this to access String methods.
   */
  get $terminology_id() {
    return this._terminology_id;
  }
  /**
   * Sets terminology_id from either a primitive value or String wrapper.
   */
  set terminology_id(val) {
    if (val === void 0 || val === null) {
      this._terminology_id = void 0;
    } else if (typeof val === "string") {
      this._terminology_id = String2.from(val);
    } else {
      this._terminology_id = val;
    }
  }
  /**
   * Internal storage for terminology_version
   * @protected
   */
  _terminology_version;
  /**
   * Optional string value representing terminology version, typically a date or dotted numeric.
   */
  get terminology_version() {
    return this._terminology_version?.value;
  }
  /**
   * Gets the String wrapper object for terminology_version.
   * Use this to access String methods.
   */
  get $terminology_version() {
    return this._terminology_version;
  }
  /**
   * Sets terminology_version from either a primitive value or String wrapper.
   */
  set terminology_version(val) {
    if (val === void 0 || val === null) {
      this._terminology_version = void 0;
    } else if (typeof val === "string") {
      this._terminology_version = String2.from(val);
    } else {
      this._terminology_version = val;
    }
  }
  /**
   * Internal storage for code_string
   * @protected
   */
  _code_string;
  /**
   * A terminology code or post-coordinated code expression, if supported by the terminology. The code may refer to a single term, a value set consisting of multiple terms, or some other entity representable within the terminology.
   */
  get code_string() {
    return this._code_string?.value;
  }
  /**
   * Gets the String wrapper object for code_string.
   * Use this to access String methods.
   */
  get $code_string() {
    return this._code_string;
  }
  /**
   * Sets code_string from either a primitive value or String wrapper.
   */
  set code_string(val) {
    if (val === void 0 || val === null) {
      this._code_string = void 0;
    } else if (typeof val === "string") {
      this._code_string = String2.from(val);
    } else {
      this._code_string = val;
    }
  }
  /**
   * The URI reference that may be used as a concrete key into a notional terminology service for queries that can obtain the term text, definition, and other associated elements.
   */
  uri;
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Terminology_code)) {
      return new Boolean2(false);
    }
    const termIdMatch = this.terminology_id === other.terminology_id || this._terminology_id !== void 0 && other._terminology_id !== void 0 && this._terminology_id.is_equal(other._terminology_id).value;
    const codeMatch = this.code_string === other.code_string || this._code_string !== void 0 && other._code_string !== void 0 && this._code_string.is_equal(other._code_string).value;
    const versionMatch = this.terminology_version === other.terminology_version || this._terminology_version === void 0 && other._terminology_version === void 0 || this._terminology_version !== void 0 && other._terminology_version !== void 0 && this._terminology_version.is_equal(other._terminology_version).value;
    return new Boolean2(termIdMatch && codeMatch && versionMatch);
  }
};
var Terminology_term = class _Terminology_term extends Any {
  static {
    TYPE_REGISTRY.set("TERMINOLOGY_TERM", _Terminology_term);
  }
  /**
   * Reference to the terminology concept formally representing this term.
   */
  concept;
  /**
   * Internal storage for text
   * @protected
   */
  _text;
  /**
   * Text of term.
   */
  get text() {
    return this._text?.value;
  }
  /**
   * Gets the String wrapper object for text.
   * Use this to access String methods.
   */
  get $text() {
    return this._text;
  }
  /**
   * Sets text from either a primitive value or String wrapper.
   */
  set text(val) {
    if (val === void 0 || val === null) {
      this._text = void 0;
    } else if (typeof val === "string") {
      this._text = String2.from(val);
    } else {
      this._text = val;
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Terminology_term)) {
      return new Boolean2(false);
    }
    const textMatch = this.text === other.text || this._text !== void 0 && other._text !== void 0 && this._text.is_equal(other._text).value;
    const conceptMatch = this.concept === void 0 && other.concept === void 0 || this.concept !== void 0 && other.concept !== void 0 && this.concept.is_equal(other.concept).value;
    return new Boolean2(textMatch && conceptMatch);
  }
};

// base/foundation_types/temporal_api.ts
function builtinTemporal() {
  return globalThis.Temporal;
}

// base/foundation_types/time.ts
var TemporalAPI = builtinTemporal();
var Temporal = class extends Ordered {
};
var Iso8601_type = class extends Temporal {
  /**
   * Internal storage for value
   * @protected
   */
  _value;
  /**
   * Representation of all descendants is a single String.
   */
  get value() {
    return this._value?.value;
  }
  /**
   * Gets the String wrapper object for value.
   * Use this to access String methods.
   */
  get $value() {
    return this._value;
  }
  /**
   * Sets value from either a primitive value or String wrapper.
   */
  set value(val) {
    if (val === void 0 || val === null) {
      this._value = void 0;
    } else if (typeof val === "string") {
      this._value = String2.from(val);
    } else {
      this._value = val;
    }
  }
};
var Iso8601_date_time = class _Iso8601_date_time extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_DATE_TIME", _Iso8601_date_time);
  }
  /**
   * Extract the year part of the date as an Integer.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  year() {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.year);
    } catch {
      try {
        const match = val.match(/^(\d{4})-?(\d{2})?-?(\d{2})?/);
        if (match && match[1]) {
          return Integer.from(parseInt(match[1], 10));
        }
      } catch {
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
  month() {
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
  day() {
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
  hour() {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.hour);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the minute part of the date/time as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  minute() {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.minute);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the integral seconds part of the date/time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  second() {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return Integer.from(dt.second);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the fractional seconds part of the date/time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
   *
   * Uses Temporal API for robust ISO 8601 parsing.
   * @returns Result value
   */
  fractional_second() {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return dt.millisecond / 1e3 + dt.microsecond / 1e6 + dt.nanosecond / 1e9;
    } catch {
    }
    return 0;
  }
  /**
   * Timezone; may be Void.
   *
   * Uses Temporal API to extract timezone information.
   * @returns Result value
   */
  timezone() {
    const val = this.value || "";
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
  month_unknown() {
    return new Boolean2(this.month().value === 0);
  }
  /**
   * Indicates whether day in month is unknown.
   * @returns Result value
   */
  day_unknown() {
    return new Boolean2(this.day().value === 0);
  }
  /**
   * Indicates whether minute in hour is known.
   * @returns Result value
   */
  minute_unknown() {
    const val = this.value || "";
    return new Boolean2(!val.includes("T") || this.minute().value === 0);
  }
  /**
   * Indicates whether minute in hour is known.
   * @returns Result value
   */
  second_unknown() {
    const val = this.value || "";
    const hasSeconds = /T\d{2}:?\d{2}:?\d{2}/.test(val);
    return new Boolean2(!hasSeconds);
  }
  /**
   * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
   * @returns Result value
   */
  is_decimal_sign_comma() {
    const val = this.value || "";
    return new Boolean2(val.includes(","));
  }
  /**
   * True if this date time is partial, i.e. if seconds or more is missing.
   * @returns Result value
   */
  is_partial() {
    return this.second_unknown();
  }
  /**
   * True if this date/time uses \`'-'\`, \`':'\` separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes("-") || val.includes(":"));
  }
  /**
   * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
   * @returns Result value
   */
  has_fractional_second() {
    const val = this.value || "";
    return new Boolean2(/T\d{2}:?\d{2}:?\d{2}[,.]/.test(val));
  }
  /**
   * Return the string value in extended format.
   *
   * Uses Temporal API to parse and format in extended ISO 8601 format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      return String2.from(dt.toString());
    } catch {
      return String2.from(val);
    }
  }
  /**
   * Arithmetic addition of a duration to a date/time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt.add(dur);
      const newDateTime = new _Iso8601_date_time();
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
  subtract(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt.subtract(dur);
      const newDateTime = new _Iso8601_date_time();
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
  diff(a_date_time) {
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
  add_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
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
  subtract_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const dt = TemporalAPI.PlainDateTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = dt.subtract(dur);
      const newDateTime = new Iso8601_date();
      newDateTime.value = result.toPlainDate().toString();
      return newDateTime;
    } catch (e) {
      throw new Error(`Failed to subtract nominal duration: ${e}`);
    }
  }
  /**
   * Compares this date-time with another for ordering.
   * @param other - The object to compare with
   * @returns true if this date-time is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_date_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dt1 = TemporalAPI.PlainDateTime.from(val);
      const dt2 = TemporalAPI.PlainDateTime.from(otherVal);
      return new Boolean2(TemporalAPI.PlainDateTime.compare(dt1, dt2) < 0);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_date_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dt1 = TemporalAPI.PlainDateTime.from(val);
      const dt2 = TemporalAPI.PlainDateTime.from(otherVal);
      return new Boolean2(TemporalAPI.PlainDateTime.compare(dt1, dt2) === 0);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_duration = class _Iso8601_duration extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_DURATION", _Iso8601_duration);
  }
  /**
   * Helper method to convert openEHR duration with weeks to standard ISO 8601.
   * OpenEHR allows weeks to be mixed with other designators, but Temporal API doesn't.
   * This converts weeks to days (1W = 7D).
   * @param value - Duration string that may contain weeks
   * @returns Duration string with weeks converted to days
   */
  static normalizeWeeks(value) {
    const weeksMatch = value.match(/(\d+(?:\.\d+)?)W/);
    if (!weeksMatch)
      return value;
    const weeks = parseFloat(weeksMatch[1]);
    const days = weeks * 7;
    let normalized = value.replace(/\d+(?:\.\d+)?W/, "");
    const daysMatch = normalized.match(/(\d+(?:\.\d+)?)D/);
    if (daysMatch) {
      const existingDays = parseFloat(daysMatch[1]);
      const totalDays = existingDays + days;
      normalized = normalized.replace(/\d+(?:\.\d+)?D/, `${totalDays}D`);
    } else {
      if (normalized.includes("T")) {
        normalized = normalized.replace("T", `${days}DT`);
      } else {
        normalized = normalized.replace(/P(.*)$/, `P$1${days}D`);
      }
    }
    return normalized;
  }
  /**
   * Returns True.
   * @returns Result value
   */
  is_extended() {
    return new Boolean2(true);
  }
  /**
   * Returns False.
   * @returns Result value
   */
  is_partial() {
    return new Boolean2(false);
  }
  /**
   * Number of years in the \`_value_\`, i.e. the number preceding the \`'Y'\` in the \`'YMD'\` part, if one exists.
   * @returns Result value
   */
  years() {
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
  months() {
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
  days() {
    const val = this.value || "";
    try {
      const normalized = _Iso8601_duration.normalizeWeeks(val);
      const dur = TemporalAPI.Duration.from(normalized);
      return Integer.from(dur.days || 0);
    } catch {
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
  hours() {
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
  minutes() {
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
  seconds() {
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
  fractional_seconds() {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      return (dur.milliseconds || 0) / 1e3 + (dur.microseconds || 0) / 1e6 + (dur.nanoseconds || 0) / 1e9;
    } catch {
      return 0;
    }
  }
  /**
   * Number of weeks in the \`_value_\`, i.e. the value preceding the \`W\`, if one exists.
   * @returns Result value
   */
  weeks() {
    const val = this.value || "";
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
  is_decimal_sign_comma() {
    const val = this.value || "";
    return new Boolean2(val.includes(","));
  }
  /**
   * Total number of seconds equivalent (including fractional) of entire duration. Where non-definite elements such as year and month (i.e. 'Y' and 'M') are included, the corresponding 'average' durations from \`Time_definitions\` are used to compute the result.
   * @returns Result value
   */
  to_seconds() {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(val);
      const totalSeconds = (dur.years || 0) * 31536e3 + (dur.months || 0) * 2592e3 + (dur.weeks || 0) * 604800 + (dur.days || 0) * 86400 + (dur.hours || 0) * 3600 + (dur.minutes || 0) * 60 + (dur.seconds || 0) + (dur.milliseconds || 0) / 1e3 + (dur.microseconds || 0) / 1e6 + (dur.nanoseconds || 0) / 1e9;
      return totalSeconds;
    } catch {
      return 0;
    }
  }
  /**
   * Return the duration string value.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      return String2.from(dur.toString());
    } catch {
      return String2.from(val);
    }
  }
  /**
   * Arithmetic addition of a duration to a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
   * @param a_val - Parameter
   * @returns Result value
   */
  add(a_val) {
    const val = this.value || "";
    const otherVal = a_val.value || "";
    try {
      const dur1 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const dur2 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(otherVal)
      );
      const result = dur1.add(dur2);
      const newDuration = new _Iso8601_duration();
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
  subtract(a_val) {
    const val = this.value || "";
    const otherVal = a_val.value || "";
    try {
      const dur1 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const dur2 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(otherVal)
      );
      const result = dur1.subtract(dur2);
      const newDuration = new _Iso8601_duration();
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
  multiply(a_val) {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
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
        nanoseconds: dur.nanoseconds * a_val
      });
      const newDuration = new _Iso8601_duration();
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
  divide(a_val) {
    if (a_val === 0) {
      throw new Error("Division by zero");
    }
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
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
        nanoseconds: dur.nanoseconds / a_val
      });
      const newDuration = new _Iso8601_duration();
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
  negative() {
    const val = this.value || "";
    try {
      const dur = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const result = dur.negated();
      const newDuration = new _Iso8601_duration();
      newDuration.value = result.toString();
      return newDuration;
    } catch (e) {
      throw new Error(`Failed to negate duration: ${e}`);
    }
  }
  /**
   * Compares this duration with another for ordering.
   * @param other - The object to compare with
   * @returns true if this duration is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_duration)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dur1 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const dur2 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(otherVal)
      );
      const total1 = dur1.total({ unit: "seconds" });
      const total2 = dur2.total({ unit: "seconds" });
      return new Boolean2(total1 < total2);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_duration)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const dur1 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(val)
      );
      const dur2 = TemporalAPI.Duration.from(
        _Iso8601_duration.normalizeWeeks(otherVal)
      );
      const total1 = dur1.total({ unit: "seconds" });
      const total2 = dur2.total({ unit: "seconds" });
      return new Boolean2(total1 === total2);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_time = class _Iso8601_time extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_TIME", _Iso8601_time);
  }
  /**
   * Extract the hour part of the date/time as an Integer.
   * @returns Result value
   */
  hour() {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return Integer.from(time.hour);
    } catch {
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
  minute() {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return Integer.from(time.minute);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the integral seconds part of the time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
   * @returns Result value
   */
  second() {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return Integer.from(time.second);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Extract the fractional seconds part of the time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
   * @returns Result value
   */
  fractional_second() {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return time.millisecond / 1e3 + time.microsecond / 1e6 + time.nanosecond / 1e9;
    } catch {
    }
    return 0;
  }
  /**
   * Timezone; may be Void.
   * @returns Result value
   */
  timezone() {
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
  minute_unknown() {
    const val = this.value || "";
    const hasMinutes = /^\d{2}:?\d{2}/.test(val);
    return new Boolean2(!hasMinutes);
  }
  /**
   * Indicates whether second is unknown. If so and minute is known, the time is of the form \`"hh:mm"\` or \`"hhmm"\`.
   * @returns Result value
   */
  second_unknown() {
    const val = this.value || "";
    const hasSeconds = /^\d{2}:?\d{2}:?\d{2}/.test(val);
    return new Boolean2(!hasSeconds);
  }
  /**
   * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
   * @returns Result value
   */
  is_decimal_sign_comma() {
    const val = this.value || "";
    return new Boolean2(val.includes(","));
  }
  /**
   * True if this time is partial, i.e. if seconds or more is missing.
   * @returns Result value
   */
  is_partial() {
    return this.second_unknown();
  }
  /**
   * True if this time uses \`'-'\`, \`':'\` separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes(":"));
  }
  /**
   * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
   * @returns Result value
   */
  has_fractional_second() {
    const val = this.value || "";
    return new Boolean2(/\d{2}[,.]/.test(val));
  }
  /**
   * Return string value in extended format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      return String2.from(time.toString());
    } catch {
      return String2.from(val);
    }
  }
  /**
   * Arithmetic addition of a duration to a time.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = time.add(dur);
      const newTime = new _Iso8601_time();
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
  subtract(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const time = TemporalAPI.PlainTime.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = time.subtract(dur);
      const newTime = new _Iso8601_time();
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
  diff(a_time) {
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
  /**
   * Compares this time with another for ordering.
   * @param other - The object to compare with
   * @returns true if this time is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const time1 = TemporalAPI.PlainTime.from(val);
      const time2 = TemporalAPI.PlainTime.from(otherVal);
      return new Boolean2(TemporalAPI.PlainTime.compare(time1, time2) < 0);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_time)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const time1 = TemporalAPI.PlainTime.from(val);
      const time2 = TemporalAPI.PlainTime.from(otherVal);
      return new Boolean2(TemporalAPI.PlainTime.compare(time1, time2) === 0);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_date = class _Iso8601_date extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_DATE", _Iso8601_date);
  }
  /**
   * Extract the year part of the date as an Integer.
   *
   * Uses Temporal API for robust ISO 8601 date parsing.
   * @returns Result value
   */
  year() {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return Integer.from(date.year);
    } catch {
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
  month() {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return Integer.from(date.month);
    } catch {
      try {
        const ym = TemporalAPI.PlainYearMonth.from(val);
        return Integer.from(ym.month);
      } catch {
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
  day() {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return Integer.from(date.day);
    } catch {
    }
    return Integer.from(0);
  }
  /**
   * Indicates whether month in year is unknown. If so, the date is of the form \`"YYYY"\`.
   * @returns Result value
   */
  month_unknown() {
    return new Boolean2(this.month().value === 0);
  }
  /**
   * Indicates whether day in month is unknown. If so, and month is known, the date is of the form \`"YYYY-MM"\` or \`"YYYYMM"\`.
   * @returns Result value
   */
  day_unknown() {
    return new Boolean2(this.day().value === 0);
  }
  /**
   * True if this date is partial, i.e. if days or more is missing.
   * @returns Result value
   */
  is_partial() {
    return this.day_unknown();
  }
  /**
   * True if this date uses \`'-'\` separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes("-"));
  }
  /**
   * Return string value in extended format.
   *
   * Uses Temporal API to parse and format in extended ISO 8601 format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      return String2.from(date.toString());
    } catch {
      try {
        const ym = TemporalAPI.PlainYearMonth.from(val);
        return String2.from(ym.toString());
      } catch {
        return String2.from(val);
      }
    }
  }
  /**
   * Arithmetic addition of a duration to a date.
   * @param a_diff - Parameter
   * @returns Result value
   */
  add(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.add(dur);
      const newDate = new _Iso8601_date();
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
  subtract(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.subtract(dur);
      const newDate = new _Iso8601_date();
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
  diff(a_date) {
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
  add_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.add(dur, { overflow: "constrain" });
      const newDate = new _Iso8601_date();
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
  subtract_nominal(a_diff) {
    const val = this.value || "";
    const diffVal = a_diff.value || "";
    try {
      const date = TemporalAPI.PlainDate.from(val);
      const dur = TemporalAPI.Duration.from(
        Iso8601_duration.normalizeWeeks(diffVal)
      );
      const result = date.subtract(dur, { overflow: "constrain" });
      const newDate = new _Iso8601_date();
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
  less_than(other) {
    if (!(other instanceof _Iso8601_date)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const date1 = TemporalAPI.PlainDate.from(val);
      const date2 = TemporalAPI.PlainDate.from(otherVal);
      return new Boolean2(TemporalAPI.PlainDate.compare(date1, date2) < 0);
    } catch {
      return new Boolean2(val < otherVal);
    }
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_date)) {
      return new Boolean2(false);
    }
    const val = this.value || "";
    const otherVal = other.value || "";
    try {
      const date1 = TemporalAPI.PlainDate.from(val);
      const date2 = TemporalAPI.PlainDate.from(otherVal);
      return new Boolean2(TemporalAPI.PlainDate.compare(date1, date2) === 0);
    } catch {
      return new Boolean2(val === otherVal);
    }
  }
};
var Iso8601_timezone = class _Iso8601_timezone extends Iso8601_type {
  static {
    TYPE_REGISTRY.set("ISO8601_TIMEZONE", _Iso8601_timezone);
  }
  /**
   * Extract the hour part of timezone, as an Integer in the range `00 - 14`.
   * @returns Result value
   */
  hour() {
    const val = this.value || "";
    if (val === "Z")
      return Integer.from(0);
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
  minute() {
    const val = this.value || "";
    if (val === "Z")
      return Integer.from(0);
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
  sign() {
    const val = this.value || "";
    if (val === "Z")
      return Integer.from(1);
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
  minute_unknown() {
    const val = this.value || "";
    if (val === "Z")
      return new Boolean2(false);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    return new Boolean2(!match || !match[3]);
  }
  /**
   * True if this time zone is partial, i.e. if minutes is missing.
   * @returns Result value
   */
  is_partial() {
    return this.minute_unknown();
  }
  /**
   * True if this time-zone uses ‘:’ separators.
   * @returns Result value
   */
  is_extended() {
    const val = this.value || "";
    return new Boolean2(val.includes(":"));
  }
  /**
   * True if timezone is UTC, i.e. \`+0000\` or \`Z\`.
   * @returns Result value
   */
  is_gmt() {
    const val = this.value || "";
    if (val === "Z")
      return new Boolean2(true);
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      return new Boolean2(hours === 0 && minutes === 0);
    }
    return new Boolean2(false);
  }
  /**
   * Return timezone string in extended format.
   * @returns Result value
   */
  as_string() {
    const val = this.value || "";
    if (val === "Z")
      return String2.from("Z");
    const match = val.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const sign = match[1];
      const hours = match[2];
      const minutes = match[3] || "00";
      return String2.from(`${sign}${hours}:${minutes}`);
    }
    return String2.from(val);
  }
  /**
   * Compares this timezone with another for ordering.
   * Timezones are ordered by their offset from UTC in minutes.
   * @param other - The object to compare with
   * @returns true if this timezone is less than the other
   */
  less_than(other) {
    if (!(other instanceof _Iso8601_timezone)) {
      return new Boolean2(false);
    }
    const thisSign = this.sign().value || 1;
    const thisHour = this.hour().value || 0;
    const thisMinute = this.minute().value || 0;
    const thisOffset = thisSign * (thisHour * 60 + thisMinute);
    const otherSign = other.sign().value || 1;
    const otherHour = other.hour().value || 0;
    const otherMinute = other.minute().value || 0;
    const otherOffset = otherSign * (otherHour * 60 + otherMinute);
    return new Boolean2(thisOffset < otherOffset);
  }
  /**
   * Value equality: return True if this and other are equal in value.
   * @param other - Parameter
   * @returns Result value
   */
  is_equal(other) {
    if (!(other instanceof _Iso8601_timezone)) {
      return new Boolean2(false);
    }
    const thisSign = this.sign().value || 1;
    const thisHour = this.hour().value || 0;
    const thisMinute = this.minute().value || 0;
    const thisOffset = thisSign * (thisHour * 60 + thisMinute);
    const otherSign = other.sign().value || 1;
    const otherHour = other.hour().value || 0;
    const otherMinute = other.minute().value || 0;
    const otherOffset = otherSign * (otherHour * 60 + otherMinute);
    return new Boolean2(thisOffset === otherOffset);
  }
};

// base/base_types/builtins.ts
var GMath = globalThis.Math;

// base/_unassigned.ts
var Byte = class _Byte extends Ordered {
  static {
    TYPE_REGISTRY.set("BYTE", _Byte);
  }
  /**
   * The underlying primitive value.
   */
  value;
  /**
   * Creates a new Byte instance.
   * @param val - The primitive value to wrap
   */
  constructor(val) {
    super();
    if (val !== void 0 && val !== null && (!Number.isInteger(val) || val < 0 || val > 255)) {
      throw new Error(
        `Byte value must be an integer between 0 and 255, got: ${val}`
      );
    }
    this.value = val;
  }
  /**
   * Creates a Byte instance from a primitive value.
   * @param val - The primitive value to wrap
   * @returns A new Byte instance
   */
  static from(val) {
    return new _Byte(val);
  }
  /**
   * Returns True if current Byte is less than other.
   * @param other - Parameter
   * @returns Result value
   */
  less_than(other) {
    if (other instanceof _Byte) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal < otherVal);
    }
    return new Boolean2(false);
  }
  /**
   * Compares this Byte with another for value equality.
   * @param other - The object to compare with
   * @returns true if the values are equal
   */
  is_equal(other) {
    if (other instanceof _Byte) {
      const thisVal = this.value || 0;
      const otherVal = other.value || 0;
      return new Boolean2(thisVal === otherVal);
    }
    return new Boolean2(false);
  }
};

// parser/annotation_families.ts
var UNPREFIXED_FAMILY = "(unprefixed)";
var FAMILY_FILL = {
  "L10n.": "#ede9fe",
  "a.": "#d1fae5",
  [UNPREFIXED_FAMILY]: "#e2e8f0"
};

// parser/l10n_annotation_generate.ts
function l10nAnnotationKey(language) {
  return `L10n.${language}`;
}
function isL10nKey(key) {
  return /^L10n\./i.test(key);
}
function countArchetypeRefs(nodes) {
  const counts = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    const ref = node.archetypeRef?.trim();
    if (!ref)
      continue;
    counts.set(ref, (counts.get(ref) ?? 0) + 1);
  }
  return counts;
}
function eligibleNodes(nodes, repeatedOnly) {
  if (!repeatedOnly) {
    return nodes.filter((n) => n.path && n.localizedNames);
  }
  const counts = countArchetypeRefs(nodes);
  return nodes.filter((n) => {
    if (!n.path || !n.localizedNames)
      return false;
    const ref = n.archetypeRef?.trim();
    return !!ref && (counts.get(ref) ?? 0) > 1;
  });
}
function proposeL10nWrites(doc, nodes, options) {
  const bags = [...new Set(
    options.languageBags.map((l) => l.trim()).filter(Boolean)
  )];
  if (!bags.length)
    return [];
  const repeatedOnly = options.repeatedOccurrencesOnly !== false;
  const writes = [];
  for (const node of eligibleNodes(nodes, repeatedOnly)) {
    const names = node.localizedNames ?? {};
    for (const [lang, text] of Object.entries(names)) {
      const value = text?.trim();
      if (!value)
        continue;
      const key = l10nAnnotationKey(lang);
      if (!isL10nKey(key))
        continue;
      const targetBags = options.copyToAllLanguageBags === false ? bags.filter((b) => b.toLowerCase() === lang.toLowerCase()) : bags;
      if (!targetBags.length)
        continue;
      for (const bag of targetBags) {
        const existing = doc?.[bag]?.[node.path]?.[key];
        if (existing === void 0) {
          writes.push({
            languageBag: bag,
            path: node.path,
            key,
            value,
            kind: "add"
          });
          continue;
        }
        if (existing === value) {
          writes.push({
            languageBag: bag,
            path: node.path,
            key,
            value,
            kind: "unchanged",
            existingValue: existing
          });
          continue;
        }
        writes.push({
          languageBag: bag,
          path: node.path,
          key,
          value,
          kind: "conflict",
          existingValue: existing
        });
      }
    }
  }
  return writes;
}
function applyL10nWrites(doc, writes, overwrite = false) {
  const result = {
    applied: 0,
    skippedUnchanged: 0,
    skippedConflict: 0,
    skippedNonL10n: 0
  };
  for (const write of writes) {
    if (!isL10nKey(write.key)) {
      result.skippedNonL10n++;
      continue;
    }
    if (write.kind === "unchanged") {
      result.skippedUnchanged++;
      continue;
    }
    if (write.kind === "conflict" && !overwrite) {
      result.skippedConflict++;
      continue;
    }
    if (!doc[write.languageBag])
      doc[write.languageBag] = {};
    if (!doc[write.languageBag][write.path]) {
      doc[write.languageBag][write.path] = {};
    }
    doc[write.languageBag][write.path][write.key] = write.value;
    result.applied++;
  }
  return result;
}

// examples/taaat-app/src/prototype/sample-model.ts
var PROTO_LANGUAGES = ["en", "sv", "fr"];
function cloneSampleTree() {
  return structuredClone(SAMPLE_TREE);
}
function cloneSampleDocumentation() {
  return structuredClone(SAMPLE_DOCUMENTATION);
}
function flattenNodes(node, out = []) {
  out.push(node);
  for (const child of node.children)
    flattenNodes(child, out);
  return out;
}
function findNode(node, path) {
  if (node.path === path)
    return node;
  for (const child of node.children) {
    const hit = findNode(child, path);
    if (hit)
      return hit;
  }
  return void 0;
}
function asL10nSources(root) {
  return flattenNodes(root).map((n) => ({
    path: n.path,
    localizedNames: n.localizedNames,
    archetypeRef: n.archetypeRef
  }));
}
function countArchetypeRefs2(root) {
  const counts = /* @__PURE__ */ new Map();
  for (const n of flattenNodes(root)) {
    if (!n.archetypeRef)
      continue;
    counts.set(n.archetypeRef, (counts.get(n.archetypeRef) ?? 0) + 1);
  }
  return counts;
}
function isRepeated(node, counts) {
  if (!node.archetypeRef)
    return false;
  return (counts.get(node.archetypeRef) ?? 0) > 1;
}
function l10nCoverage(doc, node, languages) {
  const present = [];
  const missing = [];
  for (const lang of languages) {
    const key = `L10n.${lang}`;
    const has = languages.some((bag) => doc[bag]?.[node.path]?.[key]);
    if (has)
      present.push(lang);
    else
      missing.push(lang);
  }
  return { present, missing };
}
var SAMPLE_TREE = {
  id: "root",
  path: "/",
  name: "Home care encounter",
  rmType: "COMPOSITION",
  nodeId: "openEHR-EHR-COMPOSITION.encounter.v1",
  archetypeRef: "openEHR-EHR-COMPOSITION.encounter.v1",
  occurrences: "1..1",
  localizedNames: {
    en: "Home care encounter",
    sv: "Hemv\xE5rdsbes\xF6k",
    fr: "Rencontre de soins \xE0 domicile"
  },
  children: [
    {
      id: "ctx",
      path: "/context",
      name: "Context",
      rmType: "EVENT_CONTEXT",
      occurrences: "0..1",
      localizedNames: { en: "Context", sv: "Kontext", fr: "Contexte" },
      children: [
        {
          id: "setting",
          path: "/context/setting",
          name: "Setting",
          rmType: "DV_CODED_TEXT",
          nodeId: "setting",
          occurrences: "1..1",
          localizedNames: { en: "Setting", sv: "Milj\xF6", fr: "Cadre" },
          children: []
        }
      ]
    },
    {
      id: "eq",
      path: "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']",
      name: "Medical equipment at home",
      rmType: "SECTION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-SECTION.adhoc.v1",
      occurrences: "0..1",
      localizedNames: {
        en: "Medical equipment at home",
        sv: "Medicinsk utrustning i hemmet",
        fr: "\xC9quipement m\xE9dical \xE0 domicile"
      },
      children: [
        {
          id: "eq-note",
          path: "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']/items[at0001]",
          name: "Narrative",
          rmType: "ELEMENT",
          nodeId: "at0001",
          occurrences: "0..1",
          localizedNames: { en: "Narrative", sv: "Ber\xE4ttelse", fr: "R\xE9cit" },
          children: []
        }
      ]
    },
    {
      id: "soc",
      path: "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Social situation']",
      name: "Social situation",
      rmType: "SECTION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-SECTION.adhoc.v1",
      occurrences: "0..1",
      localizedNames: {
        en: "Social situation",
        sv: "Social situation",
        fr: "Situation sociale"
      },
      children: [
        {
          id: "soc-note",
          path: "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Social situation']/items[at0001]",
          name: "Narrative",
          rmType: "ELEMENT",
          nodeId: "at0001",
          occurrences: "0..1",
          localizedNames: { en: "Narrative", sv: "Ber\xE4ttelse", fr: "R\xE9cit" },
          children: []
        }
      ]
    },
    {
      id: "bp",
      path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]",
      name: "Blood pressure",
      rmType: "OBSERVATION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-OBSERVATION.blood_pressure.v2",
      occurrences: "0..1",
      localizedNames: {
        en: "Blood pressure",
        sv: "Blodtryck",
        fr: "Pression art\xE9rielle"
      },
      children: [
        {
          id: "bp-data",
          path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]",
          name: "Data",
          rmType: "HISTORY",
          nodeId: "at0001",
          occurrences: "1..1",
          localizedNames: { en: "Data", sv: "Data", fr: "Donn\xE9es" },
          children: [
            {
              id: "bp-any",
              path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]",
              name: "Any event",
              rmType: "POINT_EVENT",
              nodeId: "at0002",
              occurrences: "0..*",
              localizedNames: {
                en: "Any event",
                sv: "Valfri h\xE4ndelse",
                fr: "Tout \xE9v\xE9nement"
              },
              children: [
                {
                  id: "sys",
                  path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]/data[at0003]/items[at0004]",
                  name: "Systolic",
                  rmType: "ELEMENT",
                  nodeId: "at0004",
                  occurrences: "1..1",
                  localizedNames: {
                    en: "Systolic",
                    sv: "Systoliskt",
                    fr: "Systolique"
                  },
                  children: []
                },
                {
                  id: "dia",
                  path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]/data[at0003]/items[at0005]",
                  name: "Diastolic",
                  rmType: "ELEMENT",
                  nodeId: "at0005",
                  occurrences: "1..1",
                  localizedNames: {
                    en: "Diastolic",
                    sv: "Diastoliskt",
                    fr: "Diastolique"
                  },
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "dx",
      path: "/content[openEHR-EHR-EVALUATION.problem_diagnosis.v1]",
      name: "Problem/Diagnosis",
      rmType: "EVALUATION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
      occurrences: "0..*",
      localizedNames: {
        en: "Problem/Diagnosis",
        sv: "Problem/diagnos",
        fr: "Probl\xE8me/diagnostic"
      },
      children: [
        {
          id: "dx-name",
          path: "/content[openEHR-EHR-EVALUATION.problem_diagnosis.v1]/data[at0001]/items[at0002]",
          name: "Diagnosis name",
          rmType: "ELEMENT",
          nodeId: "at0002",
          occurrences: "1..1",
          localizedNames: {
            en: "Diagnosis name",
            sv: "Diagnosnamn",
            fr: "Nom du diagnostic"
          },
          children: []
        }
      ]
    }
  ]
};
var SAMPLE_DOCUMENTATION = {
  en: {
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']": {
      "design note": "Renamed occurrence \u2014 needs L10n on OPT export",
      "L10n.en": "Medical equipment at home"
    },
    "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]/data[at0003]/items[at0004]": {
      ui: "passthrough",
      comment: "mmHg"
    }
  },
  sv: {
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']": {
      "design note": "Renamed occurrence \u2014 needs L10n on OPT export"
    }
  },
  fr: {}
};

// examples/taaat-app/src/prototype/session.ts
function createSession() {
  const tree = cloneSampleTree();
  return {
    tree,
    documentation: cloneSampleDocumentation(),
    languages: [...PROTO_LANGUAGES],
    selectedPath: tree.path,
    editorLanguage: "en",
    overwrite: false,
    repeatedOnly: true,
    copyToAllBags: true,
    lastWrites: []
  };
}
function selectedNode(session2) {
  return findNode(session2.tree, session2.selectedPath);
}
function setAnnotation(session2, path, key, value, language = session2.editorLanguage) {
  const k = key.trim();
  if (!k)
    return;
  session2.documentation[language] ??= {};
  session2.documentation[language][path] ??= {};
  session2.documentation[language][path][k] = value;
}
function previewL10n(session2) {
  const writes = proposeL10nWrites(session2.documentation, asL10nSources(session2.tree), {
    languageBags: session2.languages,
    overwrite: session2.overwrite,
    repeatedOccurrencesOnly: session2.repeatedOnly,
    copyToAllLanguageBags: session2.copyToAllBags
  });
  session2.lastWrites = writes;
  return writes;
}
function applyL10n(session2) {
  const writes = previewL10n(session2);
  const result = applyL10nWrites(
    session2.documentation,
    writes,
    session2.overwrite
  );
  session2.lastResult = result;
  return result;
}
function resetSession(session2) {
  const fresh = createSession();
  session2.tree = fresh.tree;
  session2.documentation = fresh.documentation;
  session2.selectedPath = fresh.selectedPath;
  session2.lastWrites = [];
  session2.lastResult = void 0;
}
function sessionSnapshot(session2) {
  return {
    selectedPath: session2.selectedPath,
    editorLanguage: session2.editorLanguage,
    generate: {
      overwrite: session2.overwrite,
      repeatedOnly: session2.repeatedOnly,
      copyToAllBags: session2.copyToAllBags,
      lastResult: session2.lastResult ?? null,
      writeCounts: {
        add: session2.lastWrites.filter((w) => w.kind === "add").length,
        unchanged: session2.lastWrites.filter((w) => w.kind === "unchanged").length,
        conflict: session2.lastWrites.filter((w) => w.kind === "conflict").length
      }
    },
    documentation: session2.documentation
  };
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// examples/taaat-app/src/prototype/switcher.ts
function currentVariantKey(keys, fallback) {
  const params = new URLSearchParams(location.search);
  const raw = params.get("variant")?.toUpperCase();
  return raw && keys.includes(raw) ? raw : fallback;
}
function setVariantInUrl(key) {
  const url = new URL(location.href);
  url.searchParams.set("variant", key);
  history.replaceState({}, "", url);
}
function mountPrototypeSwitcher(host, variants, current, onChange) {
  host.innerHTML = "";
  host.className = "proto-switcher";
  host.setAttribute("aria-label", "Prototype variant switcher");
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "proto-switcher-btn";
  prev.textContent = "\u2190";
  prev.title = "Previous variant";
  const label = document.createElement("span");
  label.className = "proto-switcher-label";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "proto-switcher-btn";
  next.textContent = "\u2192";
  next.title = "Next variant";
  const paint = (key) => {
    const def = variants.find((v) => v.key === key) ?? variants[0];
    label.textContent = `${def.key} \u2014 ${def.name}`;
  };
  paint(current);
  const cycle = (delta) => {
    const i = variants.findIndex((v) => v.key === currentVariantKey(
      variants.map((v2) => v2.key),
      variants[0].key
    ));
    const nextKey = variants[(i + delta + variants.length) % variants.length].key;
    setVariantInUrl(nextKey);
    onChange(nextKey);
  };
  prev.addEventListener("click", () => cycle(-1));
  next.addEventListener("click", () => cycle(1));
  host.append(prev, label, next);
  document.addEventListener("keydown", (event) => {
    const t = event.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
      return;
    }
    if (event.key === "ArrowLeft")
      cycle(-1);
    if (event.key === "ArrowRight")
      cycle(1);
  });
}

// examples/taaat-app/src/prototype/widgets.ts
function renderGeneratePanel(session2, rerender, options) {
  const wrap = document.createElement("section");
  wrap.className = "gen-panel";
  wrap.innerHTML = `
    <h3>Generate L10n annotations</h3>
    <p class="gen-help">
      Writes only <code>L10n.{lang}</code> keys into
      <code>annotations.documentation</code>. Definition, terminology, and
      other keys (e.g. <code>design note</code>) are left alone.
      See <a href="https://discourse.openehr.org/t/2760" target="_blank" rel="noopener">discourse #2760</a>.
    </p>
    <label><input type="checkbox" data-flag="repeatedOnly"${session2.repeatedOnly ? " checked" : ""}>
      Repeated archetype occurrences only (OPT 1.4 gap)</label>
    <label><input type="checkbox" data-flag="copyToAllBags"${session2.copyToAllBags ? " checked" : ""}>
      Copy into every language bag (needed for any primary-language OPT export)</label>
    <label><input type="checkbox" data-flag="overwrite"${session2.overwrite ? " checked" : ""}>
      Overwrite existing L10n.* values that differ</label>
    <div class="gen-actions">
      <button type="button" class="btn" data-act="preview">Preview writes</button>
      <button type="button" class="btn btn-primary" data-act="apply">Apply L10n</button>
    </div>
    <div class="gen-preview"></div>
  `;
  wrap.querySelectorAll("input[data-flag]").forEach((inp) => {
    inp.addEventListener("change", () => {
      const flag = inp.dataset.flag;
      session2[flag] = inp.checked;
      rerender();
    });
  });
  wrap.querySelector("[data-act=preview]")?.addEventListener("click", () => {
    previewL10n(session2);
    rerender();
  });
  wrap.querySelector("[data-act=apply]")?.addEventListener("click", () => {
    applyL10n(session2);
    rerender();
  });
  const preview = wrap.querySelector(".gen-preview");
  if (session2.lastWrites.length) {
    const adds = session2.lastWrites.filter((w) => w.kind === "add").length;
    const same = session2.lastWrites.filter((w) => w.kind === "unchanged").length;
    const conflicts = session2.lastWrites.filter((w) => w.kind === "conflict").length;
    const rows = (options?.compact ? session2.lastWrites.filter((w) => w.kind !== "unchanged") : session2.lastWrites).slice(0, 40);
    preview.innerHTML = `
      <p class="gen-counts">
        add ${adds} \xB7 unchanged ${same} \xB7 conflict ${conflicts}
        ${session2.lastResult ? ` \xB7 applied ${session2.lastResult.applied}` : ""}
      </p>
      <table class="gen-table">
        <thead><tr><th>kind</th><th>bag</th><th>key</th><th>value</th></tr></thead>
        <tbody>
          ${rows.map(
      (w) => `<tr class="kind-${w.kind}">
              <td>${w.kind}</td>
              <td>${escapeHtml(w.languageBag)}</td>
              <td>${escapeHtml(w.key)}</td>
              <td>${escapeHtml(w.value)}${w.existingValue && w.kind === "conflict" ? ` <s>${escapeHtml(w.existingValue)}</s>` : ""}</td>
            </tr>`
    ).join("")}
        </tbody>
      </table>
    `;
  } else {
    preview.innerHTML = `<p class="muted">Preview lists the exact L10n.* writes before they land.</p>`;
  }
  return wrap;
}
function renderAnnotationEditor(session2, rerender) {
  const wrap = document.createElement("section");
  wrap.className = "ann-editor";
  const path = session2.selectedPath;
  const rows = Object.entries(
    session2.documentation[session2.editorLanguage]?.[path] ?? {}
  );
  wrap.innerHTML = `
    <h3>Annotations</h3>
    <p class="path-display" title="${escapeHtml(path)}">${escapeHtml(path)}</p>
    <div class="ann-toolbar">
      <label>Language bag
        <select data-lang>
          ${session2.languages.map(
    (l) => `<option value="${l}"${l === session2.editorLanguage ? " selected" : ""}>${l}</option>`
  ).join("")}
        </select>
      </label>
      <button type="button" class="btn" data-act="add">Add row</button>
    </div>
    <table class="ann-table">
      <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
      <tbody>
        ${rows.map(
    ([k, v], i) => `<tr>
          <td><input data-i="${i}" data-f="key" value="${escapeHtml(k)}"></td>
          <td><input data-i="${i}" data-f="value" value="${escapeHtml(v)}"></td>
          <td><button type="button" data-del="${escapeHtml(k)}">\xD7</button></td>
        </tr>`
  ).join("") || `<tr><td colspan="3" class="muted">No annotations in this language bag.</td></tr>`}
      </tbody>
    </table>
  `;
  wrap.querySelector("[data-lang]")?.addEventListener(
    "change",
    (e) => {
      session2.editorLanguage = e.target.value;
      rerender();
    }
  );
  wrap.querySelector("[data-act=add]")?.addEventListener("click", () => {
    session2.documentation[session2.editorLanguage] ??= {};
    session2.documentation[session2.editorLanguage][path] ??= {};
    const bag = session2.documentation[session2.editorLanguage][path];
    let key = "comment";
    let n = 2;
    while (bag[key] !== void 0) {
      key = `comment-${n++}`;
    }
    bag[key] = "";
    rerender();
  });
  wrap.querySelectorAll("input[data-i]").forEach((inp) => {
    inp.addEventListener("change", () => {
      const i = Number(inp.dataset.i);
      const prevKey = rows[i]?.[0];
      if (!prevKey)
        return;
      const keyInp = wrap.querySelector(
        `input[data-i="${i}"][data-f="key"]`
      );
      const valInp = wrap.querySelector(
        `input[data-i="${i}"][data-f="value"]`
      );
      const nextKey = keyInp?.value.trim() ?? prevKey;
      const nextVal = valInp?.value ?? "";
      const bag = session2.documentation[session2.editorLanguage]?.[path];
      if (!bag)
        return;
      if (nextKey !== prevKey)
        delete bag[prevKey];
      if (nextKey)
        bag[nextKey] = nextVal;
      rerender();
    });
  });
  wrap.querySelectorAll("button[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.del ?? "";
      const bag = session2.documentation[session2.editorLanguage]?.[path];
      if (bag)
        delete bag[key];
      rerender();
    });
  });
  return wrap;
}
function rmClass(rmType) {
  return "rm-" + rmType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
function nodeBadgesHtml(session2, path, archetypeRef) {
  const counts = countArchetypeRefs2(session2.tree);
  const repeated = archetypeRef ? isRepeated({
    id: "",
    path,
    name: "",
    rmType: "",
    occurrences: "",
    localizedNames: {},
    children: [],
    archetypeRef
  }, counts) : false;
  const bags = session2.languages;
  const missing = bags.filter((lang) => {
    const key = `L10n.${lang}`;
    return !bags.some((b) => session2.documentation[b]?.[path]?.[key]);
  });
  const extra = Object.keys(
    session2.documentation[session2.editorLanguage]?.[path] ?? {}
  ).filter((k) => !/^L10n\./i.test(k)).length;
  const bits = [];
  if (repeated)
    bits.push(`<span class="badge badge-repeat">repeated</span>`);
  if (missing.length && repeated) {
    bits.push(
      `<span class="badge badge-gap">L10n missing ${escapeHtml(missing.join(","))}</span>`
    );
  }
  if (extra)
    bits.push(`<span class="badge badge-ann">${extra} other</span>`);
  return bits.join(" ");
}

// examples/taaat-app/src/prototype/variant-a.ts
var VARIANT_A = { key: "A", name: "Outline explorer" };
function renderVariantA(host, session2, rerender) {
  host.className = "variant variant-a";
  host.innerHTML = "";
  const teach = document.createElement("aside");
  teach.className = "teach-rail";
  teach.innerHTML = `
    <p><strong>What you are looking at</strong> is the template <em>definition tree</em> \u2014 every constrainable node, all visible. The live TAAAT D3 view collapses children, so repeated sections disappear.</p>
    <p><strong>Amber \u201Crepeated\u201D</strong> marks the OPT 1.4 gap: two uses of <code>SECTION.adhoc</code> with different names. Ontology can store only one translation set per archetype id.</p>
    <p><strong>Generate L10n</strong> adds <code>L10n.sv</code> / <code>L10n.fr</code> path annotations and copies them into every language bag. It will not delete the existing <code>design note</code>.</p>
  `;
  const treePane = document.createElement("div");
  treePane.className = "outline-pane";
  const filter = document.createElement("input");
  filter.className = "outline-filter";
  filter.placeholder = "Filter nodes\u2026";
  const list = document.createElement("div");
  list.className = "outline-list";
  treePane.append(filter, list);
  const paintList = (q = "") => {
    list.innerHTML = "";
    const counts = countArchetypeRefs2(session2.tree);
    const query = q.trim().toLowerCase();
    for (const node2 of flattenNodes(session2.tree)) {
      const hay = `${node2.name} ${node2.rmType} ${node2.archetypeRef ?? ""} ${node2.path}`.toLowerCase();
      if (query && !hay.includes(query))
        continue;
      const depth = Math.max(0, node2.path.split("/").filter(Boolean).length);
      const row = document.createElement("button");
      row.type = "button";
      row.className = `outline-row ${rmClass(node2.rmType)}`;
      if (node2.path === session2.selectedPath)
        row.classList.add("is-selected");
      if (isRepeated(node2, counts))
        row.classList.add("is-repeated");
      row.style.paddingLeft = `${8 + depth * 14}px`;
      const cov = l10nCoverage(session2.documentation, node2, session2.languages);
      row.innerHTML = `
        <span class="outline-name">${escapeHtml(node2.name)}</span>
        <span class="rm-chip">${escapeHtml(node2.rmType)}</span>
        <span class="occ">${escapeHtml(node2.occurrences)}</span>
        ${nodeBadgesHtml(session2, node2.path, node2.archetypeRef)}
        ${cov.present.length ? `<span class="l10n-dots">${cov.present.map((l) => `<abbr title="L10n.${l}">${l}</abbr>`).join(" ")}</span>` : ""}
      `;
      row.addEventListener("click", () => {
        session2.selectedPath = node2.path;
        rerender();
      });
      list.appendChild(row);
    }
  };
  paintList();
  filter.addEventListener("input", () => paintList(filter.value));
  const inspector = document.createElement("div");
  inspector.className = "inspector";
  const node = selectedNode(session2);
  const head = document.createElement("header");
  head.className = "inspector-head";
  head.innerHTML = node ? `<h2>${escapeHtml(node.name)}</h2>
       <p>${escapeHtml(node.rmType)} \xB7 ${escapeHtml(node.occurrences)}${node.archetypeRef ? ` \xB7 <code>${escapeHtml(node.archetypeRef)}</code>` : ""}</p>` : `<h2>Select a node</h2>`;
  inspector.append(
    head,
    renderAnnotationEditor(session2, rerender),
    renderGeneratePanel(session2, rerender)
  );
  host.append(teach, treePane, inspector);
}

// examples/taaat-app/src/prototype/variant-b.ts
var VARIANT_B = { key: "B", name: "Annotation matrix" };
function renderVariantB(host, session2, rerender) {
  host.className = "variant variant-b";
  host.innerHTML = "";
  const toolbar = document.createElement("div");
  toolbar.className = "matrix-toolbar";
  const search = document.createElement("input");
  search.placeholder = "Filter rows\u2026";
  search.className = "matrix-search";
  const hint = document.createElement("p");
  hint.className = "matrix-hint";
  hint.textContent = "Every template node is a row \u2014 nothing is collapsed. Edit L10n cells in place. Other annotation keys stay in the last columns.";
  toolbar.append(search, hint, renderGeneratePanel(session2, rerender, { compact: true }));
  const scroller = document.createElement("div");
  scroller.className = "matrix-scroll";
  const table = document.createElement("table");
  table.className = "matrix";
  const langs = session2.languages;
  table.innerHTML = `
    <thead>
      <tr>
        <th class="sticky">Node</th>
        <th>RM</th>
        <th>Occ</th>
        ${langs.map((l) => `<th>L10n.${l}</th>`).join("")}
        <th>Other keys (${session2.editorLanguage})</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  const counts = countArchetypeRefs2(session2.tree);
  const paint = (q = "") => {
    tbody.innerHTML = "";
    const query = q.trim().toLowerCase();
    for (const node of flattenNodes(session2.tree)) {
      const hay = `${node.name} ${node.rmType} ${node.path}`.toLowerCase();
      if (query && !hay.includes(query))
        continue;
      const depth = Math.max(0, node.path.split("/").filter(Boolean).length);
      const tr = document.createElement("tr");
      tr.className = rmClass(node.rmType);
      if (node.path === session2.selectedPath)
        tr.classList.add("is-selected");
      if (isRepeated(node, counts))
        tr.classList.add("is-repeated");
      const other = Object.entries(
        session2.documentation[session2.editorLanguage]?.[node.path] ?? {}
      ).filter(([k]) => !/^L10n\./i.test(k));
      const nameTd = document.createElement("td");
      nameTd.className = "sticky";
      nameTd.style.paddingLeft = `${8 + depth * 12}px`;
      nameTd.innerHTML = `<button type="button" class="matrix-name">${escapeHtml(node.name)}</button>
        ${isRepeated(node, counts) ? `<span class="badge badge-repeat">repeated</span>` : ""}
        <div class="matrix-path">${escapeHtml(node.path)}</div>`;
      nameTd.querySelector("button")?.addEventListener("click", () => {
        session2.selectedPath = node.path;
        rerender();
      });
      tr.appendChild(nameTd);
      const rm = document.createElement("td");
      rm.textContent = node.rmType;
      const occ = document.createElement("td");
      occ.textContent = node.occurrences;
      tr.append(rm, occ);
      for (const lang of langs) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.className = "matrix-l10n";
        const existing = session2.languages.map((bag) => session2.documentation[bag]?.[node.path]?.[`L10n.${lang}`]).find((v) => v != null);
        const suggested = node.localizedNames[lang] ?? "";
        input.value = existing ?? "";
        input.placeholder = suggested && !existing ? suggested : "";
        if (!existing && suggested && isRepeated(node, counts)) {
          input.classList.add("is-missing");
        }
        input.addEventListener("change", () => {
          if (!input.value.trim()) {
            for (const bag of session2.languages) {
              const slot = session2.documentation[bag]?.[node.path];
              if (slot)
                delete slot[`L10n.${lang}`];
            }
          } else {
            const bags = session2.copyToAllBags ? session2.languages : [session2.editorLanguage];
            for (const bag of bags) {
              setAnnotation(session2, node.path, `L10n.${lang}`, input.value, bag);
            }
          }
          session2.selectedPath = node.path;
          rerender();
        });
        td.appendChild(input);
        tr.appendChild(td);
      }
      const otherTd = document.createElement("td");
      otherTd.className = "matrix-other";
      otherTd.innerHTML = other.length ? other.map(
        ([k, v]) => `<code>${escapeHtml(k)}</code>=${escapeHtml(v)}`
      ).join("<br>") : `<button type="button" class="btn-link" data-add>add key\u2026</button>`;
      otherTd.querySelector("[data-add]")?.addEventListener("click", () => {
        const key = "comment";
        setAnnotation(session2, node.path, key, "", session2.editorLanguage);
        session2.selectedPath = node.path;
        rerender();
      });
      tr.appendChild(otherTd);
      tbody.appendChild(tr);
    }
  };
  paint();
  search.addEventListener("input", () => paint(search.value));
  scroller.appendChild(table);
  host.append(toolbar, scroller);
}

// examples/taaat-app/src/prototype/variant-c.ts
var VARIANT_C = { key: "C", name: "Map + review queue" };
function tile(node, session2, rerender, counts) {
  const el = document.createElement("div");
  el.className = `tile ${rmClass(node.rmType)}`;
  if (node.path === session2.selectedPath)
    el.classList.add("is-selected");
  if (isRepeated(node, counts))
    el.classList.add("is-repeated");
  const cov = l10nCoverage(session2.documentation, node, session2.languages);
  if (isRepeated(node, counts) && cov.missing.length) {
    el.classList.add("needs-l10n");
  }
  const head = document.createElement("button");
  head.type = "button";
  head.className = "tile-head";
  head.innerHTML = `
    <span class="tile-name">${escapeHtml(node.name)}</span>
    <span class="rm-chip">${escapeHtml(node.rmType)}</span>
    ${isRepeated(node, counts) ? `<span class="badge badge-repeat">repeated</span>` : ""}
    <span class="tile-langs">${session2.languages.map((l) => {
    const on = !cov.missing.includes(l);
    return `<abbr class="${on ? "on" : "off"}" title="L10n.${l}">${l}</abbr>`;
  }).join("")}</span>
  `;
  head.addEventListener("click", (e) => {
    e.stopPropagation();
    session2.selectedPath = node.path;
    rerender();
  });
  el.appendChild(head);
  if (node.children.length) {
    const kids = document.createElement("div");
    kids.className = "tile-children";
    for (const child of node.children) {
      kids.appendChild(tile(child, session2, rerender, counts));
    }
    el.appendChild(kids);
  }
  return el;
}
function renderVariantC(host, session2, rerender) {
  host.className = "variant variant-c";
  host.innerHTML = "";
  const map = document.createElement("div");
  map.className = "template-map";
  const counts = countArchetypeRefs2(session2.tree);
  map.appendChild(tile(session2.tree, session2, rerender, counts));
  const rail = document.createElement("div");
  rail.className = "review-rail";
  const node = selectedNode(session2);
  const queue = document.createElement("section");
  queue.className = "review-queue";
  const repeated = [];
  const walk = (n) => {
    if (isRepeated(n, counts))
      repeated.push(n);
    n.children.forEach(walk);
  };
  walk(session2.tree);
  queue.innerHTML = `
    <h3>L10n review queue</h3>
    <p class="muted">Repeated occurrences that OPT ontology cannot translate independently.</p>
    <ul>
      ${repeated.map((n) => {
    const cov = l10nCoverage(session2.documentation, n, session2.languages);
    const active = n.path === session2.selectedPath ? ' class="is-active"' : "";
    return `<li${active}><button type="button" data-path="${escapeHtml(n.path)}">${escapeHtml(n.name)}</button>
        <span>${cov.missing.length ? `missing ${escapeHtml(cov.missing.join(", "))}` : "covered"}</span></li>`;
  }).join("")}
    </ul>
  `;
  queue.querySelectorAll("button[data-path]").forEach((btn) => {
    btn.addEventListener("click", () => {
      session2.selectedPath = btn.dataset.path ?? session2.selectedPath;
      rerender();
    });
  });
  const selected = document.createElement("header");
  selected.className = "review-selected";
  selected.innerHTML = node ? `<h2>${escapeHtml(node.name)}</h2><p class="path-display">${escapeHtml(node.path)}</p>` : `<h2>Pick a tile</h2>`;
  rail.append(
    selected,
    queue,
    renderAnnotationEditor(session2, rerender),
    renderGeneratePanel(session2, rerender, { compact: true })
  );
  host.append(map, rail);
}

// examples/taaat-app/src/prototype/main.ts
var VARIANTS = [VARIANT_A, VARIANT_B, VARIANT_C];
var KEYS = VARIANTS.map((v) => v.key);
var session = createSession();
function render() {
  const key = currentVariantKey(KEYS, "A");
  const mount = document.getElementById("variant-root");
  if (!mount)
    return;
  if (key === "B")
    renderVariantB(mount, session, render);
  else if (key === "C")
    renderVariantC(mount, session, render);
  else
    renderVariantA(mount, session, render);
  const pre = document.getElementById("proto-state-json");
  if (pre) {
    pre.textContent = JSON.stringify(sessionSnapshot(session), null, 2);
  }
  const label = document.querySelector(".proto-switcher-label");
  const def = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
  if (label)
    label.textContent = `${def.key} \u2014 ${def.name}`;
}
function init() {
  let key = currentVariantKey(KEYS, "A");
  setVariantInUrl(key);
  const switcherHost = document.getElementById("proto-switcher");
  if (switcherHost) {
    mountPrototypeSwitcher(switcherHost, VARIANTS, key, (next) => {
      key = next;
      render();
    });
  }
  document.getElementById("proto-reset")?.addEventListener("click", () => {
    resetSession(session);
    render();
  });
  document.getElementById("proto-state-toggle")?.addEventListener(
    "click",
    () => {
      document.getElementById("proto-state")?.classList.toggle("is-open");
    }
  );
  render();
}
document.addEventListener("DOMContentLoaded", init);
