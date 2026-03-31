import type { CommitteePhase6 } from '../types';

const ROLE_BASED_TYPES = new Set(['MAIN', 'BUDGET_FINANCE', 'FUNDS_MOBILIZATION']);

export const isRoleBasedCommittee = (committee: Partial<CommitteePhase6> | null | undefined): boolean => {
  if (!committee) {
    return false;
  }

  const committeeName = (committee.name || '').toLowerCase();
  const committeeType = (committee.committee_type || '').toUpperCase();

  return (
    committee.is_main === true ||
    ROLE_BASED_TYPES.has(committeeType) ||
    committeeName.includes('finance') ||
    committeeName.includes('executive')
  );
};

export const isTaskBasedCommittee = (committee: Partial<CommitteePhase6> | null | undefined): boolean => {
  return !!committee && !isRoleBasedCommittee(committee);
};