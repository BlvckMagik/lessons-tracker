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
  InputAdornment,
  alpha,
  Fade,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
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
        cell: (info) => (
          <Typography fontWeight={500} fontSize="0.875rem">
            {info.getValue()}
          </Typography>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Телефон',
        cell: (info) => (
          <Typography fontSize="0.875rem" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {info.getValue() || '—'}
          </Typography>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <Typography fontSize="0.875rem" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {info.getValue() || '—'}
          </Typography>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Створено',
        cell: (info) => (
          <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.35)' }}>
            {new Date(info.getValue()).toLocaleDateString('uk-UA')}
          </Typography>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <IconButton
              size="small"
              disabled
              sx={{ opacity: 0.3 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                if (confirm('Видалити учня?')) {
                  deleteStudent(info.row.original.id);
                }
              }}
              sx={{
                color: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  color: '#f87171',
                  backgroundColor: alpha('#f87171', 0.1),
                },
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">Учні</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: 'rgba(255,255,255,0.35)' }}>
            {students.length} {students.length === 1 ? 'учень' : 'учнів'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setDialogOpen(true)}
          size="medium"
        >
          Додати учня
        </Button>
      </Stack>

      <TextField
        placeholder="Пошук учнів..."
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
                      <PeopleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.08)', mb: 1 }} />
                      <Typography color="text.secondary" fontSize="0.9rem">
                        Учнів поки немає
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', mt: 0.5 }}>
                        Натисніть «Додати учня» щоб почати
                      </Typography>
                    </Box>
                  </Fade>
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
