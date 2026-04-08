import type { Metadata } from 'next';
import { Box } from '@mui/material';
import { Providers } from './providers';
import { Sidebar, DRAWER_WIDTH } from '@/widgets/sidebar/ui/sidebar';

export const metadata: Metadata = {
  title: 'Lesson Tracker',
  description: 'Трекінг уроків, учнів та оплат',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0 }}>
        <Providers>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                width: `calc(100% - ${DRAWER_WIDTH}px)`,
                p: { xs: 2, md: 4 },
                pt: { xs: 3, md: 4 },
                backgroundColor: '#09090b',
                backgroundImage:
                  'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.08), transparent)',
                minHeight: '100vh',
              }}
            >
              <Box
                sx={{
                  animation: 'fadeInUp 0.4s ease-out',
                }}
              >
                {children}
              </Box>
            </Box>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
