const vscode = require('vscode');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
    const inputUrl = await vscode.window.showInputBox({
        placeHolder: 'Enter the LeetCode Problem URL',
    });

    if (!inputUrl) {
        vscode.window.showErrorMessage('No URL provided!');
        return;
    }

    vscode.window.showInformationMessage('Fetching test cases...');
    try {
        const testCases = await fetchTestCases(inputUrl);

        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
        if (!workspacePath) {
            vscode.window.showErrorMessage('Please open a workspace folder to save test cases.');
            return;
        }

        saveTestCases(testCases, workspacePath);
        vscode.window.showInformationMessage('Test cases fetched and saved successfully!');
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage('Failed to fetch test cases. Check the console for details.');
    }
};

/**
 * Fetches test cases from the given LeetCode problem URL using Puppeteer and Cheerio.
 * @param {string} url
 * @returns {Promise<{ input: string, output: string }[]>}
 */
async function fetchTestCases(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the content to load
    await page.waitForSelector("pre");
    // Get the HTML content of the page
    const pageContent = await page.content();
    // console.log('Page Content:', pageContent);  // Log the content for debugging
// console.log(pageContent);
    // Load the page content into Cheerio to parse it
    const $ = cheerio.load(pageContent);

    // Extract test cases using Cheerio (general selector)
    const testCases = [];
    $('pre').each((index, element) => {
        const preContent = $(element).text().trim();
        if (preContent.includes('Input:')) {
            const input = preContent.split('Input:')[1]?.split('Output:')[0]?.trim();
            // const output = preContent.split('Output:')[1]?.trim();
            const outputMatch = preContent.match(/Output:\s*(\[[^\]]+\])/);
            if (input && outputMatch) {
                const output = outputMatch[1]; 
                testCases.push({ input, output });
            }
        }
    });


    console.log('Test Cases:', testCases); // Log the extracted test cases for debugging

    await browser.close();
    return testCases;
}

/**
 * Saves the test cases to input and output files in the workspace.
 * @param {{ input: string, output: string }[]} testCases
 * @param {string} workspacePath
 */
function saveTestCases(testCases, workspacePath) {
    
    const testCaseFolder = path.join(workspacePath, 'TestCases'); // Specify the TestCases folder

    // Create the folder if it doesn't exist
    if (!fs.existsSync(testCaseFolder)) {
        fs.mkdirSync(testCaseFolder);
    }

    testCases.forEach((testCase, index) => {
        const inputPath = path.join(testCaseFolder, `input_${index + 1}.txt`);
        const outputPath = path.join(testCaseFolder, `output_${index + 1}.txt`);
        fs.writeFileSync(inputPath, testCase.input);
        fs.writeFileSync(outputPath, testCase.output);
    });
}



