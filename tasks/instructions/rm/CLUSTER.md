# Instruction: Implementing the `CLUSTER` Class

## 1. Description

The `CLUSTER` class represents a group of related data items within a data structure. It extends `ITEM` and can contain other items including nested clusters.

-   **Reference:** [openEHR RM - CLUSTER](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_cluster_class)

## 2. Behavior

### 2.1. Properties

#### `items: List<ITEM>`

-   **Purpose:** The items in the cluster.
-   **Mandatory:** Yes (must have at least one item)
-   **Contains:** ELEMENT or nested CLUSTER objects

### 2.2. Methods

#### `is_simple(): Boolean`

-   **Purpose:** CLUSTER is not simple (is composite).
-   **Returns:** False

```typescript
is_simple(): Boolean {
  return new Boolean(false);
}
```

## 3. Invariants

-   **Items_exists:** `items /= Void and then not items.is_empty()`

## 4. Example Usage

```typescript
// Blood pressure cluster
const bpCluster = new CLUSTER();
bpCluster.archetype_node_id = "at0001";

const clusterName = new DV_TEXT();
clusterName.value = "Blood pressure";
bpCluster.name = clusterName;

// Systolic element
const systolic = new ELEMENT();
systolic.archetype_node_id = "at0004";
const systolicName = new DV_TEXT();
systolicName.value = "Systolic";
systolic.name = systolicName;
systolic.value = DV_QUANTITY.from(120, "mm[Hg]");

// Diastolic element
const diastolic = new ELEMENT();
diastolic.archetype_node_id = "at0005";
const diastolicName = new DV_TEXT();
diastolicName.value = "Diastolic";
diastolic.name = diastolicName;
diastolic.value = DV_QUANTITY.from(80, "mm[Hg]");

// Add to cluster
bpCluster.items = new List<ITEM>();
bpCluster.items.append(systolic);
bpCluster.items.append(diastolic);

console.log(bpCluster.is_simple());  // false
```

## 5. Use Cases

CLUSTER is used to group related data:
- Blood pressure (systolic + diastolic)
- Name (given name + family name)
- Address (street + city + postal code)
- Laboratory panel (multiple test results)
- Medication details (dose + frequency + route)

## 6. Test Cases

1. Test creation with items
2. Test is_simple() returns false
3. Test nested clusters (cluster within cluster)
4. Test with ELEMENT items
5. Test validation requires at least one item
6. Test path navigation through cluster

## 7. References

-   [openEHR RM - CLUSTER](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_cluster_class)
-   [Archie CLUSTER](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datastructures/Cluster.java)
