'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Box,
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

type PendingItem = {
  id: string;
  message: string;
  execute: () => void | Promise<void>;
  startTime: number;
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
  const [pending, setPending] = useState<PendingItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [, setRenderTick] = useState(0);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (pending.length === 0) return;
    let rafId: number;
    const loop = () => {
      setRenderTick((n) => n + 1);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [pending.length]);

  const scheduleDelete = useCallback((payload: DeferredDeletePayload) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startTime = Date.now();
    const { message: msg, execute } = payload;

    setPending((prev) => [...prev, { id, message: msg, execute, startTime }]);

    const t = setTimeout(() => {
      timeoutsRef.current.delete(id);
      setPending((prev) => prev.filter((p) => p.id !== id));
      void execute();
    }, DELETE_DELAY_MS);
    timeoutsRef.current.set(id, t);
  }, []);

  const handleUndo = useCallback((id: string) => {
    const t = timeoutsRef.current.get(id);
    if (t) clearTimeout(t);
    timeoutsRef.current.delete(id);
    setPending((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <DeferredDeleteContext.Provider value={{ scheduleDelete }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: { xs: 16, sm: 24 },
          zIndex: (theme) => theme.zIndex.snackbar,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 1,
          pointerEvents: 'none',
          '& > *': { pointerEvents: 'auto' },
          px: 2,
        }}
      >
        {pending.map((item) => {
          const elapsed = Date.now() - item.startTime;
          const progress = Math.min(100, (elapsed / DELETE_DELAY_MS) * 100);
          return (
            <Paper
              key={item.id}
              elevation={12}
              sx={{
                width: '100%',
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
                  {item.message}
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleUndo(item.id)}
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
          );
        })}
      </Box>
    </DeferredDeleteContext.Provider>
  );
}
