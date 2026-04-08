'use client';

import { Stack, Button, Chip, alpha, Fade } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useUpdateLessonStatusMutation } from '@/entities/lesson/api/lessonApi';
import type { LessonStatus } from '@/entities/lesson/model/types';
import { LESSON_STATUSES, LESSON_STATUS_LABELS } from '@/shared/config/constants';

interface Props {
  lessonId: number;
  currentStatus: LessonStatus;
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399' },
  MISSED: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' },
  CANCELLED: { bg: 'rgba(248, 113, 113, 0.12)', color: '#f87171' },
  PLANNED: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' },
};

export function LessonStatusButtons({ lessonId, currentStatus }: Props) {
  const [updateStatus, { isLoading }] = useUpdateLessonStatusMutation();

  if (currentStatus !== LESSON_STATUSES.PLANNED) {
    const style = statusStyles[currentStatus];
    return (
      <Fade in timeout={300}>
        <Chip
          label={LESSON_STATUS_LABELS[currentStatus]}
          size="small"
          sx={{
            backgroundColor: style.bg,
            color: style.color,
            fontWeight: 600,
            border: 'none',
          }}
        />
      </Fade>
    );
  }

  const handleStatus = (status: LessonStatus) => {
    updateStatus({ id: lessonId, status });
  };

  return (
    <Stack direction="row" spacing={0.75}>
      <Button
        size="small"
        variant="outlined"
        onClick={() => handleStatus(LESSON_STATUSES.COMPLETED)}
        disabled={isLoading}
        startIcon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          fontSize: '0.72rem',
          py: 0.5,
          px: 1,
          minWidth: 0,
          borderColor: alpha('#34d399', 0.3),
          color: '#34d399',
          '&:hover': {
            borderColor: '#34d399',
            backgroundColor: alpha('#34d399', 0.08),
          },
        }}
      >
        Пройшов
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={() => handleStatus(LESSON_STATUSES.MISSED)}
        disabled={isLoading}
        startIcon={<EventBusyIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          fontSize: '0.72rem',
          py: 0.5,
          px: 1,
          minWidth: 0,
          borderColor: alpha('#fbbf24', 0.3),
          color: '#fbbf24',
          '&:hover': {
            borderColor: '#fbbf24',
            backgroundColor: alpha('#fbbf24', 0.08),
          },
        }}
      >
        Пропуск
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={() => handleStatus(LESSON_STATUSES.CANCELLED)}
        disabled={isLoading}
        startIcon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          fontSize: '0.72rem',
          py: 0.5,
          px: 1,
          minWidth: 0,
          borderColor: alpha('#f87171', 0.3),
          color: '#f87171',
          '&:hover': {
            borderColor: '#f87171',
            backgroundColor: alpha('#f87171', 0.08),
          },
        }}
      >
        Скасовано
      </Button>
    </Stack>
  );
}
