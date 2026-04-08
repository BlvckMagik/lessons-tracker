import { baseApi } from '@/shared/api/baseApi';
import type { RecurringLesson, CreateRecurringLessonDto } from '../model/types';

export const recurringLessonApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRecurringLessons: build.query<RecurringLesson[], void>({
      query: () => 'recurring-lessons',
      providesTags: [{ type: 'RecurringLesson' as const }],
    }),

    createRecurringLesson: build.mutation<RecurringLesson, CreateRecurringLessonDto>({
      query: (body) => ({
        url: 'recurring-lessons',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'RecurringLesson' as const }, { type: 'Lesson', id: 'LIST' }],
    }),

    updateRecurringLesson: build.mutation<RecurringLesson, { id: number; data: Partial<CreateRecurringLessonDto & { active: boolean }> }>({
      query: ({ id, data }) => ({
        url: `recurring-lessons/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: [{ type: 'RecurringLesson' as const }],
    }),

    deleteRecurringLesson: build.mutation<void, number>({
      query: (id) => ({
        url: `recurring-lessons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'RecurringLesson' as const }, { type: 'Lesson', id: 'LIST' }, { type: 'Report' }],
    }),

    generateRecurringLessons: build.mutation<{ created: number }, { id: number; weeks?: number }>({
      query: ({ id, weeks }) => ({
        url: `recurring-lessons/${id}/generate`,
        method: 'POST',
        body: { weeks },
      }),
      invalidatesTags: [{ type: 'Lesson', id: 'LIST' }, { type: 'RecurringLesson' as const }],
    }),
  }),
});

export const {
  useGetRecurringLessonsQuery,
  useCreateRecurringLessonMutation,
  useUpdateRecurringLessonMutation,
  useDeleteRecurringLessonMutation,
  useGenerateRecurringLessonsMutation,
} = recurringLessonApi;
