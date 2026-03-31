import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';
import type { RBACRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: RBACRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" textAlign="center" px={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Not Authorized
          </Typography>
          <Typography color="text.secondary">
            Your role does not have permission to access this page.
          </Typography>
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
