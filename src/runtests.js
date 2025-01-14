const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute command and return a Promise
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

module.exports = async () => {
    const language = await vscode.window.showQuickPick(['cpp', 'py', 'java', 'js'], {
        placeHolder: 'Select the language of your solution',
    });

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
    if (!workspacePath) {
        vscode.window.showErrorMessage('Open a workspace folder to run test cases.');
        return;
    }

    const testCaseFolder = path.join(workspacePath, 'TestCases');
    const solutionFile = path.join(workspacePath, `solution.${language}`);
    const testCaseFiles = fs.readdirSync(testCaseFolder).filter(file => file.startsWith('input_'));

    // Correct path for MinGW (or other compilers)
    const gppPath = "C:/MinGW/bin/g++.exe";

    // Loop through test cases asynchronously
    for (const inputFile of testCaseFiles) {
        const inputPath = path.join(testCaseFolder, inputFile);
        const outputPath = path.join(testCaseFolder, `output_${inputFile.split('_')[1]}`);
        const expectedOutput = fs.readFileSync(outputPath, 'utf-8').trim();

        let command;

        switch (language) {
            case 'cpp':
                // Fixing the C++ command
                command = `"${gppPath}" "${solutionFile}" -o "solution.exe" && "solution.exe" < "${inputPath}"`;
                break;
            case 'py':
                command = `python3 "${solutionFile}" < "${inputPath}"`;
                break;
            case 'java':
                command = `javac "${solutionFile}" && java Solution < "${inputPath}"`;
                break;
            case 'js':
                command = `node "${solutionFile}" < "${inputPath}"`;
                break;
            default:
                vscode.window.showErrorMessage('Unsupported language');
                return;
        }

        try {
            // Wait for the command to finish before running the next one
            const stdout = await executeCommand(command);

            // Check if the output matches the expected output
            if (stdout === expectedOutput) {
                vscode.window.showInformationMessage(`Test case ${inputFile} passed!`);
            } else {
                vscode.window.showErrorMessage(`Test case ${inputFile} failed. Expected: ${expectedOutput}, Got: ${stdout}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(error); // Handle errors if exec fails
        }
    }
};
