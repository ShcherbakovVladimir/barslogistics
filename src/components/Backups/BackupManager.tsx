import React from 'react';
import { BackupItem, DbMaintenanceInfo, UserRole } from '../../types';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import {
  Cloud,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Database,
  Wrench,
  GitBranch,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface BackupManagerProps {
  backups: BackupItem[];
  onCreateBackup: () => Promise<void>;
  currentUserRole: UserRole;
  onRefresh?: () => void;
  embedded?: boolean;
}

const CONFIRM_APPLY = 'APPLY';
const CONFIRM_ROLLBACK = 'ROLLBACK';
const CONFIRM_RESTORE = 'RESTORE';

export const BackupManager: React.FC<BackupManagerProps> = ({
  backups,
  onCreateBackup,
  currentUserRole,
  onRefresh,
  embedded = false,
}) => {
  const { t, localeTag } = useI18n();
  const canBackup = currentUserRole === 'admin';
  const [creating, setCreating] = React.useState(false);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [maintenance, setMaintenance] = React.useState<DbMaintenanceInfo | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(false);
  const [maintenanceError, setMaintenanceError] = React.useState('');
  const [applyingMigrations, setApplyingMigrations] = React.useState(false);
  const [rollingBack, setRollingBack] = React.useState(false);
  const [applyConfirm, setApplyConfirm] = React.useState('');
  const [rollbackConfirm, setRollbackConfirm] = React.useState('');
  const [restoreConfirmById, setRestoreConfirmById] = React.useState<Record<string, string>>({});

  const loadMaintenance = React.useCallback(async () => {
    if (!canBackup) return;
    setMaintenanceLoading(true);
    setMaintenanceError('');
    try {
      const data = await ApiService.getDbMaintenance();
      setMaintenance(data);
    } catch (e) {
      setMaintenanceError(e instanceof Error ? e.message : t('backups.loadError'));
    } finally {
      setMaintenanceLoading(false);
    }
  }, [canBackup, t]);

  React.useEffect(() => {
    void loadMaintenance();
  }, [loadMaintenance]);

  const getBackupDescription = (backup: BackupItem) => {
    return backup.type === 'auto' ? t('backups.autoDesc') : t('backups.manualDesc');
  };

  const downloadBackupFile = async (backup: BackupItem) => {
    try {
      await ApiService.downloadBackup(backup.id, backup.filename);
    } catch {
      alert(t('backups.downloadError'));
    }
  };

  const uploadToCloud = async (backup: BackupItem) => {
    try {
      await ApiService.uploadBackupToCloud(backup.id);
      onRefresh?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('backups.uploadError'));
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateBackup();
      onRefresh?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('backups.createError'));
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backup: BackupItem) => {
    if (restoreConfirmById[backup.id] !== CONFIRM_RESTORE) {
      alert(t('backups.restoreConfirm'));
      return;
    }
    setRestoringId(backup.id);
    try {
      await ApiService.restoreBackup(backup.id);
      alert(t('backups.restoreSuccess'));
      setRestoreConfirmById(prev => ({ ...prev, [backup.id]: '' }));
      onRefresh?.();
      await loadMaintenance();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('backups.restoreError'));
    } finally {
      setRestoringId(null);
    }
  };

  const handleApplyMigrations = async () => {
    if (applyConfirm !== CONFIRM_APPLY) {
      alert(t('backups.migrationsApplyConfirm'));
      return;
    }
    setApplyingMigrations(true);
    try {
      const result = await ApiService.applyPendingMigrations();
      setMaintenance(prev => prev ? { ...prev, migrations: result.migrations } : prev);
      setApplyConfirm('');
      if (result.applied.length === 0) {
        alert(t('backups.migrationsApplyNone'));
      } else {
        alert(t('backups.migrationsApplySuccess', { count: result.applied.length }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t('backups.migrationsApplyError'));
    } finally {
      setApplyingMigrations(false);
    }
  };

  const handleRollbackMigration = async () => {
    if (rollbackConfirm !== CONFIRM_ROLLBACK) {
      alert(t('backups.migrationsRollbackConfirm'));
      return;
    }
    setRollingBack(true);
    try {
      const result = await ApiService.rollbackLastMigration();
      setMaintenance(prev => prev ? { ...prev, migrations: result.migrations } : prev);
      setRollbackConfirm('');
      if (!result.rolled_back) {
        alert(result.message || t('backups.migrationsRollbackNone'));
      } else {
        alert(t('backups.migrationsRollbackSuccess', { file: result.rolled_back }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : t('backups.migrationsRollbackError'));
    } finally {
      setRollingBack(false);
    }
  };

  const canDownload = (backup: BackupItem) => Boolean(backup.storage_path);
  const migrations = maintenance?.migrations;

  const scopeLabel = (scope: string) => {
    if (scope === 'bootstrap') return t('backups.scopeBootstrap');
    if (scope === 'schema') return t('backups.scopeSchema');
    if (scope === 'data') return t('backups.scopeData');
    return scope;
  };

  return (
    <div className={embedded ? 'admin-backups-embedded space-y-4' : 'admin-backups p-4 sm:p-6 space-y-6 bg-slate-950 min-h-full text-slate-100'}>

      <div className={`admin-backups-toolbar flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl`}>
        {!embedded && (
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <span>{t('backups.title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('backups.subtitleReal')}</p>
          </div>
        )}
        {embedded && (
          <p className="text-xs text-slate-400">{t('backups.subtitleReal')}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {canBackup && (
            <button
              type="button"
              onClick={() => void loadMaintenance()}
              disabled={maintenanceLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold transition-colors min-h-[2.75rem] sm:min-h-0"
            >
              <RefreshCw className={`w-4 h-4 ${maintenanceLoading ? 'animate-spin' : ''}`} />
              <span>{t('backups.refresh')}</span>
            </button>
          )}
          {canBackup ? (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="admin-backups-create-btn flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors min-h-[2.75rem] sm:min-h-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? t('backups.creating') : t('backups.create')}</span>
            </button>
          ) : (
            <div className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
              {t('backups.adminRequired')}
            </div>
          )}
        </div>
      </div>

      {canBackup && (
        <>
          <section className="admin-db-tools bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              {t('backups.sectionTools')}
            </h3>
            {maintenanceError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {maintenanceError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['pg_dump', 'psql'] as const).map(tool => {
                const available = maintenance?.tools[tool === 'pg_dump' ? 'pg_dump' : 'psql'];
                return (
                  <div
                    key={tool}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60"
                  >
                    <span className="font-mono text-xs text-slate-300">
                      {tool === 'pg_dump' ? t('backups.toolPgDump') : t('backups.toolPsql')}
                    </span>
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${available ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {available ? t('backups.toolAvailable') : t('backups.toolUnavailable')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-db-migrations bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  {t('backups.sectionMigrations')}
                </h3>
                {migrations && (
                  <p className="text-xs text-slate-400 mt-1">
                    {t('backups.migrationsSummary', {
                      applied: migrations.applied_count,
                      total: migrations.total_count,
                      pending: migrations.pending_count,
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2 p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('backups.migrationsApply')}
                </label>
                <input
                  type="text"
                  value={applyConfirm}
                  onChange={e => setApplyConfirm(e.target.value)}
                  placeholder={CONFIRM_APPLY}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyMigrations()}
                  disabled={applyingMigrations || !migrations?.pending_count}
                  className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {applyingMigrations ? t('backups.migrationsApplying') : t('backups.migrationsApply')}
                </button>
              </div>

              <div className="space-y-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                  {t('backups.migrationsRollback')}
                </label>
                <input
                  type="text"
                  value={rollbackConfirm}
                  onChange={e => setRollbackConfirm(e.target.value)}
                  placeholder={CONFIRM_ROLLBACK}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/30 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void handleRollbackMigration()}
                  disabled={rollingBack}
                  className="w-full px-3 py-2 bg-amber-600/30 hover:bg-amber-600/50 disabled:opacity-40 text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/30 transition-colors"
                >
                  {rollingBack ? t('backups.migrationsRollingBack') : t('backups.migrationsRollback')}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto responsive-table-wrap rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">{t('backups.colMigrationFile')}</th>
                    <th className="p-3 hidden sm:table-cell">{t('backups.colMigrationScope')}</th>
                    <th className="p-3">{t('backups.colMigrationStatus')}</th>
                    <th className="p-3 hidden md:table-cell">{t('backups.colMigrationApplied')}</th>
                    <th className="p-3 hidden lg:table-cell">{t('backups.colMigrationRollback')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(migrations?.migrations ?? []).map(row => (
                    <tr key={row.file} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-[11px] text-indigo-300">{row.file}</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded border border-slate-700 text-[10px] text-slate-400">
                          {scopeLabel(row.scope)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.applied
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {row.applied ? t('backups.migrationApplied') : t('backups.migrationPending')}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-[11px] text-slate-500">
                        {row.applied_at ? new Date(row.applied_at).toLocaleString(localeTag) : '—'}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-[11px]">
                        {row.has_rollback ? t('backups.migrationRollbackYes') : t('backups.migrationRollbackNo')}
                      </td>
                    </tr>
                  ))}
                  {!migrations?.migrations.length && !maintenanceLoading && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        {maintenanceError || '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 px-1">
          <Database className="w-4 h-4 text-indigo-400" />
          {t('backups.sectionBackups')}
          <span className="text-slate-500 font-normal">({backups.length})</span>
        </h3>

        <div className="admin-backups-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {backups.length === 0 && (
            <div className="col-span-full text-center text-sm text-slate-500 py-8 border border-dashed border-slate-800 rounded-2xl">
              —
            </div>
          )}
          {backups.map(bkp => (
            <div key={bkp.id} className="admin-backup-card bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    bkp.type === 'auto' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}>
                    {bkp.type === 'auto' ? t('backups.typeAuto') : t('backups.typeManual')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{(bkp.size_bytes / 1024).toFixed(1)} KB</span>
                </div>

                <h3 className="font-mono font-bold text-white text-xs mt-3 truncate">{bkp.filename}</h3>
                <p className="text-xs text-slate-400 mt-1">{getBackupDescription(bkp)}</p>
                {bkp.cloud_uploaded && (
                  <p className="text-[10px] text-emerald-400 mt-1">☁ {bkp.cloud_provider}</p>
                )}
              </div>

              {canBackup && canDownload(bkp) && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                    {t('backups.restore')}
                  </label>
                  <input
                    type="text"
                    value={restoreConfirmById[bkp.id] ?? ''}
                    onChange={e => setRestoreConfirmById(prev => ({ ...prev, [bkp.id]: e.target.value }))}
                    placeholder={CONFIRM_RESTORE}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/30 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    autoComplete="off"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                <span className="text-[11px] text-slate-500">{new Date(bkp.created_at).toLocaleString(localeTag)}</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {canBackup && !bkp.cloud_uploaded && (
                    <button
                      type="button"
                      onClick={() => uploadToCloud(bkp)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1 transition-colors"
                      title={t('backups.uploadCloud')}
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadBackupFile(bkp)}
                    disabled={!canDownload(bkp)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                    title={canDownload(bkp) ? undefined : t('backups.fileMissing')}
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">{t('backups.downloadSql')}</span>
                  </button>
                  {canBackup && canDownload(bkp) && (
                    <button
                      type="button"
                      onClick={() => void restoreBackup(bkp)}
                      disabled={restoringId === bkp.id || restoreConfirmById[bkp.id] !== CONFIRM_RESTORE}
                      className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 disabled:opacity-40 text-amber-300 rounded-xl font-semibold flex items-center gap-1 transition-colors border border-amber-500/30"
                      title={t('backups.restore')}
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoringId === bkp.id ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{t('backups.restore')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
