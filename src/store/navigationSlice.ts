import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const APP_TABS = [
  'map',
  'dashboard',
  'shipments',
  'factories',
  'sites',
  'carriers',
  'products',
  'transport',
  'managers',
  'rzd-analytics',
  'mydata',
  'account',
  'admin',
  'logs',
] as const;

export type AppTab = (typeof APP_TABS)[number];

const STORAGE_KEY = 'barslogistics_active_tab';

export interface NavigationState {
  activeTab: AppTab;
}

function isAppTab(value: unknown): value is AppTab {
  return typeof value === 'string' && (APP_TABS as readonly string[]).includes(value);
}

function loadActiveTab(): AppTab {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isAppTab(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'map';
}

function persistActiveTab(tab: AppTab): void {
  try {
    localStorage.setItem(STORAGE_KEY, tab);
  } catch {
    /* ignore */
  }
}

const initialState: NavigationState = {
  activeTab: loadActiveTab(),
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<AppTab>) {
      state.activeTab = action.payload;
      persistActiveTab(action.payload);
    },
  },
});

export const { setActiveTab } = navigationSlice.actions;
export default navigationSlice.reducer;
