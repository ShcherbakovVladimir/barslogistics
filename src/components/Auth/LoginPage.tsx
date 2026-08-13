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

  const inputClass = 'auth-login-input';

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
    <div className="auth-login-shell flex flex-col items-center justify-center p-4 relative">
      <div className="auth-login-theme-toggle absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mx-auto mb-4" />
          <h1 className="auth-login-heading">{title}</h1>
          <p className="auth-login-subtitle">{subtitle}</p>
        </div>

        <div className="auth-login-card space-y-4">
          {error && (
            <div className="auth-login-alert auth-login-alert--error">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="auth-login-alert auth-login-alert--success">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {onPortalLogin ? (
                <div className="auth-login-mode-tabs">
                  <button
                    type="button"
                    className={`auth-login-mode-tab${loginMode === 'local' ? ' is-active' : ''}`}
                    onClick={() => setLoginMode('local')}
                  >
                    {t('auth.localTab')}
                  </button>
                  <button
                    type="button"
                    className={`auth-login-mode-tab${loginMode === 'portal' ? ' is-active' : ''}`}
                    onClick={() => setLoginMode('portal')}
                  >
                    {t('auth.portalTab')}
                  </button>
                </div>
              ) : null}
              <div>
                <label htmlFor="username" className="auth-login-label">
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
                <label htmlFor="password" className="auth-login-label">
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
                className="auth-login-submit-btn"
              >
                <LogIn className="w-4 h-4" />
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <button type="button" onClick={() => go('forgot')} className="auth-login-link">
                  {t('auth.forgotLink')}
                </button>
                {registrationEnabled && loginMode === 'local' ? (
                  <button type="button" onClick={() => go('register')} className="auth-login-link auth-login-link--accent">
                    {t('auth.registerLink')}
                  </button>
                ) : null}
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="on">
              <div>
                <label htmlFor="register-username" className="auth-login-label">
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
                <label htmlFor="register-name" className="auth-login-label">
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
                <label htmlFor="register-email" className="auth-login-label">
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
                <label htmlFor="register-password" className="auth-login-label">
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
                <label htmlFor="register-password-confirm" className="auth-login-label">
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
                className="auth-login-submit-btn"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? t('auth.registering') : t('auth.register')}
              </button>
              <button type="button" onClick={() => go('login')} className="auth-login-link w-full">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4" autoComplete="on">
              <div>
                <label htmlFor="forgot-email" className="auth-login-label">
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
                className="auth-login-submit-btn"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
              <button type="button" onClick={() => go('login')} className="auth-login-link w-full">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4" autoComplete="on">
              {!token && (
                <p className="auth-login-warning">{t('auth.invalidToken')}</p>
              )}
              <div>
                <label htmlFor="reset-password" className="auth-login-label">
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
                <label htmlFor="reset-password-confirm" className="auth-login-label">
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
                className="auth-login-submit-btn"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? t('auth.saving') : t('auth.resetPassword')}
              </button>
              <button type="button" onClick={() => go('login')} className="auth-login-link w-full">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'confirm' && loading && (
            <p className="auth-login-status">{t('auth.confirming')}</p>
          )}
          {view === 'confirm' && !loading && (
            <button type="button" onClick={() => go('login')} className="auth-login-link auth-login-link--accent w-full">
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
