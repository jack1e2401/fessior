import { Spin } from 'antd';

/* =====================================================
   LoadingScreen — Full-page loading with Vermilion spinner
   Ink background. AntD Spin is theme-overridden via ConfigProvider.
   ===================================================== */

export function LoadingScreen(props: { label?: string }) {
  return (
    <div className="min-h-screen w-full bg-ink text-linen font-body">
      <div className="mx-auto flex min-h-screen w-full max-w-[960px] flex-col items-center justify-center gap-5 px-8 py-10">
        <Spin size="large" />
        <div className="font-body text-sm text-stone">{props.label ?? 'Đang tải…'}</div>
      </div>
    </div>
  );
}
