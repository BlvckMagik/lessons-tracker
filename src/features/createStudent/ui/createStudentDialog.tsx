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
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';
import { useCreateStudentMutation } from '@/entities/student/api/studentApi';

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
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [createStudent, { isLoading }] = useCreateStudentMutation();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createStudent({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setEmail('');
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
            label="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            fullWidth
          />
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
