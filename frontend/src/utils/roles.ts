import type { Role } from '../types';

export const homeByRole: Record<Role, string> = {
  ADMIN: '/admin',
  WAITER: '/waiter',
  BARISTA: '/barista',
};