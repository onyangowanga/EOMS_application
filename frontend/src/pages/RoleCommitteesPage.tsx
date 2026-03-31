import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Button,
} from '@mui/material';
import { ArrowForward, Group, Assignment, AccountBalance, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event.service';
import type { CommitteePhase6 } from '../types';
import { isRoleBasedCommittee } from '../utils/committeeModules';

const RoleCommitteesPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: committees, isLoading } = useQuery({
    queryKey: ['committees', eventId, 'role-based'],
    queryFn: () => eventService.getEventCommittees(eventId!),
    enabled: !!eventId,
  });

  const roleCommittees = ((committees || []) as CommitteePhase6[]).filter(isRoleBasedCommittee);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Role-Based Committees</Typography>
          <Typography variant="body2" color="text.secondary">
            Governance, finance, and supervisory committees are managed separately from operational task committees.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate(`/events/${eventId}/approvals`)}>
          Open Approval Center
        </Button>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={180} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {roleCommittees.map((committee) => (
            <Grid item xs={12} md={6} lg={4} key={committee.id}>
              <Card sx={{ height: '100%', '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {committee.name}
                      </Typography>
                      <Chip label={committee.committee_type_display} size="small" color="primary" sx={{ mb: 1 }} />
                      {committee.lead_name && (
                        <Typography variant="body2" color="text.secondary">
                          Lead: {committee.lead_name}
                        </Typography>
                      )}
                      {committee.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {committee.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton onClick={() => navigate(`/events/${eventId}/subcommittees/${committee.id}`)} size="small">
                      <ArrowForward />
                    </IconButton>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip icon={<Group />} label={`${committee.member_count || 0} members`} size="small" variant="outlined" />
                    <Chip icon={<Assignment />} label={`${committee.task_count || 0} tracked items`} size="small" variant="outlined" />
                    <Chip icon={<AccountBalance />} label={committee.is_main ? 'Executive' : 'Oversight'} size="small" variant="outlined" />
                    {committee.operational_progress && (
                      <Chip icon={<CheckCircle />} label={`${parseFloat(committee.operational_progress).toFixed(0)}% progress`} size="small" variant="outlined" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && roleCommittees.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center', mt: 3 }}>
          <Typography color="text.secondary" gutterBottom>
            No role-based committees found for this event.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default RoleCommitteesPage;