import { UserRole, UserProfile, Organ } from './types';
import { editOrgan } from '../shared/institutions.mjs';
export { generalAdmin, institutionAdmin, institutionName } from '../shared/institutions.mjs';
export const isAdmin = (role: UserRole) => role === 'ADMIN' || role === 'SUPERADMIN' || role === 'ADMIN_INSTITUSI';
export const canManageContent = (role: UserRole) => isAdmin(role) || role === 'DOSEN';

export const canEditOrgan = (user: UserProfile | null, organ: Organ) => editOrgan(user,organ);
