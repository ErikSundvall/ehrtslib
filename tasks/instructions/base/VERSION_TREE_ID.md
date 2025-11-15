# Instruction: Implementing the `VERSION_TREE_ID` Class

## 1. Description

The `VERSION_TREE_ID` class represents an identifier in a version tree for a
versioned object. It supports both trunk and branch versions.

- **Format:** `trunk_version[.branch_number.branch_version]`
- **Examples:** `"1"` (trunk), `"2.1.3"` (branch)
- **Reference:**
  [openEHR BASE - VERSION_TREE_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_version_tree_id_class)

## 2. Behavior

### 2.1. Constructor and Parsing

- **Pseudo-code:**
  ```typescript
  static from(treeIdStr: string): VERSION_TREE_ID {
    const id = new VERSION_TREE_ID();
    id.value = treeIdStr;
    id.parse(treeIdStr);
    return id;
  }

  private parse(treeIdStr: string): void {
    const parts = treeIdStr.split('.');
    
    if (parts.length === 1) {
      // Trunk version only
      this._trunk_version = parseInt(parts[0]);
      this._branch_number = undefined;
      this._branch_version = undefined;
    } else if (parts.length === 3) {
      // Branch version
      this._trunk_version = parseInt(parts[0]);
      this._branch_number = parseInt(parts[1]);
      this._branch_version = parseInt(parts[2]);
    } else {
      throw new Error("Invalid VERSION_TREE_ID format");
    }
  }
  ```

### 2.2. Component Accessors

#### `trunk_version(): Integer`

- **Purpose:** Return the trunk version number.
- **Pseudo-code:**
  ```typescript
  trunk_version(): Integer {
    return Integer.from(this._trunk_version);
  }
  ```

#### `branch_number(): Integer | undefined`

- **Purpose:** Return the branch number (undefined for trunk versions).
- **Pseudo-code:**
  ```typescript
  branch_number(): Integer | undefined {
    return this._branch_number ? Integer.from(this._branch_number) : undefined;
  }
  ```

#### `branch_version(): Integer | undefined`

- **Purpose:** Return the branch version number.
- **Pseudo-code:**
  ```typescript
  branch_version(): Integer | undefined {
    return this._branch_version ? Integer.from(this._branch_version) : undefined;
  }
  ```

### 2.3. Query Methods

#### `is_branch(): Boolean`

- **Purpose:** Check if this is a branch version.
- **Pseudo-code:**
  ```typescript
  is_branch(): Boolean {
    return new Boolean(this._branch_number !== undefined);
  }
  ```

#### `is_first(): Boolean`

- **Purpose:** Check if this is version 1 (first trunk version).
- **Pseudo-code:**
  ```typescript
  is_first(): Boolean {
    return new Boolean(
      this._trunk_version === 1 && 
      this._branch_number === undefined
    );
  }
  ```

### 2.4. Comparison

#### `less_than(other: Ordered): Boolean`

- **Purpose:** Compare version tree IDs.
- **Rules:**
  - Trunk versions compared by trunk_version
  - Branch versions with same trunk compared by branch_number, then
    branch_version
  - Trunk version < any branch of same trunk
- **Pseudo-code:**
  ```typescript
  less_than(other: Ordered): Boolean {
    if (!(other instanceof VERSION_TREE_ID)) {
      throw new Error("Cannot compare with non-VERSION_TREE_ID");
    }
    
    // Compare trunk versions first
    if (this._trunk_version !== other._trunk_version) {
      return new Boolean(this._trunk_version < other._trunk_version);
    }
    
    // Same trunk version - check branches
    const thisBranch = this._branch_number ?? -1;
    const otherBranch = other._branch_number ?? -1;
    
    if (thisBranch !== otherBranch) {
      return new Boolean(thisBranch < otherBranch);
    }
    
    // Same branch - compare branch versions
    const thisBranchVer = this._branch_version ?? 0;
    const otherBranchVer = other._branch_version ?? 0;
    
    return new Boolean(thisBranchVer < otherBranchVer);
  }
  ```

## 3. Invariants

- **Trunk_version_valid:** `trunk_version >= 1`
- **Branch_validity:** If branch_number exists, branch_version must exist
- **Branch_number_valid:** `branch_number >= 1` (if present)
- **Branch_version_valid:** `branch_version >= 1` (if present)

## 4. Pre-conditions

- Version string must be valid format (N or N.N.N).

## 5. Post-conditions

- Trunk version always accessible.
- Branch components only if branch version.

## 6. Example Usage

```typescript
// Trunk versions
const v1 = VERSION_TREE_ID.from("1");
console.log(v1.trunk_version().value); // 1
console.log(v1.is_branch()); // false
console.log(v1.is_first()); // true

const v2 = VERSION_TREE_ID.from("2");
console.log(v2.trunk_version().value); // 2
console.log(v2.is_first()); // false

// Branch version
const branch = VERSION_TREE_ID.from("2.1.3");
console.log(branch.trunk_version().value); // 2
console.log(branch.branch_number().value); // 1
console.log(branch.branch_version().value); // 3
console.log(branch.is_branch()); // true

// Comparison
console.log(v1.less_than(v2)); // true
console.log(v2.less_than(branch)); // true (trunk < branch)

const branch2 = VERSION_TREE_ID.from("2.1.4");
console.log(branch.less_than(branch2)); // true
```

## 7. Version Tree Semantics

- **Trunk versions** (1, 2, 3, ...): Main line of development
- **Branch versions** (N.B.V): Branches from trunk version N
  - N = trunk version where branch started
  - B = branch number (multiple branches can exist from same trunk)
  - V = version within that branch

Example tree:

```
1 -- 2 -- 3 -- 4
     |
     +-- 2.1.1 -- 2.1.2
     |
     +-- 2.2.1
```

## 8. Test Cases

Key test cases to implement:

1. Test parsing trunk version ("1", "2", etc.)
2. Test parsing branch version ("2.1.3")
3. Test parsing throws error for invalid formats ("1.2", "1.2.3.4")
4. Test trunk_version() accessor
5. Test branch_number() and branch_version() accessors
6. Test is_branch() for trunk and branch versions
7. Test is_first() for first and other versions
8. Test less_than() with trunk versions
9. Test less_than() with trunk vs branch
10. Test less_than() with branches of same trunk
11. Test less_than() with branches of different trunks
12. Test string representation matches input

## 9. References

- [openEHR BASE - VERSION_TREE_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_version_tree_id_class)
- [openEHR RM - Versioning Semantics](https://specifications.openehr.org/releases/RM/latest/common.html#_versioning_model)
- [Archie VersionTreeId](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/VersionTreeId.java)
