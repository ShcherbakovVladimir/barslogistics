import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageCircle, X, Send, Paperclip, Search, Users, MessagesSquare, ChevronLeft, Download, Bell, BellOff,
} from 'lucide-react';
import { ChatEmojiPicker } from './ChatEmojiPicker';
import { AppBottomSheetHandle } from '../UI/AppBottomSheetHandle';
import { useAppBottomSheet } from '../../hooks/useAppBottomSheet';
import {
  getChatNotificationPermission,
  requestChatNotificationPermission,
  setChatUiState,
  subscribeChatNotificationClicks,
  syncWebPushSubscription,
} from '../../utils/chatNotifications';
import { useI18n } from '../../i18n';
import { ApiService } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import type {
  User,
  ChatConversationSummary,
  ChatMessage,
  ChatUserDirectoryEntry,
  WebSocketInboundMessage,
} from '../../types';

interface ChatWidgetProps {
  currentUser: User;
  /** Hide floating launcher (e.g. when chat sits in AppSideRail). */
  hideLauncher?: boolean;
  onUnreadChange?: (count: number) => void;
  onOpenChange?: (open: boolean) => void;
}

type LeftTab = 'chats' | 'users';

interface ChatPanelShellProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Mounted only while chat is open — bottom-sheet drag state resets on close. */
const ChatPanelShell: React.FC<ChatPanelShellProps> = ({ onClose, title, children }) => {
  const {
    sheetRef,
    sheetStyle,
    isDragging,
    dragEnabled,
    onHandlePointerDown,
  } = useAppBottomSheet(onClose);

  return (
    <div
      ref={sheetRef}
      style={sheetStyle}
      className={`chat-widget-panel app-modal-sheet ${isDragging ? 'is-sheet-dragging' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {dragEnabled ? (
        <AppBottomSheetHandle onPointerDown={onHandlePointerDown} isDragging={isDragging} />
      ) : null}
      <div className="chat-widget-panel-body">{children}</div>
    </div>
  );
};

function formatMessageTime(iso: string, localeTag: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(localeTag, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatListTime(iso: string | undefined, localeTag: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(localeTag, { day: '2-digit', month: '2-digit' });
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  currentUser,
  hideLauncher = false,
  onUnreadChange,
  onOpenChange,
}) => {
  const { t, localeTag } = useI18n();
  const activeTab = useAppSelector(state => state.navigation.activeTab);
  const aboveMapZoom = activeTab === 'map';

  const [open, setOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>('chats');
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [users, setUsers] = useState<ChatUserDirectoryEntry[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<Pick<ChatConversationSummary, 'peer_id' | 'peer_name' | 'peer_username' | 'peer_role'> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => getChatNotificationPermission());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const openRef = useRef(false);

  activeConversationIdRef.current = activeConversationId;
  openRef.current = open;

  useEffect(() => {
    setChatUiState({ open, activeConversationId });
  }, [open, activeConversationId]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setOpen(false);
        setMobileShowThread(false);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    setDraft(prev => {
      const input = draftInputRef.current;
      const start = input?.selectionStart ?? prev.length;
      const end = input?.selectionEnd ?? prev.length;
      const next = prev.slice(0, start) + emoji + prev.slice(end);
      requestAnimationFrame(() => {
        if (!input) return;
        input.focus();
        const pos = start + emoji.length;
        input.setSelectionRange(pos, pos);
      });
      return next;
    });
  }, []);

  const handleEnablePush = useCallback(async () => {
    const perm = await requestChatNotificationPermission();
    setPushPermission(perm);
    if (perm === 'granted' && currentUser.notifications_enabled) {
      await syncWebPushSubscription(
        () => ApiService.getPushVapidPublicKey(),
        sub => ApiService.subscribeWebPush(sub),
      );
    }
  }, [currentUser.notifications_enabled]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [conversations],
  );

  useEffect(() => {
    onUnreadChange?.(totalUnread);
  }, [totalUnread, onUnreadChange]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await ApiService.getChatConversations();
      setConversations(data);
    } catch (e) {
      console.error('chat conversations:', e);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await ApiService.getChatUsers();
      setUsers(data);
    } catch (e) {
      console.error('chat users:', e);
    }
  }, []);

  const loadLists = useCallback(async () => {
    setLoadingList(true);
    try {
      await Promise.all([refreshConversations(), refreshUsers()]);
    } finally {
      setLoadingList(false);
    }
  }, [refreshConversations, refreshUsers]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  /** Keep unread badge fresh when tab becomes visible again. */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshConversations();
    };
    document.addEventListener('visibilitychange', onVis);
    const interval = window.setInterval(() => {
      if (!openRef.current) void refreshConversations();
    }, 30_000);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(interval);
    };
  }, [refreshConversations]);

  const openConversation = useCallback(async (
    conversationId: string,
    peer: Pick<ChatConversationSummary, 'peer_id' | 'peer_name' | 'peer_username' | 'peer_role'>,
  ) => {
    setActiveConversationId(conversationId);
    setActivePeer(peer);
    setMobileShowThread(true);
    setLeftTab('chats');
    setLoadingThread(true);
    try {
      const data = await ApiService.getChatMessages(conversationId);
      setMessages(data.map(m => ({ ...m, is_own: m.sender_id === currentUser.id })));
      await ApiService.markChatRead(conversationId);
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
      );
    } catch (e) {
      console.error('chat thread:', e);
    } finally {
      setLoadingThread(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [currentUser.id, scrollToBottom]);

  const selectConversation = useCallback((conv: ChatConversationSummary) => {
    void openConversation(conv.id, {
      peer_id: conv.peer_id,
      peer_name: conv.peer_name,
      peer_username: conv.peer_username,
      peer_role: conv.peer_role,
    });
  }, [openConversation]);

  const wasOpenRef = useRef(false);
  /** On open: refresh list and auto-load the right thread (unread → last active → first). */
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const list = await ApiService.getChatConversations();
        if (cancelled) return;
        setConversations(list);

        const currentId = activeConversationIdRef.current;
        const pick =
          (currentId ? list.find(c => c.id === currentId) : undefined)
          || list.find(c => (c.unread_count || 0) > 0)
          || list[0];

        if (!pick) return;
        await openConversation(pick.id, {
          peer_id: pick.peer_id,
          peer_name: pick.peer_name,
          peer_username: pick.peer_username,
          peer_role: pick.peer_role,
        });
      } catch (e) {
        console.error('chat auto-open:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, openConversation]);

  useEffect(() => {
    return subscribeChatNotificationClicks(conversationId => {
      setOpen(true);
      void (async () => {
        const list = await ApiService.getChatConversations();
        setConversations(list);
        const updated = list.find(c => c.id === conversationId);
        if (updated) {
          await openConversation(conversationId, {
            peer_id: updated.peer_id,
            peer_name: updated.peer_name,
            peer_username: updated.peer_username,
            peer_role: updated.peer_role,
          });
        }
      })();
    });
  }, [openConversation]);

  useEffect(() => {
    const onOpenChat = (ev: Event) => {
      const conversationId = (ev as CustomEvent<{ conversationId?: string }>).detail?.conversationId;
      setOpen(true);
      if (!conversationId) return;
      void (async () => {
        const list = await ApiService.getChatConversations();
        setConversations(list);
        const conv = list.find(c => c.id === conversationId);
        if (conv) {
          await openConversation(conversationId, {
            peer_id: conv.peer_id,
            peer_name: conv.peer_name,
            peer_username: conv.peer_username,
            peer_role: conv.peer_role,
          });
        }
      })();
    };
    const onToggleChat = () => {
      setOpen(v => !v);
    };
    window.addEventListener('bars-chat-open', onOpenChat);
    window.addEventListener('bars-chat-toggle', onToggleChat);
    return () => {
      window.removeEventListener('bars-chat-open', onOpenChat);
      window.removeEventListener('bars-chat-toggle', onToggleChat);
    };
  }, [openConversation]);

  useEffect(() => {
    if (!open || !currentUser.notifications_enabled) return;
    if (pushPermission === 'granted') {
      void syncWebPushSubscription(
        () => ApiService.getPushVapidPublicKey(),
        sub => ApiService.subscribeWebPush(sub),
      );
      return;
    }
    if (pushPermission === 'denied') return;
    void requestChatNotificationPermission().then(async perm => {
      setPushPermission(perm);
      if (perm === 'granted') {
        await syncWebPushSubscription(
          () => ApiService.getPushVapidPublicKey(),
          sub => ApiService.subscribeWebPush(sub),
        );
      }
    });
  }, [open, currentUser.notifications_enabled, pushPermission]);

  const selectUser = useCallback(async (entry: ChatUserDirectoryEntry) => {
    setLoadingThread(true);
    setMobileShowThread(true);
    try {
      const { conversation_id, messages: initial } = await ApiService.openChatConversation(entry.id);
      setActiveConversationId(conversation_id);
      setActivePeer({
        peer_id: entry.id,
        peer_name: entry.name,
        peer_username: entry.username,
        peer_role: entry.role,
      });
      setMessages(initial.map(m => ({ ...m, is_own: m.sender_id === currentUser.id })));
      await ApiService.markChatRead(conversation_id);
      await refreshConversations();
      setLeftTab('chats');
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      console.error('open chat:', e);
    } finally {
      setLoadingThread(false);
    }
  }, [currentUser.id, refreshConversations, scrollToBottom]);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    setTimeout(scrollToBottom, 50);
  }, [scrollToBottom]);

  const handleWsEvent = useCallback((data: WebSocketInboundMessage) => {
    if (data.type === 'CHAT_MESSAGE') {
      const { conversation_id, message: raw } = data;
      // Server maps is_own for the sender; always recompute for this client.
      const isOwn = raw.sender_id === currentUser.id;
      const message: ChatMessage = { ...raw, is_own: isOwn };
      const panelOpen = openRef.current;
      const isActive = panelOpen && activeConversationIdRef.current === conversation_id;

      setConversations(prev => {
        const existing = prev.find(c => c.id === conversation_id);
        const peerFromMsg = isOwn
          ? existing
          : {
            peer_id: message.sender_id,
            peer_name: message.sender_name,
            peer_username: message.sender_username,
            peer_role: existing?.peer_role ?? 'local_employee' as const,
          };

        if (existing) {
          return prev
            .map(c =>
              c.id === conversation_id
                ? {
                  ...c,
                  last_message: message.body,
                  last_message_at: message.created_at,
                  unread_count: isActive || isOwn
                    ? (isActive ? 0 : c.unread_count)
                    : c.unread_count + 1,
                }
                : c,
            )
            .sort((a, b) =>
              new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime(),
            );
        }

        if (!peerFromMsg || isOwn) {
          // Own message in a new thread — refresh list from API.
          void refreshConversations();
          return prev;
        }
        const summary: ChatConversationSummary = {
          id: conversation_id,
          peer_id: peerFromMsg.peer_id,
          peer_name: peerFromMsg.peer_name,
          peer_username: peerFromMsg.peer_username,
          peer_role: peerFromMsg.peer_role,
          last_message: message.body,
          last_message_at: message.created_at,
          unread_count: isActive ? 0 : 1,
        };
        return [summary, ...prev];
      });

      if (isActive) {
        appendMessage(message);
        if (!isOwn) {
          void ApiService.markChatRead(conversation_id);
        }
      }
      return;
    }

    if (data.type === 'CHAT_READ') {
      if (data.reader_id === currentUser.id) return;
      if (activeConversationIdRef.current !== data.conversation_id) return;
      setMessages(prev =>
        prev.map(m =>
          (m.sender_id === currentUser.id && !m.read_at)
            ? { ...m, read_at: new Date().toISOString() }
            : m,
        ),
      );
    }
  }, [appendMessage, currentUser.id, refreshConversations]);

  useEffect(() => {
    const onWs = (ev: Event) => {
      const detail = (ev as CustomEvent<WebSocketInboundMessage>).detail;
      if (detail) handleWsEvent(detail);
    };
    window.addEventListener('bars-chat-ws', onWs);
    return () => window.removeEventListener('bars-chat-ws', onWs);
  }, [handleWsEvent]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !activeConversationId || sending) return;
    setSending(true);
    setDraft('');
    try {
      const msg = await ApiService.sendChatMessage(activeConversationId, text);
      appendMessage(msg);
      await refreshConversations();
    } catch (e) {
      console.error('send message:', e);
      setDraft(text);
    } finally {
      setSending(false);
    }
  }, [activeConversationId, appendMessage, draft, refreshConversations, sending]);

  const handleFile = useCallback(async (file: File) => {
    if (!activeConversationId || sending) return;
    setSending(true);
    try {
      const msg = await ApiService.sendChatFile(activeConversationId, file);
      appendMessage(msg);
      await refreshConversations();
    } catch (e) {
      console.error('send file:', e);
    } finally {
      setSending(false);
    }
  }, [activeConversationId, appendMessage, refreshConversations, sending]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q)
        || u.username.toLowerCase().includes(q),
    );
  }, [userQuery, users]);

  const closeChat = useCallback(() => {
    setOpen(false);
    setMobileShowThread(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeChat]);

  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia('(max-width: 640px)').matches
      || document.documentElement.classList.contains('layout-mobile');
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const roleLabel = (role: string) => t(`roles.${role}.title` as 'roles.admin.title');

  const panel = open ? (
    <ChatPanelShell onClose={closeChat} title={`${t('chat.title')} — ${t('chat.brand')}`}>
      <div className={`chat-widget-sidebar ${mobileShowThread ? 'chat-widget-sidebar--hidden-mobile' : ''}`}>
        <div className="chat-widget-sidebar-head">
          <div className="chat-widget-title-block">
            <img src={`${import.meta.env.BASE_URL}bars.svg`} alt="" className="chat-widget-title-logo" aria-hidden />
            <div className="chat-widget-title-text">
              <span className="chat-widget-title">{t('chat.title')}</span>
              <span className="chat-widget-subtitle">{t('chat.brand')}</span>
            </div>
          </div>
          <div className="chat-widget-head-actions">
            {currentUser.notifications_enabled && pushPermission !== 'granted' ? (
              <button
                type="button"
                className="chat-widget-icon-btn chat-widget-push-btn"
                onClick={() => void handleEnablePush()}
                title={pushPermission === 'denied' ? t('chat.pushDenied') : t('chat.enablePush')}
                aria-label={t('chat.enablePush')}
              >
                {pushPermission === 'denied' ? <BellOff size={16} /> : <Bell size={16} />}
              </button>
            ) : null}
            <button
              type="button"
              className="chat-widget-icon-btn chat-widget-close-desktop"
              onClick={closeChat}
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {currentUser.notifications_enabled && pushPermission === 'denied' ? (
          <div className="chat-widget-push-hint">{t('chat.pushDenied')}</div>
        ) : null}

        <div className="chat-widget-tabs">
          <button
            type="button"
            className={`chat-widget-tab ${leftTab === 'chats' ? 'chat-widget-tab--active' : ''}`}
            onClick={() => setLeftTab('chats')}
          >
            <MessagesSquare size={14} />
            {t('chat.tabChats')}
          </button>
          <button
            type="button"
            className={`chat-widget-tab ${leftTab === 'users' ? 'chat-widget-tab--active' : ''}`}
            onClick={() => setLeftTab('users')}
          >
            <Users size={14} />
            {t('chat.tabUsers')}
          </button>
        </div>

        {leftTab === 'users' && (
          <div className="chat-widget-search">
            <Search size={14} />
            <input
              type="search"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder={t('chat.searchUsers')}
              aria-label={t('chat.searchUsers')}
            />
          </div>
        )}

        <div className="chat-widget-list scroll-area">
          {loadingList && conversations.length === 0 && users.length === 0 ? (
            <div className="chat-widget-empty">{t('common.loading')}</div>
          ) : null}

          {leftTab === 'chats' ? (
            conversations.length === 0 && !loadingList ? (
              <div className="chat-widget-empty">{t('chat.noChats')}</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  type="button"
                  className={`chat-widget-list-item ${activeConversationId === conv.id ? 'chat-widget-list-item--active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="chat-widget-list-item-top">
                    <span className="chat-widget-list-name">{conv.peer_name}</span>
                    <span className="chat-widget-list-time">{formatListTime(conv.last_message_at, localeTag)}</span>
                  </div>
                  <div className="chat-widget-list-item-bottom">
                    <span className="chat-widget-list-preview">@{conv.peer_username}</span>
                    {conv.unread_count > 0 ? (
                      <span className="chat-widget-unread">{conv.unread_count > 99 ? '99+' : conv.unread_count}</span>
                    ) : null}
                  </div>
                  {conv.last_message ? (
                    <div className="chat-widget-list-last">{conv.last_message}</div>
                  ) : null}
                </button>
              ))
            )
          ) : (
            filteredUsers.length === 0 && !loadingList ? (
              <div className="chat-widget-empty">{t('chat.noUsers')}</div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className={`chat-widget-list-item ${activePeer?.peer_id === u.id ? 'chat-widget-list-item--active' : ''}`}
                  onClick={() => selectUser(u)}
                >
                  <div className="chat-widget-list-item-top">
                    <span className="chat-widget-list-name">{u.name}</span>
                    {u.has_conversation ? (
                      <span className="chat-widget-list-badge">{t('chat.existingChat')}</span>
                    ) : null}
                  </div>
                  <div className="chat-widget-list-item-bottom">
                    <span className="chat-widget-list-preview">@{u.username}</span>
                    <span className="chat-widget-role">{roleLabel(u.role)}</span>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      <div className={`chat-widget-thread ${mobileShowThread ? 'chat-widget-thread--visible-mobile' : ''}`}>
        {activeConversationId && activePeer ? (
          <>
            <div className="chat-widget-thread-head">
              <button
                type="button"
                className="chat-widget-back-mobile"
                onClick={() => setMobileShowThread(false)}
                aria-label={t('chat.backToList')}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="chat-widget-thread-peer">
                <div className="chat-widget-thread-name">{activePeer.peer_name}</div>
                <div className="chat-widget-thread-meta">
                  @{activePeer.peer_username} · {roleLabel(activePeer.peer_role)}
                </div>
              </div>
            </div>

            <div className="chat-widget-messages scroll-area">
              {loadingThread ? (
                <div className="chat-widget-empty">{t('common.loading')}</div>
              ) : messages.length === 0 ? (
                <div className="chat-widget-empty">{t('chat.noMessages')}</div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-widget-bubble-row ${msg.is_own ? 'chat-widget-bubble-row--own' : ''}`}
                  >
                    <div className={`chat-widget-bubble ${msg.is_own ? 'chat-widget-bubble--own' : ''}`}>
                      {!msg.is_own ? (
                        <div className="chat-widget-bubble-sender">{msg.sender_name}</div>
                      ) : null}
                      {msg.body ? <div className="chat-widget-bubble-text">{msg.body}</div> : null}
                      {msg.attachment ? (
                        <button
                          type="button"
                          className="chat-widget-attachment"
                          onClick={() => void ApiService.downloadChatAttachment(msg.attachment!.id, msg.attachment!.original_name)}
                        >
                          <Paperclip size={14} />
                          <span>{msg.attachment.original_name}</span>
                          <Download size={14} />
                        </button>
                      ) : null}
                      <div className="chat-widget-bubble-time">
                        {formatMessageTime(msg.created_at, localeTag)}
                        {msg.is_own && msg.read_at ? ` · ${t('chat.read')}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="chat-widget-compose"
              onSubmit={e => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="chat-widget-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                aria-label={t('chat.attachFile')}
              >
                <Paperclip size={18} />
              </button>
              <ChatEmojiPicker onPick={insertEmoji} disabled={sending} />
              <input
                ref={draftInputRef}
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={t('chat.messagePlaceholder')}
                disabled={sending}
                aria-label={t('chat.messagePlaceholder')}
              />
              <button
                type="submit"
                className="chat-widget-send-btn"
                disabled={sending || !draft.trim()}
                aria-label={t('chat.send')}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-widget-thread-empty">
            <MessageCircle size={40} strokeWidth={1.25} />
            <p>{t('chat.selectChat')}</p>
          </div>
        )}
      </div>
    </ChatPanelShell>
  ) : null;

  const portalRoot =
    typeof document !== 'undefined'
      ? document.getElementById('chat-portal-root') ?? document.body
      : null;

  if (!portalRoot) return null;

  return createPortal(
    <div
      className={[
        'chat-widget-root',
        hideLauncher ? 'chat-widget-root--rail' : '',
        aboveMapZoom ? 'chat-widget-root--above-zoom' : '',
        open ? 'chat-widget-root--open' : '',
      ].filter(Boolean).join(' ')}
    >
      {open ? (
        <button
          type="button"
          className="chat-widget-backdrop"
          aria-label={t('common.close')}
          onClick={closeChat}
        />
      ) : null}
      {!hideLauncher ? (
        <button
          type="button"
          className="chat-widget-launcher"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={open ? t('common.close') : `${t('chat.title')} — ${t('chat.brand')}`}
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
          {totalUnread > 0 ? (
            <span className="chat-widget-launcher-badge" aria-label={`${totalUnread}`}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          ) : null}
        </button>
      ) : null}
      {panel}
    </div>,
    portalRoot,
  );
};
