'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';

const DRAWER_WIDTH = 240;

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
          backgroundColor: '#121212',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthIcon color="primary" />
          <Typography variant="h6" fontWeight={700} noWrap>
            Lesson Tracker
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={pathname === item.href}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.24)',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
