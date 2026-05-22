import { createAuthSlice } from '@maill/shared';

const auth = createAuthSlice({ name: 'auth', storageKey: 'maill.user.auth' });

export const { setCredentials, logout } = auth.actions;
export const { selectToken, selectUser, selectIsAuthenticated } = auth.selectors;
export const authReducer = auth.reducer;
