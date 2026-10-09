import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { authRepository } from '../app/api/client';
import { parseErrorMessage } from '../lib/utils';
import { AnimeStaggerVisual } from '../features/auth/AnimeStaggerVisual';

export function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await authRepository.requestPasswordReset(email.trim());
      setMessage(result.message);
    } catch (cause) {
      setError(parseErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#242322] text-linen font-body lg:h-[100dvh] lg:overflow-hidden">
      <AnimeStaggerVisual />
      <main className="relative flex flex-1 items-center justify-center overflow-y-auto p-5 sm:p-8 lg:p-12">
        <section className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-washi p-7 shadow-2xl shadow-black/30 sm:p-9">
          <p className="mb-6 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-widest text-vermilion"><span className="h-2 w-2 rounded-full bg-vermilion" />Account recovery</p>
          <Mail size={24} className="mb-4 text-vermilion" />
          <h1 className="mb-2 font-display text-2xl font-bold uppercase text-linen">Quên mật khẩu?</h1>
          <p className="mb-7 text-sm text-stone">Nhập email tài khoản. Nếu tài khoản tồn tại, liên kết khôi phục sẽ được gửi đến email đó.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-stone">Email</span>
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded border border-charcoal bg-ink px-3 text-sm text-linen outline-none focus:border-vermilion" />
            </label>
            {message && <p role="status" className="border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
            {error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button disabled={loading} className="h-11 w-full rounded bg-vermilion text-sm font-bold text-[#17130b] hover:bg-vermilion-hover disabled:opacity-60">{loading ? 'Đang gửi…' : 'Gửi liên kết khôi phục'}</button>
          </form>
          <Link to="/auth" className="mt-6 inline-flex items-center gap-2 text-sm text-stone hover:text-linen"><ArrowLeft size={15} /> Quay lại đăng nhập</Link>
        </section>
      </main>
    </div>
  );
}
