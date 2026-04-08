import { baseApi } from '@/shared/api/baseApi';
import type { Settings, UpdateSettingsDto } from '../model/types';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<Settings, void>({
      query: () => 'settings',
      providesTags: ['Settings'],
    }),

    updateSettings: build.mutation<Settings, UpdateSettingsDto>({
      query: (body) => ({
        url: 'settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
