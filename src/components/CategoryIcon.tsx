/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, className = "w-4 h-4" }) => {
  // Normalize string comparisons to handle any minor casing/spacing discrepancies
  const trimmedIcon = icon?.trim();

  switch (trimmedIcon) {
    case 'ShoppingBag':
      return <span className="select-none leading-none inline-block text-sm">🛒</span>;
    case 'CreditCard':
      return <span className="select-none leading-none inline-block text-sm">💳</span>;
    case 'GraduationCap':
      return <span className="select-none leading-none inline-block text-sm">📚</span>;
    case 'Briefcase':
      return <span className="select-none leading-none inline-block text-sm">💼</span>;
    case 'Gamepad2':
      return <span className="select-none leading-none inline-block text-sm">🎮</span>;
    case 'LayoutGrid':
      return <span className="select-none leading-none inline-block text-sm">📁</span>;
    case 'FolderOpen':
      return <span className="select-none leading-none inline-block text-sm">📁</span>;
    default:
      // Fallback for custom emojis and other custom icons
      return <span className="select-none leading-none inline-block">{trimmedIcon}</span>;
  }
};

