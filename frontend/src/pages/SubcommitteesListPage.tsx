import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import { Add, Group, Assignment, ArrowForward, Star } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import { committeeService } from '../services/committee.service';
import type { CommitteePhase6, CommitteeMember } from '../types';
import { isTaskBasedCommittee } from '../utils/committeeModules';

/**
 * Subcommittees List Page - Subcommittees Module
 * Lists all subcommittees for the current event with member previews
 */
const SubcommitteesListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: committees, isLoading } = useQuery({
    queryKey: ['committees', eventId],
    queryFn: () => eventService.getEventCommittees(eventId!),
    enabled: !!eventId,
  });

  // Fetch members for all committees
  const { data: committeesWithMembers } = useQuery({
    queryKey: ['committees-with-members', eventId, committees],
    queryFn: async () => {
      if (!committees) return [];
      
      const committeesWithMembersData = await Promise.all(
        committees.map(async (committee: CommitteePhase6) => {
          try {
            const members = await committeeService.getMembers(parseInt(committee.id));
            return { ...committee, members };
          } catch (error) {
            console.error(`Failed to fetch members for committee ${committee.id}:`, error);
            return { ...committee, members: [] };
          }
        })
      );
      
      return committeesWithMembersData;
    },
    enabled: !!committees && committees.length > 0,
  });

  const taskBasedCommittees =
    ((committeesWithMembers || committees)?.filter((committee: any) => isTaskBasedCommittee(committee)) || []);

  const averageProgress = taskBasedCommittees.length > 0
    ? taskBasedCommittees.reduce((sum: number, committee: any) => {
        const rawProgress =
          committee.operational_progress ??
          committee.progress_percentage ??
          committee.progress ??
          0;
        return sum + (parseFloat(String(rawProgress)) || 0);
      }, 0) / taskBasedCommittees.length
    : 0;

  return (
    <Box>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
          mb={2}
        >
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Task Committees
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Operational subcommittees for task execution and field coordination.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/events/${eventId}/subcommittees/create`)}
          >
            Create Subcommittee
          </Button>
        </Box>

        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              Total committees: <strong>{taskBasedCommittees.length}</strong>
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              Average progress: <strong>{averageProgress.toFixed(1)}%</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight="medium">
              Operational Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {averageProgress.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(Math.max(averageProgress, 0), 100)}
            sx={{ height: 12, borderRadius: 6 }}
          />
        </Box>
      </Paper>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {taskBasedCommittees.map((committee: any) => {
            const members = committee.members || [];
            const lead = members.find((m: CommitteeMember) => m.is_lead);
            const rawProgress =
              committee.operational_progress ??
              committee.progress_percentage ??
              committee.progress ??
              0;
            const progress = Math.max(0, Math.min(100, parseFloat(String(rawProgress)) || 0));
            
            return (
              <Grid item xs={12} md={6} lg={4} key={committee.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': { boxShadow: 4 }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {committee.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {committee.committee_type_display}
                        </Typography>
                        {lead && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Star sx={{ fontSize: 16, color: '#f57c00' }} />
                            <Typography variant="caption" color="text.secondary">
                              Lead: {lead.user.full_name || lead.user.phone}
                            </Typography>
                          </Box>
                        )}
                        {committee.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {committee.description}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        onClick={() =>
                          navigate(`/events/${eventId}/subcommittees/${committee.id}`)
                        }
                        size="small"
                      >
                        <ArrowForward />
                      </IconButton>
                    </Box>

                    {/* Members Avatar Group */}
                    {members.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Members
                        </Typography>
                        <AvatarGroup max={5} sx={{ mt: 1, justifyContent: 'flex-start' }}>
                          {members.map((member: CommitteeMember) => (
                            <Tooltip 
                              key={member.id} 
                              title={`${member.user.full_name || member.user.phone}${member.is_lead ? ' (Lead)' : ''}`}
                            >
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32,
                                  border: member.is_lead ? '2px solid #f57c00' : undefined
                                }}
                              >
                                {(member.user.full_name || member.user.phone).charAt(0).toUpperCase()}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </Box>
                    )}

                    {/* Stats */}
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        icon={<Group />}
                        label={`${committee.member_count ?? members.length} members`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Assignment />}
                        label={`${committee.task_count || 0} tasks`}
                        size="small"
                        variant="outlined"
                      />
                      {committee.is_main && (
                        <Chip
                          label="Main"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {progress.toFixed(0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        color={progress >= 75 ? 'success' : progress >= 50 ? 'warning' : 'error'}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      {/* Empty state for operational subcommittees */}
      {!isLoading && taskBasedCommittees.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center', mt: 3 }}>
          <Typography color="text.secondary" gutterBottom>
            No operational subcommittees yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Finance Committee and Main Committee are managed separately.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/events/${eventId}/subcommittees/create`)}
          >
            Create First Subcommittee
          </Button>
        </Card>
      )}    </Box>
  );
};

export default SubcommitteesListPage;
