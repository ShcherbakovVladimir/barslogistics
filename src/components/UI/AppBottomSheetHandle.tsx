import React from 'react';
import { useI18n } from '../../i18n';

interface AppBottomSheetHandleProps {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  isDragging?: boolean;
}

export const AppBottomSheetHandle: React.FC<AppBottomSheetHandleProps> = ({
  onPointerDown,
  isDragging = false,
}) => {
  const { t } = useI18n();

  return (
    <div
      className={`app-modal-sheet-handle-zone ${isDragging ? 'is-dragging' : ''}`}
      onPointerDown={onPointerDown}
      role="button"
      tabIndex={0}
      aria-label={t('common.dragSheet')}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
      }}
    >
      <span className="app-modal-sheet-handle" aria-hidden />
    </div>
  );
};
