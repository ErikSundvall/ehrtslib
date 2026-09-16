// openEHR LANG model — BMM_MODEL_ELEMENT (shared ancestor of declared elements)
// Split from core.ts so BMM3 entity classes can extend it without a cycle.

import * as openehr_base from "../../../base/mod.ts";

/**
 * Abstract meta-type of BMM declared model elements. A _declaration_ is a an element of a model within a context, which defines the _scope_ of the element. Thus, a class definition and its property and routine definitions are model elements, but Types are not, since they are derived from model elements.
 */
export abstract class BMM_MODEL_ELEMENT {
  /**
   * Internal storage for name
   * @protected
   */
  protected _name?: openehr_base.String;

  /**
   * Name of this model element.
   */
  get name(): string | undefined {
    return this._name?.value;
  }

  /**
   * Gets the openehr_base.String wrapper object for name.
   * Use this to access openehr_base.String methods.
   */
  get $name(): openehr_base.String | undefined {
    return this._name;
  }

  /**
   * Sets name from either a primitive value or openehr_base.String wrapper.
   */
  set name(val: string | openehr_base.String | undefined) {
    if (val === undefined || val === null) {
      this._name = undefined;
    } else if (typeof val === "string") {
      this._name = openehr_base.String.from(val);
    } else {
      this._name = val;
    }
  }

  /**
   * Optional documentation of this element, as a keyed list.
   *
   * It is strongly recommended to use the following key /type combinations for the relevant purposes:
   *
   * * \`"purpose": String\`
   * * \`"keywords": List<String>\`
   * * \`"use": String\`
   * * \`"misuse": String\`
   * * \`"references": String\`
   *
   * Other keys and value types may be freely added.
   */
  documentation?: undefined;
  /**
   * Model element within which an element is declared.
   */
  scope?: BMM_MODEL_ELEMENT;
  /**
   * Optional meta-data of this element, as a keyed list. May be used to extend the meta-model.
   */
  extensions?: undefined;
  /**
   * True if this model element is the root of a model structure hierarchy.
   * @returns Result value
   */
  is_root_scope(): openehr_base.Boolean {
    return openehr_base.Boolean.from(
      this.scope === undefined || this.scope === null,
    );
  }
}
