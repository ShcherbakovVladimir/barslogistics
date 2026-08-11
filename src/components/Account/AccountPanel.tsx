import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, KeyRound, Mail, Save, UserRound } from 'lucide-react';
import type { User } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { UserAvatar } from '../UI/UserAvatar';
import { invalidateUserAvatarCache } from '../../utils/userAvatar';

export interface AccountPanelProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

const fieldClass =
  'account-field w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem]';

function isAvatarFileValid(file: File): boolean {
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) return false;
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) return false;
  return true;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ user, onUserUpdated }) => {
  const { t } = useI18n();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [telegram, setTelegram] = useState(user.telegram_chat_id || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notifications_enabled);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setName(user.name);
    setTelegram(user.telegram_chat_id || '');
    setNotificationsEnabled(user.notifications_enabled);
    setRemoveAvatar(false);
    setAvatarFile(null);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }, [user.id, user.name, user.telegram_chat_id, user.notifications_enabled, user.avatar_version, user.has_avatar]);

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const showExistingAvatar = Boolean(user.has_avatar) && !removeAvatar && !avatarPreview;

  const onAvatarPicked = (file: File | null) => {
    if (!file) return;
    if (!isAvatarFileValid(file)) {
      setError(t('admin.users.avatarInvalid'));
      return;
    }
    setError('');
    setSuccess('');
    setRemoveAvatar(false);
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearAvatarDraft = () => {
    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      let next = await ApiService.updateMe({
        name: name.trim(),
        telegram_chat_id: telegram.trim() || null,
        notifications_enabled: notificationsEnabled,
      });

      if (avatarFile) {
        next = await ApiService.uploadUserAvatar(user.id, avatarFile);
        invalidateUserAvatarCache(user.id);
      } else if (removeAvatar && user.has_avatar) {
        next = await ApiService.deleteUserAvatar(user.id);
        invalidateUserAvatarCache(user.id);
      }

      onUserUpdated(next);
      clearAvatarDraft();
      setSuccess(t('account.saved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('account.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setPasswordError('');
    setPasswordMessage('');
    setSendingReset(true);
    try {
      const result = await ApiService.requestMyPasswordReset();
      setPasswordMessage(result.message);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('account.passwordResetFailed'));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="account-page h-full min-h-0 overflow-y-auto theme-scrollbar">
      <div className="account-page-inner mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7 space-y-5">
        <header className="account-hero">
          <div className="flex items-start gap-3 min-w-0">
            <span className="account-hero-icon shrink-0" aria-hidden>
              <UserRound className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h1 className="account-title text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                {t('account.title')}
              </h1>
              <p className="account-subtitle text-xs sm:text-sm text-slate-400 mt-1">
                {t('account.subtitle')}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={(e) => void handleSave(e)} className="account-card space-y-4">
          <div className="account-card-head">
            <h2 className="account-section-title">{t('account.profileSection')}</h2>
            <p className="account-section-hint">{t('account.profileHint')}</p>
          </div>

          {error ? (
            <p className="account-alert account-alert--error">{error}</p>
          ) : null}
          {success ? (
            <p className="account-alert account-alert--ok">{success}</p>
          ) : null}

          <div className="admin-users-avatar-field">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="user-avatar user-avatar--lg user-avatar--image" />
            ) : showExistingAvatar ? (
              <UserAvatar
                userId={user.id}
                name={name || user.name}
                hasAvatar
                avatarVersion={user.avatar_version}
                size="lg"
              />
            ) : (
              <UserAvatar userId={user.id} name={name || user.name} hasAvatar={false} size="lg" />
            )}
            <div className="min-w-0 space-y-1.5">
              <div className="text-xs text-slate-300 font-medium">{t('admin.users.avatar')}</div>
              <p className="admin-users-avatar-hint">{t('admin.users.avatarHint')}</p>
              <div className="admin-users-avatar-actions">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={AVATAR_ACCEPT}
                  className="hidden"
                  onChange={(e) => onAvatarPicked(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold hover:border-slate-600"
                >
                  <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                  {avatarPreview || showExistingAvatar ? t('admin.users.avatarChange') : t('admin.users.avatarUpload')}
                </button>
                {(avatarPreview || showExistingAvatar) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (avatarPreview || avatarFile) {
                        clearAvatarDraft();
                        return;
                      }
                      setRemoveAvatar(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-300 hover:bg-red-500/10"
                  >
                    {t('admin.users.avatarRemove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="text-slate-400">{t('auth.fullName')}</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                autoComplete="name"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="text-slate-400">{t('auth.username')}</span>
              <input value={user.username} disabled className={`${fieldClass} opacity-70 cursor-not-allowed`} />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="text-slate-400">{t('account.role')}</span>
              <input
                value={t(`roles.${user.role}.title`)}
                disabled
                className={`${fieldClass} opacity-70 cursor-not-allowed`}
              />
            </label>

            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="text-slate-400">{t('auth.email')}</span>
              <input
                value={user.email || '—'}
                disabled
                className={`${fieldClass} opacity-70 cursor-not-allowed`}
              />
              <span className="text-[10px] text-slate-500">{t('account.emailReadonlyHint')}</span>
            </label>

            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="text-slate-400">{t('admin.users.colTelegram')}</span>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className={`${fieldClass} font-mono`}
                placeholder="123456789"
              />
            </label>

            <label className="flex items-center gap-2 sm:col-span-2 text-slate-300 min-h-[2.75rem] text-sm">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              {t('admin.users.notifications')}
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0"
            >
              <Save className="w-3.5 h-3.5 shrink-0" />
              {saving ? t('account.saving') : t('account.save')}
            </button>
          </div>
        </form>

        <section className="account-card space-y-3">
          <div className="account-card-head">
            <h2 className="account-section-title flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-300 shrink-0" />
              {t('account.passwordSection')}
            </h2>
            <p className="account-section-hint">{t('account.passwordHint')}</p>
          </div>

          {passwordError ? (
            <p className="account-alert account-alert--error">{passwordError}</p>
          ) : null}
          {passwordMessage ? (
            <p className="account-alert account-alert--ok">{passwordMessage}</p>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 text-xs text-slate-400 min-w-0 flex-1">
              <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {user.email
                  ? t('account.passwordResetTo', { email: user.email })
                  : t('account.noEmail')}
              </span>
            </div>
            <button
              type="button"
              disabled={sendingReset || !user.email}
              onClick={() => void handlePasswordReset()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0 shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              {sendingReset ? t('auth.sending') : t('account.sendPasswordLink')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
