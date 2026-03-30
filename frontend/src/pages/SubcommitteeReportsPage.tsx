import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import { useParams } from 'react-router-dom';

/**
 * Subcommittee Reports Page - Reports Module
 * Reports from all subcommittees
 */
const SubcommitteeReportsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  const reports = [
    {
      id: 1,
      committee: 'Main Committee',
      submittedBy: 'John Doe',
      date: '2026-03-29',
      summary: 'Completed venue setup and confirmed vendor bookings',
    },
    {
      id: 2,
      committee: 'Finance Committee',
      submittedBy: 'Jane Smith',
      date: '2026-03-28',
      summary: 'Reviewed and approved budget allocations for Q1',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Subcommittee Reports
      </Typography>

      <Paper>
        <List>
          {reports.length === 0 ? (
            <ListItem>
              <ListItemText primary="No reports available" />
            </ListItem>
          ) : (
            reports.map((report, index) => (
              <React.Fragment key={report.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={report.committee}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {report.submittedBy}
                        </Typography>
                        {` — ${report.date}`}
                        <br />
                        {report.summary}
                      </>
                    }
                  />
                </ListItem>
                {index < reports.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default SubcommitteeReportsPage;
