'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TextDocument, TextLine } from 'vscode';

interface Test {
  lineText: TextLine;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "jasmine-test-selector" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'extension.jumpToTest',
    () => {
      // The code you place here will be executed every time your command is executed

      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      getTests(editor.document).then(async tests => {
        console.log('Found tests:', tests);
        const arr: vscode.QuickPickItem[] = tests.map(test => {
          return {
            label: test.lineText.text,
            detail: `Line number: ${test.lineText.lineNumber + 1}`
          };
        });

        const selection = await vscode.window.showQuickPick(arr, {
          placeHolder: 'Select a test which should be cursored'
        });

        if (
          !selection ||
          !selection.detail ||
          !selection.detail.split(': ')[1]
        ) {
          console.log(`No valid selection made!`);
          return;
        }

        const lineNumber = selection.detail.split(': ')[1];
        goToLine(Number(lineNumber));
      });
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function goToLine(line: number) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    console.error(`Cannot go to line ${line} as editor is not active`);
    return;
  }
  let range = editor.document.lineAt(line - 1).range;
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range);
}

function getTests(document: TextDocument): Promise<Test[]> {
  // Return a promise, since this might take a while for large documents
  return new Promise<Test[]>((resolve, reject) => {
    let testsToReturn = new Array<Test>();
    let lineCount = document.lineCount;

    for (let lineNumber = 0; lineNumber < lineCount; lineNumber++) {
      let lineText = document.lineAt(lineNumber);
      let tests = lineText.text.match(/(it\(|describe\()/g);
      if (tests) {
        for (let i = 0; i < tests.length; i++) {
          testsToReturn.push({ lineText: lineText });
        }
      }
    }
    if (testsToReturn.length > 0) {
      resolve(testsToReturn);
    } else {
      reject('Found no tests');
    }
  }).catch();
}
