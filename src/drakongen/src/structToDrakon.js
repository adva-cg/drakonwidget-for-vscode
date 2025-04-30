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

    // Стек для отслеживания родительских узлов и направлений
    const parentStack = [];

    function isObject(value) {
      return typeof value === 'object' && value !== null;
    }

    function isArray(value) {
      return Array.isArray(value);
    }

    function processBranches() {
      if (ast.branches) {
        for (const branch of ast.branches) {
          const branchNodeId = String(nextNodeId++);
          const iconBranch = {
            type: "branch",
            branchId: branch.branchId,
            id: branchNodeId
          };
          drakon.items[branchNodeId] = iconBranch;
          branchIds[branch.branchId] = branchNodeId;
          if (ast.branches.length !== 1) {
            iconBranch.content = branch.name;
          }
          parentStack.push({ item: iconBranch, dir: 'one' });
          const firstIcon = processObjects(drakon.items, branch.body, true);
          if (firstIcon) {
            iconBranch.one = firstIcon.id;
          }
          parentStack.pop();
        }
      }
      exit();
    }

    function processObjects(items, objectsForProcessing, returnFirst = true) {
      let lastIcon = null;
      let firstIcon = null;
      if (!objectsForProcessing || objectsForProcessing.length === 0) {
        const parent = parentStack[parentStack.length - 1];
        if (parent) {
          lastIcon = parent.item;
          firstIcon = parent.item;
        }
      } else if (isArray(objectsForProcessing)) {
        for (let i = 0; i < objectsForProcessing.length; i++) {
          const element = objectsForProcessing[i];
          const icon = processObjects(items, element);
          if (!firstIcon) {
            firstIcon = icon;
            const parent = parentStack[parentStack.length - 1];
            if (parent && icon) {
              parent.item[parent.dir] = icon.id;
            }
          }
          if (icon && lastIcon && !lastIcon.one) {
              lastIcon.one = icon.id;
          }
          if (icon && (icon.type === 'question' || icon.type === 'loop')) {
            lastIcon = icon.end;
          } else {
            lastIcon = icon;
          }
      }
      } else if (isObject(objectsForProcessing)) {
        let element = objectsForProcessing;
        if (element.type === "loop") {
          lastIcon = processLopp(lastIcon, element);
        } else {
          let newIcon = addIcon(items, element);
          if (element.type === "question") {
            lastIcon = processQuestion(newIcon, element);
          } else {
            lastIcon = newIcon;
          }
        }
      }
      if (returnFirst) {
        return firstIcon || lastIcon;
      } else {
        return lastIcon
      }
    }

    function addIcon(items, element) {
      const iconId = String(nextNodeId++);
      const icon = {
        content: element.content,
        type: element.type,
        id: iconId
      };
      if (element.type === "loopend") {
        icon.type = "arrow-loop";
        icon.content = "";
      }
      if (element.type !== "loop" && element.type !== "loopend") {
        items[iconId] = icon;
      }
      if (element.type === "question") {
        icon.flag1 = 1; // по умочанию
      }
      if (element.type === "endQuestion" || element.type === "endLoop") {
        icon.content = "";
      }
      return icon;
    }

    function processQuestion(icon, element) {
      const endQuestionIcon = addIcon(drakon.items, { type: "endQuestion" });
      icon.end = endQuestionIcon; // Store endQuestionIcon in the question icon

      let lastIconNo = null;
      if (element.no && element.no.length > 0) {
        parentStack.push({ item: icon, dir: "two" });
        lastIconNo = processObjects(drakon.items, element.no, false);
        parentStack.pop();
      }
      if (lastIconNo) {
        lastIconNo.one = endQuestionIcon.id;
      } else {
        icon.two = endQuestionIcon.id;
      }

      let lastIconYes = null;
      if (element.yes && element.yes.length > 0) {
        parentStack.push({ item: icon, dir: "one" });
        lastIconYes = processObjects(drakon.items, element.yes, false);
        parentStack.pop();
      }
      if (lastIconYes) {
        lastIconYes.one = endQuestionIcon.id;
      } else {
        icon.one = endQuestionIcon.id;
      }

      processQuestionContent(icon);

      return icon; // Return the original question icon
    }

    function processQuestionContent(icon) {
      // Check directly if icon.content is an object with operator: "and"
      if (typeof icon.content === 'object') {
        let dirNewItem = null;
        if (icon.content.operator === "and") {
          dirNewItem = 'one';
        } else if (icon.content.operator === "or") {
          dirNewItem = 'two';
        } else if (icon.content.operator === "not") {
          dirNewItem = 'one';
        }

        if (icon.content.operator === "not") {
          icon.content = icon.content.operand;
          icon.flag1 = 0;
        } else {
          //const newIcon2Id = String(nextNodeId++);
          const newIcon2 = addIcon(drakon.items, { type: "question", content: icon.content.right });

          newIcon2.one = icon.one;
          newIcon2.two = icon.two;
          icon[dirNewItem] = newIcon2.id;
          icon.content = icon.content.left;
          processQuestionContent(icon);
          processQuestionContent(newIcon2);
        }
      }
    }

    function processLopp(icon, element) {
       const endLoopIcon = addIcon(drakon.items, { type: "endLoop" });
       if (icon) {
        icon.end = endLoopIcon;
       }


      let lastIconBody = null;
      if (icon) {
        parentStack.push({ item: icon, dir: "one" });
        lastIconBody = processObjects(drakon.items, element.body);
        parentStack.pop();
        if (lastIconBody) {
          lastIconBody.one = endLoopIcon.id;
        } else {
          icon.one = endLoopIcon.id;
        }
      } else {
        const parent = parentStack[parentStack.length - 1];
        if (parent) {
          parent.item[parent.dir] = endLoopIcon.id;
        }
      }
      return icon;
    }

    function exit() {
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

      const endQuestionIconIds = [];
      const endLoopIconIds = [];
      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.type === "endQuestion") {
          endQuestionIconIds.push(key);
        }
        if (item.type === "endLoop") {
          endLoopIconIds.push(key);
        }
      }

      for (const key in drakon.items) {
        const item = drakon.items[key];
        while (item.one && endQuestionIconIds.includes(item.one)) {
          item.one = drakon.items[item.one].one;
        }
        while (item.one && endQuestionIconIds.includes(item.one)) {
          item.two = drakon.items[item.one].one;
        }
        while (item.one && endLoopIconIds.includes(item.one)) {
          item.one = drakon.items[item.one].one;
        }
      }

      for (const key of endQuestionIconIds) {
        delete drakon.items[key];
      }
      for (const key of endLoopIconIds) {
        delete drakon.items[key];
      };

      if (!endNodeId) {
        endNodeId = String(nextNodeId++);
        drakon.items[endNodeId] = { type: "end" };
      };

      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.type === "question") {
          if (!item.one) {
            item.one = endNodeId;
          }
          if (!item.two) {
            item.two = endNodeId;
          }
        }
        if (item.type === "action") {
          if (!item.one) {
            item.one = endNodeId;
          }
        }
      }
    }

    processBranches();

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
