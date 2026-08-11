import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Plus, LayoutGrid, Trash2, UserRound, Calendar, ChevronLeft, Loader2, ListTodo, LifeBuoy,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { SearchableSelect } from '../UI/SearchableSelect';
import {
  TasksDatePicker,
  formatDueDateLabel,
  isDueDateOverdue,
  isDueDateToday,
  normalizeDueDate,
} from './TasksDatePicker';
import { TaskWorkspacePanel } from './TaskWorkspacePanel';
import type {
  ChatUserDirectoryEntry,
  KanbanBoard,
  KanbanBoardDetail,
  KanbanBoardType,
  KanbanClassOfService,
  KanbanTask,
  User,
  SupportTicket,
  SupportTicketCategory,
} from '../../types';

export interface TasksDrawerProps {
  open: boolean;
  onClose: () => void;
  currentUser: User;
  openAssignedCount?: number;
  onOpenAssignedCountChange?: (count: number) => void;
  boardSync?: KanbanBoardDetail | null;
  deletedBoardId?: string | null;
  focusTaskId?: string | null;
  onFocusTaskConsumed?: () => void;
  focusBoardId?: string | null;
  onFocusBoardConsumed?: () => void;
  openSupport?: boolean;
  onOpenSupportConsumed?: () => void;
  pageContext?: string;
  workspaceRefresh?: { taskId: string; key: number } | null;
}

const BOARD_TYPES: KanbanBoardType[] = [
  'classic', 'personal', 'team', 'process', 'project', 'swimlanes',
];

const COS_OPTIONS: KanbanClassOfService[] = [
  'expedite', 'fixed_date', 'standard', 'intangible',
];

const COS_CLASS: Record<KanbanClassOfService, string> = {
  expedite: 'tasks-cos--expedite',
  fixed_date: 'tasks-cos--fixed',
  standard: 'tasks-cos--standard',
  intangible: 'tasks-cos--intangible',
};

const SUPPORT_CATEGORIES: SupportTicketCategory[] = ['bug', 'question', 'suggestion', 'other'];

type TaskDraft = {
  title: string;
  description: string;
  class_of_service: KanbanClassOfService;
  assignee_id: string;
  due_date: string;
  column_id: string;
  swimlane_id: string;
};

const emptyDraft = (columnId = '', swimlaneId = ''): TaskDraft => ({
  title: '',
  description: '',
  class_of_service: 'standard',
  assignee_id: '',
  due_date: '',
  column_id: columnId,
  swimlane_id: swimlaneId,
});

export const TasksDrawer: React.FC<TasksDrawerProps> = ({
  open,
  onClose,
  currentUser,
  onOpenAssignedCountChange,
  boardSync,
  deletedBoardId,
  focusTaskId,
  onFocusTaskConsumed,
  focusBoardId,
  onFocusBoardConsumed,
  openSupport,
  onOpenSupportConsumed,
  pageContext,
  workspaceRefresh,
}) => {
  const { t, locale } = useI18n();
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<KanbanBoardDetail | null>(null);
  const [users, setUsers] = useState<ChatUserDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'list' | 'board' | 'create-board' | 'create-task' | 'edit-task' | 'support'>('list');
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyDraft());
  const [boardDraft, setBoardDraft] = useState({
    name: '',
    description: '',
    board_type: 'classic' as KanbanBoardType,
    member_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportDraft, setSupportDraft] = useState({
    subject: '',
    message: '',
    category: 'other' as SupportTicketCategory,
  });
  const [supportSuccess, setSupportSuccess] = useState('');
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const dragTaskIdRef = useRef<string | null>(null);
  const movingRef = useRef(false);

  const refreshBoards = useCallback(async () => {
    const data = await ApiService.getKanbanBoards();
    setBoards(data.boards);
    onOpenAssignedCountChange?.(data.open_assigned);
    return data;
  }, [onOpenAssignedCountChange]);

  const loadBoard = useCallback(async (boardId: string) => {
    const detail = await ApiService.getKanbanBoard(boardId);
    setActiveBoard(detail);
    setView('board');
    return detail;
  }, []);

  const loadSupportTickets = useCallback(async () => {
    const tickets = await ApiService.getSupportTickets();
    setSupportTickets(tickets);
    return tickets;
  }, []);

  const openSupportView = useCallback(async () => {
    setView('support');
    setSupportSuccess('');
    setError('');
    try {
      await loadSupportTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.loadFailed'));
    }
  }, [loadSupportTickets, t]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [boardData, chatUsers] = await Promise.all([
          refreshBoards(),
          ApiService.getChatUsers(),
        ]);
        if (cancelled) return;
        setUsers(chatUsers);
        if (activeBoard) {
          const still = boardData.boards.find(b => b.id === activeBoard.id);
          if (still) await loadBoard(activeBoard.id);
          else {
            setActiveBoard(null);
            setView('list');
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('tasks.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload on open
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'create-task' || view === 'edit-task' || view === 'create-board') {
          setView(activeBoard ? 'board' : 'list');
          setEditingTask(null);
          return;
        }
        if (view === 'support') {
          setView('list');
          setSupportSuccess('');
          return;
        }
        if (view === 'board') {
          setActiveBoard(null);
          setView('list');
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, view, activeBoard, onClose]);

  useEffect(() => {
    if (!boardSync) return;
    setBoards(prev => {
      const rest = prev.filter(b => b.id !== boardSync.id);
      return [{ ...boardSync, task_count: boardSync.tasks.length }, ...rest];
    });
    setActiveBoard(prev => (prev?.id === boardSync.id ? boardSync : prev));
  }, [boardSync]);

  useEffect(() => {
    if (!deletedBoardId) return;
    setBoards(prev => prev.filter(b => b.id !== deletedBoardId));
    setActiveBoard(prev => {
      if (prev?.id !== deletedBoardId) return prev;
      setView('list');
      return null;
    });
  }, [deletedBoardId]);

  useEffect(() => {
    if (!open || !focusBoardId) return;
    let cancelled = false;
    void (async () => {
      setError('');
      try {
        const board = await ApiService.getKanbanBoard(focusBoardId);
        if (cancelled) return;
        setActiveBoard(board);
        setBoards(prev => {
          const rest = prev.filter(b => b.id !== board.id);
          return [{ ...board, task_count: board.tasks.length }, ...rest];
        });
        setEditingTask(null);
        setView('board');
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '';
          setError(
            msg === 'Board not found' || msg === 'Not found' || /not found/i.test(msg)
              ? t('tasks.boardNotFound')
              : msg === 'Forbidden'
                ? t('tasks.boardNotFound')
                : (msg || t('tasks.loadFailed')),
          );
        }
      } finally {
        onFocusBoardConsumed?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, focusBoardId, onFocusBoardConsumed, t]);

  useEffect(() => {
    if (!open || !openSupport) return;
    void openSupportView();
    onOpenSupportConsumed?.();
  }, [open, openSupport, onOpenSupportConsumed, openSupportView]);

  useEffect(() => {
    if (!open || !focusTaskId) return;
    let cancelled = false;
    void (async () => {
      setError('');
      try {
        // Legacy board-invite notifications used link_type=task with a kboard_* id
        if (focusTaskId.startsWith('kboard_')) {
          const board = await ApiService.getKanbanBoard(focusTaskId);
          if (cancelled) return;
          setActiveBoard(board);
          setBoards(prev => {
            const rest = prev.filter(b => b.id !== board.id);
            return [{ ...board, task_count: board.tasks.length }, ...rest];
          });
          setEditingTask(null);
          setView('board');
          return;
        }

        const ws = await ApiService.getKanbanTaskWorkspace(focusTaskId);
        if (cancelled) return;
        const board = await ApiService.getKanbanBoard(ws.task.board_id);
        if (cancelled) return;
        setActiveBoard(board);
        setBoards(prev => {
          const rest = prev.filter(b => b.id !== board.id);
          return [{ ...board, task_count: board.tasks.length }, ...rest];
        });
        setEditingTask(ws.task);
        setTaskDraft({
          title: ws.task.title,
          description: ws.task.description,
          class_of_service: ws.task.class_of_service,
          assignee_id: ws.task.assignee_id ?? '',
          due_date: normalizeDueDate(ws.task.due_date),
          column_id: ws.task.column_id,
          swimlane_id: ws.task.swimlane_id ?? '',
        });
        setView('edit-task');
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '';
          if (msg === 'Task not found' || /task not found/i.test(msg)) {
            setError(t('tasks.taskNotFound'));
          } else if (msg === 'Board not found' || /board not found/i.test(msg)) {
            setError(t('tasks.boardNotFound'));
          } else {
            setError(msg || t('tasks.loadFailed'));
          }
        }
      } finally {
        onFocusTaskConsumed?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, focusTaskId, onFocusTaskConsumed, t]);

  const doneColumnId = useMemo(() => {
    if (!activeBoard?.columns.length) return null;
    return activeBoard.columns[activeBoard.columns.length - 1]?.id ?? null;
  }, [activeBoard]);

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, KanbanTask[]>();
    if (!activeBoard) return map;
    for (const col of activeBoard.columns) map.set(col.id, []);
    for (const task of activeBoard.tasks) {
      const list = map.get(task.column_id) ?? [];
      list.push(task);
      map.set(task.column_id, list);
    }
    for (const [, list] of map) list.sort((a, b) => a.position - b.position);
    return map;
  }, [activeBoard]);

  const boardTypeOptions = useMemo(
    () => BOARD_TYPES.map(type => ({ value: type, label: t(`tasks.boardType.${type}`) })),
    [t],
  );

  const cosOptions = useMemo(
    () => COS_OPTIONS.map(c => ({ value: c, label: t(`tasks.cos.${c}`) })),
    [t],
  );

  const columnOptions = useMemo(
    () => (activeBoard?.columns ?? []).map(c => ({ value: c.id, label: c.name })),
    [activeBoard],
  );

  const swimlaneOptions = useMemo(
    () => [
      { value: '', label: t('tasks.noSwimlane') },
      ...(activeBoard?.swimlanes ?? []).map(s => ({ value: s.id, label: s.name })),
    ],
    [activeBoard, t],
  );

  const assigneeOptions = useMemo(() => {
    const opts = [
      { value: '', label: t('tasks.unassigned') },
      { value: currentUser.id, label: `${currentUser.name} (${t('tasks.me')})` },
    ];
    for (const u of users) {
      if (u.id === currentUser.id) continue;
      opts.push({ value: u.id, label: `${u.name} (@${u.username})` });
    }
    return opts;
  }, [users, currentUser, t]);

  const memberOptions = useMemo(
    () => users
      .filter(u => u.id !== currentUser.id)
      .map(u => ({ value: u.id, label: `${u.name} (@${u.username})` })),
    [users, currentUser.id],
  );

  const handleCreateBoard = async () => {
    if (!boardDraft.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const created = await ApiService.createKanbanBoard({
        name: boardDraft.name,
        description: boardDraft.description,
        board_type: boardDraft.board_type,
        member_ids: boardDraft.member_ids,
      });
      await refreshBoards();
      setActiveBoard(created);
      setView('board');
      setBoardDraft({ name: '', description: '', board_type: 'classic', member_ids: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSupport = async () => {
    const subject = supportDraft.subject.trim();
    const message = supportDraft.message.trim();
    if (subject.length < 3) {
      setError(t('tasks.supportSubjectRequired'));
      return;
    }
    if (message.length < 10) {
      setError(t('tasks.supportMessageRequired'));
      return;
    }
    setSaving(true);
    setError('');
    setSupportSuccess('');
    try {
      await ApiService.createSupportTicket({
        subject,
        message,
        category: supportDraft.category,
        page_context: pageContext || null,
      });
      setSupportDraft({ subject: '', message: '', category: 'other' });
      setSupportSuccess(t('tasks.supportSent'));
      await loadSupportTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!window.confirm(t('tasks.confirmDeleteBoard'))) return;
    setError('');
    try {
      await ApiService.deleteKanbanBoard(boardId);
      await refreshBoards();
      if (activeBoard?.id === boardId) {
        setActiveBoard(null);
        setView('list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    }
  };

  const openCreateTask = (columnId: string, swimlaneId = '') => {
    setEditingTask(null);
    setTaskDraft(emptyDraft(columnId, swimlaneId));
    setView('create-task');
  };

  const openEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setTaskDraft({
      title: task.title,
      description: task.description,
      class_of_service: task.class_of_service,
      assignee_id: task.assignee_id ?? '',
      due_date: normalizeDueDate(task.due_date),
      column_id: task.column_id,
      swimlane_id: task.swimlane_id ?? '',
    });
    setView('edit-task');
  };

  const handleSaveTask = async () => {
    if (!activeBoard || !taskDraft.title.trim() || !taskDraft.column_id) return;
    const due = normalizeDueDate(taskDraft.due_date);
    if (taskDraft.class_of_service === 'fixed_date' && !due) {
      setError(t('tasks.dueDateRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingTask) {
        await ApiService.updateKanbanTask(editingTask.id, {
          title: taskDraft.title,
          description: taskDraft.description,
          class_of_service: taskDraft.class_of_service,
          assignee_id: taskDraft.assignee_id || null,
          due_date: due || null,
          swimlane_id: taskDraft.swimlane_id || null,
        });
        if (taskDraft.column_id !== editingTask.column_id) {
          const colTasks = tasksByColumn.get(taskDraft.column_id) ?? [];
          await ApiService.moveKanbanTask(editingTask.id, {
            column_id: taskDraft.column_id,
            position: colTasks.length,
            swimlane_id: taskDraft.swimlane_id || null,
          });
        }
      } else {
        await ApiService.createKanbanTask(activeBoard.id, {
          column_id: taskDraft.column_id,
          swimlane_id: taskDraft.swimlane_id || null,
          title: taskDraft.title,
          description: taskDraft.description,
          class_of_service: taskDraft.class_of_service,
          assignee_id: taskDraft.assignee_id || null,
          due_date: due || null,
        });
      }
      await loadBoard(activeBoard.id);
      await refreshBoards();
      setView('board');
      setEditingTask(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask || !activeBoard) return;
    if (!window.confirm(t('tasks.confirmDeleteTask'))) return;
    setSaving(true);
    try {
      await ApiService.deleteKanbanTask(editingTask.id);
      await loadBoard(activeBoard.id);
      await refreshBoards();
      setView('board');
      setEditingTask(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const clearDragState = () => {
    dragTaskIdRef.current = null;
    setDragTaskId(null);
    setDropTargetKey(null);
  };

  const handleDragStart = (taskId: string, e: React.DragEvent) => {
    dragTaskIdRef.current = taskId;
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    // Improve drag ghost in some browsers
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 12, 12);
    }
  };

  const handleDropOnColumn = async (
    columnId: string,
    dropKey: string,
    e: React.DragEvent,
    swimlaneId?: string | null,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain') || dragTaskIdRef.current || dragTaskId;
    clearDragState();
    if (!taskId || !activeBoard || movingRef.current) return;

    const task = activeBoard.tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextSwimlane = swimlaneId !== undefined ? swimlaneId : task.swimlane_id;
    if (task.column_id === columnId && (task.swimlane_id ?? null) === (nextSwimlane ?? null)) {
      return;
    }

    const colTasks = (tasksByColumn.get(columnId) ?? []).filter(t => t.id !== task.id);
    const position = colTasks.length;
    const snapshot = activeBoard;

    // Optimistic UI — move card immediately
    setActiveBoard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => (
          t.id === taskId
            ? { ...t, column_id: columnId, swimlane_id: nextSwimlane ?? null, position }
            : t
        )),
      };
    });

    movingRef.current = true;
    try {
      await ApiService.moveKanbanTask(taskId, {
        column_id: columnId,
        position,
        swimlane_id: nextSwimlane ?? null,
      });
      await loadBoard(activeBoard.id);
      await refreshBoards();
    } catch (err) {
      setActiveBoard(snapshot);
      setError(err instanceof Error ? err.message : t('tasks.saveFailed'));
    } finally {
      movingRef.current = false;
      void dropKey;
    }
  };

  if (!open) return null;

  const title = view === 'support'
    ? t('tasks.supportTitle')
    : view === 'list' || view === 'create-board'
      ? t('tasks.title')
      : activeBoard?.name ?? t('tasks.title');

  const dueRequired = taskDraft.class_of_service === 'fixed_date';

  return (
    <div className="tasks-drawer-root" role="presentation">
      <button type="button" className="tasks-drawer-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <aside
        className="tasks-drawer-panel bg-slate-900/96 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl text-slate-200"
        role="dialog"
        aria-modal="true"
        aria-label={t('tasks.title')}
      >
        <header className="tasks-drawer-header border-b border-slate-700">
          <div className="tasks-drawer-header-main min-w-0">
            {(view === 'board' || view === 'create-task' || view === 'edit-task' || view === 'support') && (
              <button
                type="button"
                className="tasks-drawer-icon-btn"
                onClick={() => {
                  if (view === 'create-task' || view === 'edit-task') {
                    setView('board');
                    setEditingTask(null);
                  } else if (view === 'support') {
                    setView('list');
                    setSupportSuccess('');
                  } else {
                    setActiveBoard(null);
                    setView('list');
                  }
                }}
                aria-label={t('common.back')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0 flex items-start gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0">
                <h2 className="tasks-drawer-title truncate">{title}</h2>
                {activeBoard && view === 'board' ? (
                  <p className="tasks-drawer-subtitle truncate">
                    {t(`tasks.boardType.${activeBoard.board_type}`)}
                  </p>
                ) : view === 'support' ? (
                  <p className="tasks-drawer-subtitle">{t('tasks.supportSubtitle')}</p>
                ) : (
                  <p className="tasks-drawer-subtitle">{t('tasks.subtitle')}</p>
                )}
              </div>
            </div>
          </div>
          <button type="button" className="tasks-drawer-icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <X className="w-4 h-4" />
          </button>
        </header>

        {error ? <div className="tasks-drawer-error">{error}</div> : null}

        <div className="tasks-drawer-body scroll-area">
          {loading ? (
            <div className="tasks-drawer-loading">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('common.loading')}</span>
            </div>
          ) : null}

          {!loading && view === 'list' ? (
            <div className="tasks-board-list space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="tasks-primary-btn flex-1"
                  onClick={() => setView('create-board')}
                >
                  <Plus className="w-4 h-4" />
                  {t('tasks.createBoard')}
                </button>
                <button
                  type="button"
                  className="tasks-secondary-btn flex-1"
                  onClick={() => void openSupportView()}
                >
                  <LifeBuoy className="w-4 h-4" />
                  {t('tasks.support')}
                </button>
              </div>
              {boards.length === 0 ? (
                <p className="tasks-empty">{t('tasks.noBoards')}</p>
              ) : (
                boards.map(board => (
                  <div key={board.id} className="tasks-board-card">
                    <button
                      type="button"
                      className="tasks-board-card-main"
                      onClick={() => void loadBoard(board.id)}
                    >
                      <LayoutGrid className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="min-w-0 text-left">
                        <div className="font-semibold truncate">{board.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {t(`tasks.boardType.${board.board_type}`)}
                          {' · '}
                          {t('tasks.taskCount', { count: board.task_count ?? 0 })}
                        </div>
                      </div>
                    </button>
                    {board.owner_id === currentUser.id ? (
                      <button
                        type="button"
                        className="tasks-drawer-icon-btn tasks-drawer-icon-btn--danger"
                        onClick={() => void handleDeleteBoard(board.id)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : null}

          {!loading && view === 'support' ? (
            <div className="space-y-4">
              {supportSuccess ? (
                <div className="tasks-drawer-success">{supportSuccess}</div>
              ) : null}
              <div className="tasks-form space-y-3">
                <label className="tasks-field">
                  <span>{t('tasks.supportCategory')}</span>
                  <SearchableSelect
                    value={supportDraft.category}
                    onChange={v => setSupportDraft(d => ({ ...d, category: v as SupportTicketCategory }))}
                    options={SUPPORT_CATEGORIES.map(c => ({
                      value: c,
                      label: t(`tasks.supportCategoryOptions.${c}`),
                    }))}
                    searchable={false}
                    className="tasks-select"
                    panelClassName="tasks-dropdown-panel"
                    triggerClassName="tasks-select-trigger"
                  />
                </label>
                <label className="tasks-field">
                  <span>{t('tasks.supportSubject')}</span>
                  <input
                    value={supportDraft.subject}
                    onChange={e => setSupportDraft(d => ({ ...d, subject: e.target.value }))}
                    className="tasks-input"
                    maxLength={200}
                  />
                </label>
                <label className="tasks-field">
                  <span>{t('tasks.supportMessage')}</span>
                  <textarea
                    value={supportDraft.message}
                    onChange={e => setSupportDraft(d => ({ ...d, message: e.target.value }))}
                    className="tasks-input min-h-[6rem]"
                    maxLength={4000}
                  />
                </label>
                <button
                  type="button"
                  className="tasks-primary-btn w-full"
                  disabled={saving || supportDraft.subject.trim().length < 3 || supportDraft.message.trim().length < 10}
                  onClick={() => void handleSubmitSupport()}
                >
                  {saving ? t('common.saving') : t('tasks.supportSubmit')}
                </button>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {currentUser.role === 'admin' ? t('tasks.supportAllTickets') : t('tasks.supportMyTickets')}
                </h3>
                {supportTickets.length === 0 ? (
                  <p className="tasks-empty">{t('tasks.supportNoTickets')}</p>
                ) : (
                  supportTickets.map(ticket => (
                    <div key={ticket.id} className="tasks-board-card">
                      <div className="tasks-board-card-main cursor-default">
                        <LifeBuoy className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="min-w-0 text-left">
                          <div className="font-semibold truncate">{ticket.subject}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {t(`tasks.supportCategoryOptions.${ticket.category}`)}
                            {' · '}
                            {t(`tasks.supportStatus.${ticket.status}`)}
                            {currentUser.role === 'admin' && ticket.user_name ? ` · ${ticket.user_name}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1 line-clamp-2">{ticket.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {new Date(ticket.created_at).toLocaleString(locale === 'en' ? 'en-GB' : 'ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {!loading && view === 'create-board' ? (
            <div className="tasks-form space-y-3">
              <label className="tasks-field">
                <span>{t('tasks.boardName')}</span>
                <input
                  value={boardDraft.name}
                  onChange={e => setBoardDraft(d => ({ ...d, name: e.target.value }))}
                  className="tasks-input"
                />
              </label>
              <label className="tasks-field">
                <span>{t('tasks.boardDescription')}</span>
                <textarea
                  value={boardDraft.description}
                  onChange={e => setBoardDraft(d => ({ ...d, description: e.target.value }))}
                  className="tasks-input min-h-[4rem]"
                />
              </label>
              <div className="tasks-field">
                <span>{t('tasks.boardTypeLabel')}</span>
                <SearchableSelect
                  value={boardDraft.board_type}
                  onChange={v => setBoardDraft(d => ({ ...d, board_type: v as KanbanBoardType }))}
                  options={boardTypeOptions}
                  searchable={false}
                  className="tasks-select"
                  panelClassName="tasks-dropdown-panel"
                  triggerClassName="tasks-select-trigger"
                />
              </div>
              <p className="text-[11px] text-slate-400">{t(`tasks.boardTypeHint.${boardDraft.board_type}`)}</p>
              {(boardDraft.board_type === 'team' || boardDraft.board_type === 'project') && (
                <div className="tasks-field">
                  <span>{t('tasks.members')}</span>
                  <div className="tasks-member-list">
                    {memberOptions.length === 0 ? (
                      <p className="tasks-empty py-2">{t('tasks.unassigned')}</p>
                    ) : (
                      memberOptions.map(m => {
                        const checked = boardDraft.member_ids.includes(m.value);
                        return (
                          <label key={m.value} className={`tasks-member-option${checked ? ' is-selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setBoardDraft(d => ({
                                  ...d,
                                  member_ids: checked
                                    ? d.member_ids.filter(id => id !== m.value)
                                    : [...d.member_ids, m.value],
                                }));
                              }}
                            />
                            <span className="truncate">{m.label}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" className="tasks-secondary-btn flex-1" onClick={() => setView('list')}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="tasks-primary-btn flex-1"
                  disabled={saving || !boardDraft.name.trim()}
                  onClick={() => void handleCreateBoard()}
                >
                  {saving ? t('common.saving') : t('tasks.createBoard')}
                </button>
              </div>
            </div>
          ) : null}

          {!loading && activeBoard && view === 'board' ? (
            <div className={`tasks-kanban${dragTaskId ? ' is-dragging' : ''}`}>
              {activeBoard.swimlanes.length > 0 ? (
                activeBoard.swimlanes.map(lane => (
                  <div key={lane.id} className="tasks-swimlane">
                    <div className="tasks-swimlane-title">{lane.name}</div>
                    <div className="tasks-columns">
                      {activeBoard.columns.map(col => {
                        const dropKey = `${lane.id}:${col.id}`;
                        const tasks = (tasksByColumn.get(col.id) ?? [])
                          .filter(task => task.swimlane_id === lane.id);
                        return (
                          <Column
                            key={dropKey}
                            name={col.name}
                            wipLimit={col.wip_limit}
                            count={tasks.length}
                            isDropTarget={dropTargetKey === dropKey}
                            onAdd={() => openCreateTask(col.id, lane.id)}
                            onDragOver={e => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dropTargetKey !== dropKey) setDropTargetKey(dropKey);
                            }}
                            onDrop={e => void handleDropOnColumn(col.id, dropKey, e, lane.id)}
                          >
                            {tasks.map(task => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                dragging={dragTaskId === task.id}
                                done={task.column_id === doneColumnId}
                                locale={locale}
                                onOpen={() => openEditTask(task)}
                                onDragStart={e => handleDragStart(task.id, e)}
                                onDragEnd={clearDragState}
                                cosLabel={t(`tasks.cos.${task.class_of_service}`)}
                                overdueLabel={t('tasks.overdue')}
                                todayLabel={t('tasks.dueToday')}
                              />
                            ))}
                          </Column>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="tasks-columns">
                  {activeBoard.columns.map(col => {
                    const dropKey = col.id;
                    const tasks = tasksByColumn.get(col.id) ?? [];
                    return (
                      <Column
                        key={col.id}
                        name={col.name}
                        wipLimit={col.wip_limit}
                        count={tasks.length}
                        isDropTarget={dropTargetKey === dropKey}
                        onAdd={() => openCreateTask(col.id)}
                        onDragOver={e => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dropTargetKey !== dropKey) setDropTargetKey(dropKey);
                        }}
                        onDrop={e => void handleDropOnColumn(col.id, dropKey, e)}
                      >
                        {tasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            dragging={dragTaskId === task.id}
                            done={task.column_id === doneColumnId}
                            locale={locale}
                            onOpen={() => openEditTask(task)}
                            onDragStart={e => handleDragStart(task.id, e)}
                            onDragEnd={clearDragState}
                            cosLabel={t(`tasks.cos.${task.class_of_service}`)}
                            overdueLabel={t('tasks.overdue')}
                            todayLabel={t('tasks.dueToday')}
                          />
                        ))}
                      </Column>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {!loading && activeBoard && (view === 'create-task' || view === 'edit-task') ? (
            <div className="tasks-form space-y-3">
              <label className="tasks-field">
                <span>{t('tasks.taskTitle')}</span>
                <input
                  value={taskDraft.title}
                  onChange={e => setTaskDraft(d => ({ ...d, title: e.target.value }))}
                  className="tasks-input"
                />
              </label>
              <label className="tasks-field">
                <span>{t('tasks.taskDescription')}</span>
                <textarea
                  value={taskDraft.description}
                  onChange={e => setTaskDraft(d => ({ ...d, description: e.target.value }))}
                  className="tasks-input min-h-[5rem]"
                />
              </label>
              <div className="tasks-field">
                <span>{t('tasks.column')}</span>
                <SearchableSelect
                  value={taskDraft.column_id}
                  onChange={v => setTaskDraft(d => ({ ...d, column_id: v }))}
                  options={columnOptions}
                  searchable={false}
                  className="tasks-select"
                  panelClassName="tasks-dropdown-panel"
                  triggerClassName="tasks-select-trigger"
                />
              </div>
              {activeBoard.swimlanes.length > 0 ? (
                <div className="tasks-field">
                  <span>{t('tasks.swimlane')}</span>
                  <SearchableSelect
                    value={taskDraft.swimlane_id}
                    onChange={v => setTaskDraft(d => ({ ...d, swimlane_id: v }))}
                    options={swimlaneOptions}
                    searchable={false}
                    className="tasks-select"
                    panelClassName="tasks-dropdown-panel"
                    triggerClassName="tasks-select-trigger"
                  />
                </div>
              ) : null}
              <div className="tasks-field">
                <span>{t('tasks.classOfService')}</span>
                <SearchableSelect
                  value={taskDraft.class_of_service}
                  onChange={v => setTaskDraft(d => ({
                    ...d,
                    class_of_service: v as KanbanClassOfService,
                  }))}
                  options={cosOptions}
                  searchable={false}
                  className="tasks-select"
                  panelClassName="tasks-dropdown-panel"
                  triggerClassName="tasks-select-trigger"
                />
              </div>
              <div className="tasks-field">
                <span>{t('tasks.assignee')}</span>
                <SearchableSelect
                  value={taskDraft.assignee_id}
                  onChange={v => setTaskDraft(d => ({ ...d, assignee_id: v }))}
                  options={assigneeOptions}
                  searchable={assigneeOptions.length > 6}
                  className="tasks-select"
                  panelClassName="tasks-dropdown-panel"
                  triggerClassName="tasks-select-trigger"
                />
              </div>
                <div className="tasks-field">
                <span>
                  {t('tasks.dueDate')}
                  {dueRequired ? ' *' : ''}
                </span>
                <TasksDatePicker
                  value={taskDraft.due_date}
                  onChange={v => setTaskDraft(d => ({ ...d, due_date: v }))}
                  required={dueRequired}
                />
                {dueRequired ? (
                  <span className="tasks-field-hint">{t('tasks.dueDateRequiredHint')}</span>
                ) : null}
              </div>

              {view === 'edit-task' && editingTask ? (
                <TaskWorkspacePanel
                  task={{
                    ...editingTask,
                    title: taskDraft.title || editingTask.title,
                    due_date: taskDraft.due_date || null,
                    class_of_service: taskDraft.class_of_service,
                    assignee_id: taskDraft.assignee_id || null,
                    column_id: taskDraft.column_id,
                  }}
                  currentUser={currentUser}
                  done={taskDraft.column_id === doneColumnId}
                  refreshKey={
                    workspaceRefresh?.taskId === editingTask.id
                      ? workspaceRefresh.key
                      : 0
                  }
                />
              ) : null}

              <div className="flex gap-2">
                {view === 'edit-task' ? (
                  <button
                    type="button"
                    className="tasks-danger-btn"
                    disabled={saving}
                    onClick={() => void handleDeleteTask()}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="tasks-secondary-btn flex-1"
                  onClick={() => {
                    setView('board');
                    setEditingTask(null);
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="tasks-primary-btn flex-1"
                  disabled={saving || !taskDraft.title.trim() || (dueRequired && !taskDraft.due_date)}
                  onClick={() => void handleSaveTask()}
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

function Column({
  name,
  wipLimit,
  count,
  children,
  isDropTarget,
  onAdd,
  onDragOver,
  onDrop,
}: {
  name: string;
  wipLimit: number | null;
  count: number;
  children: React.ReactNode;
  isDropTarget?: boolean;
  onAdd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const overWip = wipLimit != null && count >= wipLimit;
  return (
    <div
      className={`tasks-column${overWip ? ' is-wip-full' : ''}${isDropTarget ? ' is-drop-target' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="tasks-column-head">
        <div className="min-w-0">
          <div className="tasks-column-name truncate">{name}</div>
          <div className="tasks-column-meta">
            {count}
            {wipLimit != null ? ` / ${wipLimit}` : ''}
          </div>
        </div>
        <button type="button" className="tasks-drawer-icon-btn" onClick={onAdd} aria-label="+">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="tasks-column-body space-y-2">{children}</div>
    </div>
  );
}

function TaskCard({
  task,
  dragging,
  done,
  locale,
  onOpen,
  onDragStart,
  onDragEnd,
  cosLabel,
  overdueLabel,
  todayLabel,
}: {
  task: KanbanTask;
  dragging?: boolean;
  done: boolean;
  locale: string;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  cosLabel: string;
  overdueLabel: string;
  todayLabel: string;
}) {
  const overdue = isDueDateOverdue(task.due_date, done);
  const dueToday = isDueDateToday(task.due_date);
  const dueLabel = task.due_date ? formatDueDateLabel(task.due_date, locale) : '';

  return (
    <div
      className={`tasks-card ${COS_CLASS[task.class_of_service]}${dragging ? ' is-dragging' : ''}${overdue ? ' is-overdue' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <button type="button" className="tasks-card-main" onClick={onOpen}>
        <div className="tasks-card-title">{task.title}</div>
        <div className="tasks-card-meta">
          <span className="tasks-cos-badge">{cosLabel}</span>
          {task.assignee_name ? (
            <span className="inline-flex items-center gap-0.5 truncate">
              <UserRound className="w-3 h-3 shrink-0" />
              {task.assignee_name}
            </span>
          ) : null}
          {task.due_date ? (
            <span className={`inline-flex items-center gap-0.5 tasks-due-chip${overdue ? ' is-overdue' : ''}${dueToday && !overdue ? ' is-today' : ''}`}>
              <Calendar className="w-3 h-3 shrink-0" />
              {overdue ? overdueLabel : dueToday ? todayLabel : dueLabel}
            </span>
          ) : null}
        </div>
      </button>
    </div>
  );
}
