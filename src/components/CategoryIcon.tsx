/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingBag, 
  CreditCard, 
  GraduationCap, 
  Briefcase, 
  Gamepad2, 
  LayoutGrid,
  FolderOpen
} from 'lucide-react';

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, className = "w-4 h-4" }) => {
  // Normalize string comparisons to handle any minor casing/spacing discrepancies
  const trimmedIcon = icon?.trim();

  switch (trimmedIcon) {
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'LayoutGrid':
      return <LayoutGrid className={className} />;
    case 'FolderOpen':
      return <FolderOpen className={className} />;
    default:
      // Fallback for custom emojis and other custom icons
      return <span className="select-none leading-none inline-block">{trimmedIcon}</span>;
  }
};
