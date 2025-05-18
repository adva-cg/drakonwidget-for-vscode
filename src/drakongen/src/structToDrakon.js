const fs = require('fs');
const path = require('path');

function astToDrakon(astJson) {
  try {
    const ast = JSON.parse(astJson);
    const drakon = {
      type: "drakon",
      items: {},
    };
    const branchIds = new Map;
    let nextNodeId = 1;
    let selectIcon = null;
    //let iconEnd = null;

    // Стек для отслеживания родительских узлов и направлений
    const parentStack = [];
    const loopStack = [];

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
          if (branch.name) {
            branchIds.set(branch.name, branchNodeId);
          };
          if (ast.branches.length !== 1) {
            iconBranch.content = branch.name;
          }
          parentStack.push({ item: iconBranch, dir: 'one' });
          const firstIcon = processObjects(drakon.items, branch.body, true);
          if (firstIcon) {
            iconBranch.one = firstIcon.id;
            firstIcon.prev = iconBranch.id;
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
          if (lastIcon) {
            parentStack.push({ item: lastIcon, dir: 'one' });
          }
          const icon = processObjects(items, element);
          if (lastIcon) {
            parentStack.pop();
          }
          if (!firstIcon) {
            firstIcon = icon;
            const parent = parentStack[parentStack.length - 1];
            if (parent && icon) {
              parent.item[parent.dir] = icon.id;
            }
          }
          if (icon && lastIcon && !lastIcon.one) {
            lastIcon.one = icon.id;
            if (!icon.prev) {
              icon.prev = lastIcon.id;
            }
          }
          if (icon && icon.end) {
            lastIcon = icon.end;
          } else {
            lastIcon = icon;
          }
        }
      } else if (isObject(objectsForProcessing)) {
        let element = objectsForProcessing;
        let newIcon = addIcon(items, element);
        if (element.type === "loop") {
          lastIcon = processLopp(newIcon, element);
        } else if (element.type === "question") {
          lastIcon = processQuestion(newIcon, element);
        } else {
          lastIcon = newIcon;
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
      if (element.secondary) {
          icon.secondary = element.secondary;
      };
      if (element.type === "loopend") {
        if (loopStack.length > 0 && loopStack[loopStack.length - 1].content) {
          icon.type = "del";
          // icon.content = "";
        } else {
          icon.type = "arrow-loop";
          icon.content = "";
        }
      }
      if (element.type === "loop") {
        if (element.content) {
          icon.type = "loopbegin";
        }
      }
      items[iconId] = icon;
      if (element.type === "question") {
        icon.flag1 = 1; // по умочанию
      }
      if (element.type === "endQuestion" || element.type === "endLoop") {
        icon.content = "";
      }
      return icon;
    }

    function processQuestion(icon, element) {

      let selIcon = null;
      const endQuestionIcon = addIcon(drakon.items, { type: "endQuestion" });
      icon.end = endQuestionIcon; // Store endQuestionIcon in the question icon

      selIcon = processCase(icon);

      let lastIconNo = null;
      if (element.no && element.no.length > 0) {
        parentStack.push({ item: icon, dir: "two" });
        lastIconNo = processObjects(drakon.items, element.no, false);
        parentStack.pop();
      }

      let lastIconYes = null;
      if (element.yes && element.yes.length > 0) {
        parentStack.push({ item: icon, dir: "one" });
        lastIconYes = processObjects(drakon.items, element.yes, false);
        parentStack.pop();
      }

      let isForeach = false;
      let lastIconBreak = null;
      let lastIconLoopend = null;
      if (loopStack.length > 0 && loopStack[loopStack.length - 1].content) {
        isForeach = true;
        if (lastIconYes && lastIconYes.type === 'break') {
          lastIconBreak = lastIconYes;
        } else if (lastIconNo && lastIconNo.type === 'break') {
          lastIconBreak = lastIconNo;
        } else if (lastIconYes && lastIconYes.type === 'del') {
          lastIconLoopend = lastIconYes;
        } else if (lastIconNo && lastIconNo.type === 'del') {
          lastIconLoopend = lastIconNo;
        }
      }
      handleBody(drakon.items, lastIconNo, icon, endQuestionIcon, "two", isForeach, lastIconBreak);
      handleBody(drakon.items, lastIconYes, icon, endQuestionIcon, "one", isForeach, lastIconBreak);

      if (isForeach && !lastIconBreak && lastIconLoopend) {
        if (lastIconLoopend = lastIconNo) {
          icon.flag1 = 0;
          let dir = icon.two;
          icon.two = icon.one;
          icon.one = dir;
        }
      }

      processQuestionContent(icon);

      function handleBody(items, lastIcon, icon, endQuestionIcon, direction, isForeach) {
        let loopend = null;

        if (lastIcon) {
          loopend = endsWithLoopend(items, lastIcon.id);
          if (loopend === "arrow-loop") {
            if (loopStack.length > 0) {
              lastIcon.one = loopStack[loopStack.length - 1].id;  // Ссылка на начало цикла
            } else {
              lastIcon.one = icon.id;
            }

          } else if (lastIconBreak) {
            if (isForeach) {
              if (direction === 'one') {
                lastIconBreak.one = null;
                if (loopStack[loopStack.length - 1].end.one) {
                  lastIconBreak.one = loopStack[loopStack.length - 1].end.one;
                  items[loopStack[loopStack.length - 1].end.one].prev = lastIconBreak.id;
                  loopStack[loopStack.length - 1].end.one = lastIconBreak.id;
                  lastIconBreak.prev = loopStack[loopStack.length - 1].end.id;
                } else {
                  loopStack[loopStack.length - 1].end.one = lastIconBreak.id;
                  if (!lastIconBreak.prev) {
                    lastIconBreak.prev = loopStack[loopStack.length - 1].end.id;
                  };
                  loopStack[loopStack.length - 1].end = lastIconBreak;
                };

                if (lastIcon === lastIconBreak) {

                  icon.flag1 = 0;
                  let dir = icon.two;
                  icon.two = icon.one;
                  icon.one = dir;
                } else {
                  lastIcon.one = endQuestionIcon.id;
                }

              } else {
                lastIcon.one = endQuestionIcon.id;

              };
            } else {
              lastIcon.one = endQuestionIcon.id;
            }
        
          } else {
            lastIcon.one = endQuestionIcon.id;
          }
        } else {
          icon[direction] = endQuestionIcon.id;
        }
      }

      if (selIcon) {
        return selIcon;
      } else {
        return icon;
      }
    }

    function endsWithLoopend(items, nodeId) {
      let current = items[nodeId];
      while (current && current.one) {
        if (current.type === "arrow-loop") {
          return "arrow-loop";
        } else if (current.type === "break") {
          return "break";
        } else if (current.type === "del") {
          return "del";
        } else if (current.type === "loopend") {
          return "loopend";
        }
        current = items[current.one];
      }
      if (current) {
        if (current.type === "arrow-loop") {
          return "arrow-loop";
        } else if (current.type === "break") {
          return "break";
        } else if (current.type === "del") {
          return "del";
        } else if (current.type === "loopend") {
          return "loopend";
        }
      }
      return null;
    }

    function processCase(icon) {

      let isSelect = false;

      let isCase = false;
      let currentContect = icon.content;
      while (typeof currentContect === 'object') {
        if (currentContect.operator === 'equal') {
          isCase = true;
          break;
        } else {
          currentContect = currentContect.left;
        }
      }

      if (isCase) {
        if (!selectIcon || selectIcon.content !== currentContect.left) {
          selectIcon = addIcon(drakon.items, { type: 'select', content: currentContect.left });
          selectIcon.one = icon.id;
          if (parentStack.length > 0) {
            parentStack[parentStack.length - 1].one = selectIcon.id;
          }
          isSelect = true;
        }
        icon.type = 'case';
      }
      if (isSelect) {
        return selectIcon;
      } else {
        return null;
      }
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
        } else if (icon.content.operator === "equal") {
          dirNewItem = 'one';
        }

        if (icon.content.operator === "not") {
          icon.content = icon.content.operand;
          icon.flag1 = 0;
        } else if (icon.content.operator === "equal") {
          icon.content = icon.content.right;
        } else {
          const newIcon2 = addIcon(drakon.items, { type: icon.type, content: icon.content.right });

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
      let endLoopIcon = addIcon(drakon.items, { type: "endLoop" });
      if (icon.content) {
        endLoopIcon.type = 'loopend';
      };
      if (icon) {
        icon.end = endLoopIcon;
      }

      let lastIconBody = null;
      if (icon) {
        parentStack.push({ item: icon, dir: "one" });
        loopStack.push(icon);
        lastIconBody = processObjects(drakon.items, element.body, false);
        loopStack.pop();
        parentStack.pop();
        if (lastIconBody) {
          if (!lastIconBody.one) {
            lastIconBody.one = endLoopIcon.id;
          };
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

      const deleteIds = [];

      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.type === 'address' && item.content) {
          item.one = branchIds.get(item.content);
         // delete item.oneBranchId;
        }
        if (item.type === "end") {
          endNodeId = key;
        }
        if (item.type === 'arrow-loop') {
          let loop = drakon.items[item.one];
          item.one = loop.one;
          if (drakon.items[item.one].type === 'arrow-loop') {
            deleteIds.push(item.id);
          }
          loop.one = item.id;
        }
      }

      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.type === "endQuestion" || item.type === "del"  || item.type === "address"
          || item.type === "endLoop" || item.type === "break"
          || item.type === "error" || item.type === "loop") {
          deleteIds.push(key);
        }
      }

      for (const key in drakon.items) {
        const item = drakon.items[key];
        while (item.one && deleteIds.includes(item.one)) {
          item.one = drakon.items[item.one].one;
        }
        while (item.two && deleteIds.includes(item.two)) {
          item.two = drakon.items[item.two].one;
        }
      }

      for (const key of deleteIds) {
        delete drakon.items[key];
      };

      for (const key in drakon.items) {
        const item = drakon.items[key];
        if (item.end) {
          delete item.end
        }
        if (item.id) {
          delete item.id
        }
        if (item.prev) {
          delete item.prev
        }
        if (item.type === "question") {
          if (!item.one) {
            item.one = endNodeId;
          }
          if (!item.two) {
            item.two = endNodeId;
          }
        }
        if (item.type === "case" && item.two === item.one) {
          delete item.two;
        }
        if (!item.one && item.type !== "end") {
          item.one = endNodeId;
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

// const inputDirectory = '../examples';
// const outputDirectory = '../examples/outdr';
// generateDrakonFiles(inputDirectory, outputDirectory);
module.exports = { generateDrakonFiles, astToDrakon }