# Instruction: Implementing the `EVALUATION` Class

## 1. Description

The `EVALUATION` class records clinical assessments, opinions, and
interpretations. Unlike OBSERVATION, it represents evaluated knowledge rather
than raw observations.

- **Reference:**
  [openEHR RM - EVALUATION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_evaluation_class)

## 2. Behavior

### 2.1. Properties

#### `data: ITEM_STRUCTURE`

- **Purpose:** The assessment or evaluation data.
- **Optional:** Yes (per specification)

### 2.2. Common Uses

EVALUATION is used for:

- Problem/diagnosis lists
- Risk assessments
- Adverse reaction lists
- Family history
- Social history
- Clinical summaries
- Prognoses

## 3. Example Usage

```typescript
const diagnosis = new EVALUATION();
diagnosis.archetype_node_id = "openEHR-EHR-EVALUATION.problem_diagnosis.v1";

const name = new DV_TEXT();
name.value = "Problem/Diagnosis";
diagnosis.name = name;

const data = new ITEM_TREE();
// Add diagnosis details as elements
diagnosis.data = data;
```

## 4. Test Cases

1. Test creation with data
2. Test diagnosis archetype
3. Test risk assessment archetype
4. Test adverse reaction archetype

## 5. References

- **Official Specification:**
  [openEHR RM - EVALUATION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_evaluation_class)
- **Implementation:**
  [Archie EVALUATION](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/composition/Evaluation.java)
