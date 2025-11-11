// Generated from BMM schema: base v1.3.0
// BMM Version: 2.4
// Schema Revision: 1.3.0.2
// Description: openEHR base types.
// Source: https://raw.githubusercontent.com/sebastian-iancu/code-generator/master/code/BMM-JSON/openehr_base_1.3.0.bmm.json
// Generated: 2025-11-11T08:25:30.520Z
// 
// This file was automatically generated from openEHR BMM (Basic Meta-Model) specifications.
// Do not edit manually - regenerate using: deno run --allow-read --allow-net --allow-write tasks/generate_ts_libs.ts
//
// For more information about openEHR specifications, visit: https://specifications.openehr.org/

// Unknown types - defined as 'any' for now
type T = any;

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
        throw new Error("Method equal not implemented.");
    }

    /**
     * Create new instance of a type.
     * @param a_type - Parameter
     * @returns Result value
     */
    instance_of(a_type: String): Any {
        throw new Error("Method instance_of not implemented.");
    }

    /**
     * Type name of an object as a string. May include generic parameters, as in \`"Interval<Time>"\`.
     * @param an_object - Parameter
     * @returns Result value
     */
    type_of(an_object: Any): String {
        throw new Error("Method type_of not implemented.");
    }

    /**
     * True if current object not equal to \`_other_\`. Returns not \`_equal_()\`.
     * @param other - Parameter
     * @returns Result value
     */
    not_equal(other: Ordered): Boolean {
        throw new Error("Method not_equal not implemented.");
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
    there_exists(test: Operation): Boolean {
        throw new Error("Method there_exists not implemented.");
    }

    /**
     * Universal quantifier applied to container, taking one agent argument \`_test_\` whose signature is \`(v:T): Boolean\`.
     * @param test - Parameter
     * @returns Result value
     */
    for_all(test: Operation): Boolean {
        throw new Error("Method for_all not implemented.");
    }

    /**
     * Return a List all items matching the predicate function \`_test_\` which has signature \`(v:T): Boolean\`. If no matches, an empty List is returned.
     * @param test - Parameter
     * @returns Result value
     */
    matching(test: Operation): T {
        throw new Error("Method matching not implemented.");
    }

    /**
     * Return first item matching the predicate function \`_test_\` which has signature \`(v:T): Boolean\`, or Void if no match.
     * @param test - Parameter
     * @returns Result value
     */
    select(test: Operation): T {
        throw new Error("Method select not implemented.");
    }

}

/**
 * Type representing a keyed table of values. V is the value type, and K the type of the keys. 
 */
export class Hash<K extends Ordered, V> extends Container<K> {
    /**
     * Test for presence of \`_a_key_\`.
     * @param a_key - Parameter
     * @returns Result value
     */
    has_key(a_key: K): Boolean {
        throw new Error("Method has_key not implemented.");
    }

    /**
     * Return item for key \`_a_key_\`.
     * @param a_key - Parameter
     * @returns Result value
     */
    item(a_key: K): V {
        throw new Error("Method item not implemented.");
    }

}

/**
 * Ordered container that may contain duplicates.
 */
export class List<T extends Any> extends Container<T> {
    /**
     * Return first element.
     * @returns Result value
     */
    first(): T {
        throw new Error("Method first not implemented.");
    }

    /**
     * Return last element.
     * @returns Result value
     */
    last(): T {
        throw new Error("Method last not implemented.");
    }

}

/**
 * Unordered container that may not contain duplicates.
 */
export class Set<T extends Any> extends Container<T> {
}

/**
 * Container whose storage is assumed to be contiguous.
 */
export class Array<T extends Any> extends Container<T> {
    /**
     * Return item for key  \`_a_key_\`.
     * @param a_key - Parameter
     * @returns Result value
     */
    item(a_key: Integer): T {
        throw new Error("Method item not implemented.");
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
        throw new Error("Method less_than_or_equal not implemented.");
    }

    /**
     * True if current object greater than \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    greater_than(other: Ordered): Boolean {
        throw new Error("Method greater_than not implemented.");
    }

    /**
     * True if current object greater than or equal to \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    greater_than_or_equal(other: Ordered): Boolean {
        throw new Error("Method greater_than_or_equal not implemented.");
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
    is_equal(other: any): boolean {
        if (other instanceof String) {
            return this.value === other.value;
        }
        return false;
    }

    /**
     * True if string is empty, i.e. equal to "".
     * @returns Result value
     */
    is_empty(): Boolean {
        throw new Error("Method is_empty not implemented.");
    }

    /**
     * True if string can be parsed as an integer.
     * @returns Result value
     */
    is_integer(): Boolean {
        throw new Error("Method is_integer not implemented.");
    }

    /**
     * Return the integer corresponding to the integer value represented in this string.
     * @returns Result value
     */
    as_integer(): Integer {
        throw new Error("Method as_integer not implemented.");
    }

    /**
     * Concatenation operator - causes \`_other_\` to be appended to this string.
     * @param other - Parameter
     * @returns Result value
     */
    append(other: String): String {
        throw new Error("Method append not implemented.");
    }

    /**
     * Lexical comparison of string content based on ordering in relevant character set.
     * @param other - Parameter
     * @returns Result value
     */
    less_than(other: String): Boolean {
        throw new Error("Method less_than not implemented.");
    }

    /**
     * Return True if this String contains \`_other_\` (case-sensitive).
     * @param other - Parameter
     * @returns Result value
     */
    contains(other: String): Boolean {
        throw new Error("Method contains not implemented.");
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
    is_equal(other: any): boolean {
        if (other instanceof Integer) {
            return this.value === other.value;
        }
        return false;
    }

    /**
     * Integer addition.
     * @param other - Parameter
     * @returns Result value
     */
    add(other: Integer): Integer {
        throw new Error("Method add not implemented.");
    }

    /**
     * Integer subtraction.
     * @param other - Parameter
     * @returns Result value
     */
    subtract(other: Integer): Integer {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Integer multiplication.
     * @param other - Parameter
     * @returns Result value
     */
    multiply(other: Integer): Integer {
        throw new Error("Method multiply not implemented.");
    }

    /**
     * Integer division.
     * @param other - Parameter
     * @returns Result value
     */
    divide(other: Integer): number {
        throw new Error("Method divide not implemented.");
    }

    /**
     * Integer exponentiation.
     * @param other - Parameter
     * @returns Result value
     */
    exponent(other: number): number {
        throw new Error("Method exponent not implemented.");
    }

    /**
     * Return self modulo other.
     * @param mod - Parameter
     * @returns Result value
     */
    modulo(mod: Integer): Integer {
        throw new Error("Method modulo not implemented.");
    }

    /**
     * Returns True if current Integer is less than \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    less_than(other: Integer): Boolean {
        throw new Error("Method less_than not implemented.");
    }

    /**
     * Generate negative of current Integer value.
     * @returns Result value
     */
    negative(): Integer {
        throw new Error("Method negative not implemented.");
    }

    /**
     * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
     * @param other - Parameter
     * @returns Result value
     */
    is_equal(other: Integer): Boolean {
        throw new Error("Method is_equal not implemented.");
    }

    /**
     * Reference equality for reference types, value equality for value types.
     * @param other - Parameter
     * @returns Result value
     */
    equal(other: Integer): Boolean {
        throw new Error("Method equal not implemented.");
    }

}

/**
 * Type used to represent double-precision decimal numbers. Corresponds to a double-precision floating point value in most languages.
 */
export class Double extends Ordered_Numeric {
    /**
     * Return the greatest integer no greater than the value of this object.
     * @returns Result value
     */
    floor(): Integer {
        throw new Error("Method floor not implemented.");
    }

    /**
     * Double-precision real number addition.
     * @param other - Parameter
     * @returns Result value
     */
    add(other: number): number {
        throw new Error("Method add not implemented.");
    }

    /**
     * Double-precision real number subtraction.
     * @param other - Parameter
     * @returns Result value
     */
    subtract(other: number): number {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Double-precision real number multiplication.
     * @param other - Parameter
     * @returns Result value
     */
    multiply(other: number): number {
        throw new Error("Method multiply not implemented.");
    }

    /**
     * Double-precision real number division.
     * @param other - Parameter
     * @returns Result value
     */
    divide(other: number): number {
        throw new Error("Method divide not implemented.");
    }

    /**
     * Double-precision real number exponentiation.
     * @param other - Parameter
     * @returns Result value
     */
    exponent(other: number): number {
        throw new Error("Method exponent not implemented.");
    }

    /**
     * Returns True if current Double is less than \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    less_than(other: number): Boolean {
        throw new Error("Method less_than not implemented.");
    }

    /**
     * Generate negative of current Double value.
     * @returns Result value
     */
    negative(): number {
        throw new Error("Method negative not implemented.");
    }

    /**
     * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
     * @param other - Parameter
     * @returns Result value
     */
    is_equal(other: number): Boolean {
        throw new Error("Method is_equal not implemented.");
    }

    /**
     * Reference equality for reference types, value equality for value types.
     * @param other - Parameter
     * @returns Result value
     */
    equal(other: number): Boolean {
        throw new Error("Method equal not implemented.");
    }

}

/**
 * Type representing minimal interface of built-in Octet type.
 */
export class Octet extends Ordered {
}

/**
 * Type representing minimal interface of built-in Character type.
 */
export class Character extends Ordered {
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
    is_equal(other: any): boolean {
        if (other instanceof Boolean) {
            return this.value === other.value;
        }
        return false;
    }

    /**
     * Logical conjunction of this with \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    conjunction(other: Boolean): Boolean {
        throw new Error("Method conjunction not implemented.");
    }

    /**
     * Boolean semi-strict conjunction with \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    semistrict_conjunction(other: Boolean): Boolean {
        throw new Error("Method semistrict_conjunction not implemented.");
    }

    /**
     * Boolean disjunction with \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    disjunction(other: Boolean): Boolean {
        throw new Error("Method disjunction not implemented.");
    }

    /**
     * Boolean semi-strict disjunction with \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    semistrict_disjunction(other: Boolean): Boolean {
        throw new Error("Method semistrict_disjunction not implemented.");
    }

    /**
     * Boolean exclusive or with \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    exclusive_disjunction(other: Boolean): Boolean {
        throw new Error("Method exclusive_disjunction not implemented.");
    }

    /**
     * Boolean implication of \`_other_\` (semi-strict)
     * @param other - Parameter
     * @returns Result value
     */
    implication(other: Boolean): Boolean {
        throw new Error("Method implication not implemented.");
    }

    /**
     * Boolean negation of the current value.
     * @returns Result value
     */
    negation(): Boolean {
        throw new Error("Method negation not implemented.");
    }

}

/**
 * Type used to represent decimal numbers. Corresponds to a single-precision floating point value in most languages.
 */
export class Real extends Ordered_Numeric {
    /**
     * Return the greatest integer no greater than the value of this object.
     * @returns Result value
     */
    floor(): Integer {
        throw new Error("Method floor not implemented.");
    }

    /**
     * Real number addition.
     * @param other - Parameter
     * @returns Result value
     */
    add(other: number): number {
        throw new Error("Method add not implemented.");
    }

    /**
     * Real number subtraction.
     * @param other - Parameter
     * @returns Result value
     */
    subtract(other: number): number {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Real number multiplication.
     * @param other - Parameter
     * @returns Result value
     */
    multiply(other: number): number {
        throw new Error("Method multiply not implemented.");
    }

    /**
     * Real number division.
     * @param other - Parameter
     * @returns Result value
     */
    divide(other: number): number {
        throw new Error("Method divide not implemented.");
    }

    /**
     * Real number exponentiation.
     * @param other - Parameter
     * @returns Result value
     */
    exponent(other: number): number {
        throw new Error("Method exponent not implemented.");
    }

    /**
     * Returns True if current Real is less than \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    less_than(other: number): Boolean {
        throw new Error("Method less_than not implemented.");
    }

    /**
     * Generate negative of current Real value.
     * @returns Result value
     */
    negative(): number {
        throw new Error("Method negative not implemented.");
    }

    /**
     * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
     * @param other - Parameter
     * @returns Result value
     */
    is_equal(other: number): Boolean {
        throw new Error("Method is_equal not implemented.");
    }

    /**
     * Reference equality for reference types, value equality for value types.
     * @param other - Parameter
     * @returns Result value
     */
    equal(other: number): Boolean {
        throw new Error("Method equal not implemented.");
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
    is_equal(other: any): boolean {
        if (other instanceof Integer64) {
            return this.value === other.value;
        }
        return false;
    }

    /**
     * Large integer addition.
     * @param other - Parameter
     * @returns Result value
     */
    add(other: Integer): Integer64 {
        throw new Error("Method add not implemented.");
    }

    /**
     * Large integer subtraction.
     * @param other - Parameter
     * @returns Result value
     */
    subtract(other: Integer): Integer64 {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Large integer multiplication.
     * @param other - Parameter
     * @returns Result value
     */
    multiply(other: Integer): Integer64 {
        throw new Error("Method multiply not implemented.");
    }

    /**
     * Large integer division.
     * @param other - Parameter
     * @returns Result value
     */
    divide(other: Integer): number {
        throw new Error("Method divide not implemented.");
    }

    /**
     * Large integer exponentiation.
     * @param other - Parameter
     * @returns Result value
     */
    exponent(other: number): number {
        throw new Error("Method exponent not implemented.");
    }

    /**
     * Large integer modulus.
     * @param mod - Parameter
     * @returns Result value
     */
    modulo(mod: Integer): Integer64 {
        throw new Error("Method modulo not implemented.");
    }

    /**
     * Returns True if current Integer is less than \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    less_than(other: Integer64): Boolean {
        throw new Error("Method less_than not implemented.");
    }

    /**
     * Generate negative of current Integer value.
     * @returns Result value
     */
    negative(): Integer64 {
        throw new Error("Method negative not implemented.");
    }

    /**
     * Value equality: return True if \`this\` and \`_other_\` are attached to objects considered to be equal in value.
     * @param other - Parameter
     * @returns Result value
     */
    is_equal(other: Integer64): Boolean {
        throw new Error("Method is_equal not implemented.");
    }

    /**
     * Reference equality for reference types, value equality for value types.
     * @param other - Parameter
     * @returns Result value
     */
    equal(other: Integer64): Boolean {
        throw new Error("Method equal not implemented.");
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
        if (val !== undefined && val !== null && (!Number.isInteger(val) || val < 0 || val > 255)) {
            throw new Error(`Byte value must be an integer between 0 and 255, got: ${val}`);
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
     * @param y - Parameter
     * @returns Result value
     */
    valid_year(y: Integer): Boolean {
        throw new Error("Method valid_year not implemented.");
    }

    /**
     * True if \`m >= 1 and m <= months_in_year\`.
     * @param m - Parameter
     * @returns Result value
     */
    valid_month(m: Integer): Boolean {
        throw new Error("Method valid_month not implemented.");
    }

    /**
     * True if \`d >= 1 and d <= days_in_month (m, y)\`.
     * @param y - Parameter
     * @param m - Parameter
     * @param d - Parameter
     * @returns Result value
     */
    valid_day(y: Integer, m: Integer, d: Integer): Boolean {
        throw new Error("Method valid_day not implemented.");
    }

    /**
     * True if \`(h >= 0 and h < Hours_in_day) or (h = Hours_in_day and m = 0 and s = 0)\` .
     * @param h - Parameter
     * @param m - Parameter
     * @param s - Parameter
     * @returns Result value
     */
    valid_hour(h: Integer, m: Integer, s: Integer): Boolean {
        throw new Error("Method valid_hour not implemented.");
    }

    /**
     * True if \`m >= 0 and m < Minutes_in_hour\`.
     * @param m - Parameter
     * @returns Result value
     */
    valid_minute(m: Integer): Boolean {
        throw new Error("Method valid_minute not implemented.");
    }

    /**
     * True if \`s >= 0 and s < Seconds_in_minute\` .
     * @param s - Parameter
     * @returns Result value
     */
    valid_second(s: Integer): Boolean {
        throw new Error("Method valid_second not implemented.");
    }

    /**
     * True if \`fs >= 0.0\` and \`fs < 1.0\` .
     * @param fs - Parameter
     * @returns Result value
     */
    valid_fractional_second(fs: number): Boolean {
        throw new Error("Method valid_fractional_second not implemented.");
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
        throw new Error("Method valid_iso8601_date not implemented.");
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
        throw new Error("Method valid_iso8601_time not implemented.");
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
        throw new Error("Method valid_iso8601_date_time not implemented.");
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
        throw new Error("Method valid_iso8601_duration not implemented.");
    }

}

/**
 * Abstract ancestor type of ISO 8601 types, defining interface for 'extended' and 'partial' concepts from ISO 8601.
 */
export abstract class Iso8601_type extends Temporal {
    /**
     * Representation of all descendants is a single String.
     */
    value?: String;
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
     * @returns Result value
     */
    year(): Integer {
        throw new Error("Method year not implemented.");
    }

    /**
     * Extract the month part of the date/time as an Integer, or return 0 if not present.
     * @returns Result value
     */
    month(): Integer {
        throw new Error("Method month not implemented.");
    }

    /**
     * Extract the day part of the date/time as an Integer, or return 0 if not present.
     * @returns Result value
     */
    day(): Integer {
        throw new Error("Method day not implemented.");
    }

    /**
     * Extract the hour part of the date/time as an Integer, or return 0 if not present.
     * @returns Result value
     */
    hour(): Integer {
        throw new Error("Method hour not implemented.");
    }

    /**
     * Extract the minute part of the date/time as an Integer, or return 0 if not present.
     * @returns Result value
     */
    minute(): Integer {
        throw new Error("Method minute not implemented.");
    }

    /**
     * Extract the integral seconds part of the date/time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
     * @returns Result value
     */
    second(): Integer {
        throw new Error("Method second not implemented.");
    }

    /**
     * Extract the fractional seconds part of the date/time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
     * @returns Result value
     */
    fractional_second(): number {
        throw new Error("Method fractional_second not implemented.");
    }

    /**
     * Timezone; may be Void.
     * @returns Result value
     */
    timezone(): Iso8601_timezone {
        throw new Error("Method timezone not implemented.");
    }

    /**
     * Indicates whether month in year is unknown.
     * @returns Result value
     */
    month_unknown(): Boolean {
        throw new Error("Method month_unknown not implemented.");
    }

    /**
     * Indicates whether day in month is unknown.
     * @returns Result value
     */
    day_unknown(): Boolean {
        throw new Error("Method day_unknown not implemented.");
    }

    /**
     * Indicates whether minute in hour is known.
     * @returns Result value
     */
    minute_unknown(): Boolean {
        throw new Error("Method minute_unknown not implemented.");
    }

    /**
     * Indicates whether minute in hour is known.
     * @returns Result value
     */
    second_unknown(): Boolean {
        throw new Error("Method second_unknown not implemented.");
    }

    /**
     * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
     * @returns Result value
     */
    is_decimal_sign_comma(): Boolean {
        throw new Error("Method is_decimal_sign_comma not implemented.");
    }

    /**
     * True if this date time is partial, i.e. if seconds or more is missing.
     * @returns Result value
     */
    is_partial(): Boolean {
        throw new Error("Method is_partial not implemented.");
    }

    /**
     * True if this date/time uses \`'-'\`, \`':'\` separators.
     * @returns Result value
     */
    is_extended(): Boolean {
        throw new Error("Method is_extended not implemented.");
    }

    /**
     * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
     * @returns Result value
     */
    has_fractional_second(): Boolean {
        throw new Error("Method has_fractional_second not implemented.");
    }

    /**
     * Return the string value in extended format.
     * @returns Result value
     */
    as_string(): String {
        throw new Error("Method as_string not implemented.");
    }

    /**
     * Arithmetic addition of a duration to a date/time.
     * @param a_diff - Parameter
     * @returns Result value
     */
    add(a_diff: Iso8601_duration): Iso8601_date_time {
        throw new Error("Method add not implemented.");
    }

    /**
     * Arithmetic subtraction of a duration from a date/time.
     * @param a_diff - Parameter
     * @returns Result value
     */
    subtract(a_diff: Iso8601_duration): Iso8601_date_time {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Difference of two date/times.
     * @param a_date_time - Parameter
     * @returns Result value
     */
    diff(a_date_time: Iso8601_date_time): Iso8601_duration {
        throw new Error("Method diff not implemented.");
    }

    /**
     * Addition of nominal duration represented by \`_a_diff_\`. See \`Iso8601_date._add_nominal_()\` for semantics.
     * @param a_diff - Parameter
     * @returns Result value
     */
    add_nominal(a_diff: Iso8601_duration): Iso8601_date {
        throw new Error("Method add_nominal not implemented.");
    }

    /**
     * Subtraction of nominal duration represented by \`_a_diff_\`. See \`_add_nominal_()\` for semantics.
     * @param a_diff - Parameter
     * @returns Result value
     */
    subtract_nominal(a_diff: Iso8601_duration): Iso8601_date {
        throw new Error("Method subtract_nominal not implemented.");
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
     * Returns True.
     * @returns Result value
     */
    is_extended(): Boolean {
        throw new Error("Method is_extended not implemented.");
    }

    /**
     * Returns False.
     * @returns Result value
     */
    is_partial(): Boolean {
        throw new Error("Method is_partial not implemented.");
    }

    /**
     * Number of years in the \`_value_\`, i.e. the number preceding the \`'Y'\` in the \`'YMD'\` part, if one exists.
     * @returns Result value
     */
    years(): Integer {
        throw new Error("Method years not implemented.");
    }

    /**
     * Number of months in the \`_value_\`, i.e. the value preceding the \`'M'\` in the \`'YMD'\` part, if one exists.
     * @returns Result value
     */
    months(): Integer {
        throw new Error("Method months not implemented.");
    }

    /**
     * Number of days in the \`_value_\`, i.e. the number preceding the \`'D'\` in the \`'YMD'\` part, if one exists.
     * @returns Result value
     */
    days(): Integer {
        throw new Error("Method days not implemented.");
    }

    /**
     * Number of hours in the \`_value_\`, i.e. the number preceding the \`'H'\` in the \`'HMS'\` part, if one exists.
     * @returns Result value
     */
    hours(): Integer {
        throw new Error("Method hours not implemented.");
    }

    /**
     * Number of minutes in the \`_value_\`, i.e. the number preceding the \`'M'\` in the \`'HMS'\` part, if one exists.
     * @returns Result value
     */
    minutes(): Integer {
        throw new Error("Method minutes not implemented.");
    }

    /**
     * Number of seconds in the \`_value_\`, i.e. the integer number preceding the \`'S'\` in the \`'HMS'\` part, if one exists.
     * @returns Result value
     */
    seconds(): Integer {
        throw new Error("Method seconds not implemented.");
    }

    /**
     * Fractional seconds in the \`_value_\`, i.e. the decimal part of the number preceding the \`'S'\` in the \`'HMS'\` part, if one exists.
     * @returns Result value
     */
    fractional_seconds(): number {
        throw new Error("Method fractional_seconds not implemented.");
    }

    /**
     * Number of weeks in the \`_value_\`, i.e. the value preceding the \`W\`, if one exists.
     * @returns Result value
     */
    weeks(): Integer {
        throw new Error("Method weeks not implemented.");
    }

    /**
     * True if this time has a decimal part indicated by ',' (comma) rather than '.' (period).
     * @returns Result value
     */
    is_decimal_sign_comma(): Boolean {
        throw new Error("Method is_decimal_sign_comma not implemented.");
    }

    /**
     * Total number of seconds equivalent (including fractional) of entire duration. Where non-definite elements such as year and month (i.e. 'Y' and 'M') are included, the corresponding 'average' durations from \`Time_definitions\` are used to compute the result.
     * @returns Result value
     */
    to_seconds(): number {
        throw new Error("Method to_seconds not implemented.");
    }

    /**
     * Return the duration string value.
     * @returns Result value
     */
    as_string(): String {
        throw new Error("Method as_string not implemented.");
    }

    /**
     * Arithmetic addition of a duration to a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
     * @param a_val - Parameter
     * @returns Result value
     */
    add(a_val: Iso8601_duration): Iso8601_duration {
        throw new Error("Method add not implemented.");
    }

    /**
     * Arithmetic subtraction of a duration from a duration, via conversion to seconds, using \`Time_definitions._Average_days_in_year_\` and \`Time_definitions._Average_days_in_month_\`
     * @param a_val - Parameter
     * @returns Result value
     */
    subtract(a_val: Iso8601_duration): Iso8601_duration {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Arithmetic multiplication a duration by a number.
     * @param a_val - Parameter
     * @returns Result value
     */
    multiply(a_val: number): Iso8601_duration {
        throw new Error("Method multiply not implemented.");
    }

    /**
     * Arithmetic division of a duration by a number.
     * @param a_val - Parameter
     * @returns Result value
     */
    divide(a_val: number): Iso8601_duration {
        throw new Error("Method divide not implemented.");
    }

    /**
     * Generate negative of current duration value.
     * @returns Result value
     */
    negative(): Iso8601_duration {
        throw new Error("Method negative not implemented.");
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
        throw new Error("Method hour not implemented.");
    }

    /**
     * Extract the minute part of the time as an Integer, or return 0 if not present.
     * @returns Result value
     */
    minute(): Integer {
        throw new Error("Method minute not implemented.");
    }

    /**
     * Extract the integral seconds part of the time (i.e. prior to any decimal sign) as an Integer, or return 0 if not present.
     * @returns Result value
     */
    second(): Integer {
        throw new Error("Method second not implemented.");
    }

    /**
     * Extract the fractional seconds part of the time (i.e. following to any decimal sign) as a Real, or return 0.0 if not present.
     * @returns Result value
     */
    fractional_second(): number {
        throw new Error("Method fractional_second not implemented.");
    }

    /**
     * Timezone; may be Void.
     * @returns Result value
     */
    timezone(): Iso8601_timezone {
        throw new Error("Method timezone not implemented.");
    }

    /**
     * Indicates whether minute is unknown. If so, the time is of the form “hh”.
     * @returns Result value
     */
    minute_unknown(): Boolean {
        throw new Error("Method minute_unknown not implemented.");
    }

    /**
     * Indicates whether second is unknown. If so and month is known, the time is of the form \`"hh:mm"\` or \`"hhmm"\`.
     * @returns Result value
     */
    second_unknown(): Boolean {
        throw new Error("Method second_unknown not implemented.");
    }

    /**
     * True if this time has a decimal part indicated by \`','\` (comma) rather than \`'.'\` (period).
     * @returns Result value
     */
    is_decimal_sign_comma(): Boolean {
        throw new Error("Method is_decimal_sign_comma not implemented.");
    }

    /**
     * True if this time is partial, i.e. if seconds or more is missing.
     * @returns Result value
     */
    is_partial(): Boolean {
        throw new Error("Method is_partial not implemented.");
    }

    /**
     * True if this time uses \`'-'\`, \`':'\` separators.
     * @returns Result value
     */
    is_extended(): Boolean {
        throw new Error("Method is_extended not implemented.");
    }

    /**
     * True if the \`_fractional_second_\` part is significant (i.e. even if = 0.0).
     * @returns Result value
     */
    has_fractional_second(): Boolean {
        throw new Error("Method has_fractional_second not implemented.");
    }

    /**
     * Return string value in extended format.
     * @returns Result value
     */
    as_string(): String {
        throw new Error("Method as_string not implemented.");
    }

    /**
     * Arithmetic addition of a duration to a time.
     * @param a_diff - Parameter
     * @returns Result value
     */
    add(a_diff: Iso8601_duration): Iso8601_time {
        throw new Error("Method add not implemented.");
    }

    /**
     * Arithmetic subtraction of a duration from a time.
     * @param a_diff - Parameter
     * @returns Result value
     */
    subtract(a_diff: Iso8601_duration): Iso8601_time {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Difference of two times.
     * @param a_time - Parameter
     * @returns Result value
     */
    diff(a_time: Iso8601_time): Iso8601_duration {
        throw new Error("Method diff not implemented.");
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
     * @returns Result value
     */
    year(): Integer {
        throw new Error("Method year not implemented.");
    }

    /**
     * Extract the month part of the date as an Integer, or return 0 if not present.
     * @returns Result value
     */
    month(): Integer {
        throw new Error("Method month not implemented.");
    }

    /**
     * Extract the day part of the date as an Integer, or return 0 if not present.
     * @returns Result value
     */
    day(): Integer {
        throw new Error("Method day not implemented.");
    }

    /**
     * Timezone; may be Void.
     * @returns Result value
     */
    timezone(): Iso8601_timezone {
        throw new Error("Method timezone not implemented.");
    }

    /**
     * Indicates whether month in year is unknown. If so, the date is of the form \`"YYYY"\`.
     * @returns Result value
     */
    month_unknown(): Boolean {
        throw new Error("Method month_unknown not implemented.");
    }

    /**
     * Indicates whether day in month is unknown. If so, and month is known, the date is of the form \`"YYYY-MM"\` or \`"YYYYMM"\`.
     * @returns Result value
     */
    day_unknown(): Boolean {
        throw new Error("Method day_unknown not implemented.");
    }

    /**
     * True if this date is partial, i.e. if days or more is missing.
     * @returns Result value
     */
    is_partial(): Boolean {
        throw new Error("Method is_partial not implemented.");
    }

    /**
     * True if this date uses \`'-'\` separators.
     * @returns Result value
     */
    is_extended(): Boolean {
        throw new Error("Method is_extended not implemented.");
    }

    /**
     * Return string value in extended format.
     * @returns Result value
     */
    as_string(): String {
        throw new Error("Method as_string not implemented.");
    }

    /**
     * Arithmetic addition of a duration to a date.
     * @param a_diff - Parameter
     * @returns Result value
     */
    add(a_diff: Iso8601_duration): Iso8601_date {
        throw new Error("Method add not implemented.");
    }

    /**
     * Arithmetic subtraction of a duration from a date.
     * @param a_diff - Parameter
     * @returns Result value
     */
    subtract(a_diff: Iso8601_duration): Iso8601_date {
        throw new Error("Method subtract not implemented.");
    }

    /**
     * Difference of two dates.
     * @param a_date - Parameter
     * @returns Result value
     */
    diff(a_date: Iso8601_date): Iso8601_duration {
        throw new Error("Method diff not implemented.");
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
        throw new Error("Method add_nominal not implemented.");
    }

    /**
     * Subtraction of nominal duration represented by \`_a_diff_\`. See \`_add_nominal_()\` for semantics.
     * @param a_diff - Parameter
     * @returns Result value
     */
    subtract_nominal(a_diff: Iso8601_duration): Iso8601_date {
        throw new Error("Method subtract_nominal not implemented.");
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
     * True if \`_lower_\` boundary open (i.e. = \`-infinity\`).
     */
    lower_unbounded?: Boolean;
    /**
     * True if \`_upper_\` boundary open (i.e. = \`+infinity\`).
     */
    upper_unbounded?: Boolean;
    /**
     * True if \`_lower_\` boundary value included in range, if \`not _lower_unbounded_\`.
     */
    lower_included?: Boolean;
    /**
     * True if \`_upper_\` boundary value included in range if \`not _upper_unbounded_\`.
     */
    upper_included?: Boolean;
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
    abstract intersects(other: Interval): Boolean;

    /**
     * True if current interval properly contains \`_other_\`? True if all points of \`_other_\` are inside the current interval.
     * @param other - Parameter
     * @returns Result value
     */
    abstract contains(other: Interval): Boolean;

    /**
     * True if current object's interval is semantically same as \`_other_\`.
     * @param other - Parameter
     * @returns Result value
     */
    abstract is_equal(other: Any): Boolean;

}

/**
 * Type representing a 'proper' Interval, i.e. any two-sided or one-sided interval.
 */
export class Proper_interval<T extends Ordered> extends Interval<T> {
}

/**
 * An Interval of Integer, used to represent multiplicity, cardinality and optionality in models. 
 */
export class Multiplicity_interval extends Proper_interval<T> {
    /**
     * True if this interval imposes no constraints, i.e. is set to \`0..*\`.
     * @returns Result value
     */
    is_open(): Boolean {
        throw new Error("Method is_open not implemented.");
    }

    /**
     * True if this interval expresses optionality, i.e. \`0..1\`.
     * @returns Result value
     */
    is_optional(): Boolean {
        throw new Error("Method is_optional not implemented.");
    }

    /**
     * True if this interval expresses mandation, i.e. \`1..1\`.
     * @returns Result value
     */
    is_mandatory(): Boolean {
        throw new Error("Method is_mandatory not implemented.");
    }

    /**
     * True if this interval is set to \`0..0\`.
     * @returns Result value
     */
    is_prohibited(): Boolean {
        throw new Error("Method is_prohibited not implemented.");
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
     * True if the members of the container attribute to which this cardinality refers are ordered. 
     */
    is_ordered?: Boolean;
    /**
     * True if the members of the container attribute to which this cardinality refers are unique.
     */
    is_unique?: Boolean;
    /**
     * True if the semantics of this cardinality represent a bag, i.e. unordered, non-unique membership.
     * @returns Result value
     */
    is_bag(): Boolean {
        throw new Error("Method is_bag not implemented.");
    }

    /**
     * True if the semantics of this cardinality represent a list, i.e. ordered, non-unique membership.
     * @returns Result value
     */
    is_list(): Boolean {
        throw new Error("Method is_list not implemented.");
    }

    /**
     * True if the semantics of this cardinality represent a set, i.e. unordered, unique membership.
     * @returns Result value
     */
    is_set(): Boolean {
        throw new Error("Method is_set not implemented.");
    }

}

/**
 * Primitive type representing a standalone reference to a terminology concept, in the form of a terminology identifier, optional version, and a code or code string from the terminology.
 */
export class Terminology_code extends Any {
    /**
     * The archetype environment namespace identifier used to identify a terminology. Typically a value like \`"snomed_ct"\` that is mapped elsewhere to the full URI identifying the terminology.
     */
    terminology_id?: String;
    /**
     * Optional string value representing terminology version, typically a date or dotted numeric.
     */
    terminology_version?: String;
    /**
     * A terminology code or post-coordinated code expression, if supported by the terminology. The code may refer to a single term, a value set consisting of multiple terms, or some other entity representable within the terminology.
     */
    code_string?: String;
    /**
     * The URI reference that may be used as a concrete key into a notional terminology service for queries that can obtain the term text, definition, and other associated elements.
     */
    uri?: Uri;
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
     * Text of term.
     */
    text?: String;
}

/**
 * Ancestor class of identifiers of informational objects. Ids may be completely meaningless, in which case their only job is to refer to something, or may carry some information to do with the identified object. 
 * 
 * Object ids are used inside an object to identify that object. To identify another object in another service, use an \`OBJECT_REF\`, or else use a UID for local objects identified by UID. If none of the subtypes is suitable, direct instances of this class may be used. 
 */
export abstract class OBJECT_ID {
    /**
     * The value of the id in the form defined below. 
     */
    value?: String;
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
        throw new Error("Method qualified_rm_entity not implemented.");
    }

    /**
     * Name of the concept represented by this archetype, including specialisation, e.g. \`"Biochemistry_result-cholesterol"\`. 
     * @returns Result value
     */
    domain_concept(): String {
        throw new Error("Method domain_concept not implemented.");
    }

    /**
     * Organisation originating the reference model on which this archetype is based, e.g. \`"openEHR"\`, \`"CEN"\`, \`"HL7"\`. 
     * @returns Result value
     */
    rm_originator(): String {
        throw new Error("Method rm_originator not implemented.");
    }

    /**
     * Name of the reference model, e.g. \`"RIM"\`,  \`"EHR"\`,  \`"EN13606"\`. 
     * @returns Result value
     */
    rm_name(): String {
        throw new Error("Method rm_name not implemented.");
    }

    /**
     * Name of the ontological level within the reference model to which this archetype is targeted, e.g. for openEHR:  \`"FOLDER"\`, \`"COMPOSITION"\`, \`"SECTION"\`, \`"OBSERVATION"\`.
     * @returns Result value
     */
    rm_entity(): String {
        throw new Error("Method rm_entity not implemented.");
    }

    /**
     * Name of specialisation of concept, if this archetype is a specialisation of another archetype, e.g. \`"cholesterol"\`.
     * @returns Result value
     */
    specialisation(): String {
        throw new Error("Method specialisation not implemented.");
    }

    /**
     * Version of this archetype. 
     * 
     * @returns Result value
     */
    version_id(): String {
        throw new Error("Method version_id not implemented.");
    }

}

/**
 * Generic identifier type for identifiers whose format is otherwise unknown to openEHR. Includes an attribute for naming the identification scheme (which may well be local). 
 */
export class GENERIC_ID extends OBJECT_ID {
    /**
     * Name of the scheme to which this identifier conforms. Ideally this name will be recognisable globally but realistically it may be a local ad hoc scheme whose name is not controlled or standardised in any way. 
     */
    scheme?: String;
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
        throw new Error("Method root not implemented.");
    }

    /**
     * Optional local identifier of the object within the context of the root identifier. Returns the part to the right of the first '::' separator if any, or else any empty String.
     * @returns Result value
     */
    extension(): String {
        throw new Error("Method extension not implemented.");
    }

    /**
     * True if not \`_extension_.is_empty()\`.
     * @returns Result value
     */
    has_extension(): Boolean {
        throw new Error("Method has_extension not implemented.");
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
     * Namespace to which this identifier belongs in the local system context (and possibly in any other openEHR compliant environment) e.g.  terminology ,  demographic . These names are not yet standardised. Legal values for \`_namespace_\` are:
     * 
     * * \`"local"\`
     * * \`"unknown"\`
     * * a string matching the standard regex \`[a-zA-Z][a-zA-Z0-9_.:\/&?=+-]*\`.
     * 
     * Note that the first two are just special values of the regex, and will be matched by it.
     */
    namespace?: String;
    /**
     * Name of the  class (concrete or abstract) of object to which this identifier type refers, e.g. \`PARTY\`, \`PERSON\`,  \`GUIDELINE\`  etc. These class names are from the relevant reference model. The type name \`ANY\` can be used to indicate that any type is accepted (e.g. if the type is unknown). 
     */
    type?: String;
    /**
     * Globally unique id of an object, regardless of where it is stored.
     */
    id?: OBJECT_ID;
}

/**
 * Reference to a \`LOCATABLE\` instance inside the top-level content structure inside a \`VERSION<T>\` identified by the \`_id_\` attribute. The \`_path_\` attribute is applied to the object that \`VERSION._data_\` points to. 
 */
export class LOCATABLE_REF extends OBJECT_REF {
    /**
     * The path to an instance, as an absolute path with respect to the object found at \`VERSION._data_\`. An empty path means that the object referred to by \`_id_\` is being specified. 
     */
    path?: String;
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
        throw new Error("Method as_uri not implemented.");
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
        throw new Error("Method object_id not implemented.");
    }

    /**
     * Identifier of the system that created the Version corresponding to this Object version id.
     * @returns Result value
     */
    creating_system_id(): UID {
        throw new Error("Method creating_system_id not implemented.");
    }

    /**
     * Tree identifier of this version with respect to other versions in the same version tree, as either 1 or 3 part dot-separated numbers, e.g.  1 ,  2.1.4 . 
     * @returns Result value
     */
    version_tree_id(): VERSION_TREE_ID {
        throw new Error("Method version_tree_id not implemented.");
    }

    /**
     * True if this version identifier represents a branch.
     * @returns Result value
     */
    is_branch(): Boolean {
        throw new Error("Method is_branch not implemented.");
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
 * 
 */
export class TERMINOLOGY_ID extends OBJECT_ID {
    /**
     * Return the terminology id (which includes the  version  in some cases). Distinct names correspond to distinct (i.e. non-compatible) terminologies. Thus the names  \`"ICD10AM"\` and \`"ICD10"\` refer to distinct terminologies. 
     * @returns Result value
     */
    name(): String {
        throw new Error("Method name not implemented.");
    }

    /**
     * Version of this terminology, if versioning supported, else the empty string. 
     * @returns Result value
     */
    version_id(): String {
        throw new Error("Method version_id not implemented.");
    }

}

/**
 * Version tree identifier for one version. Lexical form: 
 * 
 * \`trunk_version [  '.' branch_number  '.' branch_version ]\`
 */
export class VERSION_TREE_ID {
    /**
     * String form of this identifier.
     */
    value?: String;
    /**
     * Trunk version number; numbering starts at 1. 
     * @returns Result value
     */
    trunk_version(): String {
        throw new Error("Method trunk_version not implemented.");
    }

    /**
     * True if this version identifier represents a branch, i.e. has \`_branch_number()_\` and \`_branch_version()_\` parts.
     * @returns Result value
     */
    is_branch(): Boolean {
        throw new Error("Method is_branch not implemented.");
    }

    /**
     * Number of branch from the trunk point; numbering starts at 1. 
     * @returns Result value
     */
    branch_number(): String {
        throw new Error("Method branch_number not implemented.");
    }

    /**
     * Version of the branch; numbering starts at 1. 
     * @returns Result value
     */
    branch_version(): String {
        throw new Error("Method branch_version not implemented.");
    }

}

/**
 * Abstract parent of classes representing unique identifiers which identify information entities in a durable way. UIDs only ever identify one IE in time or space and are never re-used.
 */
export abstract class UID {
    /**
     * The value of the id.
     */
    value?: String;
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
 * 
 */
export class Iso8601_timezone extends Iso8601_type {
    /**
     * Extract the hour part of timezone, as an Integer in the range \`00 - 14\`.
     * @returns Result value
     */
    hour(): Integer {
        throw new Error("Method hour not implemented.");
    }

    /**
     * Extract the hour part of timezone, as an Integer, usually either 0 or 30.
     * @returns Result value
     */
    minute(): Integer {
        throw new Error("Method minute not implemented.");
    }

    /**
     * Direction of timezone expresssed as +1 or -1.
     * @returns Result value
     */
    sign(): Integer {
        throw new Error("Method sign not implemented.");
    }

    /**
     * Indicates whether minute part known.
     * @returns Result value
     */
    minute_unknown(): Boolean {
        throw new Error("Method minute_unknown not implemented.");
    }

    /**
     * True if this time zone is partial, i.e. if minutes is missing.
     * @returns Result value
     */
    is_partial(): Boolean {
        throw new Error("Method is_partial not implemented.");
    }

    /**
     * True if this time-zone uses ‘:’ separators.
     * @returns Result value
     */
    is_extended(): Boolean {
        throw new Error("Method is_extended not implemented.");
    }

    /**
     * True if timezone is UTC, i.e. \`+0000\`.
     * @returns Result value
     */
    is_gmt(): Boolean {
        throw new Error("Method is_gmt not implemented.");
    }

    /**
     * Return timezone string in extended format.
     * @returns Result value
     */
    as_string(): String {
        throw new Error("Method as_string not implemented.");
    }

}

/**
 * Type representing an Interval that happens to be a point value. Provides an efficient representation that is substitutable for \`Interval<T>\` where needed.
 */
export class Point_interval<T extends Ordered> extends Interval<T> {
    /**
     * Lower boundary open (i.e. = -infinity).
     */
    override lower_unbounded?: Boolean;
    /**
     * Upper boundary open (i.e. = +infinity).
     */
    override upper_unbounded?: Boolean;
    /**
     * Lower boundary value included in range if not \`_lower_unbounded_\`.
     */
    override lower_included?: Boolean;
    /**
     * Upper boundary value included in range if not \`_upper_unbounded_\`.
     */
    override upper_included?: Boolean;
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
     * The key used by the terminology service to identify a concept or coordination of concepts. This string is most likely parsable inside the terminology service, but nothing can be assumed about its syntax outside that context. 
     */
    code_string?: String;
    /**
     * Optional attribute to carry preferred term corresponding to the code or expression in \`_code_string_\`. Typical use in integration situations which create mappings, and representing data for which both a (non-preferred) actual term and a preferred term are both required.
     */
    preferred_term?: String;
}

/**
 * Abstract idea of an online resource created by a human author. 
 * 
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
     * True if this resource is under any kind of change control (even file copying), in which case revision history is created. 
     */
    is_controlled?: Boolean;
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
        throw new Error("Method current_revision not implemented.");
    }

    /**
     * Total list of languages available in this resource, derived from original_language and translations. 
     * @returns Result value
     */
    languages_available(): String {
        throw new Error("Method languages_available not implemented.");
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
     * Namespace of original author's organisation, in reverse internet form, if applicable.
     */
    original_namespace?: String;
    /**
     * Plain text name of organisation that originally published this artefact, if any.
     */
    original_publisher?: String;
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
     * Namespace in reverse internet id form, of current custodian organisation.
     */
    custodian_namespace?: String;
    /**
     * Plain text name of current custodian organisation.
     */
    custodian_organisation?: String;
    /**
     * Optional copyright statement for the resource as a knowledge resource. 
     * 
     */
    copyright?: String;
    /**
     * Licence of current artefact, in format "short licence name <URL of licence>", e.g. "Apache 2.0 License <http://www.apache.org/licenses/LICENSE-2.0.html>"
     */
    licence?: String;
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
     * URI of package to which this resource belongs.
     */
    resource_package_uri?: String;
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
     * Accreditation of primary translator or group, usually a national translator's registration or association membership id.
     */
    accreditation?: String;
    /**
     * Any other meta-data.
     */
    other_details?: undefined;
    /**
     * Version of this resource last time it was translated into the language represented by this \`TRANSLATION_DETAILS\` object.
     */
    version_last_translated?: String;
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
     * Purpose of the resource.
     */
    purpose?: String;
    /**
     * Keywords which characterise this resource, used e.g. for indexing and searching. 
     * 
     */
    keywords?: undefined;
    /**
     * Description of the uses of the resource, i.e. contexts in which it could be used. 
     * 
     */
    use?: String;
    /**
     * Description of any misuses of the resource, i.e. contexts in which it should not be used.
     */
    misuse?: String;
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
 * 
 */
export class RESOURCE_ANNOTATIONS {
    /**
     * Documentary annotations in a multi-level keyed structure.
     */
    documentation?: undefined;
}

