"use client";

import { useState, useEffect, forwardRef } from "react";
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
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useGetStudentsQuery } from "@/entities/student/api/studentApi";
import { useCreateLessonMutation } from "@/entities/lesson/api/lessonApi";
import { useCreateRecurringLessonMutation } from "@/entities/recurringLesson/api/recurringLessonApi";
import { useGetSettingsQuery } from "@/entities/settings/api/settingsApi";
import type { LessonType, LessonSubject } from "@/entities/lesson/model/types";
import type { Student } from "@/entities/student/model/types";
import {
  LESSON_TYPES,
  LESSON_SUBJECTS,
  LESSON_TYPE_LABELS,
  LESSON_SUBJECT_LABELS,
} from "@/shared/config/constants";

const SlideTransition = forwardRef(function SlideTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const WEEKDAY_LABELS_MONDAY_FIRST = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const MONDAY_FIRST_INDEX_TO_JS_WEEKDAY = [1, 2, 3, 4, 5, 6, 0];

function jsWeekdayToMondayFirstIndex(js: number): number {
  return js === 0 ? 6 : js - 1;
}

function snapToFullHour(d: Dayjs): Dayjs {
  return d.minute(0).second(0).millisecond(0);
}

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStart?: Date | null;
  defaultEnd?: Date | null;
}

export function CreateLessonDialog({
  open,
  onClose,
  defaultStart,
  defaultEnd,
}: Props) {
  const [type, setType] = useState<LessonType>(LESSON_TYPES.INDIVIDUAL);
  const [subject, setSubject] = useState<LessonSubject>(LESSON_SUBJECTS.GERMAN);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringStartTime, setRecurringStartTime] = useState<Dayjs | null>(
    null,
  );
  const [recurringEndTime, setRecurringEndTime] = useState<Dayjs | null>(null);
  const [repeatUntil, setRepeatUntil] = useState<Dayjs | null>(null);

  const { data: students = [] } = useGetStudentsQuery();
  const { data: settings } = useGetSettingsQuery();
  const [createLesson, { isLoading: isCreating }] = useCreateLessonMutation();
  const [createRecurring, { isLoading: isCreatingRecurring }] =
    useCreateRecurringLessonMutation();
  const isLoading = isCreating || isCreatingRecurring;

  const defaultIndividual = settings?.defaultIndividualPrice ?? 200;
  const defaultGroup = settings?.defaultGroupPrice ?? 50;

  useEffect(() => {
    if (open) {
      let defStart = defaultStart
        ? snapToFullHour(dayjs(defaultStart))
        : snapToFullHour(dayjs().add(1, "hour"));
      let defEnd = defaultEnd
        ? snapToFullHour(dayjs(defaultEnd))
        : snapToFullHour(dayjs().add(2, "hour"));
      if (!defEnd.isAfter(defStart)) {
        defEnd = defStart.add(1, "hour");
      }
      setStartTime(defStart);
      setEndTime(defEnd);
      setRecurringStartTime(snapToFullHour(defStart));
      setRecurringEndTime(snapToFullHour(defEnd));
      if (defaultStart) {
        setRecurringDays([jsWeekdayToMondayFirstIndex(defaultStart.getDay())]);
      } else {
        setRecurringDays([]);
      }
    }
  }, [open, defaultStart, defaultEnd]);

  const getStudentPrice = (student: Student) => {
    if (type === LESSON_TYPES.INDIVIDUAL) {
      return student.individualPrice ?? defaultIndividual;
    }
    return student.groupPrice ?? defaultGroup;
  };

  const totalPrice = selectedStudents.reduce(
    (sum, s) => sum + getStudentPrice(s),
    0,
  );

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) return;

    if (isRecurring) {
      if (
        recurringDays.length === 0 ||
        !recurringStartTime ||
        !recurringEndTime
      )
        return;

      const rs = recurringStartTime.second(0).millisecond(0);
      let re = recurringEndTime.second(0).millisecond(0);
      if (!re.isAfter(rs)) {
        re = rs.add(1, "hour");
      }

      await createRecurring({
        daysOfWeek: Array.from(
          new Set(
            recurringDays.map(
              (i) => MONDAY_FIRST_INDEX_TO_JS_WEEKDAY[Number(i)],
            ),
          ),
        ).join(","),
        startTime: rs.format("HH:mm"),
        endTime: re.format("HH:mm"),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        type,
        subject,
        studentIds: selectedStudents.map((s) => s.id),
        repeatUntil: repeatUntil ? repeatUntil.format("YYYY-MM-DD") : undefined,
      });
    } else {
      if (!startTime || !endTime) return;

      const s = startTime.second(0).millisecond(0);
      let e = endTime.second(0).millisecond(0);
      if (!e.isAfter(s)) {
        e = s.add(1, "hour");
      }

      await createLesson({
        type,
        subject,
        startTime: s.toISOString(),
        endTime: e.toISOString(),
        studentIds: selectedStudents.map((s) => s.id),
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setType(LESSON_TYPES.INDIVIDUAL);
    setSubject(LESSON_SUBJECTS.GERMAN);
    setStartTime(null);
    setEndTime(null);
    setSelectedStudents([]);
    setIsRecurring(false);
    setRecurringDays([]);
    setRecurringStartTime(null);
    setRecurringEndTime(null);
    setRepeatUntil(null);
    onClose();
  };

  const canSubmit = isRecurring
    ? recurringDays.length > 0 &&
      recurringStartTime &&
      recurringEndTime &&
      selectedStudents.length > 0
    : startTime && endTime && selectedStudents.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={SlideTransition}
    >
      <DialogTitle component="div" sx={{ pb: 0.5 }}>
        <Typography variant="h6" fontSize="1.1rem" fontWeight={700}>
          {isRecurring ? "Регулярний урок" : "Новий урок"}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.35)", mt: 0.25 }}
        >
          {isRecurring
            ? "Створіть щотижневий розклад уроків"
            : "Заплануйте новий урок у розкладі"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <RepeatIcon
                  sx={{
                    fontSize: 18,
                    color: isRecurring ? "#818cf8" : "rgba(255,255,255,0.4)",
                  }}
                />
                <Typography fontSize="0.875rem" fontWeight={500}>
                  Повторювати щотижня
                </Typography>
              </Stack>
            }
            sx={{
              p: 1,
              borderRadius: 2.5,
              backgroundColor: isRecurring
                ? alpha("#6366f1", 0.08)
                : alpha("#fff", 0.02),
              border: `1px solid ${isRecurring ? alpha("#6366f1", 0.2) : alpha("#fff", 0.06)}`,
              transition: "all 0.2s ease",
              mx: 0,
            }}
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Тип</InputLabel>
              <Select
                value={type}
                label="Тип"
                onChange={(e) => {
                  const newType = e.target.value as LessonType;
                  setType(newType);
                  if (
                    newType === LESSON_TYPES.INDIVIDUAL &&
                    selectedStudents.length > 1
                  ) {
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

          {isRecurring ? (
            <>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                  }}
                >
                  Дні тижня
                </Typography>
                <ToggleButtonGroup
                  value={recurringDays}
                  onChange={(_e, val) => val && setRecurringDays(val)}
                  size="small"
                  sx={{
                    gap: 0.5,
                    "& .MuiToggleButton-root": {
                      borderRadius: "8px !important",
                      border: `1px solid ${alpha("#fff", 0.1)} !important`,
                      px: 1.5,
                      py: 0.75,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.4)",
                      "&.Mui-selected": {
                        backgroundColor: alpha("#6366f1", 0.2),
                        color: "#818cf8",
                        borderColor: `${alpha("#6366f1", 0.3)} !important`,
                      },
                    },
                  }}
                >
                  {WEEKDAY_LABELS_MONDAY_FIRST.map((label, idx) => (
                    <ToggleButton key={idx} value={idx}>
                      {label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Stack direction="row" spacing={2}>
                <TimePicker
                  label="Початок"
                  value={recurringStartTime}
                  onChange={(v) => setRecurringStartTime(v ? v : null)}
                  ampm={false}
                  sx={{ flex: 1 }}
                />
                <TimePicker
                  label="Кінець"
                  value={recurringEndTime}
                  onChange={(v) => setRecurringEndTime(v ? v : null)}
                  ampm={false}
                  sx={{ flex: 1 }}
                />
              </Stack>

              <DatePicker
                label="Повторювати до (необов'язково)"
                value={repeatUntil}
                onChange={setRepeatUntil}
                minDate={dayjs().add(1, "day")}
                slotProps={{
                  textField: { fullWidth: true },
                  field: { clearable: true },
                }}
              />
            </>
          ) : (
            <Stack direction="row" spacing={2}>
              <DateTimePicker
                label="Початок"
                value={startTime}
                onChange={(v) => setStartTime(v ? v : null)}
                ampm={false}
                sx={{ flex: 1 }}
              />
              <DateTimePicker
                label="Кінець"
                value={endTime}
                onChange={(v) => setEndTime(v ? v : null)}
                ampm={false}
                sx={{ flex: 1 }}
              />
            </Stack>
          )}

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
                      backgroundColor: alpha("#6366f1", 0.15),
                      color: "#818cf8",
                      fontWeight: 600,
                    }}
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
                backgroundColor: alpha("#6366f1", 0.06),
                border: `1px solid ${alpha("#6366f1", 0.12)}`,
              }}
            >
              {selectedStudents.map((s) => (
                <Typography
                  key={s.id}
                  variant="body2"
                  fontSize="0.8rem"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {s.name}: {getStudentPrice(s)} грн
                </Typography>
              ))}
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ color: "#818cf8", mt: 0.5 }}
              >
                Разом: {totalPrice} грн
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} sx={{ color: "rgba(255,255,255,0.5)" }}>
          Скасувати
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit || isLoading}
        >
          {isRecurring ? "Створити розклад" : "Створити"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
