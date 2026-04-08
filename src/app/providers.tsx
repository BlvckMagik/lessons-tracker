'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/uk';
import { theme } from './theme';
import { StoreProvider } from './storeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}
