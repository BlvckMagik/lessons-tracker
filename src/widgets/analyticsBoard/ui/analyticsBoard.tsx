'use client';

import { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, alpha, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface AnalyticsData {
  summary: { incomeThisMonth: number; lessonsThisMonth: number; totalDebt: number };
  incomeByMonth: { month: string; income: number }[];
  lessonCountByMonth: { month: string; count: number }[];
  debts: { studentId: number; studentName: string; unpaidLessons: number; totalDebt: number }[];
  missedThisMonth: { studentId: number; studentName: string; count: number }[];
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: alpha('#fff', 0.03),
        border: `1px solid ${alpha('#fff', 0.06)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ color: '#818cf8', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.4)' }}>{label}</Typography>
        <Typography fontSize="1.4rem" fontWeight={700}>{value}</Typography>
      </Box>
    </Paper>
  );
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('uk-UA', { month: 'short', year: '2-digit' });
}

export function AnalyticsBoard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d: AnalyticsData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (!data) return null;

  const incomeChartData = data.incomeByMonth.map((d) => ({ ...d, month: formatMonth(d.month) }));
  const lessonChartData = data.lessonCountByMonth.map((d) => ({ ...d, month: formatMonth(d.month) }));

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Аналітика
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            icon={<TrendingUpIcon />}
            label="Дохід цього місяця"
            value={`${data.summary.incomeThisMonth} грн`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            icon={<SchoolIcon />}
            label="Уроків цього місяця"
            value={String(data.summary.lessonsThisMonth)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            icon={<AccountBalanceWalletIcon />}
            label="Загальний борг"
            value={`${data.summary.totalDebt} грн`}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography fontWeight={600} sx={{ mb: 2 }}>Дохід по місяцях (грн)</Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={incomeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography fontWeight={600} sx={{ mb: 2 }}>Кількість уроків по місяцях</Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={lessonChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {data.debts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>Борги учнів</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Учень</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Неоплачених уроків</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Борг</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.debts.map((d) => (
                <TableRow key={d.studentId}>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{d.studentName}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{d.unpaidLessons}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>
                    {d.totalDebt} грн
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {data.missedThisMonth.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>Пропуски цього місяця</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Учень</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Пропусків</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.missedThisMonth.map((m) => (
                <TableRow key={m.studentId}>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{m.studentName}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>{m.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
