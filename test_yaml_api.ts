import { stringify, Document, YAMLMap, YAMLSeq, Scalar, Pair } from 'yaml';

// Create a document with explicit flow style
const doc = new Document();

// Create a flow map for {value: "Test"}
const valueMap = new YAMLMap();
valueMap.flow = true;  // This should make it {value: ...}
valueMap.add(new Pair('value', 'Test'));

// Create root map
const rootMap = new YAMLMap();
rootMap.add(new Pair('name', valueMap));

doc.contents = rootMap;

console.log("With flow=true on inner map:");
console.log(doc.toString());

// Try with flowCollectionPadding option
console.log("\nWith options:");
console.log(doc.toString({ flowCollectionPadding: false }));
