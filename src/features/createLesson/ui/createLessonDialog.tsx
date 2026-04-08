'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новий урок</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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

          <DateTimePicker
            label="Початок"
            value={startTime}
            onChange={setStartTime}
            ampm={false}
            minutesStep={5}
          />

          <DateTimePicker
            label="Кінець"
            value={endTime}
            onChange={setEndTime}
            ampm={false}
            minutesStep={5}
          />

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
                  <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                ))
              }
              renderInput={(params) => <TextField {...params} label="Учні" />}
            />
          )}

          <Typography variant="body2" color="text.secondary">
            Вартість: {price} грн {type === LESSON_TYPES.GROUP ? 'з кожного' : ''}
            {type === LESSON_TYPES.GROUP && selectedStudents.length > 0 && (
              <> (разом: {price * selectedStudents.length} грн)</>
            )}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Скасувати</Button>
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
