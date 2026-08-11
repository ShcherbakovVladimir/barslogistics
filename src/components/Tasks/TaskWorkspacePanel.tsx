import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Paperclip, Send, Check, X, Clock, FileText, Plus, Download, Trash2, Loader2,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import type {
  KanbanMilestoneStatus,
  KanbanTask,
  KanbanTaskAttachment,
  KanbanTaskMessage,
  KanbanTaskMilestone,
  KanbanTaskWorkspace,
  User,
} from '../../types';
import { TasksDatePicker, normalizeDueDate } from './TasksDatePicker';

interface TaskWorkspacePanelProps {
  task: KanbanTask;
  currentUser: User;
  done: boolean;
  refreshKey?: number;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function timeProgress(task: KanbanTask): {
  pct: number;
  remainingMs: number | null;
  totalMs: number | null;
  overdue: boolean;
  labelKey: 'noDue' | 'done' | 'overdue' | 'remaining';
} {
  if (task.completed_at) {
    return { pct: 100, remainingMs: 0, totalMs: null, overdue: false, labelKey: 'done' };
  }
  if (!task.due_date) {
    return { pct: 0, remainingMs: null, totalMs: null, overdue: false, labelKey: 'noDue' };
  }
  const start = new Date(task.started_at || task.created_at).getTime();
  const due = new Date(`${normalizeDueDate(task.due_date)}T23:59:59`).getTime();
  const now = Date.now();
  const totalMs = Math.max(due - start, 1);
  const remainingMs = due - now;
  const elapsed = now - start;
  const pct = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
  if (remainingMs < 0) {
    return { pct: 100, remainingMs, totalMs, overdue: true, labelKey: 'overdue' };
  }
  return { pct, remainingMs, totalMs, overdue: false, labelKey: 'remaining' };
}

function formatDuration(ms: number, locale: string): string {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / (24 * 3600_000));
  const hours = Math.floor((abs % (24 * 3600_000)) / 3600_000);
  if (locale === 'en') {
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((abs % 3600_000) / 60_000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  if (days > 0) return `${days} д ${hours} ч`;
  const mins = Math.floor((abs % 3600_000) / 60_000);
  return hours > 0 ? `${hours} ч ${mins} мин` : `${mins} мин`;
}

const MILESTONE_FLOW: KanbanMilestoneStatus[] = [
  'pending', 'in_progress', 'awaiting_approval', 'approved',
];

export const TaskWorkspacePanel: React.FC<TaskWorkspacePanelProps> = ({
  task,
  currentUser,
  done,
  refreshKey = 0,
}) => {
  const { t, locale } = useI18n();
  const [workspace, setWorkspace] = useState<KanbanTaskWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDue, setMilestoneDue] = useState('');
  const [tab, setTab] = useState<'chat' | 'stages' | 'files'>('chat');
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ApiService.getKanbanTaskWorkspace(task.id);
      setWorkspace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [task.id, t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [workspace?.messages.length, tab]);

  const progress = useMemo(() => timeProgress(task), [task]);

  const sendMessage = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await ApiService.postKanbanTaskMessage(task.id, draft.trim());
      setWorkspace(prev => prev ? { ...prev, messages: [...prev.messages, message] } : prev);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File) => {
    setSending(true);
    setError('');
    try {
      const result = await ApiService.uploadKanbanTaskAttachment(task.id, file, {
        message: draft.trim() || undefined,
      });
      setWorkspace(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: [result.attachment, ...prev.attachments],
          messages: result.message ? [...prev.messages, result.message] : prev.messages,
        };
      });
      setDraft('');
      setTab('files');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addMilestone = async () => {
    if (!milestoneTitle.trim()) return;
    setSending(true);
    try {
      const m = await ApiService.createKanbanMilestone(task.id, {
        title: milestoneTitle.trim(),
        due_date: milestoneDue || null,
      });
      setWorkspace(prev => prev ? { ...prev, milestones: [...prev.milestones, m] } : prev);
      setMilestoneTitle('');
      setMilestoneDue('');
      setTab('stages');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSending(false);
    }
  };

  const setMilestoneStatus = async (m: KanbanTaskMilestone, status: KanbanMilestoneStatus) => {
    setSending(true);
    try {
      const updated = await ApiService.updateKanbanMilestone(m.id, { status });
      setWorkspace(prev => prev
        ? { ...prev, milestones: prev.milestones.map(x => (x.id === m.id ? updated : x)) }
        : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSending(false);
    }
  };

  if (loading && !workspace) {
    return (
      <div className="tasks-workspace-loading">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const messages = workspace?.messages ?? [];
  const milestones = workspace?.milestones ?? [];
  const attachments = workspace?.attachments ?? [];
  const approvedCount = milestones.filter(m => m.status === 'approved').length;
  const milestonePct = milestones.length
    ? Math.round((approvedCount / milestones.length) * 100)
    : 0;

  return (
    <div className="tasks-workspace">
      {error ? <div className="tasks-drawer-error">{error}</div> : null}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
        }}
      />

      <div className={`tasks-time-bar${progress.overdue ? ' is-overdue' : ''}${done ? ' is-done' : ''}`}>
        <div className="tasks-time-bar-head">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {progress.labelKey === 'noDue' && t('tasks.timeNoDue')}
            {progress.labelKey === 'done' && t('tasks.timeDone')}
            {progress.labelKey === 'overdue' && t('tasks.timeOverdue', {
              duration: formatDuration(progress.remainingMs ?? 0, locale),
            })}
            {progress.labelKey === 'remaining' && t('tasks.timeRemaining', {
              duration: formatDuration(progress.remainingMs ?? 0, locale),
            })}
          </span>
          {milestones.length > 0 ? (
            <span className="tasks-time-bar-meta">
              {t('tasks.milestonesProgress', { done: approvedCount, total: milestones.length, pct: milestonePct })}
            </span>
          ) : null}
        </div>
        <div className="tasks-time-bar-track" aria-hidden>
          <div className="tasks-time-bar-fill" style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      <div className="tasks-workspace-tabs">
        {([
          ['chat', t('tasks.tabChat')],
          ['stages', t('tasks.tabStages')],
          ['files', t('tasks.tabFiles')],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tasks-workspace-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'chat' && messages.length > 0 ? ` (${messages.length})` : ''}
            {id === 'stages' && milestones.length > 0 ? ` (${approvedCount}/${milestones.length})` : ''}
            {id === 'files' && attachments.length > 0 ? ` (${attachments.length})` : ''}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div className="tasks-workspace-chat">
          <div className="tasks-workspace-chat-list">
            {messages.length === 0 ? (
              <p className="tasks-empty py-3">{t('tasks.chatEmpty')}</p>
            ) : (
              messages.map((msg: KanbanTaskMessage) => (
                <div
                  key={msg.id}
                  className={`tasks-chat-bubble${msg.author_id === currentUser.id ? ' is-own' : ''}`}
                >
                  <div className="tasks-chat-meta">
                    <span className="font-semibold">{msg.author_name}</span>
                    <span>
                      {new Date(msg.created_at).toLocaleString(locale === 'en' ? 'en-GB' : 'ru-RU', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="tasks-chat-body whitespace-pre-wrap">{msg.body}</div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="tasks-workspace-compose">
            <button
              type="button"
              className="tasks-drawer-icon-btn"
              onClick={() => fileRef.current?.click()}
              disabled={sending}
              title={t('tasks.attachFile')}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              className="tasks-input flex-1"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={t('tasks.chatPlaceholder')}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="button"
              className="tasks-primary-btn"
              disabled={sending || !draft.trim()}
              onClick={() => void sendMessage()}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'stages' ? (
        <div className="tasks-workspace-stages space-y-2">
          <div className="tasks-milestone-create">
            <input
              className="tasks-input flex-1"
              value={milestoneTitle}
              onChange={e => setMilestoneTitle(e.target.value)}
              placeholder={t('tasks.milestoneTitle')}
            />
            <TasksDatePicker value={milestoneDue} onChange={setMilestoneDue} />
            <button
              type="button"
              className="tasks-primary-btn"
              disabled={sending || !milestoneTitle.trim()}
              onClick={() => void addMilestone()}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('tasks.addMilestone')}
            </button>
          </div>
          {milestones.length === 0 ? (
            <p className="tasks-empty py-3">{t('tasks.milestonesEmpty')}</p>
          ) : (
            milestones.map(m => (
              <div key={m.id} className={`tasks-milestone tasks-milestone--${m.status}`}>
                <div className="tasks-milestone-head">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m.title}</div>
                    <div className="tasks-milestone-status">
                      {t(`tasks.milestoneStatus.${m.status}`)}
                      {m.due_date ? ` · ${m.due_date}` : ''}
                      {m.approved_by_name ? ` · ${m.approved_by_name}` : ''}
                    </div>
                  </div>
                  <div className="tasks-milestone-actions">
                    {m.status !== 'approved' && m.status !== 'rejected' ? (
                      <>
                        {MILESTONE_FLOW.indexOf(m.status) < MILESTONE_FLOW.indexOf('awaiting_approval') ? (
                          <button
                            type="button"
                            className="tasks-secondary-btn"
                            disabled={sending}
                            onClick={() => void setMilestoneStatus(
                              m,
                              MILESTONE_FLOW[MILESTONE_FLOW.indexOf(m.status) + 1],
                            )}
                          >
                            {t('tasks.milestoneAdvance')}
                          </button>
                        ) : null}
                        {m.status === 'awaiting_approval' ? (
                          <>
                            <button
                              type="button"
                              className="tasks-primary-btn"
                              disabled={sending}
                              onClick={() => void setMilestoneStatus(m, 'approved')}
                              title={t('tasks.milestoneApprove')}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="tasks-danger-btn"
                              disabled={sending}
                              onClick={() => void setMilestoneStatus(m, 'rejected')}
                              title={t('tasks.milestoneReject')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : null}
                      </>
                    ) : null}
                    {m.status === 'rejected' ? (
                      <button
                        type="button"
                        className="tasks-secondary-btn"
                        disabled={sending}
                        onClick={() => void setMilestoneStatus(m, 'in_progress')}
                      >
                        {t('tasks.milestoneRestart')}
                      </button>
                    ) : null}
                  </div>
                </div>
                {m.description ? <p className="tasks-milestone-desc">{m.description}</p> : null}
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'files' ? (
        <div className="tasks-workspace-files space-y-2">
          <button
            type="button"
            className="tasks-secondary-btn w-full"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
          >
            <Paperclip className="w-3.5 h-3.5" />
            {t('tasks.attachFile')}
          </button>
          {attachments.length === 0 ? (
            <p className="tasks-empty py-3">{t('tasks.filesEmpty')}</p>
          ) : (
            attachments.map((a: KanbanTaskAttachment) => (
              <div key={a.id} className="tasks-file-row">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate text-xs">{a.original_name}</div>
                  <div className="text-[10px] text-slate-400">
                    {a.uploaded_by_name}
                    {' · '}
                    {new Date(a.created_at).toLocaleString(locale === 'en' ? 'en-GB' : 'ru-RU', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                    {' · '}
                    {formatBytes(a.size_bytes)}
                  </div>
                </div>
                <button
                  type="button"
                  className="tasks-drawer-icon-btn"
                  onClick={() => void ApiService.downloadKanbanTaskAttachment(a.id, a.original_name)}
                  title={t('common.details')}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {(a.uploaded_by === currentUser.id || currentUser.role === 'admin') ? (
                  <button
                    type="button"
                    className="tasks-drawer-icon-btn tasks-drawer-icon-btn--danger"
                    onClick={() => {
                      void (async () => {
                        await ApiService.deleteKanbanTaskAttachment(a.id);
                        setWorkspace(prev => prev
                          ? { ...prev, attachments: prev.attachments.filter(x => x.id !== a.id) }
                          : prev);
                      })();
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
