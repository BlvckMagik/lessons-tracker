'use client';

import { createTheme, alpha } from '@mui/material/styles';

const ACCENT = '#6366f1';
const ACCENT_LIGHT = '#818cf8';
const ACCENT_DARK = '#4f46e5';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: ACCENT,
      light: ACCENT_LIGHT,
      dark: ACCENT_DARK,
    },
    secondary: {
      main: '#ec4899',
    },
    success: {
      main: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: '#09090b',
      paper: '#111113',
    },
    divider: 'rgba(255,255,255,0.06)',
    text: {
      primary: '#fafafa',
      secondary: 'rgba(250,250,250,0.55)',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
      fontSize: '0.7rem',
      color: 'rgba(250,250,250,0.4)',
    },
    body2: {
      color: 'rgba(250,250,250,0.6)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha('#fff', 0.08)} transparent`,
        },
        '*::-webkit-scrollbar': {
          width: 6,
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: alpha('#fff', 0.08),
          borderRadius: 3,
        },
        '@keyframes fadeInUp': {
          from: {
            opacity: 0,
            transform: 'translateY(12px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        '@keyframes pulseNeedsAction': {
          '0%, 100%': {
            boxShadow: `0 0 0 0 rgba(129, 140, 248, 0.4)`,
          },
          '50%': {
            boxShadow: `0 0 12px 4px rgba(129, 140, 248, 0.25)`,
          },
        },
        '.MuiPopper-root div[style*="100000"]': {
          display: 'none !important',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#fff', 0.03),
          border: `1px solid ${alpha('#fff', 0.06)}`,
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
          boxShadow: `0 4px 14px ${alpha(ACCENT, 0.3)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${ACCENT_LIGHT} 0%, ${ACCENT} 100%)`,
            boxShadow: `0 6px 20px ${alpha(ACCENT, 0.4)}`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: alpha('#fff', 0.12),
          '&:hover': {
            borderColor: alpha('#fff', 0.25),
            backgroundColor: alpha('#fff', 0.04),
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha('#fff', 0.04),
          padding: '14px 16px',
        },
        head: {
          backgroundColor: alpha('#fff', 0.02),
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          color: 'rgba(250,250,250,0.4)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&.MuiTableRow-hover:hover': {
            backgroundColor: alpha('#fff', 0.03),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 8,
        },
        outlined: {
          borderColor: alpha('#fff', 0.12),
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#141416',
          border: `1px solid ${alpha('#fff', 0.08)}`,
          backgroundImage: 'none',
          boxShadow: `0 24px 48px ${alpha('#000', 0.5)}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: '#18181b',
          border: `1px solid ${alpha('#fff', 0.08)}`,
          backgroundImage: 'none',
          boxShadow: `0 16px 40px ${alpha('#000', 0.5)}`,
          borderRadius: 14,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(ACCENT, 0.15)}`,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#fff', 0.06),
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.15)',
          },
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          '&.Mui-active': {
            color: ACCENT_LIGHT,
          },
        },
      },
    },
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          backgroundColor: alpha('#fff', 0.04),
          '&::after': {
            background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.04)}, transparent)`,
          },
        },
      },
    },
  },
});
