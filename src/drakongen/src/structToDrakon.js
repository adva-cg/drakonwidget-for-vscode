const fs = require('fs');
const path = require('path');

/**
 * Converts a DRAKON AST (in the Untitled-1.txt format) to a DRAKON diagram string.
 *
 * @param {string} astJson - The JSON string representing the DRAKON AST.
 * @returns {{fileName: string, content: string}} An object containing the file name and content.
 */
function astToDrakon(astJson) {
  try {
    const ast = JSON.parse(astJson);
    const drakon = {
      type: "drakon",
      items: {},
    };
    const branchIds = {};
    let nextNodeId = 2;
    let previousIcon = null;
    let isFirstElement = true;

    function defineFirstItem() {
      const objectJs = ast;
      const resultFileName = objectJs.name;

      if (objectJs.branches && objectJs.branches.length > 0 && (objectJs.branches.length !== 1 || objectJs.branches[0].body.length > 0)) {
        const endNodeId = String(nextNodeId++);
        drakon.items[endNodeId] = { type: "end" };
      } else {
        drakon.items = {};
      }
      processBranches();
      exit();
    }

    function processBranches() {
      if (ast.branches) {
        for (const branch of ast.branches) {
          const branchNodeId = String(nextNodeId++);
          const iconBranch = {
            type: "branch",
            branchId: branch.branchId,
          };
          drakon.items[branchNodeId] = iconBranch;
          branchIds[branch.branchId] = branchNodeId;
          if (ast.branches.length !== 1) {
            iconBranch.content = branch.name;
          }
          previousIcon = iconBranch;
          processObject(branch);
        }
      }
    }

    function processObject(objectForProcessing) {
      isFirstElement = true;
      if (objectForProcessing.body) {
        for (const element of objectForProcessing.body) {
          if (element.type === "address") {
            previousIcon.oneBranchId = element.content;
          } else {
            const newIconId = String(nextNodeId++);
            const newIcon = {
              type: "action",
              content: element.content,
            };
            drakon.items[newIconId] = newIcon;
            if (isFirstElement && objectForProcessing.no) {
              previousIcon.two = newIconId;
            } else {
              previousIcon.one = newIconId;
            }
            previousIcon = newIcon;
            isFirstElement = false;
            if (element.yes || element.no) {
              processObject(element);
            }
          }
        }
      }
    }

    function exit() {
      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.oneBranchId) {
          item.one = branchIds[item.oneBranchId];
          delete item.oneBranchId;
        }
      }
    }

    defineFirstItem();

    return {
      fileName: ast.name,
      content: JSON.stringify(drakon, null, 4),
    };
  } catch (error) {
    console.error("Error converting AST to DRAKON:", error);
    return { fileName: "", content: "" };
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

      // Read the JSON file
      fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        // Convert AST to DRAKON
        const result = astToDrakon(data);

        if (result.content === "") {
          console.error(`Error converting AST to DRAKON for file ${file}`);
          return;
        }

        // Write the DRAKON file
        const drakonFileName = result.fileName + '.drakon';
        const drakonFilePath = path.join(outputDir, drakonFileName);
        fs.writeFile(drakonFilePath, result.content, 'utf8', (err) => {
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
