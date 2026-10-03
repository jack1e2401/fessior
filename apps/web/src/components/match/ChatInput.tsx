import React, { useState } from 'react';
import { Send } from 'lucide-react';

/* =====================================================
   ChatInput — Ink & Vermillion
   Props unchanged: { onSendMessage }
   ===================================================== */

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSendMessage(value);
    setValue('');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[480px] mx-auto gap-3">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center bg-washi border border-charcoal py-1.5 pl-4 pr-1.5 focus-within:border-vermilion transition-colors">
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none font-body text-sm text-linen placeholder-stone"
            placeholder="Bạn muốn tìm hiểu về gì?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            type="submit"
            aria-label="Send"
            className="w-9 h-9 flex items-center justify-center bg-vermilion text-linen hover:bg-vermilion-hover transition-colors cursor-pointer shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
      <p className="font-body text-[11px] text-stone text-center">
        Mẹo: Hãy chuẩn bị tinh thần thép trước khi bước vào trận đấu.
      </p>
    </div>
  );
};
