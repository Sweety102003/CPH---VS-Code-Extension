const vscode = require('vscode');

const fetchtestcases=require("./src/scraper")
const createCodeEditor=require("./src/codeeditor");
const runTestCases=require("./src/runtests")
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Congratulations, your extension "cph-leetcode" is now active!');
 context.subscriptions.push( 
        vscode.commands.registerCommand('cph-leetcode.fetchTestCases',fetchtestcases),
        vscode.commands.registerCommand('cph-leetcode.createCodeEditor', createCodeEditor),
        vscode.commands.registerCommand('cph-leetcode.runTestCases', runTestCases)
    );
}



function deactivate() {}

module.exports = {
    activate,
    deactivate
};


// https://leetcode.com/problems/two-sum/