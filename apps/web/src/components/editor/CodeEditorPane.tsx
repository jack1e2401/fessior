import React from 'react';
import { ScreenShare, ChevronDown } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';

/* =====================================================
   CodeEditorPane — Ink & Vermillion
   Props unchanged: { code, onChange, language, onLanguageChange }
   ===================================================== */

interface CodeEditorPaneProps {
  code: string;
  onCodeChange: (value: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  code,
  onCodeChange,
  language,
  onLanguageChange,
}) => {
  const [shareActive, setShareActive] = React.useState(false);

  const getExtension = () => {
    if (language === 'python') return 'py';
    if (language === 'cpp') return 'cpp';
    if (language === 'java') return 'java';
    return 'js';
  };

  const getMonacoLanguage = () => {
    if (language === 'cpp') return 'cpp';
    if (language === 'java') return 'java';
    if (language === 'python') return 'python';
    return 'javascript';
  };

  const handleEditorDidMount = (_editor: any, monaco: Monaco) => {
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: word.startColumn, endColumn: word.endColumn,
        };
        const suggestions = [
          { label: 'vector', kind: monaco.languages.CompletionItemKind.Class, insertText: 'vector<${1:int}> ', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'std::vector', range },
          { label: 'unordered_map', kind: monaco.languages.CompletionItemKind.Class, insertText: 'unordered_map<${1:int}, ${2:int}> ', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'std::unordered_map', range },
          { label: 'unordered_set', kind: monaco.languages.CompletionItemKind.Class, insertText: 'unordered_set<${1:int}> ', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'std::unordered_set', range },
          { label: 'sort', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sort(${1:v}.begin(), ${1:v}.end());', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'std::sort', range },
          { label: 'push_back', kind: monaco.languages.CompletionItemKind.Method, insertText: 'push_back(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'pair', kind: monaco.languages.CompletionItemKind.Class, insertText: 'pair<${1:int}, ${2:int}> ', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
        ];
        return { suggestions };
      },
    });
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const suggestions = [
          { label: 'defaultdict', kind: monaco.languages.CompletionItemKind.Class, insertText: 'defaultdict(${1:list})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'collections.defaultdict', range },
          { label: 'Counter', kind: monaco.languages.CompletionItemKind.Class, insertText: 'Counter(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'collections.Counter', range },
          { label: 'heappush', kind: monaco.languages.CompletionItemKind.Function, insertText: 'heapq.heappush(${1:heap}, ${2:item})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'heapq.heappush', range },
          { label: 'heappop', kind: monaco.languages.CompletionItemKind.Function, insertText: 'heapq.heappop(${1:heap})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: 'heapq.heappop', range },
          { label: 'bisect_left', kind: monaco.languages.CompletionItemKind.Function, insertText: 'bisect.bisect_left(${1:a}, ${2:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
        ];
        return { suggestions };
      },
    });
    monaco.languages.registerCompletionItemProvider('java', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const suggestions = [
          { label: 'ArrayList', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ArrayList<${1:Integer}> ${2:list} = new ArrayList<>();', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'HashMap', kind: monaco.languages.CompletionItemKind.Class, insertText: 'HashMap<${1:Integer}, ${2:Integer}> ${3:map} = new HashMap<>();', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'HashSet', kind: monaco.languages.CompletionItemKind.Class, insertText: 'HashSet<${1:Integer}> ${2:set} = new HashSet<>();', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
          { label: 'PriorityQueue', kind: monaco.languages.CompletionItemKind.Class, insertText: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
        ];
        return { suggestions };
      },
    });
  };

  return (
    <div className="flex flex-col h-[480px] bg-ink border border-charcoal overflow-hidden">
      {/* ── Header ── */}
      <div className="h-12 bg-washi border-b border-charcoal flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 bg-charcoal/20 border-x border-t border-charcoal rounded-t-xl px-4 py-1.5 h-full">
          <div className="w-1.5 h-1.5 rounded-full bg-vermilion" />
          <span className="font-mono text-xs font-medium text-linen">
            solution.{getExtension()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${shareActive ? 'border-vermilion/30 text-vermilion' : 'border-charcoal text-stone hover:text-linen hover:border-stone'
              }`}
            onClick={() => setShareActive(!shareActive)}
          >
            <ScreenShare size={14} />
            <span>{shareActive ? 'Sharing' : 'Share'}</span>
          </button>

          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="appearance-none bg-charcoal/30 border border-charcoal text-linen text-xs px-2.5 py-1.5 pr-7 outline-none cursor-pointer focus:border-vermilion transition-colors"
            >
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Editor Body ── */}
      <div className="flex-1 w-full bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={getMonacoLanguage()}
          value={code}
          onChange={(val) => onCodeChange(val || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            automaticLayout: true,
            scrollbar: { vertical: 'visible', horizontal: 'visible' },
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
};
