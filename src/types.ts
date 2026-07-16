/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AvatarType = 'color' | 'emoji' | 'image';

export interface ProfileAvatar {
  type: AvatarType;
  value: string; // Hex color, emoji character, or image data URL
  bgColor?: string; // Background color for emojis or letters
}

export interface ProfilePreset {
  id: string;
  name: string;
  avatar: ProfileAvatar;
  email?: string;
  username?: string;
  password?: string;
  accessLink?: string;
  description?: string;
  ownerId?: string;
}

export interface Profile {
  id: string;
  name: string; // Pessoal, Trabalho, Família, Estudos, Freelance, Empresa, or Custom
  username?: string; // Optional username
  email?: string; // Optional email
  password?: string;
  accessLink?: string;
  description?: string; // Notes/Rascunho
  avatar: ProfileAvatar;
}

export interface Status {
  id: string;
  label: string;
  color: string;
  icon?: string;
  isCustom?: boolean;
}

export type PurchaseStatus = string;

export interface Tag {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface BundleItem {
  id: string;
  name: string;
  price?: number;
  link?: string;
  image?: string;
  status?: string;
}

export interface Purchase {
  id: string;
  profileId: string; // References a profile of the platform
  productName: string;
  productLink?: string;
  status: PurchaseStatus;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  notes?: string;
  date: string; // ISO String
  productImages?: string[];
  paymentDate?: string;
  paymentMethod?: string;
  bankName?: string;
  installments?: number;
  cardName?: string;
  deliveryDate?: string;
  quantity?: number;
  tags?: string[]; // References Tag IDs
  isBundle?: boolean;
  bundleItems?: BundleItem[];
  purchaseType?: 'subscription' | 'single'; // 'subscription' para assinatura, 'single' para compra única
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji or Lucide icon name
  color: string; // hex or Tailwind color
  isCustom?: boolean;
}

export interface Platform {
  id: string;
  name: string;
  url?: string;
  logoUrl?: string; // Auto-fetched or uploaded
  categoryId: string; // References Category ID
  profiles: Profile[];
  purchases: Purchase[];
  ownerId?: string; // Owner UID for strict server/client authorization
}
