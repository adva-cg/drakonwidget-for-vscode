function demonstrateParameterPassing(primitiveParam, objectParam, arrayParam) {
    console.log("--- Inside the function ---");
    console.log("Initial values inside the function:");
    console.log("primitiveParam:", primitiveParam); // Output: Initial value of primitive
    console.log("objectParam:", objectParam); // Output: { name: 'Initial Object', value: 10 }
    console.log("arrayParam:", arrayParam); // Output: [1, 2, 3]
  
    // Modifying the primitive parameter (reassignment)
    primitiveParam = "Modified primitive";
    console.log("primitiveParam after modification (reassignment):", primitiveParam); // Output: Modified primitive
  
    // Modifying the object parameter (changing properties)
    objectParam.name = "Modified Object";
    objectParam.newValue = 20;
    console.log("objectParam after modification (changing properties):", objectParam); // Output: { name: 'Modified Object', value: 10, newValue: 20 }
  
    // Modifying the array parameter (changing elements)
    arrayParam.push(4);
    arrayParam[0] = 99;
    console.log("arrayParam after modification (changing elements):", arrayParam); // Output: [99, 2, 3, 4]
  
    // --- New: Reassigning the object and array parameters ---
    objectParam = { name: "New Object", value: 30 };
    console.log("objectParam after reassignment:", objectParam); // Output: { name: 'New Object', value: 30 }
  
    arrayParam = [5, 6, 7];
    console.log("arrayParam after reassignment:", arrayParam); // Output: [5, 6, 7]
  
    // --- New: Reassigning the primitive parameter ---
    primitiveParam = 123;
    console.log("primitiveParam after reassignment:", primitiveParam); // Output: 123
  
    console.log("--- End of function ---");
  }
  
  // --- Example Usage ---
  
  // Initial values
  let myPrimitive = "Initial value of primitive";
  let myObject = { name: "Initial Object", value: 10 };
  let myArray = [1, 2, 3];
  
  console.log("--- Before function call ---");
  console.log("myPrimitive:", myPrimitive); // Output: Initial value of primitive
  console.log("myObject:", myObject); // Output: { name: 'Initial Object', value: 10 }
  console.log("myArray:", myArray); // Output: [1, 2, 3]
  
  // Calling the function
  demonstrateParameterPassing(myPrimitive, myObject, myArray);
  
  console.log("--- After function call ---");
  console.log("myPrimitive:", myPrimitive); // Output: Initial value of primitive
  console.log("myObject:", myObject); // Output: { name: 'Modified Object', value: 10, newValue: 20 }
  console.log("myArray:", myArray); // Output: [99, 2, 3, 4]
