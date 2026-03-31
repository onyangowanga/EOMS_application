import type { RBACRole, User } from '../types';

const LEGACY_TO_RBAC: Record<string, RBACRole[]> = {
  ADMIN: ['executive_admin'],
  FINANCE: ['finance_member'],
  LEADER: ['chair'],
  MEMBER: ['committee_member'],
  STAKEHOLDER: ['committee_member'],
};

export const normalizeUserRoles = (user: User | null): RBACRole[] => {
  if (!user) {
    return [];
  }

  const explicit = (user.roles || []).filter(Boolean) as RBACRole[];
  const mapped = LEGACY_TO_RBAC[user.role] || [];

  return Array.from(new Set([...explicit, ...mapped]));
};

export const hasAnyRole = (user: User | null, required: RBACRole | RBACRole[]): boolean => {
  if (!user) {
    return false;
  }

  const requiredRoles = Array.isArray(required) ? required : [required];
  const userRoles = normalizeUserRoles(user);

  if (userRoles.includes('executive_admin')) {
    return true;
  }

  return requiredRoles.some((role) => userRoles.includes(role));
};

export const hasSubcommitteeRole = (
  user: User | null,
  subcommitteeId: string,
  role: 'lead' | 'member' = 'lead'
): boolean => {
  if (!user?.subcommittee_roles) {
    return false;
  }

  return user.subcommittee_roles[subcommitteeId] === role;
};

export const hasClusterRole = (
  user: User | null,
  clusterId: string,
  role: 'lead' | 'member' = 'lead'
): boolean => {
  if (!user?.cluster_roles) {
    return false;
  }

  return user.cluster_roles[clusterId] === role;
};