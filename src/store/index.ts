import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import adminReducer from './adminSlice';
import navigationReducer from './navigationSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    admin: adminReducer,
    navigation: navigationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
