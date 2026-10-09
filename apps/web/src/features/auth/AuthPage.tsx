import { useEffect, useState } from 'react';
import { Form, Input } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { validateEmail, validateUsername, checkPasswordStrength } from '../../lib/validators';
import { parseErrorMessage } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimeStaggerVisual } from './AnimeStaggerVisual';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const navigate = useNavigate();
  const { token, user, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAuthed = Boolean(token && user);

  useEffect(() => {
    if (isAuthed) navigate('/home', { replace: true });
  }, [isAuthed, navigate]);

  const handleFinish = async (values: {
    email: string;
    password: string;
    username?: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(values.email, values.password);
        navigate('/home', { replace: true });
        return;
      }
      const username = values.username?.trim() ?? '';
      if (!validateUsername(username)) {
        setError('Tên hiển thị không hợp lệ (3-30 ký tự, chữ/số/_).');
        return;
      }
      if (!validateEmail(values.email)) {
        setError('Email không hợp lệ.');
        return;
      }
      const strength = checkPasswordStrength(values.password);
      if (!strength.isStrong) {
        setError(`Mật khẩu quá yếu: ${strength.feedback.join(' ')}`);
        return;
      }
      await register(username, values.email, values.password);
      setMode('login');
      setError('Đăng ký thành công. Đăng nhập ngay.');
    } catch (e) {
      setError(parseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#242322] text-linen font-body lg:h-[100dvh] lg:overflow-hidden">
      <AnimeStaggerVisual />

      {/* ── RIGHT: Form Card ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-y-auto">
        <div className="flex flex-1 items-center justify-center p-5 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'tween', ease: 'circOut', duration: 0.5, delay: 0.3 }}
            className="mx-auto w-full max-w-[420px]"
          >
            <div className="rounded-2xl border border-white/10 bg-washi p-7 shadow-2xl shadow-black/30 sm:p-8 lg:p-9">

              <div className="font-display text-[11px] font-bold tracking-widest text-vermilion mb-6 uppercase flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-2 h-2 bg-vermilion rounded-full"
                />
                MEMBER ACCESS
              </div>

              {/* Toggle Login/Register */}
              <div className="flex bg-ink border border-charcoal rounded-xl p-1 mb-8 relative">
                {/* Active Slider Indicator */}
                <motion.div
                  layout
                  className="absolute top-1 bottom-1 bg-charcoal rounded-xl z-0"
                  initial={false}
                  animate={{
                    left: mode === 'login' ? '4px' : 'calc(50% + 2px)',
                    width: 'calc(50% - 6px)'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`relative z-10 flex-1 py-2 font-display text-[13px] font-bold rounded-xl flex justify-center items-center transition-colors ${mode === 'login' ? 'text-linen' : 'text-stone hover:text-linen'
                    }`}
                >
                  LOGIN
                </button>
                <button
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`relative z-10 flex-1 py-2 font-display text-[13px] font-bold rounded-xl flex justify-center items-center transition-colors ${mode === 'register' ? 'text-linen' : 'text-stone hover:text-linen'
                    }`}
                >
                  REGISTER
                </button>
              </div>

              <div className="mb-8">
                <motion.h2
                  key={mode}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-2xl font-bold text-linen mb-2 uppercase"
                >
                  {mode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
                </motion.h2>
                <motion.p
                  key={`p-${mode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-body text-[14px] text-stone"
                >
                  {mode === 'login'
                    ? 'Enter your credentials to access the arena.'
                    : 'Register an account to start your journey.'}
                </motion.p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className={`text-[13px] font-body px-4 py-3 rounded-xl border ${error.includes('thành công')
                      ? 'bg-green-500/10 border-green-500/30 text-green-500'
                      : 'bg-vermilion/10 border-vermilion/30 text-vermilion'
                      }`}>
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Form layout="vertical" onFinish={handleFinish} requiredMark={false} autoComplete="off" className="flex flex-col gap-5 ocj-auth-form">

                <AnimatePresence mode="popLayout">
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'tween', ease: 'easeInOut', duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <Form.Item
                        name="username"
                        label={<span className="font-display block text-[11px] font-bold text-stone uppercase tracking-wider">Username</span>}
                        rules={[{ required: true, message: 'Required' }]}
                        className="!mb-0 mt-1"
                      >
                        <Input
                          prefix={<UserOutlined className="text-stone mr-2" />}
                          placeholder="Choose a username"
                          autoComplete="off"
                          className="w-full h-[44px] bg-ink border border-charcoal rounded-xl px-4 py-3 font-body text-[14px] text-linen focus:outline-none focus:border-vermilion hover:border-stone transition-colors placeholder:text-stone"
                        />
                      </Form.Item>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form.Item
                  name="email"
                  label={<span className="font-display block text-[11px] font-bold text-stone uppercase tracking-wider">Identifier</span>}
                  rules={[{ required: true, message: 'Required' }]}
                  className="!mb-0"
                >
                  <Input
                    prefix={<UserOutlined className="text-stone mr-2" />}
                    placeholder="khoicoder1@gmail.com"
                    autoComplete="off"
                    className="w-full h-[44px] bg-ink border border-charcoal rounded-xl px-4 py-3 font-body text-[14px] text-linen focus:outline-none focus:border-vermilion hover:border-stone transition-colors placeholder:text-stone"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={
                    <div className="flex justify-between items-center w-full">
                      <span className="font-display block text-[11px] font-bold text-stone uppercase tracking-wider">Security Key</span>
                    </div>
                  }
                  rules={[{ required: true, message: 'Required' }]}
                  className="!mb-2"
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-stone mr-2" />}
                    placeholder="••••••••"
                    autoComplete="off"
                    className="w-full h-[44px] bg-ink border border-charcoal rounded-xl px-4 py-3 font-body text-[14px] text-linen focus:outline-none focus:border-vermilion hover:border-stone transition-colors placeholder:text-stone [&_.ant-input-suffix]:text-stone"
                  />
                </Form.Item>

                <Form.Item className="!mt-4 !mb-0">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full h-[44px] bg-vermilion hover:bg-vermilion-hover text-linen font-display font-bold text-[14px] uppercase tracking-wider rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                    {!loading && <ArrowRightOutlined className="text-sm" />}
                  </motion.button>
                </Form.Item>
              </Form>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
