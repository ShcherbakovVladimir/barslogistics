import React, { useEffect, useState } from 'react';
import {
  resolveUserAvatarUrl,
  userAvatarTone,
  userInitials,
} from '../../utils/userAvatar';

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface UserAvatarProps {
  userId?: string | null;
  name: string;
  hasAvatar?: boolean;
  avatarVersion?: string | null;
  size?: UserAvatarSize;
  className?: string;
  title?: string;
}

const sizeClass: Record<UserAvatarSize, string> = {
  xs: 'user-avatar--xs',
  sm: 'user-avatar--sm',
  md: 'user-avatar--md',
  lg: 'user-avatar--lg',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  name,
  hasAvatar = false,
  avatarVersion,
  size = 'md',
  className = '',
  title,
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const tone = userAvatarTone(userId || name || '?');
  const initials = userInitials(name || '?');

  useEffect(() => {
    let cancelled = false;
    const id = userId || '';

    if (!id || !hasAvatar) {
      setSrc(null);
      return undefined;
    }

    void resolveUserAvatarUrl(id, true, avatarVersion).then((url) => {
      if (!cancelled) setSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, hasAvatar, avatarVersion]);

  return (
    <span
      className={`user-avatar user-avatar--tone-${tone} ${sizeClass[size]} ${src ? 'user-avatar--image' : ''} ${className}`.trim()}
      title={title || name}
      aria-hidden={!title}
    >
      {src ? <img src={src} alt="" className="user-avatar-img" draggable={false} /> : initials}
    </span>
  );
};
