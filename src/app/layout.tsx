import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Box } from '@mui/material';
import { Providers } from './providers';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { SIDEBAR_COOKIE } from '@/shared/config/constants';

export const viewport: Viewport = {
  themeColor: '#6366f1',
};

export const metadata: Metadata = {
  title: 'Lesson Tracker',
  description: 'Трекінг уроків, учнів та оплат',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lesson Tracker',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === 'true';

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
            <Sidebar defaultCollapsed={sidebarCollapsed} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                minWidth: 0,
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
