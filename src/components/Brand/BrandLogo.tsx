import React from 'react';
import { useI18n } from '../../i18n';
import barsLogo from '../../../assets/img/bars.svg';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
}

const sizeClasses: Record<BrandLogoSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9 sm:w-10 sm:h-10',
  lg: 'w-14 h-14',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  const { t } = useI18n();

  return (
    <img
      src={barsLogo}
      alt={t('header.brandTitle')}
      className={`brand-logo ${sizeClasses[size]} ${className}`.trim()}
      draggable={false}
    />
  );
};
