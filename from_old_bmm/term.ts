// Type definitions for openEHR TERM 1.0.0
// Project: https://specifications.openehr.org/releases/LANG/Release-1.0.0
// Definitions by: Jules <https://www.jules.ai>

import {
    Any,
    String,
    Boolean,
    Integer,
    Real,
    Iso8601_date,
    Iso8601_date_time,
    Iso8601_time,
    Iso8601_duration,
    Uri,
    Terminology_code,
} from "./base";

export {
    Any,
    String,
    Boolean,
    Integer,
    Real,
    Iso8601_date,
    Iso8601_date_time,
    Iso8601_time,
    Iso8601_duration,
    Uri,
    Terminology_code,
};

//
// beom.core
//

export class STATEMENT_SET extends Any {
    name?: String;
    statement?: STATEMENT[];
    constructor(name?: String, statement?: STATEMENT[]) {
        super();
        this.name = name;
        this.statement = statement;
    }
}

export abstract class STATEMENT extends Any {
}

export class VARIABLE_DECLARATION extends STATEMENT {
    name: String;
    type: EXPR_TYPE_DEF;
    constructor(name: String, type: EXPR_TYPE_DEF) {
        super();
        this.name = name;
        this.type = type;
    }
}

export class ASSIGNMENT extends STATEMENT {
    source: EXPR_VALUE;
    target: VARIABLE_DECLARATION;
    constructor(source: EXPR_VALUE, target: VARIABLE_DECLARATION) {
        super();
        this.source = source;
        this.target = target;
    }
}

export class ASSERTION extends STATEMENT {
    tag?: String;
    string_expression?: String;
    expression: EXPRESSION;
    constructor(expression: EXPRESSION, tag?: String, string_expression?: String) {
        super();
        this.tag = tag;
        this.string_expression = string_expression;
        this.expression = expression;
    }
}

export abstract class EXPR_VALUE {
}

export class EXTERNAL_QUERY extends EXPR_VALUE {
    context: String;
    query_id: String;
    query_args?: String[];
    constructor(context: String, query_id: String, query_args?: String[]) {
        super();
        this.context = context;
        this.query_id = query_id;
        this.query_args = query_args;
    }
}

export abstract class EXPRESSION extends EXPR_VALUE {
}

export abstract class EXPR_LEAF extends EXPRESSION {
    item?: Any;
    constructor(item?: Any) {
        super();
        this.item = item;
    }
}

export abstract class EXPR_OPERATOR extends EXPRESSION {
    precedence_overridden?: Boolean;
    symbol?: String;
    operator: OPERATOR_KIND;
    constructor(operator: OPERATOR_KIND, precedence_overridden?: Boolean, symbol?: String) {
        super();
        this.precedence_overridden = precedence_overridden;
        this.symbol = symbol;
        this.operator = operator;
    }
}

export class EXPR_UNARY_OPERATOR extends EXPR_OPERATOR {
    operand: EXPRESSION;
    constructor(operator: OPERATOR_KIND, operand: EXPRESSION, precedence_overridden?: Boolean, symbol?: String) {
        super(operator, precedence_overridden, symbol);
        this.operand = operand;
    }
}

export class EXPR_BINARY_OPERATOR extends EXPR_OPERATOR {
    left_operand: EXPRESSION;
    right_operand: EXPRESSION;
    constructor(
        operator: OPERATOR_KIND,
        left_operand: EXPRESSION,
        right_operand: EXPRESSION,
        precedence_overridden?: Boolean,
        symbol?: String
    ) {
        super(operator, precedence_overridden, symbol);
        this.left_operand = left_operand;
        this.right_operand = right_operand;
    }
}

export class EXPR_FOR_ALL extends EXPR_OPERATOR {
    condition: ASSERTION;
    operand: EXPR_VALUE_REF;
    constructor(
        operator: OPERATOR_KIND,
        condition: ASSERTION,
        operand: EXPR_VALUE_REF,
        precedence_overridden?: Boolean,
        symbol?: String
    ) {
        super(operator, precedence_overridden, symbol);
        this.condition = condition;
        this.operand = operand;
    }
}

export class OPERATOR_KIND {
    identifier: String;
    constructor(identifier: String) {
        this.identifier = identifier;
    }
}

export class EXPR_LITERAL extends EXPR_LEAF {
    item: Any;
    constructor(item: Any) {
        super(item);
        this.item = item;
    }
}

export class EXPR_FUNCTION_CALL extends EXPR_LEAF {
    arguments?: EXPRESSION[];
    constructor(item?: Any, args?: EXPRESSION[]) {
        super(item);
        this.arguments = args;
    }
}

export class EXPR_VARIABLE_REF extends EXPR_LEAF {
    item: VARIABLE_DECLARATION;
    constructor(item: VARIABLE_DECLARATION) {
        super(item);
        this.item = item;
    }
}

export class EXPR_VALUE_REF extends EXPR_LEAF {
}

//
// beom.types
//

export abstract class EXPR_TYPE_DEF {
    type_name: String;
    type_anchor: Any;
    constructor(type_name: String, type_anchor: Any) {
        this.type_name = type_name;
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_BOOLEAN extends EXPR_TYPE_DEF {
    type_anchor: Boolean;
    constructor(type_name: String, type_anchor: Boolean) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_INTEGER extends EXPR_TYPE_DEF {
    type_anchor: Integer;
    constructor(type_name: String, type_anchor: Integer) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_REAL extends EXPR_TYPE_DEF {
    type_anchor: Real;
    constructor(type_name: String, type_anchor: Real) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_DATE extends EXPR_TYPE_DEF {
    type_anchor: Iso8601_date;
    constructor(type_name: String, type_anchor: Iso8601_date) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_DATE_TIME extends EXPR_TYPE_DEF {
    type_anchor: Iso8601_date_time;
    constructor(type_name: String, type_anchor: Iso8601_date_time) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_TIME extends EXPR_TYPE_DEF {
    type_anchor: Iso8601_time;
    constructor(type_name: String, type_anchor: Iso8601_time) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_DURATION extends EXPR_TYPE_DEF {
    type_anchor: Iso8601_duration;
    constructor(type_name: String, type_anchor: Iso8601_duration) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_STRING extends EXPR_TYPE_DEF {
    type_anchor: String;
    constructor(type_name: String, type_anchor: String) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_URI extends EXPR_TYPE_DEF {
    type_anchor: Uri;
    constructor(type_name: String, type_anchor: Uri) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_TERMINOLOGY_CODE extends EXPR_TYPE_DEF {
    type_anchor: Terminology_code;
    constructor(type_name: String, type_anchor: Terminology_code) {
        super(type_name, type_anchor);
        this.type_anchor = type_anchor;
    }
}

export class TYPE_DEF_OBJECT_REF extends EXPR_TYPE_DEF {
}
