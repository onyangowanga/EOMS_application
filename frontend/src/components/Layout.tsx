import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  alpha,
  useTheme,
} from '@mui/material/styles';
import {
  AppBar,
  Chip,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Event as EventIcon,
  Group,
  Assignment,
  AttachMoney,
  Business,
  Assessment,
  Logout,
  AccountCircle,
  People as ClusterIcon,
  AccountBalance as TreasuryIcon,
  Receipt as BudgetIcon,
  CheckCircle as ApprovalIcon,
  Notifications,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { eventService } from '../services/event.service';
import { hasAnyRole } from '../utils/rbac';

const drawerWidth = 276;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  section?: string; // Optional section header
}

// Helper to extract eventId from path
const getEventIdFromPath = (pathname: string): string | null => {
  const match = pathname.match(/\/events\/([^\/]+)/);
  if (!match) return null;
  
  const potentialEventId = match[1];
  // Exclude reserved words that are not event IDs
  const reservedWords = ['create', 'new', 'add'];
  if (reservedWords.includes(potentialEventId.toLowerCase())) {
    return null;
  }
  
  return potentialEventId;
};

/**
 * Get menu items based on event context
 * Organized according to EOMS_Frontend_Pages.md (10 modules)
 * 
 * IMPORTANT: Single Event System
 * - This system manages ONE umbrella event
 * - All users work on the same event
 * - No event switching needed
 */
const getMenuItems = (eventId: string | null, user: any): MenuItem[] => {
  if (eventId) {
    const canAccessFinance = hasAnyRole(user, ['chair', 'treasurer', 'finance_member', 'executive_admin']);
    const canAccessApprovals = hasAnyRole(user, ['chair', 'treasurer', 'finance_member', 'executive_admin']);

    // Event-centric menu (when viewing THE event)
    const eventMenuItems: MenuItem[] = [
      // Module 3: Event Dashboard
      { text: 'Event Dashboard', icon: <Dashboard />, path: `/events/${eventId}/dashboard`, section: 'Dashboard' },
      
      // Module 4: Committees
      { text: 'Role Committees', icon: <Business />, path: `/events/${eventId}/role-committees`, section: 'Committees' },
      { text: 'Task Committees', icon: <Group />, path: `/events/${eventId}/subcommittees` },
      
      // Module 5: Budget & Finance
      ...(canAccessFinance
        ? [
            { text: 'Budget Overview', icon: <BudgetIcon />, path: `/events/${eventId}/budget`, section: 'Budget & Finance' },
            { text: 'Budget Items', icon: <BudgetIcon />, path: `/events/${eventId}/budget/items` },
            { text: 'Requisitions', icon: <Assignment />, path: `/events/${eventId}/requisitions` },
            { text: 'Payment Logs', icon: <AttachMoney />, path: `/events/${eventId}/payment-logs` },
            { text: 'Treasury', icon: <TreasuryIcon />, path: `/events/${eventId}/treasury` },
          ]
        : []),
      
      // Module 6: Funds Mobilisation (Clusters)
      { text: 'Clusters', icon: <ClusterIcon />, path: `/events/${eventId}/clusters`, section: 'Fundraising' },
      
      // Module 7: Approvals
      ...(canAccessApprovals
        ? [{ text: 'Approval Center', icon: <ApprovalIcon />, path: `/events/${eventId}/approvals`, section: 'Approvals' }]
        : []),
      
      // Module 8: Reports
      { text: 'Reports', icon: <Assessment />, path: `/events/${eventId}/reports`, section: 'Reports' },
    ];
    
    return eventMenuItems;
  }
  
  // Fallback menu (shouldn't normally be shown in single-event system)
  return [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', section: 'Main' },
  ];
};

const Layout: React.FC = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect current eventId from URL
  const eventId = getEventIdFromPath(location.pathname);
  const menuItems = getMenuItems(eventId, user);
  
  // Fetch current event data if in event context
  const { data: currentEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEvent(eventId!),
    enabled: !!eventId,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(248,252,255,0.96) 0%, rgba(236,246,251,0.96) 100%)' }}>
      <Toolbar sx={{ minHeight: 76, alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <img 
            src="/favicon_io/favicon-32x32.png" 
            alt="EOMS Logo" 
            style={{ width: '32px', height: '32px' }}
          />
          <Box>
            <Typography variant="h6" noWrap component="div">
              EOMS
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Event operations cockpit
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.25, py: 1.5 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.text}>
            {item.section && index > 0 && menuItems[index - 1].section !== item.section && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItem sx={{ px: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {item.section}
                  </Typography>
                </ListItem>
              </>
            )}
            {item.section && index === 0 && (
              <ListItem sx={{ px: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {item.section}
                </Typography>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary', minWidth: 42 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      {/* User Account Section */}
      <List sx={{ px: 1.25, py: 1.5 }}>
        <ListItem sx={{ px: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Account
          </Typography>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/notifications')}>
            <ListItemIcon><Notifications /></ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/profile')}>
            <ListItemIcon><AccountCircle /></ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/settings')}>
            <ListItemIcon><Settings /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
          bgcolor: alpha(theme.palette.background.paper, 0.84),
          color: 'text.primary',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 72, sm: 78 } }}>
          <IconButton
            color="primary"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
            <img 
              src="/favicon_io/favicon-32x32.png" 
              alt="EOMS Logo" 
              style={{ width: '32px', height: '32px' }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" noWrap component="div">
                {currentEvent ? currentEvent.event_name : 'EOMS'}
              </Typography>
              {currentEvent && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                  <Chip size="small" color="primary" variant="outlined" label={currentEvent.status} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {currentEvent.location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={handleProfileMenuOpen}
            color="primary"
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
              {user?.full_name.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.full_name}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          p: { xs: 2, sm: 3.5 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
