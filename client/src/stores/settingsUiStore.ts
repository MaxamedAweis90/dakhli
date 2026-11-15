import { create } from 'zustand'

export type SettingsTab = 'finance' | 'preferences'

interface SettingsUiState {
  activeTab: SettingsTab
  isFinanceDirty: boolean
  isPreferencesDirty: boolean
  isSaving: boolean
  setActiveTab: (tab: SettingsTab) => void
  setFinanceDirty: (isDirty: boolean) => void
  setPreferencesDirty: (isDirty: boolean) => void
  setIsSaving: (isSaving: boolean) => void
}

export const useSettingsUiStore = create<SettingsUiState>((set) => ({
  activeTab: 'finance',
  isFinanceDirty: false,
  isPreferencesDirty: false,
  isSaving: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  setFinanceDirty: (isFinanceDirty) => set({ isFinanceDirty }),
  setPreferencesDirty: (isPreferencesDirty) => set({ isPreferencesDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
}))

export default useSettingsUiStore

