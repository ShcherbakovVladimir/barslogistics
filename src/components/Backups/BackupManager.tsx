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
    <div className={embedded ? 'admin-backups-embedded space-y-4' : 'admin-backups admin-panel space-y-6'}>

      <div className="admin-backups-toolbar">
        {!embedded ? (
          <div>
            <h2 className="admin-form-heading">
              <Cloud aria-hidden />
              <span>{t('backups.title')}</span>
            </h2>
            <p className="admin-section-hint mt-1">{t('backups.subtitleReal')}</p>
          </div>
        ) : (
          <p className="admin-section-hint">{t('backups.subtitleReal')}</p>
        )}

        <div className="admin-backups-toolbar-actions">
          {canBackup ? (
            <button
              type="button"
              onClick={() => void loadMaintenance()}
              disabled={maintenanceLoading}
              className="admin-form-actions-btn admin-form-actions-btn--secondary admin-backups-toolbar-btn--secondary"
            >
              <RefreshCw className={maintenanceLoading ? 'animate-spin' : ''} aria-hidden />
              <span>{t('backups.refresh')}</span>
            </button>
          ) : null}
          {canBackup ? (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="admin-backups-create-btn"
            >
              <Plus aria-hidden />
              <span>{creating ? t('backups.creating') : t('backups.create')}</span>
            </button>
          ) : (
            <div className="admin-alert admin-alert--warn">
              {t('backups.adminRequired')}
            </div>
          )}
        </div>
      </div>

      {canBackup && (
        <>
          <section className="admin-db-tools space-y-4">
            <h3 className="admin-form-heading">
              <Wrench aria-hidden />
              {t('backups.sectionTools')}
            </h3>
            {maintenanceError ? (
              <p className="admin-alert admin-alert--error flex items-center gap-1.5">
                <AlertTriangle aria-hidden />
                {maintenanceError}
              </p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['pg_dump', 'psql'] as const).map(tool => {
                const available = maintenance?.tools[tool === 'pg_dump' ? 'pg_dump' : 'psql'];
                return (
                  <div key={tool} className="admin-db-tool-row">
                    <span className="admin-db-tool-name">
                      {tool === 'pg_dump' ? t('backups.toolPgDump') : t('backups.toolPsql')}
                    </span>
                    <span className={`admin-db-tool-status ${available ? 'admin-db-tool-status--ok' : 'admin-db-tool-status--warn'}`}>
                      {available ? <CheckCircle2 aria-hidden /> : <XCircle aria-hidden />}
                      {available ? t('backups.toolAvailable') : t('backups.toolUnavailable')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-db-migrations space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="admin-form-heading">
                  <GitBranch aria-hidden />
                  {t('backups.sectionMigrations')}
                </h3>
                {migrations ? (
                  <p className="admin-section-hint mt-1">
                    {t('backups.migrationsSummary', {
                      applied: migrations.applied_count,
                      total: migrations.total_count,
                      pending: migrations.pending_count,
                    })}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="admin-db-migration-box space-y-2">
                <label className="admin-db-migration-label" htmlFor="backup-apply-confirm">
                  {t('backups.migrationsApply')}
                </label>
                <input
                  id="backup-apply-confirm"
                  type="text"
                  value={applyConfirm}
                  onChange={e => setApplyConfirm(e.target.value)}
                  placeholder={CONFIRM_APPLY}
                  className="admin-db-field"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void handleApplyMigrations()}
                  disabled={applyingMigrations || !migrations?.pending_count}
                  className="admin-db-migration-submit"
                >
                  {applyingMigrations ? t('backups.migrationsApplying') : t('backups.migrationsApply')}
                </button>
              </div>

              <div className="admin-db-migration-box admin-db-migration-box--warn space-y-2">
                <label className="admin-db-migration-label admin-db-migration-label--warn" htmlFor="backup-rollback-confirm">
                  {t('backups.migrationsRollback')}
                </label>
                <input
                  id="backup-rollback-confirm"
                  type="text"
                  value={rollbackConfirm}
                  onChange={e => setRollbackConfirm(e.target.value)}
                  placeholder={CONFIRM_ROLLBACK}
                  className="admin-db-field admin-db-field--warn"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void handleRollbackMigration()}
                  disabled={rollingBack}
                  className="admin-db-migration-submit admin-db-migration-submit--warn"
                >
                  {rollingBack ? t('backups.migrationsRollingBack') : t('backups.migrationsRollback')}
                </button>
              </div>
            </div>

            <div className="admin-backups-table-panel overflow-x-auto responsive-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('backups.colMigrationFile')}</th>
                    <th className="hidden sm:table-cell">{t('backups.colMigrationScope')}</th>
                    <th>{t('backups.colMigrationStatus')}</th>
                    <th className="hidden md:table-cell">{t('backups.colMigrationApplied')}</th>
                    <th className="hidden lg:table-cell">{t('backups.colMigrationRollback')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(migrations?.migrations ?? []).map(row => (
                    <tr key={row.file}>
                      <td className="admin-backups-row-file">{row.file}</td>
                      <td className="hidden sm:table-cell">
                        <span className="admin-backups-scope-badge">
                          {scopeLabel(row.scope)}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-backups-migration-badge ${
                          row.applied ? 'admin-backups-migration-badge--applied' : 'admin-backups-migration-badge--pending'
                        }`}>
                          {row.applied ? t('backups.migrationApplied') : t('backups.migrationPending')}
                        </span>
                      </td>
                      <td className="hidden md:table-cell admin-backups-row-muted">
                        {row.applied_at ? new Date(row.applied_at).toLocaleString(localeTag) : '—'}
                      </td>
                      <td className="hidden lg:table-cell admin-backups-row-muted">
                        {row.has_rollback ? t('backups.migrationRollbackYes') : t('backups.migrationRollbackNo')}
                      </td>
                    </tr>
                  ))}
                  {!migrations?.migrations.length && !maintenanceLoading && (
                    <tr>
                      <td colSpan={5} className="admin-backups-empty-cell">
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
        <h3 className="admin-backups-section-title">
          <Database aria-hidden />
          {t('backups.sectionBackups')}
          <span className="admin-backups-section-count">({backups.length})</span>
        </h3>

        <div className="admin-backups-grid">
          {backups.length === 0 && (
            <div className="admin-backups-empty">—</div>
          )}
          {backups.map(bkp => (
            <article key={bkp.id} className="admin-backup-card">
              <div>
                <div className="admin-backup-card-head">
                  <span className={`admin-backup-type-badge ${
                    bkp.type === 'auto' ? 'admin-backup-type-badge--auto' : 'admin-backup-type-badge--manual'
                  }`}>
                    {bkp.type === 'auto' ? t('backups.typeAuto') : t('backups.typeManual')}
                  </span>
                  <span className="admin-backup-size">{(bkp.size_bytes / 1024).toFixed(1)} KB</span>
                </div>

                <h4 className="admin-backup-filename">{bkp.filename}</h4>
                <p className="admin-backup-desc">{getBackupDescription(bkp)}</p>
                {bkp.cloud_uploaded ? (
                  <p className="admin-backup-cloud">☁ {bkp.cloud_provider}</p>
                ) : null}
              </div>

              {canBackup && canDownload(bkp) ? (
                <div className="admin-backup-restore-box space-y-2">
                  <label className="admin-backup-restore-label" htmlFor={`restore-${bkp.id}`}>
                    {t('backups.restore')}
                  </label>
                  <input
                    id={`restore-${bkp.id}`}
                    type="text"
                    value={restoreConfirmById[bkp.id] ?? ''}
                    onChange={e => setRestoreConfirmById(prev => ({ ...prev, [bkp.id]: e.target.value }))}
                    placeholder={CONFIRM_RESTORE}
                    className="admin-db-field admin-db-field--warn"
                    autoComplete="off"
                  />
                </div>
              ) : null}

              <footer className="admin-backup-card-footer">
                <span className="admin-backup-date">{new Date(bkp.created_at).toLocaleString(localeTag)}</span>
                <div className="admin-backup-actions">
                  {canBackup && !bkp.cloud_uploaded ? (
                    <button
                      type="button"
                      onClick={() => uploadToCloud(bkp)}
                      className="admin-backup-btn admin-backup-btn--upload"
                      title={t('backups.uploadCloud')}
                    >
                      <Upload aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => downloadBackupFile(bkp)}
                    disabled={!canDownload(bkp)}
                    className="admin-backup-btn admin-backup-btn--download"
                    title={canDownload(bkp) ? undefined : t('backups.fileMissing')}
                  >
                    <Download aria-hidden />
                    <span className="hidden sm:inline">{t('backups.downloadSql')}</span>
                  </button>
                  {canBackup && canDownload(bkp) ? (
                    <button
                      type="button"
                      onClick={() => void restoreBackup(bkp)}
                      disabled={restoringId === bkp.id || restoreConfirmById[bkp.id] !== CONFIRM_RESTORE}
                      className="admin-backup-btn admin-backup-btn--restore"
                      title={t('backups.restore')}
                    >
                      <RotateCcw className={restoringId === bkp.id ? 'animate-spin' : ''} aria-hidden />
                      <span className="hidden sm:inline">{t('backups.restore')}</span>
                    </button>
                  ) : null}
                </div>
              </footer>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};
