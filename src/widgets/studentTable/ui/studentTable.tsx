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
  Skeleton,
  Popover,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import TelegramIcon from '@mui/icons-material/Telegram';
import Link from '@mui/material/Link';
import {
  useGetStudentsQuery,
  useDeleteStudentMutation,
} from '@/entities/student/api/studentApi';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '@/entities/settings/api/settingsApi';
import type { Student } from '@/entities/student/model/types';
import { CreateStudentDialog } from '@/features/createStudent/ui/createStudentDialog';
import { EditStudentDialog } from '@/features/editStudent/ui/editStudentDialog';

const columnHelper = createColumnHelper<Student>();

const SKELETON_ROWS = 5;
const TABLE_HEADERS = ["Ім'я", 'Telegram', 'Індивід.', 'Група', ''];

function StudentTableSkeleton() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={60} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="rounded" width={150} height={40} sx={{ borderRadius: 2.5 }} />
      </Stack>

      <Skeleton variant="rounded" width={320} height={40} sx={{ mb: 2.5, borderRadius: 2.5 }} />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {TABLE_HEADERS.map((h, i) => (
                <TableCell key={i}>
                  {h && (
                    <Skeleton variant="text" width={h.length * 10} sx={{ fontSize: '0.75rem' }} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="text" width={100 + (i * 13) % 56} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={110} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={140} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={80} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function StudentTable() {
  const { data: students = [], isLoading } = useGetStudentsQuery();
  const { data: settings } = useGetSettingsQuery();
  const [deleteStudent] = useDeleteStudentMutation();
  const [updateSettings] = useUpdateSettingsMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [settingsIndividual, setSettingsIndividual] = useState('');
  const [settingsGroup, setSettingsGroup] = useState('');

  const handleSettingsOpen = (e: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchor(e.currentTarget);
    setSettingsIndividual(String(settings?.defaultIndividualPrice ?? 200));
    setSettingsGroup(String(settings?.defaultGroupPrice ?? 50));
  };

  const handleSettingsSave = async () => {
    await updateSettings({
      defaultIndividualPrice: Number(settingsIndividual) || 200,
      defaultGroupPrice: Number(settingsGroup) || 50,
    });
    setSettingsAnchor(null);
  };

  const defaultIndividual = settings?.defaultIndividualPrice ?? 200;
  const defaultGroup = settings?.defaultGroupPrice ?? 50;

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
      columnHelper.accessor('telegram', {
        header: 'Telegram',
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <Typography fontSize="0.875rem" sx={{ color: 'rgba(255,255,255,0.25)' }}>—</Typography>;
          const username = val.replace(/^@/, '');
          return (
            <Link
              href={`https://t.me/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.875rem',
                color: '#29b6f6',
                fontWeight: 500,
              }}
            >
              <TelegramIcon sx={{ fontSize: 16 }} />
              @{username}
            </Link>
          );
        },
      }),
      columnHelper.accessor('individualPrice', {
        header: 'Індивід.',
        cell: (info) => {
          const val = info.getValue();
          return (
            <Typography fontSize="0.85rem" sx={{ color: val !== null ? '#818cf8' : 'rgba(255,255,255,0.35)' }}>
              {val ?? defaultIndividual} грн
            </Typography>
          );
        },
      }),
      columnHelper.accessor('groupPrice', {
        header: 'Група',
        cell: (info) => {
          const val = info.getValue();
          return (
            <Typography fontSize="0.85rem" sx={{ color: val !== null ? '#818cf8' : 'rgba(255,255,255,0.35)' }}>
              {val ?? defaultGroup} грн
            </Typography>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <IconButton
              size="small"
              onClick={() => setEditStudent(info.row.original)}
              sx={{
                color: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  color: '#818cf8',
                  backgroundColor: alpha('#6366f1', 0.1),
                },
              }}
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
    [deleteStudent, defaultIndividual, defaultGroup, setEditStudent]
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

  if (isLoading) {
    return <StudentTableSkeleton />;
  }

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

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Пошук учнів..."
          size="small"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          sx={{ width: 320 }}
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
        <Tooltip title="Налаштування цін">
          <IconButton
            onClick={handleSettingsOpen}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.4)',
              '&:hover': { color: '#818cf8', backgroundColor: alpha('#6366f1', 0.1) },
            }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2.5,
              width: 300,
              borderRadius: 3,
              backgroundColor: 'rgba(30,30,40,0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha('#fff', 0.08)}`,
            },
          },
        }}
      >
        <Typography fontWeight={700} fontSize="0.95rem" sx={{ mb: 2 }}>
          Ціни за замовчуванням
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Індивідуальне заняття"
            type="number"
            size="small"
            value={settingsIndividual}
            onChange={(e) => setSettingsIndividual(e.target.value)}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">грн</InputAdornment> } }}
            fullWidth
          />
          <TextField
            label="Групове заняття"
            type="number"
            size="small"
            value={settingsGroup}
            onChange={(e) => setSettingsGroup(e.target.value)}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">грн</InputAdornment> } }}
            fullWidth
          />
          <Button variant="contained" size="small" onClick={handleSettingsSave}>
            Зберегти
          </Button>
        </Stack>
      </Popover>

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
      <EditStudentDialog
        open={Boolean(editStudent)}
        onClose={() => setEditStudent(null)}
        student={editStudent}
      />
    </Box>
  );
}
