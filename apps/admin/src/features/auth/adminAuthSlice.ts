import { createAuthSlice } from '@maill/shared';

const adminAuth = createAuthSlice({ name: 'adminAuth', storageKey: 'maill.admin.auth' });

export const { setCredentials, logout } = adminAuth.actions;
export const { selectToken, selectUser, selectIsAuthenticated } = adminAuth.selectors;
export const adminAuthReducer = adminAuth.reducer;
