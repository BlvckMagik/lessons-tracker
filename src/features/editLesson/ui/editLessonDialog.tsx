'use client';

import { useState, useEffect, forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Chip,
  Typography,
  Box,
  Slide,
  alpha,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import type { TransitionProps } from '@mui/material/transitions';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import RepeatIcon from '@mui/icons-material/Repeat';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useGetStudentsQuery } from '@/entities/student/api/studentApi';
import {
  useUpdateLessonMutation,
  useUpdateLessonStatusMutation,
  useUpdateFutureLessonsMutation,
} from '@/entities/lesson/api/lessonApi';
import { useGetSettingsQuery } from '@/entities/settings/api/settingsApi';
import type { Lesson, LessonType, LessonSubject, LessonStatus } from '@/entities/lesson/model/types';
import type { Student } from '@/entities/student/model/types';
import {
  LESSON_TYPES,
  LESSON_SUBJECTS,
  LESSON_TYPE_LABELS,
  LESSON_SUBJECT_LABELS,
  LESSON_STATUS_LABELS,
} from '@/shared/config/constants';

const SlideTransition = forwardRef(function SlideTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const STATUS_OPTIONS: { value: LessonStatus; color: string }[] = [
  { value: 'PLANNED', color: 'rgba(255,255,255,0.5)' },
  { value: 'COMPLETED', color: '#34d399' },
  { value: 'MISSED', color: '#fbbf24' },
  { value: 'CANCELLED', color: '#f87171' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
}

export function EditLessonDialog({ open, onClose, lesson }: Props) {
  const [type, setType] = useState<LessonType>('INDIVIDUAL');
  const [subject, setSubject] = useState<LessonSubject>('ENGLISH');
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<LessonStatus>('PLANNED');
  const [label, setLabel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [homework, setHomework] = useState<string>('');
  const [homeworkStatus, setHomeworkStatus] = useState<string | null>(null);
  const [homeworkRating, setHomeworkRating] = useState<number | null>(null);
  const [hoverHomeworkRating, setHoverHomeworkRating] = useState<number | null>(null);

  const { data: allStudents = [] } = useGetStudentsQuery();
  const { data: settings } = useGetSettingsQuery();
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();
  const [updateFutureLessons, { isLoading: isUpdatingFuture }] = useUpdateFutureLessonsMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateLessonStatusMutation();
  const isLoading = isUpdating || isUpdatingFuture || isUpdatingStatus;

  const defaultIndividual = settings?.defaultIndividualPrice ?? 200;
  const defaultGroup = settings?.defaultGroupPrice ?? 50;

  useEffect(() => {
    if (open && lesson) {
      setType(lesson.type);
      setSubject(lesson.subject);
      setStartTime(dayjs(lesson.startTime));
      setEndTime(dayjs(lesson.endTime));
      setStatus(lesson.status);
      setLabel(lesson.label ?? '');
      setNotes(lesson.notes ?? '');
      setRating(lesson.rating ?? null);
      setHomework(lesson.homework ?? '');
      setHomeworkStatus(lesson.homeworkStatus ?? null);
      setHomeworkRating(lesson.homeworkRating ?? null);

      const studentIds = lesson.students.map((s) => s.studentId);
      const matched = allStudents.filter((s) => studentIds.includes(s.id));
      setSelectedStudents(matched);
    } else if (!open) {
      setLabel('');
      setNotes('');
      setRating(null);
      setHoverRating(null);
      setHomework('');
      setHomeworkStatus(null);
      setHomeworkRating(null);
      setHoverHomeworkRating(null);
    }
  }, [open, lesson, allStudents]);

  const getStudentPrice = (student: Student) => {
    if (type === LESSON_TYPES.INDIVIDUAL) {
      return student.individualPrice ?? defaultIndividual;
    }
    return student.groupPrice ?? defaultGroup;
  };

  const totalPrice = selectedStudents.reduce((sum, s) => sum + getStudentPrice(s), 0);

  const buildLessonData = () => ({
    type,
    subject,
    startTime: startTime!.toISOString(),
    endTime: endTime!.toISOString(),
    studentIds: selectedStudents.map((s) => s.id),
    label: label.trim() || null,
    notes: notes.trim() || null,
    rating,
    homework: homework.trim() || null,
    homeworkStatus,
    homeworkRating,
  });

  const doSave = async (scope: 'single' | 'future') => {
    if (!lesson || !startTime || !endTime || selectedStudents.length === 0) return;

    if (status !== lesson.status) {
      await updateStatus({ id: lesson.id, status });
    }

    if (scope === 'future') {
      await updateFutureLessons({ id: lesson.id, data: { type, subject, studentIds: selectedStudents.map((s) => s.id), label: label.trim() || null } });
      // Also update per-lesson fields on just this lesson
      await updateLesson({ id: lesson.id, data: { startTime: startTime.toISOString(), endTime: endTime.toISOString(), notes: notes.trim() || null, rating, homework: homework.trim() || null, homeworkStatus, homeworkRating } });
    } else {
      await updateLesson({ id: lesson.id, data: buildLessonData() });
    }

    onClose();
  };

  const handleSubmit = (scope: 'single' | 'future') => {
    void doSave(scope);
  };

  if (!lesson) return null;

  const isRecurring = !!lesson.recurringLessonId;
  const canSave = !!startTime && !!endTime && selectedStudents.length > 0 && !isLoading;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={SlideTransition}
    >
      <DialogTitle component="div" sx={{ pb: 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontSize="1.1rem" fontWeight={700}>
            Редагувати урок
          </Typography>
          {lesson.recurringLessonId && (
            <Chip
              icon={<RepeatIcon sx={{ fontSize: '14px !important' }} />}
              label="Регулярний"
              size="small"
              sx={{
                backgroundColor: alpha('#6366f1', 0.12),
                color: '#818cf8',
                fontWeight: 600,
                fontSize: '0.7rem',
                border: 'none',
              }}
            />
          )}
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.25 }}>
          Змініть параметри уроку
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
              Статус уроку
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={status}
              onChange={(_e, val) => val && setStatus(val)}
              size="small"
              sx={{
                gap: 0.5,
                '& .MuiToggleButton-root': {
                  borderRadius: '8px !important',
                  border: `1px solid ${alpha('#fff', 0.1)} !important`,
                  px: 1.5,
                  py: 0.75,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'none',
                },
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <ToggleButton
                  key={opt.value}
                  value={opt.value}
                  sx={{
                    color: 'rgba(255,255,255,0.4)',
                    '&.Mui-selected': {
                      backgroundColor: alpha(opt.color, 0.15),
                      color: opt.color,
                      borderColor: `${alpha(opt.color, 0.3)} !important`,
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: alpha(opt.color, 0.2),
                    },
                  }}
                >
                  {LESSON_STATUS_LABELS[opt.value]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {status === 'COMPLETED' && (
            <>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <TextField
                label="Нотатки"
                multiline
                minRows={2}
                maxRows={5}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Що пройшли на уроці..."
                size="small"
              />
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.5 }}>
                  Оцінка уроку:
                </Typography>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Box
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star === rating ? null : star)}
                    sx={{
                      cursor: 'pointer',
                      color: star <= (hoverRating ?? rating ?? 0) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                      display: 'flex',
                    }}
                  >
                    {star <= (hoverRating ?? rating ?? 0) ? (
                      <StarIcon sx={{ fontSize: 22 }} />
                    ) : (
                      <StarBorderIcon sx={{ fontSize: 22 }} />
                    )}
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

              <TextField
                label="Задано"
                multiline
                minRows={2}
                maxRows={5}
                fullWidth
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                placeholder="Домашнє завдання..."
                size="small"
              />

              <Box>
                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
                  Виконання ДЗ:
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={homeworkStatus}
                  onChange={(_e, val) => setHomeworkStatus(val)}
                  size="small"
                  sx={{
                    gap: 0.5,
                    '& .MuiToggleButton-root': {
                      borderRadius: '8px !important',
                      border: `1px solid ${alpha('#fff', 0.1)} !important`,
                      px: 1.5,
                      py: 0.75,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      color: 'rgba(255,255,255,0.4)',
                    },
                  }}
                >
                  <ToggleButton
                    value="NOT_DONE"
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: alpha('#f87171', 0.15),
                        color: '#f87171',
                        borderColor: `${alpha('#f87171', 0.3)} !important`,
                      },
                    }}
                  >
                    Не виконано
                  </ToggleButton>
                  <ToggleButton
                    value="PARTIAL"
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: alpha('#fbbf24', 0.15),
                        color: '#fbbf24',
                        borderColor: `${alpha('#fbbf24', 0.3)} !important`,
                      },
                    }}
                  >
                    Виконано частково
                  </ToggleButton>
                  <ToggleButton
                    value="DONE"
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: alpha('#34d399', 0.15),
                        color: '#34d399',
                        borderColor: `${alpha('#34d399', 0.3)} !important`,
                      },
                    }}
                  >
                    Виконано
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.5 }}>
                  Оцінка ДЗ:
                </Typography>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Box
                    key={star}
                    onMouseEnter={() => setHoverHomeworkRating(star)}
                    onMouseLeave={() => setHoverHomeworkRating(null)}
                    onClick={() => setHomeworkRating(star === homeworkRating ? null : star)}
                    sx={{
                      cursor: 'pointer',
                      color: star <= (hoverHomeworkRating ?? homeworkRating ?? 0) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                      display: 'flex',
                    }}
                  >
                    {star <= (hoverHomeworkRating ?? homeworkRating ?? 0) ? (
                      <StarIcon sx={{ fontSize: 22 }} />
                    ) : (
                      <StarBorderIcon sx={{ fontSize: 22 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            </>
          )}

          <TextField
            label="Лейбл"
            fullWidth
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Напр. Іспит, Пробний урок..."
            size="small"
            slotProps={{ htmlInput: { maxLength: 30 } }}
          />

          <Divider />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Тип</InputLabel>
              <Select
                value={type}
                label="Тип"
                onChange={(e) => {
                  const newType = e.target.value as LessonType;
                  setType(newType);
                  if (newType === LESSON_TYPES.INDIVIDUAL && selectedStudents.length > 1) {
                    setSelectedStudents(selectedStudents.slice(0, 1));
                  }
                }}
              >
                {Object.entries(LESSON_TYPE_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Предмет</InputLabel>
              <Select
                value={subject}
                label="Предмет"
                onChange={(e) => setSubject(e.target.value as LessonSubject)}
              >
                {Object.entries(LESSON_SUBJECT_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <DateTimePicker
              label="Початок"
              value={startTime}
              onChange={setStartTime}
              ampm={false}
              sx={{ flex: 1 }}
            />
            <DateTimePicker
              label="Кінець"
              value={endTime}
              onChange={setEndTime}
              ampm={false}
              sx={{ flex: 1 }}
            />
          </Stack>

          {type === LESSON_TYPES.INDIVIDUAL ? (
            <Autocomplete
              options={allStudents}
              getOptionLabel={(o) => o.name}
              value={selectedStudents[0] || null}
              onChange={(_e, val) => setSelectedStudents(val ? [val] : [])}
              renderInput={(params) => <TextField {...params} label="Учень" />}
            />
          ) : (
            <Autocomplete
              multiple
              options={allStudents}
              getOptionLabel={(o) => o.name}
              value={selectedStudents}
              onChange={(_e, val) => setSelectedStudents(val)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                    size="small"
                    sx={{ backgroundColor: alpha('#6366f1', 0.15), color: '#818cf8', fontWeight: 600 }}
                  />
                ))
              }
              renderInput={(params) => <TextField {...params} label="Учні" />}
            />
          )}

          {selectedStudents.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: alpha('#6366f1', 0.06),
                border: `1px solid ${alpha('#6366f1', 0.12)}`,
              }}
            >
              {selectedStudents.map((s) => (
                <Typography key={s.id} variant="body2" fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {s.name}: {getStudentPrice(s)} грн
                </Typography>
              ))}
              <Typography variant="body2" fontWeight={600} sx={{ color: '#818cf8', mt: 0.5 }}>
                Разом: {totalPrice} грн
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Скасувати
        </Button>
        {isRecurring ? (
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => handleSubmit('single')}
              variant="outlined"
              disabled={!canSave}
              sx={{
                borderColor: alpha('#fff', 0.15),
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
                '&:hover': { borderColor: alpha('#6366f1', 0.4), color: '#818cf8' },
              }}
            >
              Цей урок
            </Button>
            <Button
              onClick={() => handleSubmit('future')}
              variant="contained"
              disabled={!canSave}
              startIcon={<EventRepeatIcon sx={{ fontSize: '16px !important' }} />}
            >
              Цей та наступні
            </Button>
          </Stack>
        ) : (
          <Button
            onClick={() => handleSubmit('single')}
            variant="contained"
            disabled={!canSave}
          >
            Зберегти
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
