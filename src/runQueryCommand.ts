import vscode from 'vscode';
import { Client, errors } from 'faunadb';
import { runFQLQuery, formatFQLCode } from './fql';

export default (
  client: Client,
  outputChannel: vscode.OutputChannel
) => async () => {
  const { activeTextEditor } = vscode.window;

  if (!activeTextEditor || activeTextEditor.document.languageId !== 'fql') {
    vscode.window.showWarningMessage(
      'You have to select a FQL document to run a FQL query.'
    );
    return;
  }

  const selection = activeTextEditor.selection;
  const selectedText = activeTextEditor.document.getText(selection);
  const fqlExpression =
    selectedText.length > 0
      ? selectedText
      : activeTextEditor.document.getText();
  if (fqlExpression.length < 1) {
    vscode.window.showWarningMessage(
      'Selected file or selected text must have a FQL query to run'
    );

    return;
  }

  outputChannel.appendLine('');
  outputChannel.appendLine(`RUNNING: ${fqlExpression}`);
  outputChannel.show();

  try {
    const result = await runFQLQuery(fqlExpression, client);
    const formattedCode = formatFQLCode(result);
    outputChannel.appendLine(formattedCode);
  } catch (error) {
    let message = error.message;

    //@ts-ignore
    if (error instanceof errors.FaunaHTTPError) {
      message = JSON.stringify(error.errors(), null, 2);
    }

    outputChannel.appendLine('ERROR:');
    outputChannel.appendLine(message);
  }
};

function truncate(text: string, n: number) {
  return text.length > n ? text.substr(0, n - 1) + '...' : text;
}
