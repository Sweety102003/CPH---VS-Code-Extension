const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(`Error: ${stderr}`);
            } else {
                resolve(stdout ? stdout.trim() : "");
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


    const gppPath = "C:/MinGW/bin/g++.exe";
    const cleanupExecutable = () => {
        if (fs.existsSync("solution.exe")) {
            fs.unlinkSync("solution.exe");
        }
    };
    let allSavedCasesPassed = true;

    for (const inputFile of testCaseFiles) {
        const inputPath = path.join(testCaseFolder, inputFile);
        const outputPath = path.join(testCaseFolder, `output_${inputFile.split('_')[1]}`);
        const expectedOutput = fs.readFileSync(outputPath, 'utf-8').trim();

        let command;

        switch (language) {
            case 'cpp':

                command = `"${gppPath}" "${solutionFile}" -o "solution.exe" && "solution.exe" < "${inputPath}"`;
                break;
            case 'py':
                command = `python "${solutionFile}" < "${inputPath}"`;
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

            const stdout = await executeCommand(command);

            // Check if the output matches the expected output
            if (stdout === expectedOutput) {
                vscode.window.showInformationMessage(`Test case ${inputFile} passed!`);
            } else {
                vscode.window.showErrorMessage(`Test case ${inputFile} failed. Expected: ${expectedOutput}, Got: ${stdout}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(error);

            allSavedCasesPassed = false;
        }
    }

    const manualTestCase = await vscode.window.showInputBox({
        prompt: 'Enter your test case input (leave empty to use saved test cases)',
        placeHolder: '',
    });

    if (manualTestCase) {
        let command;

        switch (language) {
            case 'cpp':
                command = `"${gppPath}" "${solutionFile}" -o "solution.exe" && echo "${manualTestCase}" | "solution.exe"`;
                break;
            case 'py':
                command = `echo "${manualTestCase}" | python "${solutionFile}"`;
                break;
            case 'java':
                command = `echo "${manualTestCase}" | java Solution`;
                break;
            case 'js':
                command = `echo "${manualTestCase}" | node "${solutionFile}"`;
                break;
            default:
                vscode.window.showErrorMessage('Unsupported language');
                return;
        }

        try {
            const stdout = await executeCommand(command);
            vscode.window.showInformationMessage(`Manual Test Case Output:\n${stdout}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error running manual test case: ${error}`);
        }
    } else if (allSavedCasesPassed) {
        vscode.window.showInformationMessage('All saved test cases passed, and no manual input was provided.');
    }



    cleanupExecutable();


};