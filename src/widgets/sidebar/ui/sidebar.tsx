'use client';

import { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { SIDEBAR_COOKIE, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from '@/shared/config/constants';

const navItems = [
  { label: 'Календар', href: '/', icon: <CalendarMonthIcon /> },
  { label: 'Учні', href: '/students', icon: <PeopleIcon /> },
  { label: 'Звіти', href: '/reports', icon: <AssessmentIcon /> },
];

interface SidebarProps {
  defaultCollapsed?: boolean;
}

export function Sidebar({ defaultCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [enableTransition, setEnableTransition] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEnableTransition(true));
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${SIDEBAR_COOKIE}=${next};path=/;max-age=31536000`;
      return next;
    });
  };

  const width = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;
  const t = enableTransition ? '0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        transition: `width ${t}`,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          backgroundColor: alpha('#fff', 0.02),
          borderRight: `1px solid ${alpha('#fff', 0.06)}`,
          backdropFilter: 'blur(20px)',
          transition: `width ${t}`,
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ px: collapsed ? 1.25 : 2.5, py: 3, transition: `padding ${t}` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              minWidth: 36,
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
          {!collapsed && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography variant="body1" fontWeight={700} letterSpacing="-0.02em">
                Lesson Tracker
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                Трекер уроків
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ px: collapsed ? 1 : 1.5, transition: `padding ${t}` }}>
        {!collapsed && (
          <Typography
            variant="subtitle2"
            sx={{
              px: 1.5,
              mb: 1,
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Меню
          </Typography>
        )}
        <List disablePadding>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const button = (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  mb: 0.5,
                  py: 1.2,
                  px: collapsed ? 0 : 1.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
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
                    minWidth: collapsed ? 0 : 36,
                    color: isActive ? '#818cf8' : 'rgba(255,255,255,0.35)',
                    transition: 'color 0.2s ease',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                    }}
                  />
                )}
              </ListItemButton>
            );

            return collapsed ? (
              <Tooltip key={item.href} title={item.label} placement="right" arrow>
                {button}
              </Tooltip>
            ) : (
              button
            );
          })}
        </List>
      </Box>

      <Box sx={{ mt: 'auto', p: 1.5, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <IconButton
          onClick={handleToggle}
          size="small"
          sx={{
            color: 'rgba(255,255,255,0.3)',
            '&:hover': { color: '#818cf8', backgroundColor: alpha('#6366f1', 0.1) },
          }}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Drawer>
  );
}
