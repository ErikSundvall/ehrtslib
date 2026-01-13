import { Document, isMap, isSeq, isScalar } from 'yaml';

const obj = {
  name: { value: "Test" },
  items: [1, 2, 3]
};

const doc = new Document(obj);

console.log("Checking node types:");
console.log("Root isMap:", isMap(doc.contents));
console.log("Root isSeq:", isSeq(doc.contents));

if (doc.contents?.items) {
  for (const pair of doc.contents.items) {
    console.log(`\nKey: ${pair.key}`);
    console.log("  Value isMap:", isMap(pair.value));
    console.log("  Value isSeq:", isSeq(pair.value));
    console.log("  Value isScalar:", isScalar(pair.value));
  }
}
