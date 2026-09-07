import * as vscode from 'vscode';
import { blockAtPosition, isSupportedDoc } from './mermaidExtract';
import { PreviewPanel } from './previewPanel';
import { fencedBody, localizedBody, MermaidTemplate, TEMPLATES, TemplateCategory } from './templates';

const CATEGORY_ORDER: TemplateCategory[] = ['Core', 'Charts', 'Planning', 'Architecture', 'Other'];

/** QuickPick separator captions — the category ids themselves stay English. */
function categoryLabel(category: TemplateCategory): string {
  switch (category) {
    case 'Core':
      return vscode.l10n.t('Core');
    case 'Charts':
      return vscode.l10n.t('Charts');
    case 'Planning':
      return vscode.l10n.t('Planning');
    case 'Architecture':
      return vscode.l10n.t('Architecture');
    default:
      return vscode.l10n.t('Other');
  }
}

interface TemplateItem extends vscode.QuickPickItem {
  template?: MermaidTemplate;
}

function buildItems(): TemplateItem[] {
  const items: TemplateItem[] = [];
  for (const category of CATEGORY_ORDER) {
    const group = TEMPLATES.filter((t) => t.category === category);
    if (group.length === 0) {
      continue;
    }
    items.push({ label: categoryLabel(category), kind: vscode.QuickPickItemKind.Separator });
    for (const t of group) {
      items.push({
        label: vscode.l10n.t(t.label),
        description: vscode.l10n.t(t.description),
        detail: t.diagramType,
        template: t,
      });
    }
  }
  return items;
}

export function registerInsertTemplateCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand('superMermaid.insertTemplate', async () => {
    const picked = await vscode.window.showQuickPick(buildItems(), {
      placeHolder: vscode.l10n.t('Select a Mermaid template to insert'),
      matchOnDescription: true,
      matchOnDetail: true,
    });
    if (!picked?.template) {
      return;
    }
    const template = picked.template;
    const templateBody = localizedBody(template, vscode.env.language);

    let editor = vscode.window.activeTextEditor;
    if (!editor || !isSupportedDoc(editor.document)) {
      // No suitable target: open a fresh untitled mermaid document.
      const doc = await vscode.workspace.openTextDocument({ language: 'mermaid', content: '' });
      editor = await vscode.window.showTextDocument(doc, { preview: false });
      await editor.insertSnippet(new vscode.SnippetString(templateBody), new vscode.Position(0, 0));
      await PreviewPanel.createOrShow(context, editor.document);
      return;
    }

    const doc = editor.document;
    const cursorLine = editor.selection.active.line;
    // markdown 內、且游標不在既有 mermaid 區塊中 → 包 fence;其他情況插 raw。
    const needFence = doc.languageId === 'markdown' && !blockAtPosition(doc, cursorLine);
    let body = needFence ? fencedBody(templateBody) : templateBody;

    // Insert from column 0 so insertSnippet's auto re-indent can't shift the
    // fence/diagram; if the cursor line already has content, start a new line.
    const lineText = doc.lineAt(cursorLine).text;
    let position = new vscode.Position(cursorLine, 0);
    if (lineText.trim()) {
      position = new vscode.Position(cursorLine, lineText.length);
      body = '\n' + body;
    }
    if (needFence) {
      body = body + '\n';
    }
    await editor.insertSnippet(new vscode.SnippetString(body), position);
    await PreviewPanel.createOrShow(context, doc);
  });
}
