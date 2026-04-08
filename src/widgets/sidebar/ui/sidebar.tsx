'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  alpha,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Календар', href: '/', icon: <CalendarMonthIcon /> },
  { label: 'Учні', href: '/students', icon: <PeopleIcon /> },
  { label: 'Звіти', href: '/reports', icon: <AssessmentIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: alpha('#fff', 0.02),
          borderRight: `1px solid ${alpha('#fff', 0.06)}`,
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <Box sx={{ px: 2.5, py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${alpha('#6366f1', 0.3)}`,
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={700} letterSpacing="-0.02em">
              Lesson Tracker
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
              Трекер уроків
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 1.5 }}>
        <Typography
          variant="subtitle2"
          sx={{
            px: 1.5,
            mb: 1,
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Меню
        </Typography>
        <List disablePadding>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  mb: 0.5,
                  py: 1.2,
                  px: 1.5,
                  position: 'relative',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                  backgroundColor: isActive ? alpha('#6366f1', 0.12) : 'transparent',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: `translateY(-50%) scaleY(${isActive ? 1 : 0})`,
                    width: 3,
                    height: '60%',
                    borderRadius: '0 4px 4px 0',
                    background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:hover': {
                    backgroundColor: isActive
                      ? alpha('#6366f1', 0.16)
                      : alpha('#fff', 0.04),
                    color: '#fff',
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha('#6366f1', 0.12),
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: alpha('#6366f1', 0.16),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#818cf8' : 'rgba(255,255,255,0.35)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
