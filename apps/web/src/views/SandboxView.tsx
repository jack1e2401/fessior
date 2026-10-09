import { useState } from 'react';
import { CodeEditorPane } from '../components/editor/CodeEditorPane';
import { ConsolePane } from '../components/editor/ConsolePane';

export function SandboxView() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('print("Hello, world!")');
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-linen">
      <header><h1 className="m-0 font-display text-2xl font-bold">Sandbox</h1><p className="mb-0 mt-1 text-sm text-stone">Chạy code độc lập với testcase tự nhập trong môi trường chấm.</p></header>
      <CodeEditorPane className="h-[min(56vh,620px)] min-h-[360px]" code={code} onCodeChange={setCode} language={language} onLanguageChange={setLanguage} />
      <ConsolePane problem={null} code={code} language={language} onSubmit={() => undefined} isSubmitting={false} verdict="" showSubmit={false} showSampleTests />
    </section>
  );
}
