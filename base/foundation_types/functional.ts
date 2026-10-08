// openEHR BASE model — BMM package org.openehr.base.foundation_types.functional
// Hand-written from specifications-BASE working copy (SPECBASE-48).
// Package boundaries follow the BMM package structure.

import type { Any } from "./foundation_types.ts";

/**
 * Parent type of all TUPLE types.
 */
export class TUPLE {
}

/**
 * Type representing a routine with 0 or more arguments represented as a TUPLE.
 */
export class ROUTINE<ARGS extends TUPLE = TUPLE> {
}

/**
 * Type representing a function with a return type and 0 or more arguments
 * represented as a TUPLE. Official BASE BMM types container predicates as
 * `FUNCTION<TUPLE1<T>, Boolean>`; see also the TypeScript `Operation<T>` alias.
 */
export class FUNCTION<ARGS extends TUPLE = TUPLE, RESULT = unknown>
  extends ROUTINE<ARGS> {
}

/**
 * A Tuple type used, among other things, for representing a single typed
 * argument within a Routine signature.
 */
export class TUPLE1<A extends Any = Any> extends TUPLE {
  item_1?: A;
}

/**
 * A Tuple type used, among other things, for representing two typed arguments
 * within a Routine signature.
 */
export class TUPLE2<A extends Any = Any, B extends Any = Any> extends TUPLE {
  item_1?: A;
  item_2?: B;
}

/**
 * Type representing a procedure with 0 or more arguments represented as a TUPLE.
 */
export class PROCEDURE<ARGS extends TUPLE = TUPLE> extends ROUTINE<ARGS> {
}
