import type { Metadata } from 'next';
import { Box, Toolbar } from '@mui/material';
import { Providers } from './providers';
import { Sidebar, DRAWER_WIDTH } from '@/widgets/sidebar/ui/sidebar';

export const metadata: Metadata = {
  title: 'Lesson Tracker',
  description: 'Трекінг уроків, учнів та оплат',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body style={{ margin: 0 }}>
        <Providers>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                width: `calc(100% - ${DRAWER_WIDTH}px)`,
                p: 3,
                backgroundColor: '#0a0a0a',
              }}
            >
              <Toolbar sx={{ minHeight: '16px !important' }} />
              {children}
            </Box>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
