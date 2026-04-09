import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type CalendarNavigationState = {
  visibleDateIso: string | null;
  navigateRequest: { id: number; dateIso: string } | null;
};

const initialState: CalendarNavigationState = {
  visibleDateIso: null,
  navigateRequest: null,
};

export const calendarNavigationSlice = createSlice({
  name: 'calendarNavigation',
  initialState,
  reducers: {
    setVisibleDate(state, action: PayloadAction<string>) {
      state.visibleDateIso = action.payload;
    },
    requestNavigateToDate(state, action: PayloadAction<string>) {
      const nextId = (state.navigateRequest?.id ?? 0) + 1;
      state.navigateRequest = { id: nextId, dateIso: action.payload };
      state.visibleDateIso = action.payload;
    },
  },
});

export const { setVisibleDate, requestNavigateToDate } = calendarNavigationSlice.actions;
export const calendarNavigationReducer = calendarNavigationSlice.reducer;

