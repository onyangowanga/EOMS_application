import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
} from '@mui/material';
import { Download, PictureAsPdf, TableChart } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

/**
 * Event Summary Report Page - Reports Module
 * Comprehensive event summary report
 */
const EventSummaryReportPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Event Summary Report</Typography>
        <Button variant="contained" startIcon={<Download />}>
          Download PDF
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Budget
              </Typography>
              <Typography variant="h5">KES 1,500,000</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Collected
              </Typography>
              <Typography variant="h5">KES 1,200,000</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h5">KES 900,000</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Balance
              </Typography>
              <Typography variant="h5">KES 300,000</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed event summary will be displayed here...
        </Typography>
      </Paper>
    </Box>
  );
};

export default EventSummaryReportPage;
