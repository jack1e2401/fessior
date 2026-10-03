import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';


// Wrapper for white card content
export const AdminCard = ({ children, className = '', flex1 }: { children: ReactNode, className?: string, flex1?: boolean }) => (
  <div className={`bg-washi border border-charcoal rounded-xl p-6 shadow-lg flex flex-col gap-5 ${flex1 ? 'flex-1' : ''} ${className}`}>
    {children}
  </div>
);

// Header for card
export const AdminHeader = ({ children, rightNode }: { children: ReactNode, rightNode?: ReactNode }) => (
  <div className="flex items-center justify-between pb-3 border-b border-charcoal mb-1">
    <h3 className="font-display text-lg font-bold text-linen m-0">{children}</h3>
    {rightNode && <div>{rightNode}</div>}
  </div>
);

// Form element wrapper
export const AdminFormGroup = ({ label, children, className = '' }: { label: ReactNode, children: ReactNode, className?: string }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <label className="text-xs font-semibold text-stone flex items-center gap-1.5 font-display uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

// Common Input style
export const AdminInput = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`bg-ink border border-charcoal text-linen rounded-xl px-4 py-3 text-sm w-full outline-none focus:border-vermilion focus:ring-1 focus:ring-vermilion transition-all ${className}`}
  />
);

export const AdminTextarea = ({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`bg-ink border border-charcoal text-linen rounded-xl px-4 py-3 text-sm w-full outline-none focus:border-vermilion focus:ring-1 focus:ring-vermilion transition-all resize-y ${className}`}
  />
);

export const AdminSelect = ({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={`bg-ink border border-charcoal text-linen rounded-xl px-4 py-3 text-sm w-full outline-none focus:border-vermilion focus:ring-1 focus:ring-vermilion transition-all appearance-none pr-10 ${className}`}
    style={{
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 14px center',
      backgroundSize: '16px'
    }}
  />
);

// Common Button styles
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon-edit' | 'icon-delete' | 'icon-warning';
interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const AdminButton = ({ variant = 'primary', className = '', children, ...props }: AdminButtonProps) => {
  let baseClass = 'font-display flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ';
  
  if (variant === 'primary') {
    baseClass += 'bg-vermilion hover:bg-vermilion-hover text-linen text-sm font-bold px-5 py-3 rounded-xl shadow-md hover:-translate-y-[1px] hover:shadow-lg active:translate-y-0 ';
  } else if (variant === 'secondary') {
    baseClass += 'bg-washi border border-charcoal text-stone hover:bg-ink hover:text-linen text-sm font-semibold px-5 py-3 rounded-xl ';
  } else if (variant === 'danger') {
    baseClass += 'bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-md ';
  } else if (variant.startsWith('icon-')) {
    baseClass = 'w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors duration-200 border ';
    if (variant === 'icon-edit') baseClass += 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300 ';
    if (variant === 'icon-delete') baseClass += 'bg-vermilion/10 text-vermilion border-vermilion/20 hover:bg-vermilion/20 hover:text-red-400 ';
    if (variant === 'icon-warning') baseClass += 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 hover:text-yellow-400 ';
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const AdminListRow = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`bg-washi border border-charcoal rounded-xl px-4 py-3.5 flex justify-between items-center transition-colors duration-200 hover:border-vermilion/50 hover:bg-charcoal/20 ${className}`}>
    {children}
  </div>
);

export const AdminBadge = ({ children, color = 'gray', className = '' }: { children: ReactNode, color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'pink', className?: string }) => {
  const colorMap = {
    green: 'bg-green-500/15 text-green-500',
    yellow: 'bg-yellow-500/15 text-yellow-500',
    red: 'bg-red-500/15 text-red-500',
    blue: 'bg-blue-500/15 text-blue-400',
    gray: 'bg-ink border border-charcoal text-stone',
    pink: 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
  };
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-xl w-fit font-display tracking-wider uppercase inline-flex items-center gap-1.5 ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
};
