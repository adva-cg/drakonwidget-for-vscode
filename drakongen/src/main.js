#!/usr/bin/env node

const {toTree, toPseudocode} = require("./index")

const fs = require('fs').promises;
const path = require('path');

// Display usage summary
function displayUsage() {
    console.log(`Usage:
    drakongen <path>                      Read from <path> and output to standard output
    drakongen --language <lang> <path>    Read from <path> and output to standard output, use the provided language
    drakongen --tree <path>               Read from <path> and output to standard output, use the JSON-tree format
    drakongen --output <output folder> <path> 
                                      Read from <path> and write to <output folder>
    drakongen                             Display this usage summary.`);
}



// Main logic
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        displayUsage();
        return;
    }

    let options = {
        language: "en",
        json: false,
        output: null,
        tree: false
    };
    let targetPath = null;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--language':
                options.language = args[++i];
                break;
            case '--tree':
                options.tree = true;
                break;                
            case '--output':
                options.output = args[++i];
                break;
            default:
                if (!targetPath) {
                    targetPath = args[i];
                }
        }
    }

    if (!targetPath) {
        displayUsage();
        return;
    }

    try {
        const stats = await fs.lstat(targetPath);

        if (stats.isDirectory()) {
            await generate(targetPath, options);
        } else {
            await generateOne(targetPath, options);
        }
    } catch (err) {
        console.error(`${err.message}`);
        console.error(`Filename: ${err.filename}`);
        console.error(`Node id: ${err.nodeId}`);
        process.exit(1);
    }
}

async function getDrakonFiles(dirPath) {    
    // Read all entries in the directory
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    // Filter files that are regular files and have a .txt extension, then map to full paths
    const txtFiles = files
        .filter(file => file.isFile() && path.extname(file.name) === '.drakon')
        .map(file => path.join(dirPath, file.name));

    return txtFiles;
}

// Placeholder functions (not implemented)
async function generate(folderPath, options) {
    var files = await getDrakonFiles(folderPath)
    var output
    if (options.tree) {
        var obj = {procedures:[]}
        for (var file of files) {
            var json = await convertToTree(file, options)
            obj.procedures.push(json)
        }     
        output = JSON.stringify(obj, null, 4)   
    } else {
        output = ""
        for (var file of files) {
            var pseudo = await convertToPseudo(file, options)
            output += (pseudo + "\n\n\n")
        }
    }
    await writeOut(output, folderPath, options.output)
}

async function generateOne(filePath, options) {
    var output
    if (options.tree) {
        var json = await convertToTree(filePath, options)
        output = JSON.stringify(json, null, 4)   
    } else {
        output = await convertToPseudo(filePath, options)
    }
    await writeOut(output, filePath, options.output)
}

async function writeOut(content, inputPath, outputFolder) {
    if (outputFolder) {
        var pname = path.parse(inputPath)
        var fullName = path.join(outputFolder, pname.name + ".txt")
        await fs.writeFile(fullName, content, 'utf8');
    } else {
        console.log(content)
    }
}

async function convertToTree(filePath, options) {
    // Read the content of the file with UTF-8 encoding
    const content = await fs.readFile(filePath, 'utf8');

    var pname = path.parse(filePath)
    const name = pname.name    
    var result = toTree(content, name, filePath, options.language)
    return JSON.parse(result)
}


async function convertToPseudo(filePath, options) {
    // Read the content of the file with UTF-8 encoding
    const content = await fs.readFile(filePath, 'utf8');

    var pname = path.parse(filePath)
    const name = pname.name    
    const result = toPseudocode(content, name, filePath, options.language);
    return result
}



// Entry point
main();


