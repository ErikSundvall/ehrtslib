import { Document } from 'yaml';

const obj = {
  name: { value: "Test" }
};

const doc = new Document(obj);

console.log("Document structure:");
console.log("Contents type:", doc.contents?.type);
console.log("Contents items length:", doc.contents?.items?.length);

if (doc.contents?.items) {
  for (let i = 0; i < doc.contents.items.length; i++) {
    const pair = doc.contents.items[i];
    console.log(`\nPair ${i}:`);
    console.log("  Key:", pair.key);
    console.log("  Value type:", pair.value?.type);
    console.log("  Value items:", pair.value?.items?.length);
    
    if (pair.value?.items) {
      for (let j = 0; j < pair.value.items.length; j++) {
        const innerPair = pair.value.items[j];
        console.log(`    Inner pair ${j}:`);
        console.log("      Key:", innerPair.key);
        console.log("      Value type:", innerPair.value?.type);
        console.log("      Value:", innerPair.value?.value);
      }
    }
  }
}

console.log("\n\nDefault output:");
console.log(doc.toString());
