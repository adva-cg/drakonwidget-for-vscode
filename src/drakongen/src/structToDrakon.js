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
    let nextNodeId = 1;
    let previousIcon = null;

    function defineFirstItem() {
      //const objectJs = ast;

      // if (objectJs.branches && objectJs.branches.length > 0 && (objectJs.branches.length !== 1 || objectJs.branches[0].body.length > 0)) {
      //   const endNodeId = String(nextNodeId++);
      //   drakon.items[endNodeId] = { type: "end" };
      // } else {
      //   drakon.items = {};
      // }
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
          processObject(drakon.items, branch.body, "one", iconBranch);
        }
      }
    }

    function processObject(items, objectsForProcessing, direction, iconForDirection) {
      let isFirstElement = true;
      const iconsForDirection = [];
      if (!objectsForProcessing || objectsForProcessing.length === 0) {
        return;
      }
      let newIcon;
      for (const element of objectsForProcessing) {
        if (element.type === "address") {
          const targetBranch = ast.branches.find(b => b.name === element.content);
          if (targetBranch) {
            iconForDirection.oneBranchId = targetBranch.branchId;
          }
        } else {
          const newIconId = String(nextNodeId++);
          newIcon = {
            content: element.content,
            type: element.type
          };
          if (element.type === "question") {
            newIcon.flag1 = 1;
          };
          items[newIconId] = newIcon;

          if (isFirstElement) {
            iconForDirection[direction] = newIconId;
          } else {
            for (const itemDir of iconsForDirection) {
              itemDir.item[itemDir.dir] = newIconId;
            }
          }

          isFirstElement = false;
          iconsForDirection.length = 0;

          if (element.type === "question") {
            const iconOne = newIcon;
            const iconTwo = newIcon;

            if (element.no) {
              processObject(items, element.no, "two", iconTwo);
            }
            iconsForDirection.push({ item: iconTwo, dir: "two" });

            if (element.yes) {
              processObject(items, element.yes, "one", iconOne);
            }
            iconsForDirection.push({ item: iconOne, dir: "one" });
          } else  {
            const iconForFlow = newIcon;
            iconsForDirection.push({ item: iconForFlow, dir: "one" });
          }
        }
      //iconForDirection = newIcon;
      }
    }

    function exit() {
      let lastItemId = null;
      let endNodeId = null;
      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.oneBranchId) {
          item.one = branchIds[item.oneBranchId];
          delete item.oneBranchId;
        }
        if (item.type === "end") {
          endNodeId = key;
        }
        lastItemId = key;
      }

      if (endNodeId && lastItemId && lastItemId !== endNodeId) {
        drakon.items[lastItemId].one = endNodeId;
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
const inputDirectory = '../examples'; // Corrected input directory
const outputDirectory = '../examples/outdr'; // Corrected output directory
generateDrakonFiles(inputDirectory, outputDirectory);
