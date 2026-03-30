import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Group, Assignment, ArrowForward } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventService } from '../services/event.service';

/**
 * Subcommittees List Page - Subcommittees Module
 * Lists all subcommittees for the current event
 */
const SubcommitteesListPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { data: committees, isLoading } = useQuery({
    queryKey: ['committees', eventId],
    queryFn: () => eventService.getEventCommittees(eventId!),
    enabled: !!eventId,
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Subcommittees</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate(`/events/${eventId}/subcommittees/create`)}
        >
          Create Subcommittee
        </Button>
      </Box>

      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          {committees?.map((committee: any) => (
            <Grid item xs={12} md={6} lg={4} key={committee.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h6">{committee.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {committee.description}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() =>
                        navigate(`/events/${eventId}/subcommittees/${committee.id}`)
                      }
                    >
                      <ArrowForward />
                    </IconButton>
                  </Box>

                  <Box display="flex" gap={1} mt={2}>
                    <Chip
                      icon={<Group />}
                      label={`${committee.members_count || 0} members`}
                      size="small"
                    />
                    <Chip
                      icon={<Assignment />}
                      label={`${committee.tasks_count || 0} tasks`}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SubcommitteesListPage;
