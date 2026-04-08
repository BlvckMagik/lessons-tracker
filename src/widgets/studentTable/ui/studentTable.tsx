'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
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
  IconButton,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  useGetStudentsQuery,
  useDeleteStudentMutation,
} from '@/entities/student/api/studentApi';
import type { Student } from '@/entities/student/model/types';
import { CreateStudentDialog } from '@/features/createStudent/ui/createStudentDialog';

const columnHelper = createColumnHelper<Student>();

export function StudentTable() {
  const { data: students = [] } = useGetStudentsQuery();
  const [deleteStudent] = useDeleteStudentMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: "Ім'я",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('phone', {
        header: 'Телефон',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('createdAt', {
        header: 'Дата створення',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('uk-UA'),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Дії',
        cell: (info) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" disabled>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                if (confirm('Видалити учня?')) {
                  deleteStudent(info.row.original.id);
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ),
      }),
    ],
    [deleteStudent]
  );

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          Учні
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Додати учня
        </Button>
      </Stack>

      <TextField
        placeholder="Пошук..."
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
                  <Typography color="text.secondary">Учнів поки немає</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateStudentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </Box>
  );
}
