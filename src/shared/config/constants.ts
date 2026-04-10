export const LESSON_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  GROUP: 'GROUP',
} as const;

export const LESSON_SUBJECTS = {
  ENGLISH: 'ENGLISH',
  GERMAN: 'GERMAN',
} as const;

export const LESSON_STATUSES = {
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
} as const;

export const LESSON_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Індивідуальне',
  GROUP: 'Групове',
};

export const LESSON_SUBJECT_LABELS: Record<string, string> = {
  GERMAN: 'Німецька',
  ENGLISH: 'Англійська',
};

export const LESSON_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Заплановано',
  COMPLETED: 'Проведено',
  MISSED: 'Пропущено',
  CANCELLED: 'Скасовано',
};

export const CHARGEABLE_STATUSES = [LESSON_STATUSES.COMPLETED, LESSON_STATUSES.MISSED];

export const SIDEBAR_COOKIE = 'sidebar-collapsed';
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
