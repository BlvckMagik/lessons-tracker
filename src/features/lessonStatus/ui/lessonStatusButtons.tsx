'use client';

import { Stack, Button, Chip } from '@mui/material';
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

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  PLANNED: 'default',
  COMPLETED: 'success',
  MISSED: 'warning',
  CANCELLED: 'error',
};

export function LessonStatusButtons({ lessonId, currentStatus }: Props) {
  const [updateStatus, { isLoading }] = useUpdateLessonStatusMutation();

  if (currentStatus !== LESSON_STATUSES.PLANNED) {
    return (
      <Chip
        label={LESSON_STATUS_LABELS[currentStatus]}
        color={statusColors[currentStatus]}
        size="small"
      />
    );
  }

  const handleStatus = (status: LessonStatus) => {
    updateStatus({ id: lessonId, status });
  };

  return (
    <Stack direction="row" spacing={0.5}>
      <Button
        size="small"
        color="success"
        variant="outlined"
        onClick={() => handleStatus(LESSON_STATUSES.COMPLETED)}
        disabled={isLoading}
        startIcon={<CheckCircleIcon />}
        sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75, minWidth: 0 }}
      >
        Пройшов
      </Button>
      <Button
        size="small"
        color="warning"
        variant="outlined"
        onClick={() => handleStatus(LESSON_STATUSES.MISSED)}
        disabled={isLoading}
        startIcon={<EventBusyIcon />}
        sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75, minWidth: 0 }}
      >
        Пропуск
      </Button>
      <Button
        size="small"
        color="error"
        variant="outlined"
        onClick={() => handleStatus(LESSON_STATUSES.CANCELLED)}
        disabled={isLoading}
        startIcon={<CancelIcon />}
        sx={{ fontSize: '0.7rem', py: 0.25, px: 0.75, minWidth: 0 }}
      >
        Скасовано
      </Button>
    </Stack>
  );
}
