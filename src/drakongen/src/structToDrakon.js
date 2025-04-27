const fs = require('fs');
const path = require('path');

function astToDrakon(astJson) {
  try {
    const ast = JSON.parse(astJson);
    const drakon = {
      type: "drakon",
      items: {},
    };
    const branchIds = {};
    let nextNodeId = 1;

    function defineFirstItem() {
      const iconsForDirection = processBranches();
      exit(iconsForDirection);
    }

    function processBranches() {
      let iconsForDirection = [];
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
          iconsForDirection = processObject(drakon.items, branch.body, [{item: iconBranch, dir: "one"}]);
        }
      }
      return iconsForDirection;
    }

    function processObject(items, objectsForProcessing, iconsForDirection) {
      if (!objectsForProcessing || objectsForProcessing.length === 0) {
        return iconsForDirection;
      }
      for (const element of objectsForProcessing) {
        if (element.type === "address") {
          const targetBranch = ast.branches.find(b => b.name === element.content);
          if (targetBranch) {
            iconsForDirection[0].item.oneBranchId = targetBranch.branchId;
          }
        } else {
          const newIconId = String(nextNodeId++);
          const newIcon = {
            content: element.content,
            type: element.type
          };
          if (element.type === "question") {
            newIcon.flag1 = 1;
          }
          items[newIconId] = newIcon;

          for (const itemDir of iconsForDirection) {
            itemDir.item[itemDir.dir] = newIconId;
          }

          iconsForDirection.length = 0;

          if (element.type === "question") {
            var iconOne = newIcon;
            var iconTwo = newIcon;

            if (element.no && element.no.length > 0) {
              iconsForDirection.push(...processObject(items, element.no, [{item: iconTwo, dir: "two"}]));
            } else {
              iconsForDirection.push({ item: iconTwo, dir: "two" });
            }

            // Check directly if newIcon.content is an object with operator: "and"
            if (typeof newIcon.content === 'object' && newIcon.content.operator === "and") {
              const newIconAndId = String(nextNodeId++);
              const newIconAnd = {
                ...newIcon,
                content: newIcon.content.right, // Access properties directly
                one: null
              };
              newIcon.content = newIcon.content.left; // Access properties directly
              newIcon.one = newIconAndId;
              items[newIconAndId] = newIconAnd;

              if (newIcon.two) {
                // тут не добавляем, т.к. будет ссылаться туда же
              } else {
                iconsForDirection.push(...processObject(items, element.no, [{item: newIconAnd, dir: "two"}]));
              }
              iconOne = newIconAnd;
            }

            if (element.yes && element.yes.length > 0) {
              iconsForDirection.push(...processObject(items, element.yes, [{item: iconOne, dir: "one"}]));
            } else {
              iconsForDirection.push({ item: iconOne, dir: "one" });
            }

          } else {
            const iconForFlow = newIcon;
            iconsForDirection.push({ item: iconForFlow, dir: "one" });
          }
        }
      }
      return iconsForDirection;
    }

    function exit(iconsForDirection) {
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
      }
      if (!endNodeId) {
        endNodeId = String(nextNodeId++);
        drakon.items[endNodeId] = { type: "end" };
      }

      for (const itemDir of iconsForDirection) {
        if (!itemDir.item[itemDir.dir]) {
          itemDir.item[itemDir.dir] = endNodeId;
        }
      }

      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.type === "question") {
          if (item.one === null) {
            item.one = endNodeId;
          }
          if (item.two === null) {
            item.two = endNodeId;
          }
        }
        if (item.type === "action") {
          if (!item.one) {
            item.one = endNodeId;
          }
        }
        if (item.type === "end") {
          delete item.one;
          delete item.two;
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

function generateDrakonFiles(inputDir, outputDir) {
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    } catch (err) {
      console.error(`Error creating output directory ${outputDir}:`, err);
      return;
    }
  }

  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error("Error reading input directory:", err);
      return;
    }

    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    jsonFiles.forEach(file => {
      const jsonFilePath = path.join(inputDir, file);

      fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file ${file}:`, err);
          return;
        }

        const result = astToDrakon(data);

        if (result.content === "") {
          console.error(`Error converting AST to DRAKON for file ${file}`);
          return;
        }

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

const inputDirectory = '../examples';
const outputDirectory = '../examples/outdr';
generateDrakonFiles(inputDirectory, outputDirectory);
