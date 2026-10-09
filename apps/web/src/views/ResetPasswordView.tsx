import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { authRepository } from '../app/api/client';
import { checkPasswordStrength } from '../lib/validators';
import { parseErrorMessage } from '../lib/utils';
import { AnimeStaggerVisual } from '../features/auth/AnimeStaggerVisual';

export function ResetPasswordView() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) window.history.replaceState({}, '', '/auth/reset-password');
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!token) return setError('Liên kết khôi phục không hợp lệ hoặc đã hết hạn.');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
    const strength = checkPasswordStrength(password);
    if (!strength.isStrong) return setError(`Mật khẩu chưa đủ mạnh: ${strength.feedback.join(' ')}`);
    setLoading(true);
    try {
      const result = await authRepository.resetPassword({ token, password });
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
          <KeyRound size={24} className="mb-4 text-vermilion" />
          <h1 className="mb-2 font-display text-2xl font-bold uppercase text-linen">Đặt mật khẩu mới</h1>
          <p className="mb-7 text-sm text-stone">Liên kết chỉ dùng được một lần và hết hạn sau 30 phút.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-stone">Mật khẩu mới</span>
              <input required type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded border border-charcoal bg-ink px-3 text-sm text-linen outline-none focus:border-vermilion" />
            </label>
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-stone">Nhập lại mật khẩu</span>
              <input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded border border-charcoal bg-ink px-3 text-sm text-linen outline-none focus:border-vermilion" />
            </label>
            {message && <p role="status" className="border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
            {error && <p role="alert" className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button disabled={loading || Boolean(message)} className="h-11 w-full rounded bg-vermilion text-sm font-bold text-[#17130b] hover:bg-vermilion-hover disabled:opacity-60">{loading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}</button>
          </form>
          <Link to="/auth" className="mt-6 inline-flex items-center gap-2 text-sm text-stone hover:text-linen"><ArrowLeft size={15} /> Quay lại đăng nhập</Link>
        </section>
      </main>
    </div>
  );
}
