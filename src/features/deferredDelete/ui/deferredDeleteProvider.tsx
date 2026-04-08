'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Snackbar,
  Paper,
  Stack,
  Typography,
  Button,
  LinearProgress,
  alpha,
} from '@mui/material';

const DELETE_DELAY_MS = 5000;

export type DeferredDeletePayload = {
  message: string;
  execute: () => void | Promise<void>;
};

type Ctx = {
  scheduleDelete: (payload: DeferredDeletePayload) => void;
};

const DeferredDeleteContext = createContext<Ctx | null>(null);

export function useDeferredDelete() {
  const ctx = useContext(DeferredDeleteContext);
  if (!ctx) {
    throw new Error('useDeferredDelete must be used within DeferredDeleteProvider');
  }
  return ctx;
}

export function DeferredDeleteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const generationRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearTimeoutOnly = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleDelete = useCallback(
    (payload: DeferredDeletePayload) => {
      generationRef.current += 1;
      const gen = generationRef.current;
      clearTimeoutOnly();
      stopAnimation();

      const { message: msg, execute } = payload;
      setMessage(msg);
      setProgress(0);
      setOpen(true);
      startTimeRef.current = Date.now();

      const loop = () => {
        if (gen !== generationRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const p = Math.min(100, (elapsed / DELETE_DELAY_MS) * 100);
        setProgress(p);
        if (p < 100 && gen === generationRef.current) {
          rafRef.current = requestAnimationFrame(loop);
        }
      };
      rafRef.current = requestAnimationFrame(loop);

      timeoutRef.current = setTimeout(async () => {
        if (gen !== generationRef.current) return;
        stopAnimation();
        clearTimeoutOnly();
        setOpen(false);
        setProgress(0);
        await execute();
      }, DELETE_DELAY_MS);
    },
    [clearTimeoutOnly, stopAnimation],
  );

  const handleUndo = useCallback(() => {
    generationRef.current += 1;
    clearTimeoutOnly();
    stopAnimation();
    setOpen(false);
    setProgress(0);
  }, [clearTimeoutOnly, stopAnimation]);

  return (
    <DeferredDeleteContext.Provider value={{ scheduleDelete }}>
      {children}
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={null}
        onClose={(_, reason) => {
          if (reason === 'clickaway' || reason === 'escapeKeyDown') return;
        }}
        sx={{ bottom: { xs: 16, sm: 24 } }}
      >
        <Paper
          elevation={12}
          sx={{
            minWidth: { xs: '100%', sm: 360 },
            maxWidth: 480,
            overflow: 'hidden',
            backgroundColor: alpha('#18181b', 0.98),
            border: `1px solid ${alpha('#fff', 0.08)}`,
            borderRadius: 2,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              borderRadius: 0,
              backgroundColor: alpha('#fff', 0.06),
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#f87171',
                transition: 'none',
              },
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ px: 2, py: 1.5 }}
          >
            <Typography
              variant="body2"
              sx={{ flex: 1, color: 'rgba(255,255,255,0.85)', pr: 1 }}
            >
              {message}
            </Typography>
            <Button
              size="small"
              onClick={handleUndo}
              sx={{
                color: '#818cf8',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: alpha('#6366f1', 0.12) },
              }}
            >
              Скасувати
            </Button>
          </Stack>
        </Paper>
      </Snackbar>
    </DeferredDeleteContext.Provider>
  );
}
