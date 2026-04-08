"use client";

import { useState, useMemo, Fragment, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { SingleInputDateRangeField } from "@mui/x-date-pickers-pro/SingleInputDateRangeField";
import type { DateRange } from "@mui/x-date-pickers-pro/models";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Stack,
  Checkbox,
  Chip,
  IconButton,
  Collapse,
  InputAdornment,
  alpha,
  Fade,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SearchIcon from "@mui/icons-material/Search";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  useGetReportsQuery,
  useUpdatePaymentMutation,
} from "@/entities/lesson/api/lessonApi";
import type {
  StudentReport,
  LessonReportItem,
} from "@/entities/lesson/model/types";
import {
  LESSON_SUBJECT_LABELS,
  LESSON_TYPE_LABELS,
  LESSON_STATUS_LABELS,
  CHARGEABLE_STATUSES,
} from "@/shared/config/constants";

const columnHelper = createColumnHelper<StudentReport>();

const statusChipStyles: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: "rgba(52, 211, 153, 0.12)", color: "#34d399" },
  MISSED: { bg: "rgba(251, 191, 36, 0.12)", color: "#fbbf24" },
  CANCELLED: { bg: "rgba(248, 113, 113, 0.12)", color: "#f87171" },
  PLANNED: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" },
};

function LessonDetailsTable({
  lessons,
  studentId,
}: {
  lessons: LessonReportItem[];
  studentId: number;
}) {
  const [updatePayment] = useUpdatePaymentMutation();

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Дата</TableCell>
          <TableCell>Предмет</TableCell>
          <TableCell>Тип</TableCell>
          <TableCell>Статус</TableCell>
          <TableCell align="right">Ціна</TableCell>
          <TableCell align="center">Нараховано</TableCell>
          <TableCell align="center">Оплачено</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lessons.map((lesson) => {
          const style =
            statusChipStyles[lesson.status] || statusChipStyles.PLANNED;
          return (
            <TableRow
              key={lesson.lessonStudentId}
              sx={{ "&:last-child td": { border: 0 } }}
            >
              <TableCell>
                <Typography fontSize="0.8rem">
                  {new Date(lesson.startTime).toLocaleDateString("uk-UA")}{" "}
                  <Box
                    component="span"
                    sx={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {new Date(lesson.startTime).toLocaleTimeString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Box>
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="0.8rem">
                  {LESSON_SUBJECT_LABELS[lesson.subject]}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  fontSize="0.8rem"
                  sx={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {LESSON_TYPE_LABELS[lesson.type]}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={LESSON_STATUS_LABELS[lesson.status]}
                  size="small"
                  sx={{
                    backgroundColor: style.bg,
                    color: style.color,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    border: "none",
                  }}
                />
              </TableCell>
              <TableCell align="right">
                <Typography fontSize="0.8rem" fontWeight={500}>
                  {lesson.pricePerStudent} грн
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: lesson.charged
                      ? "#34d399"
                      : "rgba(255,255,255,0.12)",
                    mx: "auto",
                  }}
                />
              </TableCell>
              <TableCell align="center">
                <Checkbox
                  checked={lesson.paid}
                  disabled={!lesson.charged}
                  onChange={(e) =>
                    updatePayment({
                      lessonId: lesson.lessonId,
                      studentId,
                      paid: e.target.checked,
                    })
                  }
                  size="small"
                  sx={{
                    color: "rgba(255,255,255,0.15)",
                    "&.Mui-checked": {
                      color: "#34d399",
                    },
                  }}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

const REPORT_SKELETON_ROWS = 4;
const REPORT_HEADERS = [
  "",
  "Учень",
  "Уроків",
  "Проведено",
  "Пропущено",
  "Скасовано",
  "Нараховано",
  "Оплачено",
  "Борг",
];

function ReportTableSkeleton() {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Skeleton
            variant="rounded"
            width={80}
            height={32}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton variant="text" width={180} sx={{ mt: 0.5 }} />
        </Box>
      </Stack>

      <Stack direction="column" spacing={1} sx={{ mb: 1.5 }}>
        <Skeleton
          variant="rounded"
          width={200}
          height={32}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rounded"
          width={200}
          height={32}
          sx={{ borderRadius: 2 }}
        />
        <Skeleton
          variant="rounded"
          width={200}
          height={32}
          sx={{ borderRadius: 2 }}
        />
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2.5, flexWrap: "wrap", gap: 2 }}
      >
        <Skeleton
          variant="rounded"
          width={320}
          height={40}
          sx={{ borderRadius: 2.5 }}
        />
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton
            variant="rounded"
            width={280}
            height={40}
            sx={{ borderRadius: 2.5 }}
          />
          <Skeleton
            variant="rounded"
            width={180}
            height={40}
            sx={{ borderRadius: 2.5 }}
          />
        </Stack>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {REPORT_HEADERS.map((h, i) => (
                <TableCell key={i}>
                  {h && (
                    <Skeleton
                      variant="text"
                      width={h.length * 9}
                      sx={{ fontSize: "0.75rem" }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: REPORT_SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="circular" width={28} height={28} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={90 + ((i * 11) % 48)} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={24} />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rounded"
                    width={36}
                    height={24}
                    sx={{ borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rounded"
                    width={36}
                    height={24}
                    sx={{ borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rounded"
                    width={36}
                    height={24}
                    sx={{ borderRadius: 2 }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={70} />
                </TableCell>
                <TableCell>
                  <Skeleton
                    variant="rounded"
                    width={60}
                    height={24}
                    sx={{ borderRadius: 2 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

type TypeFilter = "ALL" | "INDIVIDUAL" | "GROUP";

type NonNullDateRange = [Dayjs, Dayjs];

export function ReportTable() {
  const [dateRange, setDateRange] = useState<NonNullDateRange>(() => [
    dayjs().startOf("month"),
    dayjs().endOf("day"),
  ]);

  const reportQueryArgs = useMemo(
    () => ({
      from: dateRange[0].startOf("day").toISOString(),
      to: dateRange[1].endOf("day").toISOString(),
    }),
    [dateRange],
  );

  const {
    data: reports = [],
    isLoading,
    isFetching,
  } = useGetReportsQuery(reportQueryArgs);

  const handleDateRangeChange = useCallback((v: DateRange<Dayjs>) => {
    setDateRange((prev) => {
      const start = v[0] ?? prev[0];
      const end = v[1] ?? prev[1];
      if (start.isAfter(end, "day")) {
        return [start, start.endOf("day")] as NonNullDateRange;
      }
      return [start, end] as NonNullDateRange;
    });
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const filteredReports = useMemo(() => {
    if (typeFilter === "ALL") return reports;

    return reports
      .map((report) => {
        const lessons = report.lessons.filter((l) => l.type === typeFilter);
        const completed = lessons.filter(
          (l) => l.status === "COMPLETED",
        ).length;
        const missed = lessons.filter((l) => l.status === "MISSED").length;
        const cancelled = lessons.filter(
          (l) => l.status === "CANCELLED",
        ).length;
        const totalCharged = lessons
          .filter((l) =>
            (CHARGEABLE_STATUSES as readonly string[]).includes(l.status),
          )
          .reduce((sum, l) => sum + l.pricePerStudent, 0);
        const totalPaid = lessons
          .filter(
            (l) =>
              l.paid &&
              (CHARGEABLE_STATUSES as readonly string[]).includes(l.status),
          )
          .reduce((sum, l) => sum + l.pricePerStudent, 0);

        return {
          ...report,
          lessons,
          totalLessons: lessons.length,
          completed,
          missed,
          cancelled,
          totalCharged,
          totalPaid,
          totalOwed: totalCharged - totalPaid,
        };
      })
      .filter((r) => r.totalLessons > 0);
  }, [reports, typeFilter]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "expand",
        header: "",
        cell: ({ row }) => {
          const isExpanded = expandedRows[row.original.studentId];
          return (
            <IconButton
              size="small"
              onClick={() =>
                setExpandedRows((prev) => ({
                  ...prev,
                  [row.original.studentId]: !prev[row.original.studentId],
                }))
              }
              sx={{
                color: "rgba(255,255,255,0.3)",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
                "&:hover": {
                  color: "rgba(255,255,255,0.6)",
                },
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          );
        },
      }),
      columnHelper.accessor("studentName", {
        header: "Учень",
        cell: (info) => (
          <Typography fontWeight={600} fontSize="0.875rem">
            {info.getValue()}
          </Typography>
        ),
      }),
      columnHelper.accessor("totalLessons", {
        header: "Уроків",
        cell: (info) => (
          <Typography
            fontSize="0.875rem"
            sx={{ color: "rgba(255,255,255,0.5)" }}
          >
            {info.getValue()}
          </Typography>
        ),
      }),
      columnHelper.accessor("completed", {
        header: "Проведено",
        cell: (info) => (
          <Chip
            label={info.getValue()}
            size="small"
            sx={{
              backgroundColor: "rgba(52, 211, 153, 0.12)",
              color: "#34d399",
              fontWeight: 700,
              fontSize: "0.75rem",
              minWidth: 36,
              border: "none",
            }}
          />
        ),
      }),
      columnHelper.accessor("missed", {
        header: "Пропущено",
        cell: (info) => (
          <Chip
            label={info.getValue()}
            size="small"
            sx={{
              backgroundColor: "rgba(251, 191, 36, 0.12)",
              color: "#fbbf24",
              fontWeight: 700,
              fontSize: "0.75rem",
              minWidth: 36,
              border: "none",
            }}
          />
        ),
      }),
      columnHelper.accessor("cancelled", {
        header: "Скасовано",
        cell: (info) => (
          <Chip
            label={info.getValue()}
            size="small"
            sx={{
              backgroundColor: "rgba(248, 113, 113, 0.12)",
              color: "#f87171",
              fontWeight: 700,
              fontSize: "0.75rem",
              minWidth: 36,
              border: "none",
            }}
          />
        ),
      }),
      columnHelper.accessor("totalCharged", {
        header: "Нараховано",
        cell: (info) => (
          <Typography fontSize="0.875rem" fontWeight={500}>
            {info.getValue()}{" "}
            <Box component="span" sx={{ color: "rgba(255,255,255,0.3)" }}>
              грн
            </Box>
          </Typography>
        ),
      }),
      columnHelper.accessor("totalPaid", {
        header: "Оплачено",
        cell: (info) => (
          <Typography
            fontSize="0.875rem"
            fontWeight={500}
            sx={{ color: "#34d399" }}
          >
            {info.getValue()}{" "}
            <Box component="span" sx={{ opacity: 0.6 }}>
              грн
            </Box>
          </Typography>
        ),
      }),
      columnHelper.accessor("totalOwed", {
        header: "Борг",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Chip
              label={`${val} грн`}
              size="small"
              sx={{
                backgroundColor:
                  val > 0 ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.12)",
                color: val > 0 ? "#f87171" : "#34d399",
                fontWeight: 700,
                fontSize: "0.75rem",
                border: "none",
              }}
            />
          );
        },
      }),
    ],
    [expandedRows],
  );

  const table = useReactTable({
    data: filteredReports,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const visibleFinancialSummary = table.getFilteredRowModel().rows.reduce(
    (acc, row) => ({
      charged: acc.charged + row.original.totalCharged,
      paid: acc.paid + row.original.totalPaid,
      owed: acc.owed + row.original.totalOwed,
    }),
    { charged: 0, paid: 0, owed: 0 },
  );

  if (isLoading) {
    return <ReportTableSkeleton />;
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5">Звіти</Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.25, color: "rgba(255,255,255,0.35)" }}
          >
            Фінансова звітність по учням
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
        <Chip
          label={`Нараховано: ${visibleFinancialSummary.charged} грн`}
          size="small"
          sx={{
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.9)",
            fontWeight: 600,
            fontSize: "0.8125rem",
            border: "none",
          }}
        />
        <Chip
          label={`Оплачено: ${visibleFinancialSummary.paid} грн`}
          size="small"
          sx={{
            backgroundColor: "rgba(52, 211, 153, 0.12)",
            color: "#34d399",
            fontWeight: 600,
            fontSize: "0.8125rem",
            border: "none",
          }}
        />
        <Chip
          label={`Борг: ${visibleFinancialSummary.owed} грн`}
          size="small"
          sx={{
            backgroundColor:
              visibleFinancialSummary.owed > 0
                ? "rgba(248, 113, 113, 0.12)"
                : "rgba(52, 211, 153, 0.12)",
            color: visibleFinancialSummary.owed > 0 ? "#f87171" : "#34d399",
            fontWeight: 600,
            fontSize: "0.8125rem",
            border: "none",
          }}
        />
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2.5, flexWrap: "wrap", gap: 2 }}
      >
        <TextField
          placeholder="Пошук учня..."
          size="small"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          sx={{ width: 320, flexShrink: 0 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ fontSize: 18, color: "rgba(255,255,255,0.25)" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {isFetching && (
            <CircularProgress
              size={18}
              sx={{ color: "rgba(255,255,255,0.35)" }}
            />
          )}
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            slots={{ field: SingleInputDateRangeField }}
            localeText={{ start: "Від", end: "До" }}
            slotProps={{
              textField: {
                size: "small",
                label: "Період",
                sx: { minWidth: 280 },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Тип занять</InputLabel>
            <Select
              value={typeFilter}
              label="Тип занять"
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            >
              <MenuItem value="ALL">Усі заняття</MenuItem>
              <MenuItem value="INDIVIDUAL">Індивідуальні</MenuItem>
              <MenuItem value="GROUP">Групові</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {header.column.getCanSort() ? (
                      <TableSortLabel
                        active={!!header.column.getIsSorted()}
                        direction={header.column.getIsSorted() || undefined}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableSortLabel>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Fade in timeout={400}>
                    <Box>
                      <AssessmentIcon
                        sx={{
                          fontSize: 48,
                          color: "rgba(255,255,255,0.08)",
                          mb: 1,
                        }}
                      />
                      <Typography color="text.secondary" fontSize="0.9rem">
                        Даних поки немає
                      </Typography>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.25)",
                          fontSize: "0.8rem",
                          mt: 0.5,
                        }}
                      >
                        Створіть уроки та учнів для формування звітів
                      </Typography>
                    </Box>
                  </Fade>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow hover>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      sx={{
                        py: 0,
                        px: 0,
                        borderBottom: expandedRows[row.original.studentId]
                          ? undefined
                          : `1px solid ${alpha("#fff", 0.04)}`,
                      }}
                    >
                      <Collapse
                        in={!!expandedRows[row.original.studentId]}
                        timeout={250}
                        unmountOnExit
                      >
                        <Box
                          sx={{
                            px: 4,
                            py: 2.5,
                            backgroundColor: alpha("#6366f1", 0.03),
                            borderTop: `1px solid ${alpha("#fff", 0.04)}`,
                            borderBottom: `1px solid ${alpha("#fff", 0.04)}`,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1.5, color: "rgba(255,255,255,0.4)" }}
                          >
                            Деталі уроків
                          </Typography>
                          <LessonDetailsTable
                            lessons={row.original.lessons}
                            studentId={row.original.studentId}
                          />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
