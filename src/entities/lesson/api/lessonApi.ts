import { baseApi } from '@/shared/api/baseApi';
import type {
  Lesson,
  CreateLessonDto,
  UpdateLessonDto,
  LessonStatus,
  StudentReport,
} from '../model/types';

export const lessonApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLessons: build.query<Lesson[], { from?: string; to?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.from) searchParams.set('from', params.from);
        if (params?.to) searchParams.set('to', params.to);
        const qs = searchParams.toString();
        return `lessons${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Lesson' as const, id })), { type: 'Lesson', id: 'LIST' }]
          : [{ type: 'Lesson', id: 'LIST' }],
    }),

    getLesson: build.query<Lesson, number>({
      query: (id) => `lessons/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Lesson', id }],
    }),

    createLesson: build.mutation<Lesson, CreateLessonDto>({
      query: (body) => ({
        url: 'lessons',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Lesson', id: 'LIST' }, { type: 'Report' }],
    }),

    updateLesson: build.mutation<Lesson, { id: number; data: UpdateLessonDto }>({
      query: ({ id, data }) => ({
        url: `lessons/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lesson', id },
        { type: 'Lesson', id: 'LIST' },
        { type: 'Report' },
      ],
    }),

    deleteLesson: build.mutation<void, number>({
      query: (id) => ({
        url: `lessons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Lesson', id: 'LIST' }, { type: 'Report' }],
    }),

    deleteFutureLessons: build.mutation<{ deleted: number }, number>({
      query: (id) => ({
        url: `lessons/${id}/delete-future`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Lesson', id: 'LIST' }, { type: 'Report' }, { type: 'RecurringLesson' as const }],
    }),

    updateLessonStatus: build.mutation<Lesson, { id: number; status: LessonStatus }>({
      query: ({ id, status }) => ({
        url: `lessons/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patches = dispatch(
          lessonApi.util.updateQueryData('getLessons', undefined, (draft) => {
            const lesson = draft.find((l) => l.id === id);
            if (lesson) {
              lesson.status = status;
              lesson.students.forEach((s) => { s.status = status; });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patches.undo();
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Lesson', id },
        { type: 'Report' },
      ],
    }),

    updateStudentStatus: build.mutation<Lesson, { lessonId: number; studentId: number; status: LessonStatus }>({
      query: ({ lessonId, studentId, status }) => ({
        url: `lessons/${lessonId}/student-status`,
        method: 'PATCH',
        body: { studentId, status },
      }),
      async onQueryStarted({ lessonId, studentId, status }, { dispatch, queryFulfilled }) {
        const patches = dispatch(
          lessonApi.util.updateQueryData('getLessons', undefined, (draft) => {
            const lesson = draft.find((l) => l.id === lessonId);
            if (lesson) {
              const ls = lesson.students.find((s) => s.studentId === studentId);
              if (ls) ls.status = status;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patches.undo();
        }
      },
      invalidatesTags: (_result, _error, { lessonId }) => [
        { type: 'Lesson', id: lessonId },
        { type: 'Lesson', id: 'LIST' },
        { type: 'Report' },
      ],
    }),

    updatePayment: build.mutation<void, { lessonId: number; studentId: number; paid: boolean }>({
      query: ({ lessonId, ...body }) => ({
        url: `lessons/${lessonId}/payment`,
        method: 'PATCH',
        body,
      }),
      async onQueryStarted({ lessonId, studentId, paid }, { dispatch, queryFulfilled }) {
        const patches = dispatch(
          lessonApi.util.updateQueryData('getLessons', undefined, (draft) => {
            const lesson = draft.find((l) => l.id === lessonId);
            if (lesson) {
              const ls = lesson.students.find((s) => s.studentId === studentId);
              if (ls) ls.paid = paid;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patches.undo();
        }
      },
      invalidatesTags: [{ type: 'Report' }],
    }),

    getReports: build.query<StudentReport[], void>({
      query: () => 'reports',
      providesTags: [{ type: 'Report' }],
    }),
  }),
});

export const {
  useGetLessonsQuery,
  useGetLessonQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useDeleteFutureLessonsMutation,
  useUpdateLessonStatusMutation,
  useUpdateStudentStatusMutation,
  useUpdatePaymentMutation,
  useGetReportsQuery,
} = lessonApi;
