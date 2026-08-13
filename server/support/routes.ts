import type { Express } from 'express';
import { requireAuth, type AuthRequest } from '../auth.js';
import type { SupportTicketCategory, SupportTicketStatus } from '../../src/types.js';
import { notifyUsers } from '../notifications/service.js';
import { getServerT } from '../../src/i18n/translations.js';
import {
  createSupportTicket,
  getSupportTicketById,
  listAdminUserIds,
  listSupportTicketsForUser,
  updateSupportTicketStatus,
} from './repository.js';

const CATEGORIES: SupportTicketCategory[] = ['bug', 'question', 'suggestion', 'other'];
const STATUSES: SupportTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const st = getServerT('ru');

function requireAdmin(req: AuthRequest, res: import('express').Response): boolean {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

export function registerSupportRoutes(app: Express): void {
  app.get('/api/support/tickets', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const isAdmin = user.role === 'admin';
      const tickets = await listSupportTicketsForUser(user.id, isAdmin);
      res.json({ status: 'success', data: { tickets } });
    } catch (error) {
      console.error('GET /api/support/tickets:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/support/tickets/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const ticket = await getSupportTicketById(req.params.id);
      if (!ticket) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (user.role !== 'admin' && ticket.user_id !== user.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      res.json({ status: 'success', data: ticket });
    } catch (error) {
      console.error('GET /api/support/tickets/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/support/tickets', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      const body = req.body as {
        subject?: string;
        message?: string;
        category?: string;
        page_context?: string;
      };

      const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const category = body.category as SupportTicketCategory;

      if (!subject || subject.length < 3) {
        res.status(400).json({ error: 'Subject is required (min 3 characters)' });
        return;
      }
      if (!message || message.length < 10) {
        res.status(400).json({ error: 'Message is required (min 10 characters)' });
        return;
      }
      if (!CATEGORIES.includes(category)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      const ticket = await createSupportTicket({
        userId: user.id,
        subject,
        message,
        category,
        pageContext: typeof body.page_context === 'string' ? body.page_context : null,
      });

      const adminIds = await listAdminUserIds();
      const recipients = adminIds.filter(id => id !== user.id);
      if (recipients.length > 0) {
        const preview = message.length > 120 ? `${message.slice(0, 117)}…` : message;
        await notifyUsers(recipients, {
          title: st('notifications.supportTicketTitle'),
          message: st('notifications.supportTicketMessage', {
            name: user.name || user.username,
            subject,
            preview,
          }),
          type: 'info',
          linkType: 'support',
          linkId: ticket.id,
        });
      }

      res.status(201).json({ status: 'success', data: ticket });
    } catch (error) {
      console.error('POST /api/support/tickets:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.patch('/api/support/tickets/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as AuthRequest).user;
      if (!requireAdmin(req as AuthRequest, res)) return;

      const body = req.body as { status?: string };
      const status = body.status as SupportTicketStatus;
      if (!STATUSES.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const existing = await getSupportTicketById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      const ticket = await updateSupportTicketStatus(req.params.id, status);
      if (!ticket) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      if (existing.status !== status && ticket.user_id !== user.id) {
        await notifyUsers([ticket.user_id], {
          title: st('notifications.supportTicketStatusTitle'),
          message: st('notifications.supportTicketStatusMessage', {
            subject: ticket.subject,
            status: st(`tasks.supportStatus.${status}`),
          }),
          type: 'info',
          linkType: 'support',
          linkId: ticket.id,
        });
      }

      res.json({ status: 'success', data: ticket });
    } catch (error) {
      console.error('PATCH /api/support/tickets/:id:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });
}
