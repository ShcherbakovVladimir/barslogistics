import type { Express } from 'express';
import path from 'path';
import multer from 'multer';
import { requireAuth, type AuthRequest } from '../auth.js';
import type {
  KanbanBoardType,
  KanbanClassOfService,
  KanbanMilestoneStatus,
} from '../../src/types.js';
import {
  notifyBoardMembersAdded,
  notifyTaskAssigned,
  notifyTaskMilestone,
  notifyTaskMessage,
  notifyTaskStatus,
} from '../notifications/personalEvents.js';
import { contentDispositionAttachment } from '../chat/filename.js';
import { broadcastTaskEvent } from './broadcast.js';
import { getTaskMaxFileBytes } from './files.js';
import {
  countOpenTasksForUser,
  createBoard,
  createColumn,
  createSwimlane,
  createTask,
  deleteBoard,
  deleteTask,
  getBoardDetail,
  getBoardParticipantIds,
  getTaskById,
  listBoardsForUser,
  moveTask,
  updateBoard,
  updateTask,
  userCanAccessBoard,
} from './repository.js';
import {
  addTaskMessage,
  createMilestone,
  deleteMilestone,
  deleteTaskAttachment,
  getTaskAttachmentForDownload,
  getTaskWorkspace,
  saveTaskAttachment,
  updateMilestoneStatus,
} from './workspace.js';

const BOARD_TYPES: KanbanBoardType[] = [
  'classic', 'personal', 'team', 'process', 'project', 'swimlanes',
];
const COS: KanbanClassOfService[] = ['expedite', 'fixed_date', 'standard', 'intangible'];

const taskUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getTaskMaxFileBytes() },
});

async function emitBoardSync(boardId: string, event: string, extra: Record<string, unknown> = {}) {
  const detail = await getBoardDetail(boardId);
  if (!detail) return;
  const participants = await getBoardParticipantIds(boardId);
  broadcastTaskEvent(participants, {
    type: event,
    board_id: boardId,
    board: detail,
    ...extra,
  });
}

export function registerTaskRoutes(app: Express): void {
  app.get('/api/tasks/boards', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const data = await listBoardsForUser(user.id);
      const open_assigned = await countOpenTasksForUser(user.id);
      res.json({ status: 'success', data: { boards: data, open_assigned } });
    } catch (error) {
      console.error('GET /api/tasks/boards:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/tasks/boards/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      if (!(await userCanAccessBoard(req.params.id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const data = await getBoardDetail(req.params.id);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json({ status: 'success', data });
    } catch (error) {
      console.error('GET /api/tasks/boards/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/tasks/boards', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const body = req.body as {
        name?: string;
        description?: string;
        board_type?: string;
        member_ids?: string[];
      };
      if (!body.name?.trim()) return res.status(400).json({ error: 'name is required' });
      const boardType = (body.board_type || 'classic') as KanbanBoardType;
      if (!BOARD_TYPES.includes(boardType)) {
        return res.status(400).json({ error: 'Invalid board_type' });
      }
      const data = await createBoard({
        name: body.name,
        description: body.description,
        board_type: boardType,
        owner_id: user.id,
        member_ids: body.member_ids,
      });
      await emitBoardSync(data.id, 'TASK_BOARD_UPDATED');
      if (body.member_ids?.length) {
        await notifyBoardMembersAdded({
          boardId: data.id,
          boardName: data.name,
          memberIds: body.member_ids,
          actorUserId: user.id,
        });
      }
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      console.error('POST /api/tasks/boards:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
    }
  });

  app.patch('/api/tasks/boards/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const body = req.body as { name?: string; description?: string; member_ids?: string[] };
      const before = await getBoardDetail(req.params.id);
      const data = await updateBoard(req.params.id, user.id, body);
      if (!data) return res.status(404).json({ error: 'Not found' });
      await emitBoardSync(data.id, 'TASK_BOARD_UPDATED');

      if (body.member_ids && before) {
        const prev = new Set(before.member_ids ?? []);
        const added = body.member_ids.filter(id => id && !prev.has(id));
        await notifyBoardMembersAdded({
          boardId: data.id,
          boardName: data.name,
          memberIds: added,
          actorUserId: user.id,
        });
      }

      res.json({ status: 'success', data });
    } catch (error) {
      console.error('PATCH /api/tasks/boards/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete('/api/tasks/boards/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const participants = await getBoardParticipantIds(req.params.id);
      const ok = await deleteBoard(req.params.id, user.id);
      if (!ok) return res.status(404).json({ error: 'Not found or not owner' });
      broadcastTaskEvent(participants, {
        type: 'TASK_BOARD_DELETED',
        board_id: req.params.id,
      });
      res.json({ status: 'success', data: { deleted: true } });
    } catch (error) {
      console.error('DELETE /api/tasks/boards/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/tasks/boards/:id/columns', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      if (!(await userCanAccessBoard(req.params.id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { name, wip_limit } = req.body as { name?: string; wip_limit?: number | null };
      if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
      const column = await createColumn(req.params.id, name, wip_limit);
      await emitBoardSync(req.params.id, 'TASK_BOARD_UPDATED');
      res.status(201).json({ status: 'success', data: column });
    } catch (error) {
      console.error('POST /api/tasks/boards/:id/columns:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/tasks/boards/:id/swimlanes', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      if (!(await userCanAccessBoard(req.params.id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { name } = req.body as { name?: string };
      if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
      const lane = await createSwimlane(req.params.id, name);
      await emitBoardSync(req.params.id, 'TASK_BOARD_UPDATED');
      res.status(201).json({ status: 'success', data: lane });
    } catch (error) {
      console.error('POST /api/tasks/boards/:id/swimlanes:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/tasks/boards/:id/tasks', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      if (!(await userCanAccessBoard(req.params.id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const body = req.body as {
        column_id?: string;
        swimlane_id?: string | null;
        title?: string;
        description?: string;
        class_of_service?: string;
        assignee_id?: string | null;
        due_date?: string | null;
        priority?: number;
      };
      if (!body.title?.trim() || !body.column_id) {
        return res.status(400).json({ error: 'title and column_id are required' });
      }
      const cos = (body.class_of_service || 'standard') as KanbanClassOfService;
      if (!COS.includes(cos)) return res.status(400).json({ error: 'Invalid class_of_service' });

      const task = await createTask({
        board_id: req.params.id,
        column_id: body.column_id,
        swimlane_id: body.swimlane_id,
        title: body.title,
        description: body.description,
        class_of_service: cos,
        assignee_id: body.assignee_id,
        creator_id: user.id,
        due_date: body.due_date,
        priority: body.priority,
      });

      await emitBoardSync(req.params.id, 'TASK_UPDATED', { task });

      await notifyTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: task.assignee_id ?? '',
        actorUserId: user.id,
        isNew: true,
      });

      res.status(201).json({ status: 'success', data: task });
    } catch (error) {
      console.error('POST /api/tasks/boards/:id/tasks:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' });
    }
  });

  app.patch('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const existing = await getTaskById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      if (!(await userCanAccessBoard(existing.board_id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const body = req.body as {
        title?: string;
        description?: string;
        class_of_service?: string;
        assignee_id?: string | null;
        due_date?: string | null;
        priority?: number;
        swimlane_id?: string | null;
      };
      if (body.class_of_service && !COS.includes(body.class_of_service as KanbanClassOfService)) {
        return res.status(400).json({ error: 'Invalid class_of_service' });
      }

      const task = await updateTask(req.params.id, {
        ...body,
        class_of_service: body.class_of_service as KanbanClassOfService | undefined,
      });
      if (!task) return res.status(404).json({ error: 'Not found' });

      await emitBoardSync(task.board_id, 'TASK_UPDATED', { task });

      if (
        body.assignee_id
        && body.assignee_id !== existing.assignee_id
      ) {
        await notifyTaskAssigned({
          taskId: task.id,
          taskTitle: task.title,
          assigneeId: body.assignee_id ?? '',
          actorUserId: user.id,
          isNew: false,
        });
      }

      res.json({ status: 'success', data: task });
    } catch (error) {
      console.error('PATCH /api/tasks/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/tasks/:id/move', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const existing = await getTaskById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      if (!(await userCanAccessBoard(existing.board_id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const body = req.body as {
        column_id?: string;
        position?: number;
        swimlane_id?: string | null;
      };
      if (!body.column_id || body.position == null) {
        return res.status(400).json({ error: 'column_id and position are required' });
      }

      const task = await moveTask(req.params.id, {
        column_id: body.column_id,
        position: Number(body.position),
        swimlane_id: body.swimlane_id,
      });
      if (!task) return res.status(404).json({ error: 'Not found' });

      await emitBoardSync(task.board_id, 'TASK_UPDATED', { task });

      if (task.column_id !== existing.column_id) {
        const board = await getBoardDetail(task.board_id);
        const columnName = board?.columns.find(c => c.id === task.column_id)?.name ?? '';
        await notifyTaskStatus({
          taskId: task.id,
          taskTitle: task.title,
          columnName,
          actorUserId: user.id,
          assigneeId: task.assignee_id,
          creatorId: task.creator_id,
        });
      }

      res.json({ status: 'success', data: task });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg.startsWith('WIP')) return res.status(409).json({ error: msg });
      console.error('POST /api/tasks/:id/move:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const existing = await getTaskById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      if (!(await userCanAccessBoard(existing.board_id, user.id))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      await deleteTask(req.params.id);
      await emitBoardSync(existing.board_id, 'TASK_UPDATED', { deleted_task_id: existing.id });
      res.json({ status: 'success', data: { deleted: true } });
    } catch (error) {
      console.error('DELETE /api/tasks/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // ── Task workspace: messages, milestones, attachments ──

  app.get('/api/tasks/:id/workspace', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const data = await getTaskWorkspace(req.params.id, user.id);
      res.json({ status: 'success', data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg === 'Task not found') return res.status(404).json({ error: msg });
      console.error('GET /api/tasks/:id/workspace:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/tasks/:id/messages', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const ws = await getTaskWorkspace(req.params.id, user.id);
      res.json({ status: 'success', data: ws.messages });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg === 'Task not found') return res.status(404).json({ error: msg });
      console.error('GET /api/tasks/:id/messages:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/tasks/:id/messages', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const body = req.body as { body?: string; milestone_id?: string | null };
      const message = await addTaskMessage(
        req.params.id,
        user.id,
        String(body.body ?? ''),
        body.milestone_id,
      );
      const task = await getTaskById(req.params.id);
      if (task) {
        await emitBoardSync(task.board_id, 'TASK_WORKSPACE_UPDATED', {
          task_id: task.id,
          message,
        });
        await notifyTaskMessage({
          taskId: task.id,
          taskTitle: task.title,
          actorUserId: user.id,
          actorName: user.name,
          preview: message.body,
        });
      }
      res.status(201).json({ status: 'success', data: message });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg === 'Task not found') return res.status(404).json({ error: msg });
      if (msg.includes('required')) return res.status(400).json({ error: msg });
      console.error('POST /api/tasks/:id/messages:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/tasks/:id/milestones', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const body = req.body as { title?: string; description?: string; due_date?: string | null };
      const milestone = await createMilestone(req.params.id, user.id, {
        title: String(body.title ?? ''),
        description: body.description,
        due_date: body.due_date,
      });
      const task = await getTaskById(req.params.id);
      if (task) {
        await emitBoardSync(task.board_id, 'TASK_WORKSPACE_UPDATED', {
          task_id: task.id,
          milestone,
        });
      }
      res.status(201).json({ status: 'success', data: milestone });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg.includes('required')) return res.status(400).json({ error: msg });
      console.error('POST /api/tasks/:id/milestones:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/tasks/milestones/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const body = req.body as {
        status?: string;
        rejection_reason?: string | null;
        title?: string;
        description?: string;
        due_date?: string | null;
      };
      const milestone = await updateMilestoneStatus(req.params.id, user.id, {
        status: body.status as KanbanMilestoneStatus | undefined,
        rejection_reason: body.rejection_reason,
        title: body.title,
        description: body.description,
        due_date: body.due_date,
      });
      const task = await getTaskById(milestone.task_id);
      if (task) {
        await emitBoardSync(task.board_id, 'TASK_WORKSPACE_UPDATED', {
          task_id: task.id,
          milestone,
        });
        if (body.status === 'awaiting_approval' || body.status === 'approved' || body.status === 'rejected') {
          await notifyTaskMilestone({
            taskId: task.id,
            taskTitle: task.title,
            milestoneTitle: milestone.title,
            status: milestone.status,
            actorUserId: user.id,
          });
        }
      }
      res.json({ status: 'success', data: milestone });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg === 'Milestone not found') return res.status(404).json({ error: msg });
      console.error('PATCH /api/tasks/milestones/:id:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/tasks/milestones/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const taskId = await deleteMilestone(req.params.id, user.id);
      const task = await getTaskById(taskId);
      if (task) {
        await emitBoardSync(task.board_id, 'TASK_WORKSPACE_UPDATED', {
          task_id: task.id,
          deleted_milestone_id: req.params.id,
        });
      }
      res.json({ status: 'success', data: { deleted: true } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg === 'Milestone not found') return res.status(404).json({ error: msg });
      if (msg.includes('approved')) return res.status(409).json({ error: msg });
      console.error('DELETE /api/tasks/milestones/:id:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.post(
    '/api/tasks/:id/attachments',
    requireAuth,
    (req, res, next) => {
      taskUpload.single('file')(req, res, (err: unknown) => {
        if (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          return res.status(400).json({ error: msg });
        }
        next();
      });
    },
    async (req, res) => {
      try {
        const user = (req as AuthRequest).user;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'file is required' });
        const milestoneId = req.body?.milestone_id ? String(req.body.milestone_id) : null;
        const messageBody = req.body?.message ? String(req.body.message) : undefined;
        const result = await saveTaskAttachment(user.id, req.params.id, file, {
          milestoneId,
          messageBody,
        });
        const task = await getTaskById(req.params.id);
        if (task) {
          await emitBoardSync(task.board_id, 'TASK_WORKSPACE_UPDATED', {
            task_id: task.id,
            attachment: result.attachment,
            message: result.message,
          });
          await notifyTaskMessage({
            taskId: task.id,
            taskTitle: task.title,
            actorUserId: user.id,
            actorName: user.name,
            preview: `📎 ${result.attachment.original_name}`,
          });
        }
        res.status(201).json({ status: 'success', data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Database error';
        if (msg === 'Forbidden') return res.status(403).json({ error: msg });
        if (msg === 'Task not found') return res.status(404).json({ error: msg });
        console.error('POST /api/tasks/:id/attachments:', error);
        res.status(500).json({ error: msg });
      }
    },
  );

  app.get('/api/tasks/attachments/:id/download', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const file = await getTaskAttachmentForDownload(req.params.id, user.id);
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', contentDispositionAttachment(file.originalName));
      res.sendFile(path.resolve(file.storagePath));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Download failed';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg.includes('not found') || msg.includes('missing')) return res.status(404).json({ error: msg });
      console.error('GET /api/tasks/attachments/:id/download:', error);
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/tasks/attachments/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const taskId = await deleteTaskAttachment(req.params.id, user.id);
      const task = await getTaskById(taskId);
      if (task) {
        await emitBoardSync(task.board_id, 'TASK_WORKSPACE_UPDATED', {
          task_id: task.id,
          deleted_attachment_id: req.params.id,
        });
      }
      res.json({ status: 'success', data: { deleted: true } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Database error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      if (msg.includes('not found')) return res.status(404).json({ error: msg });
      console.error('DELETE /api/tasks/attachments/:id:', error);
      res.status(500).json({ error: msg });
    }
  });
}
