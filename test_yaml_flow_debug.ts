import { Document } from 'yaml';

// Test if yaml library flow style works as expected
const obj = {
  name: { value: "Test" },
  items: [
    { name: { value: "Item 1" } }
  ]
};

const doc = new Document(obj);

// Try to set flow style on name property
function setFlow(node: any) {
  if (!node) return;
  
  if (node.items && Array.isArray(node.items)) {
    if (node.type === 'MAP' || node.type === 'FLOW_MAP') {
      // Check if simple
      if (node.items.length <= 2) {
        node.flow = true;
        console.log("Setting flow=true for node with", node.items.length, "items");
      }
      
      // Recurse
      for (const pair of node.items) {
        if (pair.value) {
          setFlow(pair.value);
        }
      }
    } else if (node.type === 'SEQ' || node.type === 'FLOW_SEQ') {
      node.flow = false;
      for (const item of node.items) {
        setFlow(item);
      }
    }
  }
}

setFlow(doc.contents);

console.log(doc.toString());
