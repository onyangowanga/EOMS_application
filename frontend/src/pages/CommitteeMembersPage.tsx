import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Skeleton,
  Card,
  CardContent,
  CardActions,
  Grid,
  Tabs,
  Tab,
  Divider,
  Snackbar,
  Drawer,
  InputAdornment,
  Avatar,
  Stack,
  Fab,
} from '@mui/material';
import {
  Add,
  Delete,
  People,
  Star,
  ArrowBack,
  PersonAdd,
  GroupAdd,
  Search,
  Edit,
  Visibility,
  Close,
  AccountCircle,
  Phone,
  Email,
  Work,
  Group,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { committeeService } from '../services/committee.service';
import { eventService } from '../services/event.service';
import { userService, type CreateUserRequest } from '../services/user.service';
import apiClient from '../services/api';
import type { CommitteePhase6, EventMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Helpers

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function roleColor(role: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' {
  switch (role) {
    case 'EVENT_OWNER': return 'error';
    case 'CHAIRMAN': return 'primary';
    case 'TREASURER': return 'success';
    case 'SECRETARY': return 'info';
    case 'TEAM_LEAD': return 'warning';
    case 'CLUSTER_LEAD': return 'secondary';
    default: return 'default';
  }
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    EVENT_OWNER: 'Event Owner',
    CHAIRMAN: 'Chairman',
    TREASURER: 'Treasurer',
    SECRETARY: 'Secretary',
    TEAM_LEAD: 'Team Lead',
    CLUSTER_LEAD: 'Cluster Lead',
    MEMBER: 'Member',
  };
  return map[role] ?? role;
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

function getPrivilegeChips(member: EventMember): { label: string; color: ChipColor }[] {
  const chips: { label: string; color: ChipColor }[] = [];
  if (member.can_approve_expenses) chips.push({ label: 'Finance Committee', color: 'success' });
  if (member.is_executive) chips.push({ label: 'Executive Member', color: 'primary' });
  if (member.is_official) chips.push({ label: 'Official', color: 'info' });
  if (member.has_super_admin_rights) chips.push({ label: 'Super Admin', color: 'error' });
  if (member.role === 'CLUSTER_LEAD') chips.push({ label: 'Cluster Lead', color: 'secondary' });
  return chips;
}

const avatarColors = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#0288d1', '#f57c00', '#455a64'];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getMemberName(member: EventMember): string {
  return member.full_name || member.user_details?.full_name || member.phone || 'Unknown';
}

// Member Profile Drawer

interface MemberProfileDrawerProps {
  open: boolean;
  member: EventMember | null;
  committeeNames: string[];
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

const MemberProfileDrawer: React.FC<MemberProfileDrawerProps> = ({
  open, member, committeeNames, onClose, onEdit, onRemove,
}) => {
  if (!member) return null;
  const name = getMemberName(member);
  const privileges = getPrivilegeChips(member);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 0 } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', p: 3, color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" gap={2} alignItems="center">
            <Avatar sx={{ width: 64, height: 64, bgcolor: avatarColor(name), fontSize: '1.5rem', fontWeight: 'bold' }}>
              {getInitials(name)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">{name}</Typography>
              <Chip label={roleLabel(member.role)} size="small" sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.25)', color: 'white' }} />
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>CONTACT</Typography>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Phone fontSize="small" color="action" />
            <Typography variant="body2">{member.phone || member.user_details?.phone || '—'}</Typography>
          </Box>
          {(member.email || member.user_details?.email) && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2">{member.email || member.user_details?.email}</Typography>
            </Box>
          )}
          {member.alternative_phone && (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Phone fontSize="small" color="action" />
              <Typography variant="body2">{member.alternative_phone} (alt)</Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>EVENT ROLE</Typography>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
          <Work fontSize="small" color="action" />
          <Chip label={roleLabel(member.role)} color={roleColor(member.role)} size="small" />
        </Box>

        <Divider sx={{ mb: 2 }} />
        {privileges.length > 0 && (
          <>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>PRIVILEGES</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.75} sx={{ mb: 3 }}>
              {privileges.map((p) => (
                <Chip key={p.label} label={p.label} color={p.color} size="small" variant="outlined" />
              ))}
            </Box>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          COMMITTEE ASSIGNMENTS ({committeeNames.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={0.75} sx={{ mb: 3 }}>
          {committeeNames.length > 0
            ? committeeNames.map((c) => <Chip key={c} label={c} size="small" variant="outlined" color="primary" />)
            : <Typography variant="body2" color="text.secondary">Not assigned to any committee</Typography>}
        </Box>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>PERMISSIONS</Typography>
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          {([
            ['Can Create Tasks', member.can_create_tasks],
            ['Can Manage Roles', member.can_manage_roles],
            ['Can Approve Expenses', member.can_approve_expenses],
          ] as [string, boolean][]).map(([label, val]) => (
            <Box key={label} display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Chip label={val ? 'Yes' : 'No'} size="small" color={val ? 'success' : 'default'} variant="outlined" />
            </Box>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Joined: {new Date(member.joined_at).toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Button variant="outlined" startIcon={<Edit />} onClick={onEdit} sx={{ flex: 1 }}>Edit</Button>
        <Button variant="outlined" color="error" startIcon={<Delete />} onClick={onRemove} sx={{ flex: 1 }}>Remove</Button>
      </Box>
    </Drawer>
  );
};

// Member Card (mobile)

interface MemberCardProps {
  member: EventMember;
  committeeNames: string[];
  onViewProfile: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onRemove: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member, committeeNames, onViewProfile, onEdit, onAssign, onRemove,
}) => {
  const name = getMemberName(member);
  const privileges = getPrivilegeChips(member);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" gap={2} alignItems="flex-start" mb={1.5}>
          <Avatar sx={{ bgcolor: avatarColor(name), width: 48, height: 48, fontWeight: 'bold' }}>
            {getInitials(name)}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>{name}</Typography>
            <Typography variant="caption" color="text.secondary">{member.phone || member.user_details?.phone}</Typography>
          </Box>
          <Chip label={roleLabel(member.role)} color={roleColor(member.role)} size="small" />
        </Box>

        {privileges.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
            {privileges.map((p) => (
              <Chip key={p.label} label={p.label} color={p.color} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {committeeNames.slice(0, 2).map((c) => (
            <Chip key={c} label={c} size="small" variant="outlined" color="primary" />
          ))}
          {committeeNames.length > 2 && <Chip label={`+${committeeNames.length - 2} more`} size="small" />}
          {committeeNames.length === 0 && <Typography variant="caption" color="text.secondary">No committee</Typography>}
        </Box>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'space-between', px: 1.5, py: 1 }}>
        <Tooltip title="View Profile">
          <IconButton size="small" color="primary" onClick={onViewProfile}><Visibility fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Change Event Role">
          <IconButton size="small" color="info" onClick={onEdit}><Edit fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Assign to Subcommittee">
          <IconButton size="small" color="secondary" onClick={onAssign}><GroupAdd fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Remove from Event">
          <IconButton size="small" color="error" onClick={onRemove}><Delete fontSize="small" /></IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// Edit Member Modal

interface EditMemberModalProps {
  open: boolean;
  member: EventMember | null;
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ open, member, eventId, onClose, onSuccess }) => {
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (member) setRole(member.role);
  }, [member]);

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/events/${eventId}/members/${member.id}/`, { role });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Event Role</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {member ? getMemberName(member) : ''}
          </Typography>
          <Alert severity="info">
            Choose the member's event-level role. This controls their permissions across the event.
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Event Role</InputLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value)} label="Event Role">
              <MenuItem value="CHAIRMAN">Chair</MenuItem>
              <MenuItem value="SECRETARY">Secretary</MenuItem>
              <MenuItem value="TREASURER">Treasurer</MenuItem>
              <MenuItem value="MEMBER">Committee Member</MenuItem>
              <MenuItem value="TEAM_LEAD">Mobilisation Team Lead</MenuItem>
              <MenuItem value="CLUSTER_LEAD">Cluster Lead</MenuItem>
            </Select>
          </FormControl>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Assign to Subcommittee Modal

interface AssignSubcommitteeModalProps {
  open: boolean;
  member: EventMember | null;
  committees: CommitteePhase6[];
  onClose: () => void;
  onSuccess: () => void;
}

const AssignSubcommitteeModal: React.FC<AssignSubcommitteeModalProps> = ({
  open, member, committees, onClose, onSuccess,
}) => {
  const [selectedCommittee, setSelectedCommittee] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [roleDescription, setRoleDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!open) { setSelectedCommittee(''); setIsLead(false); setRoleDescription(''); setError(null); }
  }, [open]);

  const handleAssign = async () => {
    if (!member || !selectedCommittee) return;
    setSaving(true);
    setError(null);
    try {
      await committeeService.addMember(parseInt(selectedCommittee), {
        user_id: member.user_details?.id ?? (member as any).user,
        is_lead: isLead,
        role_description: roleDescription,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to assign member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GroupAdd /> Assign to Subcommittee
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {member ? getMemberName(member) : ''}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Subcommittee *</InputLabel>
            <Select value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)} label="Subcommittee *">
              {committees.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Role Description" value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            placeholder="e.g., Coordinator, Secretary" fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={isLead} onChange={(e) => setIsLead(e.target.checked)} />}
            label="Assign as Subcommittee Lead"
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAssign} disabled={saving || !selectedCommittee}>
          {saving ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Loading Skeleton

const LoadingSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" height={100} /></Grid>)}
    </Grid>
    <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={400} />
  </Box>
);

// Main Page

const CommitteeMembersPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();

  // UI state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<EventMember | null>(null);
  const [isLead, setIsLead] = useState(false);
  const [roleDescription, setRoleDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ userId: number; name: string } | null>(null);
  const [userCreationError, setUserCreationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<'existing' | 'new'>('new');
  const [newUserData, setNewUserData] = useState<CreateUserRequest>({ full_name: '', phone: '', email: '', role: 'MEMBER' });

  const [profileMember, setProfileMember] = useState<EventMember | null>(null);
  const [editMember, setEditMember] = useState<EventMember | null>(null);
  const [assignMember, setAssignMember] = useState<EventMember | null>(null);
  const [teamLeadDialogOpen, setTeamLeadDialogOpen] = useState(false);
  const [selectedTeamLeadMemberId, setSelectedTeamLeadMemberId] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('');

  // Data
  const { data: committees, isLoading: loadingCommittees, error: errorCommittees } = useQuery({
    queryKey: ['committees', eventId],
    queryFn: () => eventService.getEventCommittees(eventId!),
    enabled: !!eventId,
  });

  const { data: eventMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['event-members', eventId],
    queryFn: () => eventService.getEventMembers(eventId!),
    enabled: !!eventId,
  });

  const currentEventRole = (eventMembers || []).find((member: any) => member.user_details?.id === user?.id)?.role;
  const canManageRoles = hasRole('executive_admin') || ['EVENT_OWNER', 'CHAIRMAN', 'SECRETARY', 'TREASURER'].includes(currentEventRole || '');
  const canCreateNewMember = canManageRoles;

  const eligibleTeamLeadMembers = useMemo(
    () => (eventMembers || []).filter((m) => m.role !== 'EVENT_OWNER'),
    [eventMembers]
  );

  const { data: allCommitteeMembers, isLoading: loadingCommitteeMembers } = useQuery({
    queryKey: ['all-committee-members', eventId, committees?.map((c) => c.id).join(',')],
    queryFn: async () => {
      if (!committees) return [];
      const arrays = await Promise.all(
        committees.map(async (committee: CommitteePhase6) => {
          try {
            const members = await committeeService.getMembers(parseInt(committee.id));
            return members.map((m: any) => ({ ...m, committee }));
          } catch {
            return [];
          }
        })
      );
      return arrays.flat();
    },
    enabled: !!committees && committees.length > 0,
  });

  // userId -> committee names
  const memberCommitteeMap = useMemo(() => {
    const map = new Map<number, string[]>();
    (allCommitteeMembers || []).forEach((cm: any) => {
      const uid: number = cm.user?.id ?? cm.user_id;
      if (!map.has(uid)) map.set(uid, []);
      map.get(uid)!.push(cm.committee?.name ?? 'Unknown');
    });
    return map;
  }, [allCommitteeMembers]);

  const getMemberCommittees = (member: EventMember): string[] => {
    const uid = member.user_details?.id ?? (member as any).user;
    return memberCommitteeMap.get(uid) || [];
  };

  // Stats
  const stats = useMemo(() => {
    const members = eventMembers || [];
    return {
      totalMembers: members.length,
      executives: members.filter((m) => m.is_executive || m.is_official).length,
      leads: members.filter((m) => ['CHAIRMAN', 'TEAM_LEAD', 'CLUSTER_LEAD'].includes(m.role)).length,
      committeeCount: committees?.length || 0,
    };
  }, [eventMembers, committees]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let members = eventMembers || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      members = members.filter(
        (m) =>
          getMemberName(m).toLowerCase().includes(q) ||
          (m.phone || m.user_details?.phone || '').includes(q)
      );
    }
    if (roleFilter) members = members.filter((m) => m.role === roleFilter);
    if (committeeFilter) {
      members = members.filter((m) =>
        getMemberCommittees(m).includes(committeeFilter)
      );
    }
    return members;
  }, [eventMembers, searchQuery, roleFilter, committeeFilter, memberCommitteeMap]);

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: async ({ committeeId, data }: { committeeId: string; data: any }) =>
      committeeService.addMember(parseInt(committeeId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees', eventId] });
      queryClient.invalidateQueries({ queryKey: ['all-committee-members', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      setSuccessMessage('Member added successfully!');
      setAddDialogOpen(false);
      resetForm();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) => eventService.removeEventMember(eventId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      queryClient.invalidateQueries({ queryKey: ['all-committee-members', eventId] });
      setSuccessMessage('Member removed successfully!');
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      setProfileMember(null);
    },
  });

  const assignTeamLeadMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.patch(`/events/${eventId}/members/${memberId}/`, { role: 'TEAM_LEAD' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
      setSuccessMessage('Team lead assigned successfully!');
      setTeamLeadDialogOpen(false);
      setSelectedTeamLeadMemberId('');
    },
  });

  const resetForm = () => {
    setSelectedCommittee(null);
    setSelectedUser(null);
    setIsLead(false);
    setRoleDescription('');
    setCreationMode('new');
    setUserCreationError(null);
    setNewUserData({ full_name: '', phone: '', email: '', role: 'MEMBER' });
  };

  const handleAddMember = async () => {
    if (!selectedCommittee) return;
    setUserCreationError(null);
    try {
      let userId: number;
      if (creationMode === 'new') {
        if (!canCreateNewMember) {
          setUserCreationError('Only Event Owner, Chairman, and Secretary can create new members');
          return;
        }
        if (!newUserData.full_name || !newUserData.phone) {
          setUserCreationError('Full name and phone number are required');
          return;
        }
        try {
          const newUser = await userService.create({
            full_name: newUserData.full_name,
            phone: newUserData.phone,
            email: newUserData.email || undefined,
            role: newUserData.role,
          });
          userId = newUser.id;
        } catch (userError: any) {
          setUserCreationError(
            userError?.response?.data?.phone?.[0] ||
            userError?.response?.data?.email?.[0] ||
            userError?.response?.data?.error ||
            'Failed to create user.'
          );
          return;
        }
        const eventRole =
          newUserData.role === 'LEADER' ? 'CHAIRMAN' :
          newUserData.role === 'FINANCE' ? 'TREASURER' : 'MEMBER';
        await eventService.addEventMember(eventId!, userId, eventRole);
      } else {
        if (!selectedUser) return;
        userId = selectedUser.user_details.id;
      }
      await addMemberMutation.mutateAsync({
        committeeId: selectedCommittee,
        data: { user_id: userId, is_lead: isLead, role_description: roleDescription },
      });
    } catch (error: any) {
      setUserCreationError(error?.response?.data?.error || error?.message || 'Failed to add member');
    }
  };

  const handleDeleteClick = (member: EventMember) => {
    setMemberToDelete({ userId: member.user_details?.id ?? (member as any).user, name: getMemberName(member) });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) return;
    removeMemberMutation.mutate({ userId: memberToDelete.userId });
  };

  if (loadingCommittees || loadingMembers || loadingCommitteeMembers) return <LoadingSkeleton />;
  if (errorCommittees) return <Alert severity="error">Failed to load committee data. Please try again.</Alert>;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(`/events/${eventId}/dashboard`)}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Committee Members
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Manage all committee members for this event
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
          disabled={!canCreateNewMember}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Add Member
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Role assignment:</strong> Super Admin and officials (Event Owner, Chair, Secretary, Treasurer) can change roles.
        Use <strong>Edit Member</strong> to assign roles like Chair/Secretary/Treasurer/Member, or use
        <strong> Assign Team Lead</strong> to promote an existing member quickly.
      </Alert>

      <Box display="flex" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Star />}
          onClick={() => setTeamLeadDialogOpen(true)}
          disabled={!canManageRoles || eligibleTeamLeadMembers.length === 0}
        >
          Assign Team Lead
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Members', value: stats.totalMembers, icon: <People sx={{ color: '#1976d2', fontSize: 36 }} /> },
          { label: 'Leads / Officers', value: stats.leads, icon: <Star sx={{ color: '#f57c00', fontSize: 36 }} /> },
          { label: 'Executives', value: stats.executives, icon: <AccountCircle sx={{ color: '#388e3c', fontSize: 36 }} /> },
          { label: 'Committees', value: stats.committeeCount, icon: <Group sx={{ color: '#7b1fa2', fontSize: 36 }} /> },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  {s.icon}
                  <Box>
                    <Typography color="text.secondary" variant="caption">{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth size="small"
              placeholder="Search by name or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Role">
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="CHAIRMAN">Chairman</MenuItem>
                <MenuItem value="TREASURER">Treasurer</MenuItem>
                <MenuItem value="SECRETARY">Secretary</MenuItem>
                <MenuItem value="TEAM_LEAD">Team Lead</MenuItem>
                <MenuItem value="CLUSTER_LEAD">Cluster Lead</MenuItem>
                <MenuItem value="MEMBER">Member</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Committee</InputLabel>
              <Select value={committeeFilter} onChange={(e) => setCommitteeFilter(e.target.value)} label="Committee">
                <MenuItem value="">All Committees</MenuItem>
                {committees?.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1}>
            {(searchQuery || roleFilter || committeeFilter) && (
              <Button size="small" startIcon={<Close />} onClick={() => { setSearchQuery(''); setRoleFilter(''); setCommitteeFilter(''); }}>
                Clear
              </Button>
            )}
          </Grid>
        </Grid>
        {filteredMembers.length !== (eventMembers?.length ?? 0) && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Showing {filteredMembers.length} of {eventMembers?.length ?? 0} members
          </Typography>
        )}
      </Paper>

      {/* Mobile Card Grid */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredMembers.length === 0 ? (
          <Box textAlign="center" py={6}>
            <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No members found</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredMembers.map((member) => (
              <Grid item xs={12} sm={6} key={member.id}>
                <MemberCard
                  member={member}
                  committeeNames={getMemberCommittees(member)}
                  onViewProfile={() => setProfileMember(member)}
                  onEdit={() => canManageRoles && setEditMember(member)}
                  onAssign={() => setAssignMember(member)}
                  onRemove={() => canManageRoles && handleDeleteClick(member)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Desktop Table */}
      <Paper sx={{ display: { xs: 'none', md: 'block' }, width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Privileges</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Committees</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Joined</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={4}>
                      <People sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No committee members yet. Click "Add Member" to get started.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const name = getMemberName(member);
                  const privileges = getPrivilegeChips(member);
                  const memberCommittees = getMemberCommittees(member);
                  return (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ bgcolor: avatarColor(name), width: 36, height: 36, fontSize: '0.875rem', fontWeight: 'bold' }}>
                            {getInitials(name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">{name}</Typography>
                            {member.user_details?.email && (
                              <Typography variant="caption" color="text.secondary">{member.user_details.email}</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{member.phone || member.user_details?.phone || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={roleLabel(member.role)} color={roleColor(member.role)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {privileges.slice(0, 2).map((p) => (
                            <Chip key={p.label} label={p.label} color={p.color} size="small" variant="outlined" />
                          ))}
                          {privileges.length > 2 && <Chip label={`+${privileges.length - 2}`} size="small" />}
                          {privileges.length === 0 && <Typography variant="caption" color="text.secondary">—</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {memberCommittees.slice(0, 2).map((c) => (
                            <Chip key={c} label={c} size="small" variant="outlined" color="primary" />
                          ))}
                          {memberCommittees.length > 2 && <Chip label={`+${memberCommittees.length - 2}`} size="small" />}
                          {memberCommittees.length === 0 && <Typography variant="caption" color="text.secondary">None</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          <Tooltip title="View Profile">
                            <IconButton size="small" color="primary" onClick={() => setProfileMember(member)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Change Event Role">
                            <IconButton size="small" color="info" onClick={() => setEditMember(member)} disabled={!canManageRoles}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Assign to Subcommittee">
                            <IconButton size="small" color="secondary" onClick={() => setAssignMember(member)}>
                              <GroupAdd fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove from Event">
                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(member)} disabled={!canManageRoles}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* FAB (mobile only) */}
      <Fab
        color="primary"
        onClick={() => setAddDialogOpen(true)}
        disabled={!canCreateNewMember}
        sx={{ position: 'fixed', bottom: 24, right: 24, display: { xs: 'flex', sm: 'none' } }}
      >
        <Add />
      </Fab>

      {/* Member Profile Drawer */}
      <MemberProfileDrawer
        open={!!profileMember}
        member={profileMember}
        committeeNames={profileMember ? getMemberCommittees(profileMember) : []}
        onClose={() => setProfileMember(null)}
        onEdit={() => { setEditMember(profileMember); setProfileMember(null); }}
        onRemove={() => { if (profileMember) handleDeleteClick(profileMember); setProfileMember(null); }}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        open={!!editMember && canManageRoles}
        member={editMember}
        eventId={eventId!}
        onClose={() => setEditMember(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['event-members', eventId] });
          setSuccessMessage('Member updated successfully!');
        }}
      />

      {/* Assign to Subcommittee Modal */}
      <AssignSubcommitteeModal
        open={!!assignMember}
        member={assignMember}
        committees={committees || []}
        onClose={() => setAssignMember(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['all-committee-members', eventId] });
          setSuccessMessage('Member assigned to subcommittee!');
        }}
      />

      {/* Add Member Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { m: { xs: 0, sm: 2 }, maxHeight: { xs: '100%', sm: '90vh' } } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonAdd />
            <Typography variant="h6">Add Committee Member</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={creationMode} onChange={(_, v) => setCreationMode(v)} variant="fullWidth">
              <Tab
                value="new"
                label="Create New User"
                icon={<PersonAdd />}
                iconPosition="start"
                disabled={!canCreateNewMember}
              />
              <Tab value="existing" label="Select Existing" icon={<GroupAdd />} iconPosition="start" />
            </Tabs>
            <Divider />

            {!canCreateNewMember && creationMode === 'new' && (
              <Alert severity="warning">
                New member creation is restricted to Event Owner, Chairman, and Secretary.
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Committee *</InputLabel>
              <Select value={selectedCommittee || ''} onChange={(e) => setSelectedCommittee(e.target.value)} label="Committee *">
                {committees?.map((c: CommitteePhase6) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            {creationMode === 'new' && (
              <>
                <Alert severity="info">Create a new user and add them to the selected committee</Alert>
                <TextField label="Full Name *" value={newUserData.full_name} onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })} fullWidth required placeholder="e.g., John Doe" />
                <TextField label="Phone Number *" value={newUserData.phone} onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })} fullWidth required placeholder="+254712345678" helperText="Include country code" />
                <TextField label="Email (Optional)" type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} fullWidth placeholder="e.g., john@example.com" />
                <FormControl fullWidth>
                  <InputLabel>Event Role</InputLabel>
                  <Select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })} label="Event Role">
                    <MenuItem value="LEADER">Chair</MenuItem>
                    <MenuItem value="MEMBER">Secretary</MenuItem>
                    <MenuItem value="FINANCE">Treasurer</MenuItem>
                    <MenuItem value="MEMBER">Committee Member</MenuItem>
                    <MenuItem value="FINANCE">Finance Member</MenuItem>
                    <MenuItem value="MEMBER">Budget Committee Member</MenuItem>
                    <MenuItem value="MEMBER">Mobilisation Team Member</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {creationMode === 'existing' && (
              <>
                <Alert severity="info">Select an existing event member to add to the committee</Alert>
                <Autocomplete
                  options={eventMembers || []}
                  getOptionLabel={(opt) => opt.user_details.full_name || opt.user_details.phone}
                  value={selectedUser}
                  onChange={(_, v) => setSelectedUser(v)}
                  renderInput={(params) => <TextField {...params} label="Select User *" placeholder="Search by name or phone" />}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2">{opt.user_details.full_name || opt.user_details.phone}</Typography>
                        <Typography variant="caption" color="text.secondary">{opt.user_details.phone}</Typography>
                      </Box>
                    </li>
                  )}
                />
              </>
            )}

            <TextField label="Role Description (Optional)" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="e.g., Coordinator, Secretary" fullWidth multiline rows={2} />
            <FormControlLabel control={<Checkbox checked={isLead} onChange={(e) => setIsLead(e.target.checked)} />} label="Assign as Committee Lead" />

            {(userCreationError || addMemberMutation.isError) && (
              <Alert severity="error">
                {userCreationError || (addMemberMutation.error as any)?.response?.data?.error || 'Failed to add member. Please try again.'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialogOpen(false); resetForm(); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMember}
            disabled={
              !selectedCommittee ||
              (creationMode === 'new' && (!newUserData.full_name || !newUserData.phone)) ||
              (creationMode === 'existing' && !selectedUser) ||
              addMemberMutation.isPending
            }
          >
            {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={teamLeadDialogOpen} onClose={() => setTeamLeadDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Team Lead</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select an existing event member to assign the Team Lead role.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Member</InputLabel>
              <Select
                value={selectedTeamLeadMemberId}
                onChange={(e) => setSelectedTeamLeadMemberId(String(e.target.value))}
                label="Member"
              >
                {eligibleTeamLeadMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {getMemberName(member)} ({roleLabel(member.role)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {assignTeamLeadMutation.isError && (
              <Alert severity="error">
                {(assignTeamLeadMutation.error as any)?.response?.data?.detail || 'Failed to assign team lead'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamLeadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => assignTeamLeadMutation.mutate(selectedTeamLeadMemberId)}
            disabled={!selectedTeamLeadMemberId || assignTeamLeadMutation.isPending || !canManageRoles}
          >
            {assignTeamLeadMutation.isPending ? 'Assigning...' : 'Assign Team Lead'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Member?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{memberToDelete?.name}</strong> from this event?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They will be removed from the event and all committee assignments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={removeMemberMutation.isPending}>
            {removeMemberMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CommitteeMembersPage;
