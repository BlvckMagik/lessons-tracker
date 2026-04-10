export interface Settings {
  id: number;
  defaultIndividualPrice: number;
  defaultGroupPrice: number;
  telegramChatId: string | null;
  telegramConversationState: string | null;
}

export interface UpdateSettingsDto {
  defaultIndividualPrice?: number;
  defaultGroupPrice?: number;
  telegramChatId?: string | null;
  telegramConversationState?: string | null;
}
