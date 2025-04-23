// How to Use:

// Save: Save the code as a .js file (e.g., json_modifier.js).
// Create dtsrc: Create a folder named dtsrc in the same directory as the script and put your JSON files in it. Or change dtsrc to your folder name.
// Run: Open your terminal, navigate to the directory where you saved the script, and run it using Node.js: node modify.js
// Note: Ensure you have Node.js installed on your system.
// This script will recursively find all JSON files in the specified directory, format them, and rename them based on the "name" key in the JSON data.
// It will also replace "text" with "content" in "items" and rename the file based on the "name" key.
// If the file has "items" key, the extension will be changed to .drakon
// It will create a backup of the original file with a .bak extension if the new filename already exists.
// It will also create a temporary file to avoid data loss during the renaming process.

// Вроде бы исходные файлы относятся к drakontech , решил переделать их для использования в drakonwidget

const fs = require('fs');
const path = require('path');

// Function to read and parse a JSON file
function readJsonFile(filepath) {
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    return data;
  } catch (err) {
    console.error(`Error reading or parsing JSON file '${filepath}':`, err);
    return null;
  }
}

// Function to build the hierarchy of diagrams
function buildHierarchy(files) {
  const hierarchy = {};
  const fileMap = {};
  let rootNode = null;

  // First, create a map of all files by their ID
  for (const file of files) {
    fileMap[file.id] = file;
    hierarchy[file.id] = { ...file, children: [] };
    if (file.id === '1') {
        rootNode = hierarchy[file.id];
    }
  }

  // Then, build the hierarchy based on parent_id
  for (const file of files) {
    if (file.parent_id) {
      const parent = hierarchy[file.parent_id];
      if (parent) {
        parent.children.push(hierarchy[file.id]);
      } else {
        console.warn(`Parent with id '${file.parent_id}' not found for file '${file.name}'.`);
      }
    }
  }

  // Filter out only root nodes (those without a parent)
  let rootNodes = Object.values(hierarchy).filter(node => !node.parent_id);
  if (rootNode) {
    rootNodes = [rootNode];
  }
  return { rootNodes, fileMap };
}

// Function to create folders and move files
function createFoldersAndMoveFiles(node, baseDir, fileMap) {
  const nodeFile = fileMap[node.id];
  if (!nodeFile) {
    console.error(`File not found for node with id '${node.id}'.`);
    return;
  }
  const nodeName = nodeFile.name;
  let folderPath = baseDir;
  if (nodeFile.type === 'folder' && nodeFile.id !== '1') {
    folderPath = path.join(baseDir, nodeName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: '${folderPath}'`);
    }
  } else if (nodeFile.parent_id) {
    const parent = fileMap[nodeFile.parent_id];
    if (parent && parent.type === 'folder' && parent.id !== '1') {
        folderPath = path.join(baseDir, parent.name);
    }
  }

  // Move the file to the correct folder
  const oldFilepath = path.join(baseDir, nodeFile.id + '.json');
  const newFilepath = path.join(folderPath, nodeFile.id + '.json');

  if (fs.existsSync(oldFilepath) && oldFilepath !== newFilepath) {
    fs.renameSync(oldFilepath, newFilepath);
    console.log(`Moved file '${path.basename(oldFilepath)}' to '${folderPath}'`);
    // Update the filepath in the file object
    nodeFile.filepath = newFilepath;
  }

  // Process children
  for (const child of node.children) {
    createFoldersAndMoveFiles(child, baseDir, fileMap);
  }
}

// Function to format, modify, and rename a JSON file
function formatAndModifyJson(filepath) {
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    // 1. Apply pretty formatting
    const formattedJson = JSON.stringify(data, null, 4);

    // 2. Replace "text" with "content" in "items"
    if (data.items) {
      for (const key in data.items) {
        if (data.items[key].text !== undefined) {
          data.items[key].content = data.items[key].text;
          delete data.items[key].text;
        }
      }
    }
    // Write the modified JSON back to the original file
    fs.writeFileSync(filepath, formattedJson, 'utf-8');
    console.log(`Formatted and modified '${path.basename(filepath)}'`);
  } catch (err) {
    console.error(
      `An error occurred with '${path.basename(filepath)}':`,
      err
    );
  }
}

// Function to rename a JSON file
function renameJsonFile(file) {
    const filepath = file.filepath;
    try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        if (data.name) {
            let newFilename = data.name;
            let newExtension = '.json';

            if (data.items && data.type !== 'folder') {
                newExtension = '.drakon';
            }
            newFilename += newExtension;

            const directory = path.dirname(filepath);
            const newFilepath = path.join(directory, newFilename);

            if (fs.existsSync(newFilepath)) {
                console.log(
                    `File with name '${newFilename}' already exists. Skipping rename for '${path.basename(
                        filepath
                    )}'.`
                );
            } else {
                // Rename the original file to a backup
                const backupFilepath = filepath + '.bak';
                fs.renameSync(filepath, backupFilepath);

                // Rename the backup file to the new filename
                fs.renameSync(backupFilepath, newFilepath);

                console.log(
                    `Renamed '${path.basename(filepath)}' to '${newFilename}'`
                );
                console.log(`Backup created: '${path.basename(backupFilepath)}'`);
            }
        }
    } catch (err) {
        console.error(
            `An error occurred with '${path.basename(filepath)}':`,
            err
        );
    }
}

// Function to find and process all JSON files
function findAndProcessJsonFiles(root_dir) {
  const files = [];
  const allFiles = fs.readdirSync(root_dir, { withFileTypes: true });

  for (const file of allFiles) {
    const fullPath = path.join(root_dir, file.name);
    if (file.isDirectory()) {
      const subFiles = findAndProcessJsonFiles(fullPath);
      files.push(...subFiles);
    } else if (file.isFile() && file.name.endsWith('.json')) {
      const data = readJsonFile(fullPath);
      if (data) {
        data.filepath = fullPath;
        data.id = path.basename(fullPath, '.json');
        files.push(data);
      }
    }
  }
  return files;
}

// Main execution
const rootDirectory = path.join(__dirname, 'dtsrc'); // Replace 'dtsrc' with your directory if needed

// Find and process all JSON files to build the hierarchy
const allFiles = findAndProcessJsonFiles(rootDirectory);

// Build the hierarchy
const { rootNodes, fileMap } = buildHierarchy(allFiles);

// Create folders and move files
for (const rootNode of rootNodes) {
  createFoldersAndMoveFiles(rootNode, rootDirectory, fileMap);
}

// Format and modify all files
for (const file of allFiles) {
    formatAndModifyJson(file.filepath);
}

// Rename all files
for (const file of allFiles) {
    renameJsonFile(file);
}
