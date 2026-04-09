"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { DatesSetArg } from "@fullcalendar/core";
import {
  Box,
  Paper,
  Popover,
  Typography,
  Stack,
  Chip,
  IconButton,
  Button,
  Divider,
  alpha,
  Fade,
  Skeleton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import EditIcon from "@mui/icons-material/Edit";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import RepeatIcon from "@mui/icons-material/Repeat";
import {
  useGetLessonsQuery,
  useDeleteLessonMutation,
  useDeleteFutureLessonsMutation,
  useUpdateLessonMutation,
} from "@/entities/lesson/api/lessonApi";
import { useDeferredDelete } from "@/features/deferredDelete";
import type { Lesson } from "@/entities/lesson/model/types";
import { CreateLessonDialog } from "@/features/createLesson/ui/createLessonDialog";
import { EditLessonDialog } from "@/features/editLesson/ui/editLessonDialog";
import { LessonStatusButtons } from "@/features/lessonStatus/ui/lessonStatusButtons";
import {
  LESSON_TYPE_LABELS,
  LESSON_SUBJECT_LABELS,
  LESSON_STATUSES,
} from "@/shared/config/constants";
import { useAppDispatch, useAppSelector } from "@/shared/lib/reduxHooks";
import { setVisibleDate } from "@/shared/model/calendarNavigationSlice";

const statusColorMap: Record<string, string> = {
  PLANNED: "#6366f1",
  COMPLETED: "#34d399",
  MISSED: "#fbbf24",
  CANCELLED: "#f87171",
};

const HALF_HOUR_MS = 30 * 60 * 1000;

function roundToHalfHour(d: Date): Date {
  return new Date(Math.round(d.getTime() / HALF_HOUR_MS) * HALF_HOUR_MS);
}

function mergeCalendarDateWithTime(calendarDate: Date, timeSource: Date): Date {
  const out = new Date(calendarDate);
  out.setHours(
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    timeSource.getMilliseconds(),
  );
  return roundToHalfHour(out);
}

function CalendarSkeleton() {
  return (
    <Paper sx={{ p: 2.5, border: `1px solid ${alpha("#fff", 0.06)}` }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1}>
          <Skeleton
            variant="rounded"
            width={36}
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            width={36}
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            width={80}
            height={36}
            sx={{ borderRadius: 2 }}
          />
        </Stack>
        <Skeleton
          variant="rounded"
          width={180}
          height={28}
          sx={{ borderRadius: 1 }}
        />
        <Stack direction="row" spacing={1}>
          <Skeleton
            variant="rounded"
            width={72}
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            width={72}
            height={36}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton
            variant="rounded"
            width={56}
            height={36}
            sx={{ borderRadius: 2 }}
          />
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
  const [deleteFutureLessons] = useDeleteFutureLessonsMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const { scheduleDelete } = useDeferredDelete();
  const dispatch = useAppDispatch();
  const navigateRequest = useAppSelector((s) => s.calendarNavigation.navigateRequest);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    if (!navigateRequest) return;
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.gotoDate(new Date(navigateRequest.dateIso));
  }, [navigateRequest?.id, navigateRequest?.dateIso]);

  const handleDatesSet = useCallback(
    (_info: DatesSetArg) => {
      const api = calendarRef.current?.getApi();
      const d = api?.getDate();
      if (!d) return;
      dispatch(setVisibleDate(d.toISOString()));
    },
    [dispatch],
  );

  const selectedLesson = selectedLessonId
    ? (lessons.find((l) => l.id === selectedLessonId) ?? null)
    : null;

  const events: EventInput[] = useMemo(
    () =>
      lessons.map((lesson) => {
        const studentNames = lesson.students
          .map((s) => s.student.name)
          .join(", ");
        const isPast = new Date(lesson.endTime) < new Date();
        const needsAction = isPast && lesson.status === LESSON_STATUSES.PLANNED;

        return {
          id: String(lesson.id),
          title: `${LESSON_SUBJECT_LABELS[lesson.subject]} — ${studentNames}`,
          start: lesson.startTime,
          end: lesson.endTime,
          startEditable: lesson.status === LESSON_STATUSES.PLANNED,
          durationEditable: false,
          backgroundColor: needsAction
            ? "transparent"
            : statusColorMap[lesson.status],
          borderColor: needsAction ? "#818cf8" : "transparent",
          classNames: needsAction ? ["fc-event-needs-action"] : [],
          extendedProps: { lesson },
        };
      }),
    [lessons],
  );

  const handleSelect = useCallback((info: DateSelectArg) => {
    setSelectInfo({ start: info.start, end: info.end });
    setDialogOpen(true);
  }, []);

  const handleDateClick = useCallback((info: DateClickArg) => {
    if (!info.view.type.startsWith("timeGrid")) return;
    const start = info.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setSelectInfo({ start, end });
    setDialogOpen(true);
    calendarRef.current?.getApi().unselect();
  }, []);

  const handleEventClick = useCallback((info: EventClickArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson;
    setSelectedLessonId(lesson.id);
    setPopoverAnchor(info.el);
  }, []);

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const lesson = info.event.extendedProps.lesson as Lesson;
      const oldStart = new Date(lesson.startTime);
      const oldEnd = new Date(lesson.endTime);
      const durationMs = oldEnd.getTime() - oldStart.getTime();
      const rawStart = info.event.start;
      if (!rawStart) {
        info.revert();
        return;
      }
      let newStart: Date;
      if (info.view.type === "dayGridMonth") {
        newStart = mergeCalendarDateWithTime(rawStart, oldStart);
      } else {
        newStart = roundToHalfHour(new Date(rawStart.getTime()));
      }
      const newEnd = new Date(newStart.getTime() + durationMs);
      try {
        await updateLesson({
          id: lesson.id,
          data: {
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
          },
        }).unwrap();
      } catch {
        info.revert();
      }
    },
    [updateLesson],
  );

  const handleDelete = () => {
    if (!selectedLesson) return;
    const id = selectedLesson.id;
    setPopoverAnchor(null);
    setSelectedLessonId(null);
    scheduleDelete({
      message: "Урок буде видалено…",
      execute: () => {
        void deleteLesson(id);
      },
    });
  };

  const handleDeleteFuture = () => {
    if (!selectedLesson) return;
    const id = selectedLesson.id;
    setPopoverAnchor(null);
    setSelectedLessonId(null);
    scheduleDelete({
      message: "Уроки серії від цього моменту буде видалено…",
      execute: () => {
        void deleteFutureLessons(id);
      },
    });
  };

  const handleEdit = () => {
    if (selectedLesson) {
      setEditingLesson(selectedLesson);
      setPopoverAnchor(null);
      setSelectedLessonId(null);
      setEditDialogOpen(true);
    }
  };

  const isPast = selectedLesson
    ? new Date(selectedLesson.endTime) < new Date()
    : false;

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <Box sx={{ height: "100%" }}>
      <Paper
        sx={{
          p: 2.5,
          height: "100%",
          border: `1px solid ${alpha("#fff", 0.06)}`,
          "& .fc": {
            height: "100%",
            "--fc-border-color": alpha("#fff", 0.06),
            "--fc-neutral-bg-color": alpha("#fff", 0.02),
            "--fc-page-bg-color": "transparent",
            "--fc-today-bg-color": alpha("#6366f1", 0.06),
          },
          "& .fc-theme-standard td, & .fc-theme-standard th": {
            borderColor: alpha("#fff", 0.06),
          },
          "& .fc-theme-standard .fc-scrollgrid": {
            borderColor: alpha("#fff", 0.06),
          },
          "& .fc-col-header-cell": {
            backgroundColor: alpha("#fff", 0.02),
            "& .fc-col-header-cell-cushion": {
              padding: "10px 4px",
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            },
          },
          "& .fc-daygrid-day-number, & .fc-col-header-cell-cushion": {
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
          },
          "& .fc-button": {
            backgroundColor: alpha("#fff", 0.06),
            borderColor: alpha("#fff", 0.08),
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
            fontSize: "0.8rem",
            padding: "6px 14px",
            borderRadius: "8px !important",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: alpha("#fff", 0.1),
              color: "#fff",
            },
            "&:focus": {
              boxShadow: `0 0 0 2px ${alpha("#6366f1", 0.3)}`,
            },
          },
          "& .fc-button-active, & .fc-button-active:hover": {
            backgroundColor: `${alpha("#6366f1", 0.2)} !important`,
            borderColor: `${alpha("#6366f1", 0.3)} !important`,
            color: "#818cf8 !important",
          },
          "& .fc-today-button": {
            backgroundColor: `${alpha("#6366f1", 0.12)} !important`,
            borderColor: `${alpha("#6366f1", 0.2)} !important`,
            color: "#818cf8 !important",
            "&:disabled": {
              opacity: 0.3,
            },
          },
          "& .fc-toolbar-title": {
            fontWeight: 700,
            fontSize: "1.2rem !important",
            letterSpacing: "-0.02em",
          },
          "& .fc-timegrid-slot": {
            height: "3em",
          },
          "& .fc-event": {
            cursor: "pointer",
            borderRadius: "8px !important",
            fontSize: "0.78rem",
            fontWeight: 500,
            padding: "2px 6px",
            border: "none !important",
            boxShadow: `0 2px 8px ${alpha("#000", 0.2)}`,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: `0 4px 16px ${alpha("#000", 0.3)}`,
            },
          },
          "& .fc-event.fc-event-draggable": {
            cursor: "grab",
            "&:active": {
              cursor: "grabbing",
            },
          },
          "& .fc-event.fc-event-dragging": {
            cursor: "grabbing",
            boxShadow: `0 8px 24px ${alpha("#000", 0.45)}`,
          },
          "& .fc-event-needs-action": {
            border: "2px solid #818cf8 !important",
            backgroundColor: `${alpha("#6366f1", 0.06)} !important`,
            animation: "pulseNeedsAction 2s ease-in-out infinite",
            "&:hover": {
              backgroundColor: `${alpha("#6366f1", 0.12)} !important`,
            },
          },
          "& .fc-timegrid-slot-label-cushion, & .fc-timegrid-axis-cushion": {
            color: "rgba(255,255,255,0.3)",
            fontSize: "0.75rem",
          },
          "& .fc-timegrid-now-indicator-line": {
            borderColor: "#f87171",
            borderWidth: 2,
          },
          "& .fc-timegrid-now-indicator-arrow": {
            borderColor: "#f87171",
          },
          "& .fc-highlight": {
            backgroundColor: `${alpha("#6366f1", 0.12)} !important`,
          },
          "& .fc-daygrid-day-top": {
            padding: "4px",
          },
          "& .fc-button-group": {
            gap: "4px",
            "& .fc-button": {
              borderRadius: "8px !important",
            },
          },
          "& .fc-toolbar": {
            marginBottom: "20px !important",
            gap: "12px",
          },
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="uk"
          firstDay={1}
          selectable
          selectMirror
          editable
          eventDurationEditable={false}
          events={events}
          select={handleSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          datesSet={handleDatesSet}
          allDaySlot={false}
          slotDuration="01:00:00"
          snapDuration="00:30:00"
          slotLabelInterval="01:00:00"
          slotMinTime="07:00:00"
          slotMaxTime="23:00:00"
          height="auto"
          expandRows
          nowIndicator
          buttonText={{
            today: "Сьогодні",
            month: "Місяць",
            week: "Тиждень",
            day: "День",
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
          setSelectedLessonId(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        {selectedLesson && (
          <Box sx={{ p: 2.5, minWidth: 300 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box>
                <Typography variant="h6" fontSize="1rem" fontWeight={700}>
                  {LESSON_SUBJECT_LABELS[selectedLesson.subject]}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                  <Chip
                    label={LESSON_TYPE_LABELS[selectedLesson.type]}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: alpha("#fff", 0.1), fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={`${selectedLesson.students.reduce((sum, s) => sum + (s.price || selectedLesson.pricePerStudent), 0)} грн`}
                    size="small"
                    sx={{
                      background: alpha("#6366f1", 0.15),
                      color: "#818cf8",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  />
                  {selectedLesson.recurringLessonId && (
                    <Chip
                      icon={<RepeatIcon sx={{ fontSize: "12px !important" }} />}
                      label="Регулярний"
                      size="small"
                      sx={{
                        backgroundColor: alpha("#6366f1", 0.08),
                        color: "#818cf8",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        border: "none",
                      }}
                    />
                  )}
                </Stack>
              </Box>
              <Stack direction="row" spacing={0.25}>
                <IconButton
                  size="small"
                  onClick={handleEdit}
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      color: "#818cf8",
                      backgroundColor: alpha("#6366f1", 0.1),
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  sx={{
                    color: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      color: "#f87171",
                      backgroundColor: alpha("#f87171", 0.1),
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Stack spacing={0.75} sx={{ mt: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AccessTimeIcon
                  sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}
                />
                <Typography variant="body2" fontSize="0.8rem">
                  {new Date(selectedLesson.startTime).toLocaleString("uk-UA")} —{" "}
                  {new Date(selectedLesson.endTime).toLocaleTimeString(
                    "uk-UA",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PeopleIcon
                  sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}
                />
                <Typography variant="body2" fontSize="0.8rem">
                  {selectedLesson.students
                    .map((s) => s.student.name)
                    .join(", ")}
                </Typography>
              </Stack>
            </Stack>

            {isPast && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <LessonStatusButtons lesson={selectedLesson} />
              </>
            )}

            {!isPast && (
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon sx={{ fontSize: "16px !important" }} />}
                  onClick={handleEdit}
                  sx={{
                    borderColor: alpha("#fff", 0.1),
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.8rem",
                    "&:hover": {
                      borderColor: alpha("#6366f1", 0.3),
                      backgroundColor: alpha("#6366f1", 0.06),
                      color: "#818cf8",
                    },
                  }}
                >
                  Редагувати
                </Button>
                {selectedLesson.recurringLessonId && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={
                      <DeleteSweepIcon sx={{ fontSize: "16px !important" }} />
                    }
                    onClick={handleDeleteFuture}
                    sx={{
                      borderColor: alpha("#f87171", 0.15),
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "0.78rem",
                      "&:hover": {
                        borderColor: alpha("#f87171", 0.4),
                        backgroundColor: alpha("#f87171", 0.06),
                        color: "#f87171",
                      },
                    }}
                  >
                    Видалити від цього і далі
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Popover>

      <EditLessonDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingLesson(null);
        }}
        lesson={editingLesson}
      />
    </Box>
  );
}
