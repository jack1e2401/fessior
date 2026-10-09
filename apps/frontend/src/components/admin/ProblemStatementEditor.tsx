import { useRef, useState, type MouseEvent } from 'react';
import { Bold, Code2, Heading2, List, Eye, Pencil } from 'lucide-react';
import { applyStatementFormat, type StatementFormat } from '../../lib/statementMarkdown';
import { renderMarkdownToHtml } from '../../lib/utils';

interface ProblemStatementEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const toolbarActions: Array<{ format: StatementFormat; label: string; icon: typeof Heading2 }> = [
  { format: 'heading', label: 'Tiêu đề', icon: Heading2 },
  { format: 'bold', label: 'In đậm', icon: Bold },
  { format: 'inlineCode', label: 'Mã dòng', icon: Code2 },
  { format: 'bullets', label: 'Danh sách', icon: List },
  { format: 'codeBlock', label: 'Khối mã', icon: Code2 },
];

export function ProblemStatementEditor({ value, onChange }: ProblemStatementEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function formatStatement(event: MouseEvent<HTMLButtonElement>, format: StatementFormat) {
    event.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) return;
    const formatted = applyStatementFormat(value, textarea.selectionStart, textarea.selectionEnd, format);
    onChange(formatted.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(formatted.selectionStart, formatted.selectionEnd);
    });
  }

  return (
    <div className="overflow-hidden rounded-md border border-charcoal bg-ink">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal px-3 py-2">
        <div className="flex flex-wrap gap-1" aria-label="Định dạng statement">
          {toolbarActions.map(({ format, label, icon: Icon }) => <button
            key={format}
            type="button"
            title={label}
            aria-label={label}
            onClick={(event) => formatStatement(event, format)}
            className="border border-transparent p-2 text-stone transition-colors hover:border-charcoal hover:text-linen focus-visible:outline focus-visible:outline-2 focus-visible:outline-vermilion"
          ><Icon size={15} /></button>)}
        </div>
        <div className="flex gap-1" role="group" aria-label="Chế độ statement">
          <button type="button" onClick={() => setPreview(false)} aria-pressed={!preview} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs ${!preview ? 'bg-charcoal text-linen' : 'text-stone hover:text-linen'}`}><Pencil size={13} /> Viết</button>
          <button type="button" onClick={() => setPreview(true)} aria-pressed={preview} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs ${preview ? 'bg-charcoal text-linen' : 'text-stone hover:text-linen'}`}><Eye size={13} /> Xem trước</button>
        </div>
      </div>
      {preview ? <div
        className="min-h-[340px] space-y-3 overflow-auto px-5 py-4 text-sm leading-7 text-linen [&_code]:rounded [&_code]:bg-charcoal [&_code]:px-1 [&_code]:py-0.5 [&_h1]:font-display [&_h1]:text-2xl [&_h2]:font-display [&_h2]:text-xl [&_h3]:font-display [&_h3]:text-lg [&_li]:ml-5 [&_li]:list-disc [&_pre]:overflow-auto [&_pre]:rounded [&_pre]:bg-charcoal [&_pre]:p-4 [&_p]:my-2 [&_ul]:my-2"
        aria-label="Xem trước statement"
        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(value) }}
      /> : <textarea
        ref={textareaRef}
        required
        rows={15}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[340px] w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-6 text-linen outline-none placeholder:text-stone/70 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-vermilion"
        placeholder={'## Description\nExplain the problem here.\n\n## Input\nDescribe the input format.'}
      />}
    </div>
  );
}
