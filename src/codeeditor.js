const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
    const language = await vscode.window.showQuickPick(['cpp', 'py', 'java', 'js'], {
        placeHolder: 'Select your programming language',
    });

    if (!language) {
        vscode.window.showErrorMessage('No language selected!');
        return;
    }

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
    if (!workspacePath) {
        vscode.window.showErrorMessage('Open a workspace folder to create a solution file.');
        return;
    }

    const fileName = `solution.${language}`;
    const filePath = path.join(workspacePath, fileName);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
    }

    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    await vscode.window.showTextDocument(document);
};
