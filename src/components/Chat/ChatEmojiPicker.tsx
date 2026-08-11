import React, { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { CHAT_EMOJI_GROUPS } from '../../constants/chatEmojis';
import { useI18n } from '../../i18n';

interface ChatEmojiPickerProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}

export const ChatEmojiPicker: React.FC<ChatEmojiPickerProps> = ({ onPick, disabled }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(CHAT_EMOJI_GROUPS[0]?.id ?? 'smileys');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const group = CHAT_EMOJI_GROUPS.find(g => g.id === activeGroup) ?? CHAT_EMOJI_GROUPS[0];

  return (
    <div className="chat-emoji-picker" ref={rootRef}>
      <button
        type="button"
        className={`chat-widget-icon-btn ${open ? 'chat-emoji-picker-btn--active' : ''}`}
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        aria-label={t('chat.emoji')}
        aria-expanded={open}
      >
        <Smile size={18} />
      </button>

      {open ? (
        <div className="chat-emoji-picker-panel" role="dialog" aria-label={t('chat.emoji')}>
          <div className="chat-emoji-picker-groups">
            {CHAT_EMOJI_GROUPS.map(g => (
              <button
                key={g.id}
                type="button"
                className={`chat-emoji-picker-group-btn ${activeGroup === g.id ? 'chat-emoji-picker-group-btn--active' : ''}`}
                onClick={() => setActiveGroup(g.id)}
                aria-label={g.id}
              >
                {g.icon}
              </button>
            ))}
          </div>
          <div className="chat-emoji-picker-grid scroll-area">
            {group?.emojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="chat-emoji-picker-item"
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
