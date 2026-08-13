import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, KeyRound, Mail, Save, Trash2, UserRound } from 'lucide-react';
import type { User } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { UserAvatar } from '../UI/UserAvatar';
import { invalidateUserAvatarCache } from '../../utils/userAvatar';
import accountBackground from '../../../assets/img/Background.jpg';

export interface AccountPanelProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

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
    <div
      className="account-page theme-scrollbar"
      style={{ '--account-page-bg-image': `url(${accountBackground})` } as React.CSSProperties}
    >
      <div className="account-page-inner">
        <header className="account-hero">
          <span className="account-hero-icon" aria-hidden>
            <UserRound />
          </span>
          <div className="account-hero-text">
            <h1 className="account-title">{t('account.title')}</h1>
            <p className="account-subtitle">{t('account.subtitle')}</p>
          </div>
        </header>

        <form onSubmit={(e) => void handleSave(e)} className="account-card">
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

          <div className="account-avatar-field">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="user-avatar user-avatar--lg user-avatar--image account-avatar" />
            ) : showExistingAvatar ? (
              <UserAvatar
                userId={user.id}
                name={name || user.name}
                hasAvatar
                avatarVersion={user.avatar_version}
                size="lg"
                className="account-avatar"
              />
            ) : (
              <UserAvatar
                userId={user.id}
                name={name || user.name}
                hasAvatar={false}
                size="lg"
                className="account-avatar"
              />
            )}
            <div className="account-avatar-meta">
              <div className="account-label">{t('admin.users.avatar')}</div>
              <p className="account-avatar-hint">{t('admin.users.avatarHint')}</p>
              <div className="account-avatar-actions">
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
                  className="account-btn account-btn--ghost"
                >
                  <ImagePlus aria-hidden />
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
                    className="account-btn account-btn--danger"
                  >
                    <Trash2 aria-hidden />
                    {t('admin.users.avatarRemove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="account-grid">
            <label className="account-field-wrap account-field-wrap--full">
              <span className="account-label">{t('auth.fullName')}</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="account-field"
                autoComplete="name"
              />
            </label>

            <label className="account-field-wrap">
              <span className="account-label">{t('auth.username')}</span>
              <input value={user.username} disabled className="account-field" />
            </label>

            <label className="account-field-wrap">
              <span className="account-label">{t('account.role')}</span>
              <input
                value={t(`roles.${user.role}.title`)}
                disabled
                className="account-field"
              />
            </label>

            <label className="account-field-wrap account-field-wrap--full">
              <span className="account-label">{t('auth.email')}</span>
              <input
                value={user.email || '—'}
                disabled
                className="account-field"
              />
              <span className="account-field-hint">{t('account.emailReadonlyHint')}</span>
            </label>

            <label className="account-field-wrap account-field-wrap--full">
              <span className="account-label">{t('admin.users.colTelegram')}</span>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="account-field account-field--mono"
                placeholder="123456789"
              />
            </label>

            <label className="account-check">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span>{t('admin.users.notifications')}</span>
            </label>
          </div>

          <div className="account-card-actions">
            <button
              type="submit"
              disabled={saving}
              className="account-btn account-btn--primary"
            >
              <Save aria-hidden />
              {saving ? t('account.saving') : t('account.save')}
            </button>
          </div>
        </form>

        <section className="account-card">
          <div className="account-card-head">
            <h2 className="account-section-title">
              <KeyRound className="account-section-icon" aria-hidden />
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

          <div className="account-password-row">
            <div className="account-password-note">
              <Mail aria-hidden />
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
              className="account-btn account-btn--accent"
            >
              <KeyRound aria-hidden />
              {sendingReset ? t('auth.sending') : t('account.sendPasswordLink')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
