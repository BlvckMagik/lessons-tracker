export interface Settings {
  id: number;
  defaultIndividualPrice: number;
  defaultGroupPrice: number;
}

export interface UpdateSettingsDto {
  defaultIndividualPrice: number;
  defaultGroupPrice: number;
}
