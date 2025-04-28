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
          iconsForDirection = processObject(drakon.items, branch.body, [{ item: iconBranch, dir: "one" }]);
        }
      }
      return iconsForDirection;
    }

    function processObject(items, objectsForProcessing, iconsForDirection) {

      let firstAddedIconId = null;
      let firstIconsForDirection = iconsForDirection;
      if (!objectsForProcessing || objectsForProcessing.length === 0) {
        return iconsForDirection;
      }
      for (const element of objectsForProcessing) {
        if (element.type === "address") {
          const targetBranch = ast.branches.find(b => b.name === element.content);
          if (targetBranch) {
            iconsForDirection[0].item.oneBranchId = targetBranch.branchId;
          }
        } else if (element.type === "loop") {
          iconsForDirection = processObject(items, element.body, iconsForDirection)
        } else {
          const newIconId = String(nextNodeId++);
          const newIcon = {
            content: element.content,
            type: element.type
          };
          if (element.type === "loopend") {
            newIcon.type = "arrow-loop";
            newIcon.content = "";
            // //newIcon.one = firstAddedIconId;
            // for (const itemDir of firstIconsForDirection) {
            //   itemDir.item[itemDir.dir] = newIconId;
            // }

          }
          items[newIconId] = newIcon;
          if (firstAddedIconId === null) {
            firstAddedIconId = newIconId;
          }

          for (const itemDir of iconsForDirection) {
            itemDir.item[itemDir.dir] = newIconId;
          }

          iconsForDirection = [];

          if (element.type === "question") {
            var iconOne = newIcon;
            var iconTwo = newIcon;

            newIcon.flag1 = 1;

            let firstIconIsBreak = false;
            if (element.no && element.no.length > 0 && element.no[0].type === "break") {
              firstIconIsBreak = true;
              newIcon.flag1 = 0;
            } else if (element.yes && element.yes.length > 0 && element.yes[0].type === "break") {
              firstIconIsBreak = true;
            }

            if (firstIconIsBreak) { // Если первая икона в no или yes - это break тогда

              iconsForDirection.push({ item: iconOne, dir: "one" });

              let iconsLoop = [];
              if (newIcon.flag1 = 1) {
                iconsLoop = processObject(items, element.no, [{ item: iconTwo, dir: "two" }]);
              } else {
                iconsLoop = processObject(items, element.yes, [{ item: iconTwo, dir: "two" }]);
              };

              for (const itemDir of iconsLoop) {
                itemDir.item[itemDir.dir] = firstAddedIconId;
              }
              for (const itemDir of firstIconsForDirection) {
                itemDir.item[itemDir.dir] = nextNodeId - 1;
              }

            } else {

              let selectIcon = null;

              function findExistingIcon(items, type, content) {
                for (const key in items) {
                  const item = items[key];
                  if (item.type === type && item.content === content) {
                    return true;
                  }
                }
                return false;
              }

              if (typeof newIcon.content === 'object' && newIcon.content.operator === 'equal') {

                if (!findExistingIcon(items, 'select', newIcon.content.left)) {
                  let selectIconId = String(nextNodeId++);
                  selectIcon = { type: 'select', content: newIcon.content.left };
                  selectIcon.one = newIconId;
                  items[selectIconId] = selectIcon;
                  
                  for (const itemDir of firstIconsForDirection) {
                    itemDir.item[itemDir.dir] = selectIconId;
                  }
    
                }

                newIcon.type = 'case';
                newIcon.content = newIcon.content.right;
              }

              if (element.no && element.no.length > 0) {
                iconsForDirection.push(...processObject(items, element.no, [{ item: iconTwo, dir: "two" }]));
              } else {
                iconsForDirection.push({ item: iconTwo, dir: "two" });
              }

              if (element.yes && element.yes.length > 0) {
                iconsForDirection.push(...processObject(items, element.yes, [{ item: iconOne, dir: "one" }]));
              } else {
                iconsForDirection.push({ item: iconOne, dir: "one" });
              }

              function processQuestionContent(newIcon) {
                // Check directly if newIcon.content is an object with operator: "and"
                if (typeof newIcon.content === 'object') {
                  let dirNewItem = null;
                  if (newIcon.content.operator === "and") {
                    dirNewItem = 'one';
                  } else if (newIcon.content.operator === "or") {
                    dirNewItem = 'two';
                  };
                  const newIcon2Id = String(nextNodeId++);
                  const newIcon2 = {
                    ...newIcon,
                    content: newIcon.content.right,
                    id: newIcon2Id
                  };
                  newIcon[dirNewItem] = newIcon2Id;
                  items[newIcon2Id] = newIcon2;
                  newIcon.content = newIcon.content.left;
                  processQuestionContent(newIcon);
                  processQuestionContent(newIcon2);
                  if (!newIcon2.two) {
                    iconsForDirection.push({ item: newIcon2, dir: "two" });
                  }
                  if (!newIcon2.one) {
                    iconsForDirection.push({ item: newIcon2, dir: "one" });
                  }
                }
                iconsForDirection = iconsForDirection.filter(itemDir => {
                  // Проверяем, определено ли свойство 'one' или 'two' у иконы
                  if (itemDir.item[itemDir.dir]) {
                    // Если определено, то удаляем элемент (возвращаем false)
                    return false;
                  } else {
                    // Если не определено, то оставляем элемент (возвращаем true)
                    return true;
                  }
                });

              }

              processQuestionContent(newIcon)

            };

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

      // Удаление икон с типом error и ссылок на них
      const errorIconIds = [];
      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.type === "error") {
          errorIconIds.push(key);
          delete drakon.items[key];
        }
      }

      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (errorIconIds.includes(item.one)) {
          delete item.one;
        }
        if (errorIconIds.includes(item.two)) {
          delete item.two;
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
