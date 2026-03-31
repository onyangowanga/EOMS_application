import { alpha, createTheme } from '@mui/material/styles';

const coolPrimary = '#0f6e8c';
const coolSecondary = '#1f9bb8';
const coolAccent = '#58c4dd';
const coolSurface = '#f8fcff';
const coolBackground = '#eef6fb';
const coolBorder = '#cfe2ee';
const coolText = '#17324d';
const coolMuted = '#56718b';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: coolPrimary,
      light: '#4d94ab',
      dark: '#0a4d61',
      contrastText: '#ffffff',
    },
    secondary: {
      main: coolSecondary,
      light: '#6ab8cb',
      dark: '#116f86',
      contrastText: '#ffffff',
    },
    info: {
      main: coolAccent,
      light: '#8fdded',
      dark: '#1e91ab',
    },
    success: {
      main: '#16836a',
      light: '#49af93',
      dark: '#0f5c49',
    },
    warning: {
      main: '#d68a22',
      light: '#e4ab59',
      dark: '#9c6517',
    },
    error: {
      main: '#c75a73',
      light: '#db8da0',
      dark: '#8d3047',
    },
    background: {
      default: coolBackground,
      paper: coolSurface,
    },
    text: {
      primary: coolText,
      secondary: coolMuted,
    },
    divider: coolBorder,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Manrope, Segoe UI, sans-serif',
    h1: {
      fontFamily: 'Space Grotesk, Manrope, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontFamily: 'Space Grotesk, Manrope, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontFamily: 'Space Grotesk, Manrope, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h4: {
      fontFamily: 'Space Grotesk, Manrope, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontFamily: 'Space Grotesk, Manrope, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontFamily: 'Space Grotesk, Manrope, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: '-0.01em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at top left, rgba(88,196,221,0.22), transparent 30%), radial-gradient(circle at bottom right, rgba(15,110,140,0.12), transparent 28%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha(coolBorder, 0.8)}`,
          boxShadow: '0 20px 45px rgba(23, 50, 77, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 18,
          minHeight: 42,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0f6e8c 0%, #1f9bb8 100%)',
        },
        outlined: {
          borderColor: alpha(coolPrimary, 0.2),
          backgroundColor: alpha('#ffffff', 0.5),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${alpha(coolBorder, 0.8)}`,
          boxShadow: '0 22px 40px rgba(23, 50, 77, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${alpha(coolBorder, 0.75)}`,
          backgroundColor: alpha('#ffffff', 0.72),
          backdropFilter: 'blur(14px)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(coolPrimary, 0.06),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: coolText,
          borderBottom: `1px solid ${alpha(coolBorder, 0.9)}`,
        },
        body: {
          borderBottom: `1px solid ${alpha(coolBorder, 0.55)}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 10,
          marginBlock: 4,
          '&.Mui-selected': {
            backgroundColor: alpha(coolPrimary, 0.12),
            color: coolPrimary,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: alpha('#ffffff', 0.72),
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;