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
import type { TransitionProps } from '@mui/material/transitions';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useGetStudentsQuery } from '@/entities/student/api/studentApi';
import {
  useUpdateLessonMutation,
  useUpdateLessonStatusMutation,
} from '@/entities/lesson/api/lessonApi';
import type { Lesson, LessonType, LessonSubject, LessonStatus } from '@/entities/lesson/model/types';
import type { Student } from '@/entities/student/model/types';
import {
  LESSON_TYPES,
  LESSON_SUBJECTS,
  LESSON_TYPE_LABELS,
  LESSON_SUBJECT_LABELS,
  LESSON_STATUS_LABELS,
  PRICE_INDIVIDUAL,
  PRICE_GROUP,
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

  const { data: allStudents = [] } = useGetStudentsQuery();
  const [updateLesson, { isLoading: isUpdating }] = useUpdateLessonMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateLessonStatusMutation();
  const isLoading = isUpdating || isUpdatingStatus;

  useEffect(() => {
    if (open && lesson) {
      setType(lesson.type);
      setSubject(lesson.subject);
      setStartTime(dayjs(lesson.startTime));
      setEndTime(dayjs(lesson.endTime));
      setStatus(lesson.status);

      const studentIds = lesson.students.map((s) => s.studentId);
      const matched = allStudents.filter((s) => studentIds.includes(s.id));
      setSelectedStudents(matched);
    }
  }, [open, lesson, allStudents]);

  const price = type === LESSON_TYPES.INDIVIDUAL ? PRICE_INDIVIDUAL : PRICE_GROUP;

  const handleSubmit = async () => {
    if (!lesson || !startTime || !endTime || selectedStudents.length === 0) return;

    if (status !== lesson.status) {
      await updateStatus({ id: lesson.id, status });
    }

    await updateLesson({
      id: lesson.id,
      data: {
        type,
        subject,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        studentIds: selectedStudents.map((s) => s.id),
        pricePerStudent: price,
      },
    });

    onClose();
  };

  if (!lesson) return null;

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
              minutesStep={5}
              sx={{ flex: 1 }}
            />
            <DateTimePicker
              label="Кінець"
              value={endTime}
              onChange={setEndTime}
              ampm={false}
              minutesStep={5}
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

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha('#6366f1', 0.06),
              border: `1px solid ${alpha('#6366f1', 0.12)}`,
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ color: '#818cf8' }}>
              Вартість: {price} грн {type === LESSON_TYPES.GROUP ? 'з кожного' : ''}
              {type === LESSON_TYPES.GROUP && selectedStudents.length > 0 && (
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {' '}(разом: {price * selectedStudents.length} грн)
                </Box>
              )}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Скасувати
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!startTime || !endTime || selectedStudents.length === 0 || isLoading}
        >
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  );
}
