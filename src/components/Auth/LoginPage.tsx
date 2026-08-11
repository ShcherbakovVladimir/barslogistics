import React, { useEffect, useState } from 'react';
import { LogIn, AlertCircle, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ThemeToggle } from '../Theme/ThemeToggle';
import { BrandLogo } from '../Brand/BrandLogo';
import { ApiService } from '../../services/api';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onPortalLogin?: (username: string, password: string) => Promise<void>;
}

type AuthView = 'login' | 'register' | 'forgot' | 'confirm' | 'reset';
type LoginMode = 'local' | 'portal';

function readAuthQuery(): { view: AuthView; token: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');
    const token = params.get('token') || '';
    if (auth === 'confirm') return { view: 'confirm', token };
    if (auth === 'reset') return { view: 'reset', token };
    if (auth === 'register') return { view: 'register', token: '' };
    if (auth === 'forgot') return { view: 'forgot', token: '' };
  } catch {
    /* ignore */
  }
  return { view: 'login', token: '' };
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onPortalLogin }) => {
  const { t } = useI18n();
  const initial = readAuthQuery();
  const [view, setView] = useState<AuthView>(initial.view);
  const [loginMode, setLoginMode] = useState<LoginMode>('local');
  const [token, setToken] = useState(initial.token);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);

  useEffect(() => {
    ApiService.getRegistrationStatus()
      .then((s) => setRegistrationEnabled(s.registration_enabled))
      .catch(() => setRegistrationEnabled(false));
  }, []);

  useEffect(() => {
    if (view !== 'confirm' || !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setInfo('');
      try {
        const result = await ApiService.confirmEmail(token);
        if (!cancelled) {
          setInfo(result.message);
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('auth.invalidOrExpiredToken'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [view, token, t]);

  const go = (next: AuthView) => {
    setView(next);
    setError('');
    setInfo('');
    setPassword('');
    setPassword2('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (loginMode === 'portal' && onPortalLogin) {
        await onPortalLogin(username.trim(), password);
      } else {
        await onLogin(username.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const result = await ApiService.register({
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setInfo(result.message);
      setView('login');
      setPassword('');
      setPassword2('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await ApiService.forgotPassword(email.trim());
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const result = await ApiService.resetPassword(token, password);
      setInfo(result.message);
      setView('login');
      setToken('');
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  const title =
    view === 'register' ? t('auth.registerTitle')
    : view === 'forgot' ? t('auth.forgotTitle')
    : view === 'reset' ? t('auth.resetTitle')
    : view === 'confirm' ? t('auth.confirmTitle')
    : t('header.brandTitle');

  const subtitle =
    view === 'register' ? t('auth.registerSubtitle')
    : view === 'forgot' ? t('auth.forgotSubtitle')
    : view === 'reset' ? t('auth.resetSubtitle')
    : view === 'confirm' ? t('auth.confirmSubtitle')
    : view === 'login' && loginMode === 'portal' ? t('auth.portalLoginSubtitle')
    : t('auth.subtitle');

  return (
    <div className="auth-login-shell min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <div className="auth-login-theme-toggle absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 text-sm mt-2">{subtitle}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {onPortalLogin ? (
                <div className="auth-login-mode-tabs flex rounded-lg border border-slate-800 p-0.5 bg-slate-950/60">
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                      loginMode === 'local'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => setLoginMode('local')}
                  >
                    {t('auth.localTab')}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${
                      loginMode === 'portal'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    onClick={() => setLoginMode('portal')}
                  >
                    {t('auth.portalTab')}
                  </button>
                </div>
              ) : null}
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.username')}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <button type="button" onClick={() => go('forgot')} className="text-slate-400 hover:text-indigo-300">
                  {t('auth.forgotLink')}
                </button>
                {registrationEnabled && loginMode === 'local' ? (
                  <button type="button" onClick={() => go('register')} className="text-indigo-400 hover:text-indigo-300">
                    {t('auth.registerLink')}
                  </button>
                ) : null}
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="on">
              <div>
                <label htmlFor="register-username" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.username')}
                </label>
                <input
                  id="register-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  className={inputClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.fullName')}
                </label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="register-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="register-password-confirm" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.passwordConfirm')}
                </label>
                <input
                  id="register-password-confirm"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-lg"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? t('auth.registering') : t('auth.register')}
              </button>
              <button type="button" onClick={() => go('login')} className="w-full text-xs text-slate-400 hover:text-indigo-300">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4" autoComplete="on">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-lg"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
              <button type="button" onClick={() => go('login')} className="w-full text-xs text-slate-400 hover:text-indigo-300">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4" autoComplete="on">
              {!token && (
                <p className="text-xs text-amber-300">{t('auth.invalidToken')}</p>
              )}
              <div>
                <label htmlFor="reset-password" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.newPassword')}
                </label>
                <input
                  id="reset-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!token}
                />
              </div>
              <div>
                <label htmlFor="reset-password-confirm" className="block text-xs font-medium text-slate-400 mb-1.5">
                  {t('auth.passwordConfirm')}
                </label>
                <input
                  id="reset-password-confirm"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  minLength={8}
                  disabled={!token}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium rounded-lg"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? t('auth.saving') : t('auth.resetPassword')}
              </button>
              <button type="button" onClick={() => go('login')} className="w-full text-xs text-slate-400 hover:text-indigo-300">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'confirm' && loading && (
            <p className="text-sm text-slate-400 text-center">{t('auth.confirming')}</p>
          )}
          {view === 'confirm' && !loading && (
            <button type="button" onClick={() => go('login')} className="w-full text-xs text-indigo-400 hover:text-indigo-300">
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
