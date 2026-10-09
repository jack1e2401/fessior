import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseErrorMessage } from '../lib/utils';

export function SettingsView() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username ?? '');
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? '');
    setFullName(user?.full_name ?? '');
    setBio(user?.bio ?? '');
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile({
        username: username.trim(),
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
      });
      setSaved(true);
    } catch (cause) {
      setError(parseErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl py-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm text-stone transition-colors hover:text-linen">
        <ArrowLeft size={16} /> Quay lại
      </button>
      <header className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center border border-charcoal bg-washi text-vermilion"><UserRound size={20} /></div>
        <div>
          <p className="m-0 font-display text-xs uppercase tracking-[0.2em] text-vermilion">Tài khoản</p>
          <h1 className="m-0 mt-1 font-display text-3xl font-bold text-linen">Cài đặt cá nhân</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="border border-charcoal bg-washi p-5 sm:p-8">
        <div className="mb-7 border-b border-charcoal pb-5">
          <h2 className="m-0 font-display text-lg font-semibold text-linen">Thông tin hồ sơ</h2>
          <p className="mb-0 mt-1 text-sm text-stone">Cập nhật cách mọi người nhìn thấy bạn trong Fessior.</p>
        </div>

        <label className="mb-5 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone">Username</span>
          <input required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} className="h-11 w-full border border-charcoal bg-ink px-3 text-sm text-linen outline-none transition-colors focus:border-vermilion" />
          <span className="mt-1 block text-xs text-stone">3–30 ký tự; chỉ dùng chữ, số và dấu gạch dưới.</span>
        </label>

        <label className="mb-5 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone">Họ và tên</span>
          <input maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11 w-full border border-charcoal bg-ink px-3 text-sm text-linen outline-none transition-colors focus:border-vermilion" />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-stone">Giới thiệu</span>
          <textarea maxLength={500} rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-linen outline-none transition-colors focus:border-vermilion" />
          <span className="mt-1 block text-right text-xs text-stone">{bio.length}/500</span>
        </label>

        <div className="mb-6 border-t border-charcoal pt-5">
          <p className="m-0 text-sm text-stone">Email đăng nhập</p>
          <p className="mb-0 mt-1 text-sm text-linen">{user?.email ?? '—'} <span className="text-xs text-stone">· không thể đổi tại đây</span></p>
        </div>

        {error && <p role="alert" className="mb-4 border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {saved && <p role="status" className="mb-4 border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">Đã lưu thông tin hồ sơ.</p>}

        <div className="flex justify-end">
          <button disabled={saving} type="submit" className="inline-flex h-11 items-center gap-2 bg-vermilion px-5 text-sm font-bold text-[#17130b] transition-colors hover:bg-vermilion-hover disabled:cursor-wait disabled:opacity-60">
            <Save size={16} /> {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </section>
  );
}
