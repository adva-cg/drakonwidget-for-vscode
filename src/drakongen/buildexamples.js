const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

// Path to the folder containing the .drakon files
const examplesFolder = path.join(__dirname, 'examples');

// Function to execute a command with a file
async function executeCommand(filePath) {
    return new Promise((resolve, reject) => {
        const process = spawn('node', ['src/main.js', "--output", examplesFolder, filePath]);

        // Handle stdout
        process.stdout.on('data', data => {
            console.log(`Output for ${path.basename(filePath)}: ${data}`);
        });

        // Handle stderr
        process.stderr.on('data', data => {
            console.error(`Error for ${path.basename(filePath)}: ${data}`);
        });

        // Handle process close
        process.on('close', code => {
            if (code === 0) {
                resolve(`Success: ${filePath}`);
            } else {
                reject(new Error(`Process failed for ${filePath} with exit code ${code}`));
            }
        });
    });
}

// Main function to process .drakon files
async function processDrakonFiles() {
    try {
        // Read all files in the folder
        const files = await fs.readdir(examplesFolder);

        // Filter for .drakon files
        const drakonFiles = files.filter(file => file.endsWith('.drakon'));

        // Process each .drakon file
        for (const file of drakonFiles) {
            const filePath = path.join(examplesFolder, file);
            try {
                await executeCommand(filePath);
                console.log(`Processed file: ${file}`);
            } catch (error) {
                console.error(`Error processing file ${file}: ${error.message}`);
            }
        }

        console.log('All files processed.');
    } catch (err) {
        console.error('Error reading the examples folder:', err.message);
    }
}

// Run the function
processDrakonFiles();
