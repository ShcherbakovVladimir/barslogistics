import React, { useEffect, useState } from 'react';
import { LogIn, AlertCircle, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ThemeToggle } from '../Theme/ThemeToggle';
import { BrandLogo } from '../Brand/BrandLogo';
import { ApiService } from '../../services/api';
import accountBackgroundWebp from '../../../assets/img/Background.webp';
import accountBackgroundJpg from '../../../assets/img/Background.jpg';

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
    <div className="auth-login-shell">
      <picture className="account-page-bg" aria-hidden>
        <source srcSet={accountBackgroundWebp} type="image/webp" />
        <img
          src={accountBackgroundJpg}
          alt=""
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      </picture>
      <div className="auth-login-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-login-inner">
        <header className="auth-login-hero">
          <BrandLogo size="lg" className="auth-login-logo" />
          <div className="auth-login-hero-text">
            <h1 className="auth-login-heading">{title}</h1>
            <p className="auth-login-subtitle">{subtitle}</p>
          </div>
        </header>

        <div className="auth-login-card">
          {error && (
            <div className="auth-login-alert auth-login-alert--error">
              <AlertCircle aria-hidden />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="auth-login-alert auth-login-alert--success">
              <CheckCircle2 aria-hidden />
              <span>{info}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="auth-login-form">
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
              <label className="auth-login-field" htmlFor="username">
                <span className="auth-login-label">{t('auth.username')}</span>
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
              </label>
              <label className="auth-login-field" htmlFor="password">
                <span className="auth-login-label">{t('auth.password')}</span>
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
              </label>
              <button
                type="submit"
                disabled={loading}
                className="auth-login-submit-btn"
              >
                <LogIn aria-hidden />
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
              <div className="auth-login-links">
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
            <form onSubmit={handleRegister} className="auth-login-form" autoComplete="on">
              <label className="auth-login-field" htmlFor="register-username">
                <span className="auth-login-label">{t('auth.username')}</span>
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
              </label>
              <label className="auth-login-field" htmlFor="register-name">
                <span className="auth-login-label">{t('auth.fullName')}</span>
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
              </label>
              <label className="auth-login-field" htmlFor="register-email">
                <span className="auth-login-label">{t('auth.email')}</span>
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
              </label>
              <label className="auth-login-field" htmlFor="register-password">
                <span className="auth-login-label">{t('auth.password')}</span>
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
              </label>
              <label className="auth-login-field" htmlFor="register-password-confirm">
                <span className="auth-login-label">{t('auth.passwordConfirm')}</span>
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
              </label>
              <button
                type="submit"
                disabled={loading}
                className="auth-login-submit-btn"
              >
                <UserPlus aria-hidden />
                {loading ? t('auth.registering') : t('auth.register')}
              </button>
              <button type="button" onClick={() => go('login')} className="auth-login-link auth-login-link--block">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="auth-login-form" autoComplete="on">
              <label className="auth-login-field" htmlFor="forgot-email">
                <span className="auth-login-label">{t('auth.email')}</span>
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
              </label>
              <button
                type="submit"
                disabled={loading}
                className="auth-login-submit-btn"
              >
                <KeyRound aria-hidden />
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
              <button type="button" onClick={() => go('login')} className="auth-login-link auth-login-link--block">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} className="auth-login-form" autoComplete="on">
              {!token && (
                <p className="auth-login-warning">{t('auth.invalidToken')}</p>
              )}
              <label className="auth-login-field" htmlFor="reset-password">
                <span className="auth-login-label">{t('auth.newPassword')}</span>
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
              </label>
              <label className="auth-login-field" htmlFor="reset-password-confirm">
                <span className="auth-login-label">{t('auth.passwordConfirm')}</span>
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
              </label>
              <button
                type="submit"
                disabled={loading || !token}
                className="auth-login-submit-btn"
              >
                <KeyRound aria-hidden />
                {loading ? t('auth.saving') : t('auth.resetPassword')}
              </button>
              <button type="button" onClick={() => go('login')} className="auth-login-link auth-login-link--block">
                {t('auth.backToLogin')}
              </button>
            </form>
          )}

          {view === 'confirm' && loading && (
            <p className="auth-login-status">{t('auth.confirming')}</p>
          )}
          {view === 'confirm' && !loading && (
            <button type="button" onClick={() => go('login')} className="auth-login-link auth-login-link--accent auth-login-link--block">
              {t('auth.backToLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
