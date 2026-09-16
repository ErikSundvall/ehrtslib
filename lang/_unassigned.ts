// openEHR LANG model — declarations previously unassigned in the BMM package map.
// BMM3 entity types now live in ./bmm/core/entity.ts; this file re-exports the
// shells that older imports still pull from `_unassigned.ts`.

export {
  BMM_FUNCTION_TYPE,
  BMM_GENERIC_CLASS,
  BMM_PROCEDURE_TYPE,
  BMM_SIMPLE_CLASS,
  BMM_TUPLE_TYPE,
} from "./bmm/core/entity.ts";
