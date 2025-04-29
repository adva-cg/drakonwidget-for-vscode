const fs = require('fs');
const path = require('path');

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isArray(value) {
  return Array.isArray(value);
}

function astToDrakon(astJson) {
  try {
    const ast = JSON.parse(astJson);
    const drakon = {
      type: "drakon",
      items: {},
    };
    const branchIds = {};
    let nextNodeId = 1;

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
          iconsForDirection = processObjects(drakon.items, branch.body, [{ item: iconBranch, dir: "one" }]);
        }
      }
      return iconsForDirection;
    }

    function processObjects(items, objectsForProcessing, iconsForLink) {
      let firstAddedIconId = null;
      let firstIconsForLink = iconsForLink;

      function processAddress(element) {
        const targetBranch = ast.branches.find(b => b.name === element.content);
        if (targetBranch) {
          iconsForLink[0].item.oneBranchId = targetBranch.branchId;
        }
      }

      function processLopp(element) {

        // определяем икону входа в цикл
        
        iconsForLink = processObjects(items, element.body, iconsForLink);
        
      }

      function addIcon(element) {
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
        items[iconId] = icon;
        if (firstAddedIconId === null) {
          firstAddedIconId = iconId;
        }
        return icon;
      }

      function linkIcon(icon) {
        for (const itemDir of iconsForLink) {
          itemDir.item[itemDir.dir] = icon.id;
        }
        let newLink = [];
        icon.one = null;
        newLink.push({ item: icon, dir: 'one' });
        if (icon.type === 'question') {
          icon.two = null;
          newLink.push({ item: icon, dir: 'two' });
        }

        return newLink;
      }

      function processQuestion(icon, element) {
        // икона question может быть
        // case для select. В этом случае для первого кейса надо добавить сверху селект, а саму икону преобразовать в case
        // условием для проверки цикла. В этом случае надо путь с break направить вниз (брейк может быть на любом уровне вложенности), а без - вправо
        // ну или просто условием. Здесь просто обрабатываем yes и no
        // также условие может содержать внутри себя (в content) вложенное условие, которое тоже надо обработать (просто добавить нужные если и поменять связи)

        // требуется
        // 1) для кейса надо знать, что это первая икона
        // 2) для цикла - надо знать начальную икону цикла, а при выходе - направление break

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
              const newIcon2Id = String(nextNodeId++);
              const newIcon2 = {
                ...icon,
                content: icon.content.right,
                id: newIcon2Id
              };
              icon[dirNewItem] = newIcon2Id;
              items[newIcon2Id] = newIcon2;
              icon.content = icon.content.left;
              processQuestionContent(icon);
              processQuestionContent(newIcon2);
              if (!newIcon2.two) {
                iconsForLink.push({ item: newIcon2, dir: "two" });
              }
              if (!newIcon2.one) {
                iconsForLink.push({ item: newIcon2, dir: "one" });
              }
            }
          }
          iconsForLink = iconsForLink.filter(itemDir => {
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

        var iconOne = icon;
        var iconTwo = icon;

        icon.flag1 = 1; // по умолчанию в one - yes

        let firstIconIsBreak = false;
        if (element.no && element.no.length > 0 && element.no[0].type === "break") {
          firstIconIsBreak = true;
          icon.flag1 = 0;
        } else if (element.yes && element.yes.length > 0 && element.yes[0].type === "break") {
          firstIconIsBreak = true;
        }

        if (firstIconIsBreak) { // Если первая икона в no или yes - это break тогда
          iconsForLink.push({ item: iconOne, dir: "one" });

          let iconsLoop = [];
          if (icon.flag1 === 1) {
            iconsLoop = processObjects(items, element.no, [{ item: iconTwo, dir: "two" }]);
          } else {
            iconsLoop = processObjects(items, element.yes, [{ item: iconTwo, dir: "two" }]);
          }

          for (const itemDir of iconsLoop) {
            itemDir.item[itemDir.dir] = firstAddedIconId;
          }
          for (const itemDir of firstIconsForLink) {
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

          if (typeof icon.content === 'object' && icon.content.operator === 'equal') {
            if (!findExistingIcon(items, 'select', icon.content.left)) {
              let selectIconId = String(nextNodeId++);
              selectIcon = { type: 'select', content: icon.content.left };
              selectIcon.one = icon.id;
              items[selectIconId] = selectIcon;

              for (const itemDir of firstIconsForLink) {
                itemDir.item[itemDir.dir] = selectIconId;
              }
            }

            icon.type = 'case';
            icon.content = icon.content.right;
          }

          if (element.no && element.no.length > 0) {
            iconsForLink.push(...processObjects(items, element.no, [{ item: iconTwo, dir: "two" }]));
          } else {
            iconsForLink.push({ item: iconTwo, dir: "two" });
          }

          if (element.yes && element.yes.length > 0) {
            iconsForLink.push(...processObjects(items, element.yes, [{ item: iconOne, dir: "one" }]));
          } else {
            iconsForLink.push({ item: iconOne, dir: "one" });
          }
        }

        processQuestionContent(icon);
      }

      if (!objectsForProcessing || objectsForProcessing.length === 0) {
      } else if (isArray(objectsForProcessing)) {
        for (const element of objectsForProcessing) {
          iconsForLink = processObjects(items, element, iconsForLink);
        }
      } else if (isObject(objectsForProcessing)) {
        let element = objectsForProcessing;
        if (element.type === "address") {
          processAddress(element);
        } else if (element.type === "loop") {
          processLopp(element);
        } else {
          let newIcon = addIcon(element);
          iconsForLink = linkIcon(newIcon);

          if (element.type === "question") {
            processQuestion(newIcon, element);
          }
        }
      }

      return iconsForLink;
    }

    function exit(iconsForLink) {
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

      for (const itemDir of iconsForLink) {
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

    const iconsForLink = processBranches();
    exit(iconsForLink);

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
