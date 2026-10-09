import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface NearFullModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function NearFullModal({ title, subtitle, onClose, children }: NearFullModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-[min(90dvh,1000px)] w-[min(96vw,1500px)] flex-col overflow-hidden border border-charcoal bg-ink shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-charcoal bg-washi px-5 py-4 sm:px-7">
          <div>
            <h2 className="m-0 font-display text-lg font-bold text-linen">{title}</h2>
            {subtitle && <p className="mb-0 mt-1 text-xs text-stone">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="grid h-10 w-10 place-items-center border border-charcoal text-stone transition-colors hover:border-vermilion hover:text-linen"
          >
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
