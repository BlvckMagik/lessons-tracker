'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import {
  Box,
  Paper,
  Popover,
  Typography,
  Stack,
  Chip,
  IconButton,
  Divider,
  alpha,
  Fade,
  Skeleton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import { useGetLessonsQuery, useDeleteLessonMutation } from '@/entities/lesson/api/lessonApi';
import type { Lesson } from '@/entities/lesson/model/types';
import { CreateLessonDialog } from '@/features/createLesson/ui/createLessonDialog';
import { LessonStatusButtons } from '@/features/lessonStatus/ui/lessonStatusButtons';
import {
  LESSON_TYPE_LABELS,
  LESSON_SUBJECT_LABELS,
  LESSON_STATUSES,
} from '@/shared/config/constants';

const statusColorMap: Record<string, string> = {
  PLANNED: '#6366f1',
  COMPLETED: '#34d399',
  MISSED: '#fbbf24',
  CANCELLED: '#f87171',
};

function CalendarSkeleton() {
  return (
    <Paper sx={{ p: 2.5, border: `1px solid ${alpha('#fff', 0.06)}` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={80} height={36} sx={{ borderRadius: 2 }} />
        </Stack>
        <Skeleton variant="rounded" width={180} height={28} sx={{ borderRadius: 1 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={72} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={72} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" width={56} height={36} sx={{ borderRadius: 2 }} />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={0}>
        {Array.from({ length: 7 }).map((_, dayIdx) => (
          <Box key={dayIdx} sx={{ flex: 1, px: 0.5 }}>
            <Skeleton
              variant="rounded"
              height={28}
              sx={{ mb: 1.5, borderRadius: 1 }}
            />
            {Array.from({ length: 6 }).map((_, slotIdx) => (
              <Skeleton
                key={slotIdx}
                variant="rectangular"
                height={48}
                sx={{
                  mb: 0.25,
                  borderRadius: 0,
                  opacity: 0.3 + (slotIdx % 2) * 0.15,
                }}
              />
            ))}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function LessonCalendar() {
  const { data: lessons = [], isLoading } = useGetLessonsQuery();
  const [deleteLesson] = useDeleteLessonMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<{ start: Date; end: Date } | null>(null);

  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  const events: EventInput[] = useMemo(
    () =>
      lessons.map((lesson) => {
        const studentNames = lesson.students.map((s) => s.student.name).join(', ');
        const isPast = new Date(lesson.endTime) < new Date();
        const needsAction = isPast && lesson.status === LESSON_STATUSES.PLANNED;

        return {
          id: String(lesson.id),
          title: `${LESSON_SUBJECT_LABELS[lesson.subject]} — ${studentNames}`,
          start: lesson.startTime,
          end: lesson.endTime,
          backgroundColor: needsAction ? '#f59e0b' : statusColorMap[lesson.status],
          borderColor: 'transparent',
          extendedProps: { lesson },
        };
      }),
    [lessons]
  );

  const handleSelect = useCallback((info: DateSelectArg) => {
    setSelectInfo({ start: info.start, end: info.end });
    setDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((info: EventClickArg) => {
    setSelectedLesson(info.event.extendedProps.lesson as Lesson);
    setPopoverAnchor(info.el);
  }, []);

  const handleDelete = async () => {
    if (selectedLesson) {
      await deleteLesson(selectedLesson.id);
      setPopoverAnchor(null);
      setSelectedLesson(null);
    }
  };

  const isPast = selectedLesson ? new Date(selectedLesson.endTime) < new Date() : false;

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <Box sx={{ height: '100%' }}>
      <Paper
        sx={{
          p: 2.5,
          height: '100%',
          border: `1px solid ${alpha('#fff', 0.06)}`,
          '& .fc': {
            height: '100%',
            '--fc-border-color': alpha('#fff', 0.06),
            '--fc-neutral-bg-color': alpha('#fff', 0.02),
            '--fc-page-bg-color': 'transparent',
            '--fc-today-bg-color': alpha('#6366f1', 0.06),
          },
          '& .fc-theme-standard td, & .fc-theme-standard th': {
            borderColor: alpha('#fff', 0.06),
          },
          '& .fc-theme-standard .fc-scrollgrid': {
            borderColor: alpha('#fff', 0.06),
          },
          '& .fc-col-header-cell': {
            backgroundColor: alpha('#fff', 0.02),
            '& .fc-col-header-cell-cushion': {
              padding: '10px 4px',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            },
          },
          '& .fc-daygrid-day-number, & .fc-col-header-cell-cushion': {
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          },
          '& .fc-button': {
            backgroundColor: alpha('#fff', 0.06),
            borderColor: alpha('#fff', 0.08),
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            fontSize: '0.8rem',
            padding: '6px 14px',
            borderRadius: '8px !important',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha('#fff', 0.1),
              color: '#fff',
            },
            '&:focus': {
              boxShadow: `0 0 0 2px ${alpha('#6366f1', 0.3)}`,
            },
          },
          '& .fc-button-active, & .fc-button-active:hover': {
            backgroundColor: `${alpha('#6366f1', 0.2)} !important`,
            borderColor: `${alpha('#6366f1', 0.3)} !important`,
            color: '#818cf8 !important',
          },
          '& .fc-today-button': {
            backgroundColor: `${alpha('#6366f1', 0.12)} !important`,
            borderColor: `${alpha('#6366f1', 0.2)} !important`,
            color: '#818cf8 !important',
            '&:disabled': {
              opacity: 0.3,
            },
          },
          '& .fc-toolbar-title': {
            fontWeight: 700,
            fontSize: '1.2rem !important',
            letterSpacing: '-0.02em',
          },
          '& .fc-timegrid-slot': {
            height: '3em',
          },
          '& .fc-event': {
            cursor: 'pointer',
            borderRadius: '8px !important',
            fontSize: '0.78rem',
            fontWeight: 500,
            padding: '2px 6px',
            border: 'none !important',
            boxShadow: `0 2px 8px ${alpha('#000', 0.2)}`,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: `0 4px 16px ${alpha('#000', 0.3)}`,
            },
          },
          '& .fc-timegrid-slot-label-cushion, & .fc-timegrid-axis-cushion': {
            color: 'rgba(255,255,255,0.3)',
            fontSize: '0.75rem',
          },
          '& .fc-timegrid-now-indicator-line': {
            borderColor: '#f87171',
            borderWidth: 2,
          },
          '& .fc-timegrid-now-indicator-arrow': {
            borderColor: '#f87171',
          },
          '& .fc-highlight': {
            backgroundColor: `${alpha('#6366f1', 0.12)} !important`,
          },
          '& .fc-daygrid-day-top': {
            padding: '4px',
          },
          '& .fc-button-group': {
            gap: '4px',
            '& .fc-button': {
              borderRadius: '8px !important',
            },
          },
          '& .fc-toolbar': {
            marginBottom: '20px !important',
            gap: '12px',
          },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale="uk"
          firstDay={1}
          selectable
          selectMirror
          editable={false}
          events={events}
          select={handleSelect}
          eventClick={handleEventClick}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          height="auto"
          expandRows
          nowIndicator
          buttonText={{
            today: 'Сьогодні',
            month: 'Місяць',
            week: 'Тиждень',
            day: 'День',
          }}
        />
      </Paper>

      <CreateLessonDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectInfo(null);
        }}
        defaultStart={selectInfo?.start}
        defaultEnd={selectInfo?.end}
      />

      <Popover
        open={Boolean(popoverAnchor) && Boolean(selectedLesson)}
        anchorEl={popoverAnchor}
        onClose={() => {
          setPopoverAnchor(null);
          setSelectedLesson(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        {selectedLesson && (
          <Box sx={{ p: 2.5, minWidth: 300 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" fontSize="1rem" fontWeight={700}>
                  {LESSON_SUBJECT_LABELS[selectedLesson.subject]}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                  <Chip
                    label={LESSON_TYPE_LABELS[selectedLesson.type]}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: alpha('#fff', 0.1), fontSize: '0.7rem' }}
                  />
                  <Chip
                    label={`${selectedLesson.pricePerStudent} грн`}
                    size="small"
                    sx={{
                      background: alpha('#6366f1', 0.15),
                      color: '#818cf8',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </Box>
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{
                  color: 'rgba(255,255,255,0.3)',
                  '&:hover': { color: '#f87171', backgroundColor: alpha('#f87171', 0.1) },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Stack spacing={0.75} sx={{ mt: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTimeIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="body2" fontSize="0.8rem">
                  {new Date(selectedLesson.startTime).toLocaleString('uk-UA')} —{' '}
                  {new Date(selectedLesson.endTime).toLocaleTimeString('uk-UA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PeopleIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="body2" fontSize="0.8rem">
                  {selectedLesson.students.map((s) => s.student.name).join(', ')}
                </Typography>
              </Stack>
            </Stack>

            {isPast && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <LessonStatusButtons
                  lessonId={selectedLesson.id}
                  currentStatus={selectedLesson.status}
                />
              </>
            )}
          </Box>
        )}
      </Popover>
    </Box>
  );
}
