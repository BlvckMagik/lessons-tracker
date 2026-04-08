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
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useGetStudentsQuery } from '@/entities/student/api/studentApi';
import { useCreateLessonMutation } from '@/entities/lesson/api/lessonApi';
import type { LessonType, LessonSubject } from '@/entities/lesson/model/types';
import type { Student } from '@/entities/student/model/types';
import {
  LESSON_TYPES,
  LESSON_SUBJECTS,
  LESSON_TYPE_LABELS,
  LESSON_SUBJECT_LABELS,
  PRICE_INDIVIDUAL,
  PRICE_GROUP,
} from '@/shared/config/constants';

const SlideTransition = forwardRef(function SlideTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStart?: Date | null;
  defaultEnd?: Date | null;
}

export function CreateLessonDialog({ open, onClose, defaultStart, defaultEnd }: Props) {
  const [type, setType] = useState<LessonType>(LESSON_TYPES.INDIVIDUAL);
  const [subject, setSubject] = useState<LessonSubject>(LESSON_SUBJECTS.ENGLISH);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  const { data: students = [] } = useGetStudentsQuery();
  const [createLesson, { isLoading }] = useCreateLessonMutation();

  useEffect(() => {
    if (open) {
      setStartTime(defaultStart ? dayjs(defaultStart) : dayjs().startOf('hour').add(1, 'hour'));
      setEndTime(defaultEnd ? dayjs(defaultEnd) : dayjs().startOf('hour').add(2, 'hour'));
    }
  }, [open, defaultStart, defaultEnd]);

  const price = type === LESSON_TYPES.INDIVIDUAL ? PRICE_INDIVIDUAL : PRICE_GROUP;

  const handleSubmit = async () => {
    if (!startTime || !endTime || selectedStudents.length === 0) return;

    await createLesson({
      type,
      subject,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      studentIds: selectedStudents.map((s) => s.id),
      pricePerStudent: price,
    });

    handleClose();
  };

  const handleClose = () => {
    setType(LESSON_TYPES.INDIVIDUAL);
    setSubject(LESSON_SUBJECTS.ENGLISH);
    setStartTime(null);
    setEndTime(null);
    setSelectedStudents([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={SlideTransition}
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" fontSize="1.1rem" fontWeight={700}>
          Новий урок
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.25 }}>
          Заплануйте новий урок у розкладі
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
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
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
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
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
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
              options={students}
              getOptionLabel={(o) => o.name}
              value={selectedStudents[0] || null}
              onChange={(_e, val) => setSelectedStudents(val ? [val] : [])}
              renderInput={(params) => <TextField {...params} label="Учень" />}
            />
          ) : (
            <Autocomplete
              multiple
              options={students}
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
                    sx={{
                      backgroundColor: alpha('#6366f1', 0.15),
                      color: '#818cf8',
                      fontWeight: 600,
                    }}
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
                  {' '}
                  (разом: {price * selectedStudents.length} грн)
                </Box>
              )}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={handleClose}
          sx={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Скасувати
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!startTime || !endTime || selectedStudents.length === 0 || isLoading}
        >
          Створити
        </Button>
      </DialogActions>
    </Dialog>
  );
}
