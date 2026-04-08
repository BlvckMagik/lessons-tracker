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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
  PLANNED: '#1976d2',
  COMPLETED: '#2e7d32',
  MISSED: '#ed6c02',
  CANCELLED: '#d32f2f',
};

export function LessonCalendar() {
  const { data: lessons = [] } = useGetLessonsQuery();
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
          backgroundColor: needsAction ? '#f57c00' : statusColorMap[lesson.status],
          borderColor: needsAction ? '#e65100' : statusColorMap[lesson.status],
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

  return (
    <Box sx={{ height: '100%' }}>
      <Paper
        sx={{
          p: 2,
          height: '100%',
          '& .fc': {
            height: '100%',
          },
          '& .fc-theme-standard td, & .fc-theme-standard th': {
            borderColor: 'rgba(255,255,255,0.12)',
          },
          '& .fc-theme-standard .fc-scrollgrid': {
            borderColor: 'rgba(255,255,255,0.12)',
          },
          '& .fc-col-header-cell': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          },
          '& .fc-daygrid-day-number, & .fc-col-header-cell-cushion': {
            color: 'rgba(255,255,255,0.87)',
            textDecoration: 'none',
          },
          '& .fc-button': {
            backgroundColor: '#1976d2',
            borderColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
          },
          '& .fc-button-active': {
            backgroundColor: '#0d47a1 !important',
            borderColor: '#0d47a1 !important',
          },
          '& .fc-today-button:disabled': {
            opacity: 0.5,
          },
          '& .fc-day-today': {
            backgroundColor: 'rgba(25, 118, 210, 0.08) !important',
          },
          '& .fc-timegrid-slot': {
            height: '3em',
          },
          '& .fc-event': {
            cursor: 'pointer',
            borderRadius: '4px',
            fontSize: '0.8rem',
          },
          '& .fc-timegrid-slot-label-cushion, & .fc-timegrid-axis-cushion': {
            color: 'rgba(255,255,255,0.6)',
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
      >
        {selectedLesson && (
          <Box sx={{ p: 2, minWidth: 280 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                {LESSON_SUBJECT_LABELS[selectedLesson.subject]}
              </Typography>
              <IconButton size="small" color="error" onClick={handleDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                label={LESSON_TYPE_LABELS[selectedLesson.type]}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${selectedLesson.pricePerStudent} грн`}
                size="small"
                color="primary"
              />
            </Stack>

            <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
              {new Date(selectedLesson.startTime).toLocaleString('uk-UA')} —{' '}
              {new Date(selectedLesson.endTime).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Учні: {selectedLesson.students.map((s) => s.student.name).join(', ')}
            </Typography>

            {isPast && (
              <>
                <Divider sx={{ my: 1 }} />
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
