'use client';

import { useState } from 'react';
import { Stack, Button, Chip, alpha, Fade, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { LessonNotesStep } from '@/features/lessonNotes/ui/lessonNotesStep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useUpdateLessonStatusMutation, useUpdateStudentStatusMutation } from '@/entities/lesson/api/lessonApi';
import type { Lesson, LessonStatus, LessonStudent } from '@/entities/lesson/model/types';
import { LESSON_STATUSES, LESSON_STATUS_LABELS, LESSON_TYPES } from '@/shared/config/constants';

interface Props {
  lesson: Lesson;
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399' },
  MISSED: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' },
  CANCELLED: { bg: 'rgba(248, 113, 113, 0.12)', color: '#f87171' },
  PLANNED: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' },
};

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircleIcon sx={{ fontSize: 14 }} />,
  MISSED: <EventBusyIcon sx={{ fontSize: 14 }} />,
  CANCELLED: <CancelIcon sx={{ fontSize: 14 }} />,
};

function StatusButtons({ onSelect, isLoading, size = 'normal' }: {
  onSelect: (status: LessonStatus) => void;
  isLoading: boolean;
  size?: 'normal' | 'compact';
}) {
  const py = size === 'compact' ? 0.25 : 0.5;
  const fontSize = size === 'compact' ? '0.68rem' : '0.72rem';

  return (
    <Stack direction="row" spacing={0.5}>
      <Button
        size="small"
        variant="outlined"
        onClick={() => onSelect(LESSON_STATUSES.COMPLETED)}
        disabled={isLoading}
        startIcon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          fontSize, py, px: 1, minWidth: 0,
          borderColor: alpha('#34d399', 0.3), color: '#34d399',
          '&:hover': { borderColor: '#34d399', backgroundColor: alpha('#34d399', 0.08) },
        }}
      >
        Пройшов
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={() => onSelect(LESSON_STATUSES.MISSED)}
        disabled={isLoading}
        startIcon={<EventBusyIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          fontSize, py, px: 1, minWidth: 0,
          borderColor: alpha('#fbbf24', 0.3), color: '#fbbf24',
          '&:hover': { borderColor: '#fbbf24', backgroundColor: alpha('#fbbf24', 0.08) },
        }}
      >
        Пропуск
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={() => onSelect(LESSON_STATUSES.CANCELLED)}
        disabled={isLoading}
        startIcon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
        sx={{
          fontSize, py, px: 1, minWidth: 0,
          borderColor: alpha('#f87171', 0.3), color: '#f87171',
          '&:hover': { borderColor: '#f87171', backgroundColor: alpha('#f87171', 0.08) },
        }}
      >
        Скасовано
      </Button>
    </Stack>
  );
}

function StudentStatusRow({ ls, lessonId }: { ls: LessonStudent; lessonId: number }) {
  const [updateStudentStatus, { isLoading }] = useUpdateStudentStatusMutation();
  const effectiveStatus = ls.status && ls.status !== 'PLANNED' ? ls.status : null;
  const style = effectiveStatus ? statusStyles[effectiveStatus] : null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        py: 0.75,
        px: 1,
        borderRadius: 1.5,
        backgroundColor: alpha('#fff', 0.02),
      }}
    >
      <Typography fontSize="0.78rem" fontWeight={500} sx={{ minWidth: 70 }}>
        {ls.student.name}
      </Typography>
      {effectiveStatus ? (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip
            label={LESSON_STATUS_LABELS[effectiveStatus]}
            size="small"
            sx={{
              backgroundColor: style!.bg,
              color: style!.color,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 22,
              border: 'none',
            }}
          />
          <Tooltip title="Змінити" arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => updateStudentStatus({ lessonId, studentId: ls.studentId, status: LESSON_STATUSES.PLANNED })}
                disabled={isLoading}
                sx={{ p: 0.25, color: 'rgba(255,255,255,0.2)', '&:hover': { color: 'rgba(255,255,255,0.5)' } }}
              >
                <CancelIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ) : (
        <Stack direction="row" spacing={0.25}>
          {(['COMPLETED', 'MISSED', 'CANCELLED'] as LessonStatus[]).map((s) => {
            const st = statusStyles[s];
            return (
              <Tooltip key={s} title={LESSON_STATUS_LABELS[s]} arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => updateStudentStatus({ lessonId, studentId: ls.studentId, status: s })}
                    disabled={isLoading}
                    sx={{
                      p: 0.5,
                      color: alpha(st.color, 0.5),
                      '&:hover': { color: st.color, backgroundColor: st.bg },
                    }}
                  >
                    {statusIcons[s]}
                  </IconButton>
                </span>
              </Tooltip>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

export function LessonStatusButtons({ lesson }: Props) {
  const [updateStatus, { isLoading }] = useUpdateLessonStatusMutation();
  const [showNotes, setShowNotes] = useState(false);
  const isGroup = lesson.type === LESSON_TYPES.GROUP;

  if (isGroup) {
    const allHaveStatus = lesson.students.every((s) => s.status !== null && s.status !== 'PLANNED');
    const someHaveStatus = lesson.students.some((s) => s.status !== null && s.status !== 'PLANNED');

    return (
      <Stack spacing={1}>
        {!allHaveStatus && (
          <Box>
            <StatusButtons
              onSelect={(status) => updateStatus({ id: lesson.id, status })}
              isLoading={isLoading}
              size={someHaveStatus ? 'compact' : 'normal'}
            />
            {!someHaveStatus && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', mt: 0.5, display: 'block' }}>
                або відмітьте кожного учня окремо:
              </Typography>
            )}
          </Box>
        )}
        {allHaveStatus && (
          <Fade in timeout={300}>
            <Chip
              label="Статуси встановлені"
              size="small"
              sx={{ backgroundColor: alpha('#34d399', 0.1), color: '#34d399', fontWeight: 600, border: 'none', alignSelf: 'flex-start' }}
            />
          </Fade>
        )}
        <Stack spacing={0.5}>
          {lesson.students.map((ls) => (
            <StudentStatusRow key={ls.id} ls={ls} lessonId={lesson.id} />
          ))}
        </Stack>
      </Stack>
    );
  }

  if (lesson.status !== LESSON_STATUSES.PLANNED) {
    const style = statusStyles[lesson.status];
    return (
      <Fade in timeout={300}>
        <Chip
          label={LESSON_STATUS_LABELS[lesson.status]}
          size="small"
          sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 600, border: 'none' }}
        />
      </Fade>
    );
  }

  return (
    <Stack spacing={1}>
      <StatusButtons
        onSelect={async (status) => {
          await updateStatus({ id: lesson.id, status });
          if (status === LESSON_STATUSES.COMPLETED) {
            setShowNotes(true);
          }
        }}
        isLoading={isLoading}
      />
      {showNotes && (
        <LessonNotesStep lessonId={lesson.id} onDone={() => setShowNotes(false)} />
      )}
    </Stack>
  );
}
