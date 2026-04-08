'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  Slide,
  InputAdornment,
  alpha,
  Divider,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import { useCreateStudentMutation } from '@/entities/student/api/studentApi';
import { useGetSettingsQuery } from '@/entities/settings/api/settingsApi';

const SlideTransition = forwardRef(function SlideTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateStudentDialog({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [individualPrice, setIndividualPrice] = useState('');
  const [groupPrice, setGroupPrice] = useState('');
  const [createStudent, { isLoading }] = useCreateStudentMutation();
  const { data: settings } = useGetSettingsQuery();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createStudent({
      name: name.trim(),
      telegram: telegram.trim() || undefined,
      individualPrice: individualPrice ? Number(individualPrice) : null,
      groupPrice: groupPrice ? Number(groupPrice) : null,
    });
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setTelegram('');
    setIndividualPrice('');
    setGroupPrice('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={SlideTransition}
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" fontSize="1.1rem" fontWeight={700}>
          Новий учень
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.25 }}>
          Додайте інформацію про учня
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 2 }}>
          <TextField
            label="Ім'я"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Telegram"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            fullWidth
          />

          <Divider />

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha('#6366f1', 0.04),
              border: `1px solid ${alpha('#6366f1', 0.1)}`,
            }}
          >
            <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1.5 }}>
              Індивідуальна ціна (залиште пустим для значень за замовчуванням)
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Індивідуалка"
                type="number"
                size="small"
                value={individualPrice}
                onChange={(e) => setIndividualPrice(e.target.value)}
                placeholder={String(settings?.defaultIndividualPrice ?? 200)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">грн</InputAdornment> } }}
                fullWidth
              />
              <TextField
                label="Група"
                type="number"
                size="small"
                value={groupPrice}
                onChange={(e) => setGroupPrice(e.target.value)}
                placeholder={String(settings?.defaultGroupPrice ?? 50)}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">грн</InputAdornment> } }}
                fullWidth
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={handleClose}
          sx={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Скасувати
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim() || isLoading}>
          Створити
        </Button>
      </DialogActions>
    </Dialog>
  );
}
