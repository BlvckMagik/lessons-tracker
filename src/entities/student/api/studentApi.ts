import { baseApi } from '@/shared/api/baseApi';
import type { Student, CreateStudentDto, UpdateStudentDto } from '../model/types';

export const studentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStudents: build.query<Student[], void>({
      query: () => 'students',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Student' as const, id })), { type: 'Student', id: 'LIST' }]
          : [{ type: 'Student', id: 'LIST' }],
    }),

    getStudent: build.query<Student, number>({
      query: (id) => `students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),

    createStudent: build.mutation<Student, CreateStudentDto>({
      query: (body) => ({
        url: 'students',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    updateStudent: build.mutation<Student, { id: number; data: UpdateStudentDto }>({
      query: ({ id, data }) => ({
        url: `students/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Student', id }, { type: 'Student', id: 'LIST' }],
    }),

    deleteStudent: build.mutation<void, number>({
      query: (id) => ({
        url: `students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentApi;
