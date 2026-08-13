import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Check, Ban, ImagePlus } from 'lucide-react';
import type { Factory, User, UserCreateInput, UserRole, UserUpdateInput } from '../../types';
import { USER_ROLES } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from './adminDropdown';
import { UserAvatar } from '../UI/UserAvatar';
import { invalidateUserAvatarCache } from '../../utils/userAvatar';

interface UserManagerProps {
  users: User[];
  currentUserId: string;
  onRefresh: () => Promise<void>;
}

type FormState = {
  username: string;
  name: string;
  role: UserRole;
  email: string;
  password: string;
  telegram_chat_id: string;
  notifications_enabled: boolean;
  site_id: string;
  assigned_site_ids: string[];
};

const emptyForm = (): FormState => ({
  username: '',
  name: '',
  role: 'manager',
  email: '',
  password: '',
  telegram_chat_id: '',
  notifications_enabled: true,
  site_id: '',
  assigned_site_ids: [],
});

const fieldClass =
  'admin-users-field admin-form-field w-full rounded-lg px-2.5 py-2 text-sm min-h-[2.75rem]';

interface AdminModalShellProps {
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const AdminModalShell: React.FC<AdminModalShellProps> = ({
  onClose,
  maxWidthClass = 'max-w-lg',
  children,
}) => {
  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={`admin-modal admin-users-modal app-modal-sheet modal-panel w-full ${maxWidthClass} flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
      >
        <AppBottomSheetHandle
          onPointerDown={dragEnabled ? onHandlePointerDown : () => {}}
          isDragging={isDragging}
        />
        {children}
      </div>
    </div>
  );
};

interface UserCardProps {
  user: User;
  currentUserId: string;
  siteName?: string;
  saving: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  statusLabel: (user: User) => string;
  onApprove: (user: User) => void;
  onReject: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UserCard = ({
  user,
  currentUserId,
  siteName,
  saving,
  t,
  statusLabel,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: UserCardProps) => (
  <article className="admin-users-card">
    <div className="admin-users-card-header">
      <div className="flex items-center gap-2.5 min-w-0">
        <UserAvatar
          userId={user.id}
          name={user.name}
          hasAvatar={Boolean(user.has_avatar)}
          avatarVersion={user.avatar_version}
          size="sm"
          className="admin-users-row-avatar shrink-0"
        />
        <div className="min-w-0">
          <div className="admin-users-card-name">{user.name}</div>
          <div className="admin-users-card-username">@{user.username}</div>
        </div>
      </div>
      <span className="admin-users-role-badge shrink-0">
        {t(`roles.${user.role}.title`)}
      </span>
    </div>
    <div className="admin-users-card-meta">
      <div className="admin-users-card-row">
        <span className="admin-users-card-label">{t('admin.users.colEmail')}</span>
        <span>{user.email || '—'}</span>
      </div>
      <div className="admin-users-card-row">
        <span className="admin-users-card-label">{t('admin.users.colStatus')}</span>
        <span className={`admin-users-status-badge ${
          user.account_status === 'pending' ? 'admin-users-status-badge--pending'
          : user.account_status === 'rejected' ? 'admin-users-status-badge--rejected'
          : 'admin-users-status-badge--active'
        }`}>
          {statusLabel(user)}
        </span>
      </div>
      <div className="admin-users-card-row">
        <span className="admin-users-card-label">{t('admin.users.colSite')}</span>
        <span>{siteName || '—'}</span>
      </div>
    </div>
    <div className="admin-users-card-actions">
      {user.account_status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => onApprove(user)}
            disabled={saving}
            className="admin-users-card-action admin-users-card-action--approve"
          >
            <Check className="w-4 h-4 shrink-0" />
            {t('admin.users.approve')}
          </button>
          <button
            type="button"
            onClick={() => onReject(user)}
            disabled={saving}
            className="admin-users-card-action admin-users-card-action--reject"
          >
            <Ban className="w-4 h-4 shrink-0" />
            {t('admin.users.reject')}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="admin-users-card-action admin-users-card-action--edit"
      >
        <Pencil className="w-4 h-4 shrink-0" />
        {t('admin.users.edit')}
      </button>
      <button
        type="button"
        onClick={() => onDelete(user)}
        disabled={user.id === currentUserId}
        className="admin-users-card-action admin-users-card-action--delete"
      >
        <Trash2 className="w-4 h-4 shrink-0" />
        {t('admin.users.delete')}
      </button>
    </div>
  </article>
);

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

function isAvatarFileValid(file: File): boolean {
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) return false;
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) return false;
  return true;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, currentUserId, onRefresh }) => {
  const { t } = useI18n();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const ourSites = useMemo(() => factories.filter(f => f.is_ours), [factories]);

  const roleOptions = useMemo(
    () => USER_ROLES.map(r => ({ value: r, label: t(`roles.${r}.title`) })),
    [t],
  );

  const siteOptions = useMemo(
    () => [
      { value: '', label: t('admin.users.noSite') },
      ...ourSites.map(s => ({ value: s.id, label: s.name, keywords: s.region })),
    ],
    [ourSites, t],
  );

  useEffect(() => {
    ApiService.getFactories().then(setFactories).catch(() => {});
  }, []);

  const clearAvatarDraft = () => {
    setAvatarFile(null);
    setRemoveAvatar(false);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm());
    clearAvatarDraft();
    setError('');
  };

  const openEdit = (user: User) => {
    setCreating(false);
    setEditing(user);
    setForm({
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      password: '',
      telegram_chat_id: user.telegram_chat_id || '',
      notifications_enabled: user.notifications_enabled,
      site_id: user.site_id || '',
      assigned_site_ids: user.assigned_site_ids || [],
    });
    clearAvatarDraft();
    setError('');
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
    clearAvatarDraft();
    setError('');
  };

  const onAvatarPicked = (file: File | null) => {
    if (!file) return;
    if (!isAvatarFileValid(file)) {
      setError(t('admin.users.avatarInvalid'));
      return;
    }
    setError('');
    setRemoveAvatar(false);
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const toggleAssignedSite = (siteId: string) => {
    setForm(prev => ({
      ...prev,
      assigned_site_ids: prev.assigned_site_ids.includes(siteId)
        ? prev.assigned_site_ids.filter(id => id !== siteId)
        : [...prev.assigned_site_ids, siteId],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let userId = editing?.id;
      if (creating) {
        if (!form.password) {
          setError(t('admin.users.passwordRequired'));
          setSaving(false);
          return;
        }
        const payload: UserCreateInput = {
          username: form.username,
          name: form.name,
          role: form.role,
          email: form.email,
          password: form.password,
          telegram_chat_id: form.telegram_chat_id || undefined,
          notifications_enabled: form.notifications_enabled,
          site_id: form.site_id || undefined,
          assigned_site_ids: form.role === 'manager' ? form.assigned_site_ids : undefined,
        };
        const created = await ApiService.createUser(payload);
        userId = created.id;
      } else if (editing) {
        const payload: UserUpdateInput = {
          username: form.username,
          name: form.name,
          role: form.role,
          email: form.email,
          telegram_chat_id: form.telegram_chat_id,
          notifications_enabled: form.notifications_enabled,
          site_id: form.site_id || null,
          assigned_site_ids: form.role === 'manager' ? form.assigned_site_ids : [],
        };
        if (form.password) payload.password = form.password;
        await ApiService.updateUser(editing.id, payload);
      }

      if (userId) {
        try {
          if (avatarFile) {
            await ApiService.uploadUserAvatar(userId, avatarFile);
            invalidateUserAvatarCache(userId);
          } else if (removeAvatar && editing?.has_avatar) {
            await ApiService.deleteUserAvatar(userId);
            invalidateUserAvatarCache(userId);
          }
        } catch (avatarErr) {
          setError(avatarErr instanceof Error ? avatarErr.message : t('admin.users.avatarFailed'));
          await onRefresh();
          setSaving(false);
          return;
        }
      }

      await onRefresh();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.users.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    try {
      await ApiService.deleteUser(deleteTarget.id);
      await onRefresh();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.users.deleteFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (user: User) => {
    setSaving(true);
    setError('');
    try {
      await ApiService.approveUser(user.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.users.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (user: User) => {
    setSaving(true);
    setError('');
    try {
      await ApiService.rejectUser(user.id);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.users.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (user: User) => {
    if (user.account_status === 'pending') return t('admin.users.statusPending');
    if (user.account_status === 'rejected') return t('admin.users.statusRejected');
    if (user.email_verified === false) return t('admin.users.statusUnverified');
    return t('admin.users.statusActive');
  };

  const showSiteField = form.role === 'site_manager' || form.role === 'local_employee';
  const showAssignedSites = form.role === 'manager';
  const showExistingAvatar = Boolean(editing?.has_avatar) && !removeAvatar && !avatarPreview;

  const formBody = (
    <>
      <div className="admin-users-avatar-field sm:col-span-2">
        {avatarPreview ? (
          <img src={avatarPreview} alt="" className="user-avatar user-avatar--lg user-avatar--image" />
        ) : showExistingAvatar && editing ? (
          <UserAvatar
            userId={editing.id}
            name={form.name || editing.name}
            hasAvatar
            avatarVersion={editing.avatar_version}
            size="lg"
          />
        ) : (
          <UserAvatar
            userId={editing?.id}
            name={form.name || editing?.name || '?'}
            hasAvatar={false}
            size="lg"
          />
        )}
        <div className="min-w-0 space-y-1.5">
          <div className="admin-users-avatar-label">{t('admin.users.avatar')}</div>
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
              className="admin-users-avatar-upload-btn"
            >
              <ImagePlus aria-hidden />
              {avatarPreview || showExistingAvatar ? t('admin.users.avatarChange') : t('admin.users.avatarUpload')}
            </button>
            {(avatarPreview || showExistingAvatar) ? (
              <button
                type="button"
                onClick={() => {
                  if (avatarPreview || avatarFile) {
                    clearAvatarDraft();
                    return;
                  }
                  setRemoveAvatar(true);
                }}
                className="admin-users-avatar-remove-btn"
              >
                {t('admin.users.avatarRemove')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="admin-users-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1 text-xs">
          <span className="admin-form-field-label">{t('auth.username')}</span>
          <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="admin-form-field-label">{t('admin.users.fullName')}</span>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="admin-form-field-label">{t('admin.users.colRole')}</span>
          <SearchableSelect
            {...adminDropdownSelectProps}
            value={form.role}
            onChange={value => setForm({ ...form, role: value as UserRole })}
            options={roleOptions}
          />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="admin-form-field-label">{t('admin.users.colEmail')}</span>
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs sm:col-span-2">
          <span className="admin-form-field-label">{creating ? t('auth.password') : t('admin.users.newPassword')}</span>
          <input type="password" required={creating} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing ? t('admin.users.passwordOptional') : ''} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs sm:col-span-2">
          <span className="admin-form-field-label">{t('admin.users.colTelegram')}</span>
          <input value={form.telegram_chat_id} onChange={e => setForm({ ...form, telegram_chat_id: e.target.value })} className={`${fieldClass} font-mono`} />
        </label>
        <label className="admin-form-check sm:col-span-2 min-h-[2.75rem]">
          <input type="checkbox" checked={form.notifications_enabled} onChange={e => setForm({ ...form, notifications_enabled: e.target.checked })} />
          {t('admin.users.notifications')}
        </label>
      </div>

      {showSiteField && (
        <label className="space-y-1 block text-xs">
          <span className="admin-form-field-label">{t('admin.users.colSite')}</span>
          <SearchableSelect
            {...adminDropdownSelectProps}
            searchable={ourSites.length > 6}
            value={form.site_id}
            onChange={value => setForm({ ...form, site_id: value })}
            options={siteOptions}
          />
        </label>
      )}

      {showAssignedSites && (
        <div className="space-y-1 text-xs">
          <span className="admin-form-field-label">{t('admin.users.assignedSites')}</span>
          <div className="admin-users-site-chips flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {ourSites.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleAssignedSite(s.id)}
                className={`admin-users-site-chip${form.assigned_site_ids.includes(s.id) ? ' is-active' : ''}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="admin-users-page space-y-4">
      <div className="admin-section-toolbar admin-users-toolbar">
        <p className="admin-section-hint">{t('admin.users.subtitle')}</p>
        <button
          type="button"
          onClick={openCreate}
          className="admin-users-toolbar-btn"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {t('admin.users.add')}
        </button>
      </div>

      {error && !creating && !editing && !deleteTarget ? (
        <p className="admin-alert admin-alert--error">{error}</p>
      ) : null}

      <div className="admin-users-table-panel">
        <div className="admin-users-table-desktop overflow-x-auto responsive-table-wrap">
          <table className="min-w-[28rem] lg:min-w-[32rem]">
            <thead>
              <tr>
                <th className="text-left p-3 font-semibold">{t('admin.users.colUser')}</th>
                <th className="text-left p-3 font-semibold">{t('admin.users.colRole')}</th>
                <th className="text-left p-3 font-semibold hidden sm:table-cell">{t('admin.users.colEmail')}</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">{t('admin.users.colStatus')}</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">{t('admin.users.colSite')}</th>
                <th className="text-right p-3 font-semibold">{t('admin.users.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const siteName = ourSites.find(s => s.id === u.site_id)?.name;
                return (
                  <tr key={u.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          userId={u.id}
                          name={u.name}
                          hasAvatar={Boolean(u.has_avatar)}
                          avatarVersion={u.avatar_version}
                          size="sm"
                          className="admin-users-row-avatar shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="admin-users-row-name truncate">{u.name}</div>
                          <div className="admin-users-row-login truncate">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="admin-users-role-badge">
                        {t(`roles.${u.role}.title`)}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell admin-users-row-login">{u.email || '—'}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`admin-users-status-badge ${
                        u.account_status === 'pending' ? 'admin-users-status-badge--pending'
                        : u.account_status === 'rejected' ? 'admin-users-status-badge--rejected'
                        : 'admin-users-status-badge--active'
                      }`}>
                        {statusLabel(u)}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell admin-users-row-login">{siteName || '—'}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {u.account_status === 'pending' && (
                          <>
                            <button type="button" onClick={() => void handleApprove(u)} disabled={saving} className="admin-users-row-action admin-users-row-action--approve" title={t('admin.users.approve')}>
                              <Check aria-hidden />
                            </button>
                            <button type="button" onClick={() => void handleReject(u)} disabled={saving} className="admin-users-row-action admin-users-row-action--reject" title={t('admin.users.reject')}>
                              <Ban aria-hidden />
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => openEdit(u)} className="admin-users-row-action admin-users-row-action--edit" title={t('admin.users.edit')}>
                          <Pencil aria-hidden />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(u)} disabled={u.id === currentUserId} className="admin-users-row-action admin-users-row-action--delete" title={t('admin.users.delete')}>
                          <Trash2 aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="admin-users-cards-mobile">
          {users.map(u => (
            <UserCard
              key={u.id}
              user={u}
              currentUserId={currentUserId}
              siteName={ourSites.find(s => s.id === u.site_id)?.name}
              saving={saving}
              t={t}
              statusLabel={statusLabel}
              onApprove={u => void handleApprove(u)}
              onReject={u => void handleReject(u)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      </div>

      {(creating || editing) && (
        <AdminModalShell onClose={closeForm}>
          <form onSubmit={e => void handleSave(e)} className="admin-users-form-modal admin-form-panel flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header app-modal-sheet-header px-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="admin-modal-title">
                  {creating ? t('admin.users.createTitle') : t('admin.users.editTitle')}
                </h3>
                <button type="button" onClick={closeForm} className="admin-modal-close-btn" aria-label={t('common.close')}>
                  <X aria-hidden />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar px-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
              {formBody}
            </div>
            <footer className="admin-users-form-modal-footer modal-panel-footer px-4 pt-2 pb-4">
              <button type="button" onClick={closeForm} className="admin-modal-cancel">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="admin-modal-submit">
                <Save aria-hidden />
                {saving ? t('admin.users.saving') : t('admin.users.save')}
              </button>
            </footer>
          </form>
        </AdminModalShell>
      )}

      {deleteTarget && (
        <AdminModalShell onClose={() => { setDeleteTarget(null); setError(''); }} maxWidthClass="max-w-sm">
          <div className="admin-users-delete-modal flex flex-col flex-1 min-h-0">
            <header className="modal-panel-header px-4 pb-3">
              <h3 className="admin-modal-title admin-modal-title--sm">{t('admin.users.deleteTitle')}</h3>
            </header>
            <div className="modal-panel-body px-4 flex-1">
              <p className="admin-modal-body-text">{t('admin.users.deleteConfirm', { name: deleteTarget.name, username: deleteTarget.username })}</p>
              {error ? <p className="admin-form-msg admin-form-msg--error mt-2">{error}</p> : null}
            </div>
            <footer className="admin-users-form-modal-footer modal-panel-footer px-4 pt-2 pb-4">
              <button type="button" onClick={() => { setDeleteTarget(null); setError(''); }} className="admin-modal-cancel flex-1 sm:flex-none">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={() => void handleDelete()} disabled={saving} className="admin-modal-submit admin-modal-submit--danger flex-1 sm:flex-none">
                {t('admin.users.delete')}
              </button>
            </footer>
          </div>
        </AdminModalShell>
      )}
    </div>
  );
};
