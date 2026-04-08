'use client';

import { useState, useMemo, Fragment } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
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
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import {
  useGetReportsQuery,
  useUpdatePaymentMutation,
} from '@/entities/lesson/api/lessonApi';
import type { StudentReport, LessonReportItem } from '@/entities/lesson/model/types';
import {
  LESSON_SUBJECT_LABELS,
  LESSON_TYPE_LABELS,
  LESSON_STATUS_LABELS,
} from '@/shared/config/constants';

const columnHelper = createColumnHelper<StudentReport>();

const statusChipStyles: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399' },
  MISSED: { bg: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' },
  CANCELLED: { bg: 'rgba(248, 113, 113, 0.12)', color: '#f87171' },
  PLANNED: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' },
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
          const style = statusChipStyles[lesson.status] || statusChipStyles.PLANNED;
          return (
            <TableRow key={lesson.lessonStudentId} sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell>
                <Typography fontSize="0.8rem">
                  {new Date(lesson.startTime).toLocaleDateString('uk-UA')}{' '}
                  <Box component="span" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                    {new Date(lesson.startTime).toLocaleTimeString('uk-UA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Box>
                </Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="0.8rem">{LESSON_SUBJECT_LABELS[lesson.subject]}</Typography>
              </TableCell>
              <TableCell>
                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.5)' }}>
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
                    fontSize: '0.7rem',
                    border: 'none',
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
                    borderRadius: '50%',
                    backgroundColor: lesson.charged ? '#34d399' : 'rgba(255,255,255,0.12)',
                    mx: 'auto',
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
                    color: 'rgba(255,255,255,0.15)',
                    '&.Mui-checked': {
                      color: '#34d399',
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

export function ReportTable() {
  const { data: reports = [] } = useGetReportsQuery();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'expand',
        header: '',
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
                color: 'rgba(255,255,255,0.3)',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
                '&:hover': {
                  color: 'rgba(255,255,255,0.6)',
                },
              }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          );
        },
      }),
      columnHelper.accessor('studentName', {
        header: 'Учень',
        cell: (info) => (
          <Typography fontWeight={600} fontSize="0.875rem">
            {info.getValue()}
          </Typography>
        ),
      }),
      columnHelper.accessor('totalLessons', {
        header: 'Уроків',
        cell: (info) => (
          <Typography fontSize="0.875rem" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {info.getValue()}
          </Typography>
        ),
      }),
      columnHelper.accessor('completed', {
        header: 'Проведено',
        cell: (info) => (
          <Chip
            label={info.getValue()}
            size="small"
            sx={{
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '0.75rem',
              minWidth: 36,
              border: 'none',
            }}
          />
        ),
      }),
      columnHelper.accessor('missed', {
        header: 'Пропущено',
        cell: (info) => (
          <Chip
            label={info.getValue()}
            size="small"
            sx={{
              backgroundColor: 'rgba(251, 191, 36, 0.12)',
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '0.75rem',
              minWidth: 36,
              border: 'none',
            }}
          />
        ),
      }),
      columnHelper.accessor('cancelled', {
        header: 'Скасовано',
        cell: (info) => (
          <Chip
            label={info.getValue()}
            size="small"
            sx={{
              backgroundColor: 'rgba(248, 113, 113, 0.12)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '0.75rem',
              minWidth: 36,
              border: 'none',
            }}
          />
        ),
      }),
      columnHelper.accessor('totalCharged', {
        header: 'Нараховано',
        cell: (info) => (
          <Typography fontSize="0.875rem" fontWeight={500}>
            {info.getValue()} <Box component="span" sx={{ color: 'rgba(255,255,255,0.3)' }}>грн</Box>
          </Typography>
        ),
      }),
      columnHelper.accessor('totalPaid', {
        header: 'Оплачено',
        cell: (info) => (
          <Typography fontSize="0.875rem" fontWeight={500} sx={{ color: '#34d399' }}>
            {info.getValue()} <Box component="span" sx={{ opacity: 0.6 }}>грн</Box>
          </Typography>
        ),
      }),
      columnHelper.accessor('totalOwed', {
        header: 'Борг',
        cell: (info) => {
          const val = info.getValue();
          return (
            <Chip
              label={`${val} грн`}
              size="small"
              sx={{
                backgroundColor: val > 0 ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                color: val > 0 ? '#f87171' : '#34d399',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: 'none',
              }}
            />
          );
        },
      }),
    ],
    [expandedRows]
  );

  const table = useReactTable({
    data: reports,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">Звіти</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'rgba(255,255,255,0.35)' }}>
            Фінансова звітність по учням
          </Typography>
        </Box>
      </Stack>

      <TextField
        placeholder="Пошук учня..."
        size="small"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        sx={{ mb: 2.5, width: 320 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.25)' }} />
              </InputAdornment>
            ),
          },
        }}
      />

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
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableSortLabel>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <Fade in timeout={400}>
                    <Box>
                      <AssessmentIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
                      <Typography color="text.secondary" fontSize="0.9rem">
                        Даних поки немає
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', mt: 0.5 }}>
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                          : `1px solid ${alpha('#fff', 0.04)}`,
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
                            backgroundColor: alpha('#6366f1', 0.03),
                            borderTop: `1px solid ${alpha('#fff', 0.04)}`,
                            borderBottom: `1px solid ${alpha('#fff', 0.04)}`,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ mb: 1.5, color: 'rgba(255,255,255,0.4)' }}
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
