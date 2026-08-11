import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Check, Ban } from 'lucide-react';
import type { Factory, User, UserCreateInput, UserRole, UserUpdateInput } from '../../types';
import { USER_ROLES } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import { SearchableSelect } from '../UI/SearchableSelect';
import { adminDropdownSelectProps } from './adminDropdown';

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
  'admin-users-field w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white min-h-[2.75rem]';

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
        className={`admin-users-modal app-modal-sheet modal-panel bg-slate-900 border border-slate-700 rounded-2xl w-full ${maxWidthClass} shadow-2xl text-slate-100 flex flex-col ${isDragging ? 'is-sheet-dragging' : ''}`}
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
      <div className="min-w-0">
        <div className="admin-users-card-name">{user.name}</div>
        <div className="admin-users-card-username">@{user.username}</div>
      </div>
      <span className="admin-users-card-role px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase shrink-0">
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
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          user.account_status === 'pending' ? 'bg-amber-500/10 text-amber-300'
          : user.account_status === 'rejected' ? 'bg-red-500/10 text-red-300'
          : 'bg-emerald-500/10 text-emerald-300'
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

export const UserManager: React.FC<UserManagerProps> = ({ users, currentUserId, onRefresh }) => {
  const { t } = useI18n();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm());
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
    setError('');
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
    setError('');
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
        await ApiService.createUser(payload);
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

  const formBody = (
    <>
      <div className="admin-users-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('auth.username')}</span>
          <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('admin.users.fullName')}</span>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('admin.users.colRole')}</span>
          <SearchableSelect
            {...adminDropdownSelectProps}
            value={form.role}
            onChange={value => setForm({ ...form, role: value as UserRole })}
            options={roleOptions}
          />
        </label>
        <label className="block space-y-1 text-xs">
          <span className="text-slate-400">{t('admin.users.colEmail')}</span>
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs sm:col-span-2">
          <span className="text-slate-400">{creating ? t('auth.password') : t('admin.users.newPassword')}</span>
          <input type="password" required={creating} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing ? t('admin.users.passwordOptional') : ''} className={fieldClass} />
        </label>
        <label className="block space-y-1 text-xs sm:col-span-2">
          <span className="text-slate-400">{t('admin.users.colTelegram')}</span>
          <input value={form.telegram_chat_id} onChange={e => setForm({ ...form, telegram_chat_id: e.target.value })} className={`${fieldClass} font-mono`} />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2 text-slate-300 min-h-[2.75rem]">
          <input type="checkbox" checked={form.notifications_enabled} onChange={e => setForm({ ...form, notifications_enabled: e.target.checked })} />
          {t('admin.users.notifications')}
        </label>
      </div>

      {showSiteField && (
        <label className="space-y-1 block text-xs">
          <span className="text-slate-400">{t('admin.users.colSite')}</span>
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
          <span className="text-slate-400">{t('admin.users.assignedSites')}</span>
          <div className="admin-users-site-chips flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {ourSites.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleAssignedSite(s.id)}
                className={`admin-users-site-chip px-2 py-1 rounded text-[10px] border min-h-[2rem] ${form.assigned_site_ids.includes(s.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
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
      <div className="admin-users-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{t('admin.users.subtitle')}</p>
        <button
          type="button"
          onClick={openCreate}
          className="admin-users-toolbar-btn flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-semibold min-h-[2.75rem] sm:min-h-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          {t('admin.users.add')}
        </button>
      </div>

      {error && !creating && !editing && !deleteTarget && (
        <p className="admin-users-alert text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="admin-users-table-panel bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="admin-users-table-desktop overflow-x-auto responsive-table-wrap">
          <table className="w-full text-xs min-w-[28rem] lg:min-w-[32rem]">
            <thead className="bg-slate-950 text-slate-400">
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
                  <tr key={u.id} className="border-t border-slate-800 text-slate-200">
                    <td className="p-3">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-slate-500">@{u.username}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase">
                        {t(`roles.${u.role}.title`)}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-slate-400">{u.email || '—'}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.account_status === 'pending' ? 'bg-amber-500/10 text-amber-300'
                        : u.account_status === 'rejected' ? 'bg-red-500/10 text-red-300'
                        : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {statusLabel(u)}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-slate-400">{siteName || '—'}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {u.account_status === 'pending' && (
                          <>
                            <button type="button" onClick={() => void handleApprove(u)} disabled={saving} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400" title={t('admin.users.approve')}>
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => void handleReject(u)} disabled={saving} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400" title={t('admin.users.reject')}>
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white" title={t('admin.users.edit')}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(u)} disabled={u.id === currentUserId} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 disabled:opacity-30" title={t('admin.users.delete')}>
                          <Trash2 className="w-3.5 h-3.5" />
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
                <h3 className="font-bold text-white break-words">
                  {creating ? t('admin.users.createTitle') : t('admin.users.editTitle')}
                </h3>
                <button type="button" onClick={closeForm} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" aria-label={t('common.close')}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>
            <div className="modal-panel-body modal-scrollbar px-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
              {formBody}
            </div>
            <footer className="admin-users-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold min-h-[2.75rem] sm:min-h-0">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0">
                <Save className="w-3.5 h-3.5 shrink-0" />
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
              <h3 className="font-bold text-white text-sm">{t('admin.users.deleteTitle')}</h3>
            </header>
            <div className="modal-panel-body px-4 flex-1">
              <p className="text-xs text-slate-400">{t('admin.users.deleteConfirm', { name: deleteTarget.name, username: deleteTarget.username })}</p>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </div>
            <footer className="admin-users-form-modal-footer modal-panel-footer px-4 pt-2 pb-4 flex justify-end gap-2 border-t border-slate-800">
              <button type="button" onClick={() => { setDeleteTarget(null); setError(''); }} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs min-h-[2.75rem] sm:min-h-0 flex-1 sm:flex-none">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={() => void handleDelete()} disabled={saving} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50 min-h-[2.75rem] sm:min-h-0 flex-1 sm:flex-none">
                {t('admin.users.delete')}
              </button>
            </footer>
          </div>
        </AdminModalShell>
      )}
    </div>
  );
};
