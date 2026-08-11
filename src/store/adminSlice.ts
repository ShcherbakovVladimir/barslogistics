import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AdminSection =
  | 'overview'
  | 'carriers'
  | 'telemetry'
  | 'telegram'
  | 'mail'
  | 'cloud'
  | 'backups'
  | 'users'
  | 'sites'
  | 'data'
  | 'geocoding'
  | 'support'
  | 'api';

const STORAGE_KEY = 'barslogistics_admin';
const ALL_SECTIONS: AdminSection[] = [
  'overview', 'carriers', 'telemetry', 'telegram', 'mail', 'cloud', 'backups',
  'users', 'sites', 'data', 'geocoding', 'support', 'api',
];

export interface AdminState {
  section: AdminSection;
  scrollBySection: Partial<Record<AdminSection, number>>;
}

function isAdminSection(value: unknown): value is AdminSection {
  return typeof value === 'string' && ALL_SECTIONS.includes(value as AdminSection);
}

function loadAdminState(): AdminState {
  const fallback: AdminState = { section: 'overview', scrollBySection: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AdminState>;
    const scrollBySection: Partial<Record<AdminSection, number>> = {};
    if (parsed.scrollBySection && typeof parsed.scrollBySection === 'object') {
      for (const [key, val] of Object.entries(parsed.scrollBySection)) {
        if (isAdminSection(key) && typeof val === 'number' && Number.isFinite(val)) {
          scrollBySection[key] = Math.max(0, val);
        }
      }
    }
    return {
      section: isAdminSection(parsed.section) ? parsed.section : 'overview',
      scrollBySection,
    };
  } catch {
    return fallback;
  }
}

function persistAdminState(state: AdminState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const initialState: AdminState = loadAdminState();

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdminSection(state, action: PayloadAction<AdminSection>) {
      state.section = action.payload;
      persistAdminState(state);
    },
    setAdminScroll(
      state,
      action: PayloadAction<{ section: AdminSection; scrollTop: number }>,
    ) {
      state.scrollBySection[action.payload.section] = Math.max(0, action.payload.scrollTop);
      persistAdminState(state);
    },
  },
});

export const { setAdminSection, setAdminScroll } = adminSlice.actions;
export default adminSlice.reducer;
