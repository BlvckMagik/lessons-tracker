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
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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
        {lessons.map((lesson) => (
          <TableRow key={lesson.lessonStudentId}>
            <TableCell>
              {new Date(lesson.startTime).toLocaleDateString('uk-UA')}{' '}
              {new Date(lesson.startTime).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </TableCell>
            <TableCell>{LESSON_SUBJECT_LABELS[lesson.subject]}</TableCell>
            <TableCell>{LESSON_TYPE_LABELS[lesson.type]}</TableCell>
            <TableCell>
              <Chip
                label={LESSON_STATUS_LABELS[lesson.status]}
                size="small"
                color={
                  lesson.status === 'COMPLETED'
                    ? 'success'
                    : lesson.status === 'MISSED'
                      ? 'warning'
                      : lesson.status === 'CANCELLED'
                        ? 'error'
                        : 'default'
                }
              />
            </TableCell>
            <TableCell align="right">{lesson.pricePerStudent} грн</TableCell>
            <TableCell align="center">
              {lesson.charged ? (
                <Chip label="Так" size="small" color="info" />
              ) : (
                <Chip label="Ні" size="small" variant="outlined" />
              )}
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
              />
            </TableCell>
          </TableRow>
        ))}
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
        cell: ({ row }) => (
          <IconButton
            size="small"
            onClick={() =>
              setExpandedRows((prev) => ({
                ...prev,
                [row.original.studentId]: !prev[row.original.studentId],
              }))
            }
          >
            {expandedRows[row.original.studentId] ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        ),
      }),
      columnHelper.accessor('studentName', {
        header: 'Учень',
        cell: (info) => <Typography fontWeight={500}>{info.getValue()}</Typography>,
      }),
      columnHelper.accessor('totalLessons', {
        header: 'Всього уроків',
      }),
      columnHelper.accessor('completed', {
        header: 'Проведено',
        cell: (info) => (
          <Chip label={info.getValue()} size="small" color="success" variant="outlined" />
        ),
      }),
      columnHelper.accessor('missed', {
        header: 'Пропущено',
        cell: (info) => (
          <Chip label={info.getValue()} size="small" color="warning" variant="outlined" />
        ),
      }),
      columnHelper.accessor('cancelled', {
        header: 'Скасовано',
        cell: (info) => (
          <Chip label={info.getValue()} size="small" color="error" variant="outlined" />
        ),
      }),
      columnHelper.accessor('totalCharged', {
        header: 'Нараховано',
        cell: (info) => `${info.getValue()} грн`,
      }),
      columnHelper.accessor('totalPaid', {
        header: 'Оплачено',
        cell: (info) => `${info.getValue()} грн`,
      }),
      columnHelper.accessor('totalOwed', {
        header: 'Борг',
        cell: (info) => {
          const val = info.getValue();
          return (
            <Typography color={val > 0 ? 'error.main' : 'success.main'} fontWeight={600}>
              {val} грн
            </Typography>
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Звіти
        </Typography>
      </Stack>

      <TextField
        placeholder="Пошук учня..."
        size="small"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        sx={{ mb: 2, width: 300 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id} sx={{ fontWeight: 600 }}>
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
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Даних поки немає</Typography>
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
                    <TableCell colSpan={columns.length} sx={{ py: 0, px: 0 }}>
                      <Collapse
                        in={!!expandedRows[row.original.studentId]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ px: 4, py: 2, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
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
