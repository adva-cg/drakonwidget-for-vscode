const fs = require('fs');
const path = require('path');

/**
 * Converts a DRAKON AST (in the Untitled-1.txt format) to a DRAKON diagram string.
 *
 * @param {string} astJson - The JSON string representing the DRAKON AST.
 * @returns {string} The DRAKON diagram string.
 */
function astToDrakon(astJson) {
  try {
    const ast = JSON.parse(astJson);
    const drakon = {
      type: "drakon",
      items: {},
    };

    // Node ID counter
    let nextNodeId = 2;
    let endNodeId = null;

    // Process each branch
    ast.branches.forEach((branch) => {
      const body = branch.body;
      const lastIndex = body.length - 1;
      let prevNodeId = null;

      // Add action nodes
      for (let i = 0; i < body.length; i++) {
        const node = body[i];
        const nodeId = String(nextNodeId++);
        drakon.items[nodeId] = {
          type: "action",
          content: node.content,
        };
        if (prevNodeId !== null) {
          drakon.items[prevNodeId].one = nodeId;
        }
        prevNodeId = nodeId;
      }

      // Add the end node
      endNodeId = String(nextNodeId++);
      drakon.items[endNodeId] = {
        type: "end",
      };

      // Connect the last action node to the end node
      if (prevNodeId !== null) {
        drakon.items[prevNodeId].one = endNodeId;
      }

      // Add the branch node
      const branchNodeId = String(nextNodeId++);
      drakon.items[branchNodeId] = {
        type: "branch",
        branchId: branch.branchId,
      };
      if (body.length > 0) {
        drakon.items[branchNodeId].one = body[0].id;
      } else {
        drakon.items[branchNodeId].one = endNodeId;
      }
    });

    // Sort items to put the end node first
    if (endNodeId) {
      const sortedItems = {};
      sortedItems[endNodeId] = drakon.items[endNodeId];
      for (const key in drakon.items) {
        if (key !== endNodeId) {
          sortedItems[key] = drakon.items[key];
        }
      }
      drakon.items = sortedItems;
    }

    return JSON.stringify(drakon, null, 4); // Return the .drakon as a formatted JSON string
  } catch (error) {
    console.error("Error converting AST to DRAKON:", error);
    return ""; // Or throw an error, depending on how you want to handle it
  }
}

/**
 * Generates DRAKON files from a directory of AST JSON files.
 *
 * @param {string} inputDir - The directory containing the AST JSON files.
 * @param {string} outputDir - The directory where the DRAKON files will be generated.
 */
function generateDrakonFiles(inputDir, outputDir) {
  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true }); // Create directory and any necessary parent directories
      console.log(`Created output directory: ${outputDir}`);
    } catch (err) {
      console.error(`Error creating output directory ${outputDir}:`, err);
      return; // Stop execution if we can't create the directory
    }
  }

  // Read the files in the input directory
  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error("Error reading input directory:", err);
      return;
    }

    // Filter for JSON files
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    // Process each JSON file
    jsonFiles.forEach(file => {
      const jsonFilePath = path.join(inputDir, file);
      const drakonFileName = path.basename(file, '.json') + '.drakon';
      const drakonFilePath = path.join(outputDir, drakonFileName);

      // Read the JSON file
      fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        // Convert AST to DRAKON
        const drakonContent = astToDrakon(data);

        if (drakonContent === "") {
          console.error(`Error converting AST to DRAKON for file ${file}`);
          return;
        }

        // Write the DRAKON file
        fs.writeFile(drakonFilePath, drakonContent, 'utf8', (err) => {
          if (err) {
            console.error(`Error writing file ${drakonFileName}:`, err);
            return;
          }

          console.log(`Generated ${drakonFileName}`);
        });
      });
    });
  });
}

// Example Usage:
const inputDirectory = '../examples'; // Replace with your input directory
const outputDirectory = '../examples/outdr'; // Replace with your output directory
generateDrakonFiles(inputDirectory, outputDirectory);
