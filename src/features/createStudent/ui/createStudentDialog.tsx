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
} from '@mui/material';
import { useCreateStudentMutation } from '@/entities/student/api/studentApi';

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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новий учень</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
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
      <DialogActions>
        <Button onClick={handleClose}>Скасувати</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim() || isLoading}>
          Створити
        </Button>
      </DialogActions>
    </Dialog>
  );
}
