'use client';

import { useState } from 'react';
import { Stack, TextField, Typography, Button, Box, alpha } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useUpdateLessonMutation } from '@/entities/lesson/api/lessonApi';

interface Props {
  lessonId: number;
  onDone: () => void;
}

export function LessonNotesStep({ lessonId, onDone }: Props) {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [updateLesson, { isLoading }] = useUpdateLessonMutation();

  const handleSave = async () => {
    await updateLesson({
      id: lessonId,
      data: { notes: notes.trim() || null, rating },
    });
    onDone();
  };

  const displayRating = hovered ?? rating ?? 0;

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        borderRadius: 2,
        backgroundColor: alpha('#6366f1', 0.06),
        border: `1px solid ${alpha('#6366f1', 0.15)}`,
      }}
    >
      <Typography fontSize="0.75rem" fontWeight={600} sx={{ mb: 1, color: 'rgba(255,255,255,0.6)' }}>
        Нотатки до уроку
      </Typography>
      <TextField
        multiline
        minRows={2}
        maxRows={5}
        fullWidth
        placeholder="Що пройшли, домашнє завдання..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        size="small"
        sx={{
          mb: 1,
          '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
        }}
      />
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
        <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.4)', mr: 0.5 }}>
          Оцінка:
        </Typography>
        {[1, 2, 3, 4, 5].map((star) => (
          <Box
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setRating(star === rating ? null : star)}
            sx={{ cursor: 'pointer', color: star <= displayRating ? '#fbbf24' : 'rgba(255,255,255,0.2)', display: 'flex' }}
          >
            {star <= displayRating ? (
              <StarIcon sx={{ fontSize: 20 }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 20 }} />
            )}
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="text"
          onClick={onDone}
          sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}
        >
          Пропустити
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          disabled={isLoading}
          sx={{ fontSize: '0.72rem', backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
        >
          Зберегти
        </Button>
      </Stack>
    </Box>
  );
}
