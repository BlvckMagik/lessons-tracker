'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, alpha, CircularProgress, Divider,
} from '@mui/material';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/entities/settings/api/settingsApi';

export function SettingsForm() {
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [individualPrice, setIndividualPrice] = useState('');
  const [groupPrice, setGroupPrice] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    if (!settings) return;
    setIndividualPrice(String(settings.defaultIndividualPrice));
    setGroupPrice(String(settings.defaultGroupPrice));
    setTelegramChatId(settings.telegramChatId ?? '');
  }, [settings]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  const handleSave = async () => {
    await updateSettings({
      defaultIndividualPrice: Number(individualPrice),
      defaultGroupPrice: Number(groupPrice),
      telegramChatId: telegramChatId.trim() || null,
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Налаштування</Typography>

      <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography fontWeight={600} sx={{ mb: 2 }}>Ціни за замовчуванням</Typography>
        <Stack spacing={2}>
          <TextField
            label="Індивідуальний урок (грн)"
            type="number"
            value={individualPrice}
            onChange={(e) => setIndividualPrice(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Груповий урок (грн)"
            type="number"
            value={groupPrice}
            onChange={(e) => setGroupPrice(e.target.value)}
            size="small"
            fullWidth
          />
        </Stack>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography fontWeight={600} sx={{ mb: 1 }}>Telegram</Typography>
        <Typography fontSize="0.78rem" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2 }}>
          Введіть ваш Telegram Chat ID для отримання нагадувань. Дізнатись ID можна через бота @userinfobot.
        </Typography>
        <TextField
          label="Telegram Chat ID"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value)}
          size="small"
          fullWidth
          placeholder="напр. 123456789"
        />

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          sx={{ mt: 3, backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
        >
          {isSaving ? 'Зберігаємо...' : 'Зберегти'}
        </Button>
      </Paper>
    </Box>
  );
}
