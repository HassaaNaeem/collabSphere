import { createContext, useContext, useReducer, useEffect } from "react";
import { api, clearToken } from "../services/api";

/* ------------------------------------------------------------------
   Auth state lives in a reducer (useReducer + Context). login/signup now
   call the Express backend via the api service, store the returned JWT,
   and keep the user in localStorage so a refresh stays signed in.
   ------------------------------------------------------------------ */

const AuthContext = createContext(null);
const STORAGE_KEY = "cs-auth";

const init = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null };
  } catch {
    return { user: null };
  }
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":
    case "SIGNUP":
      return { ...state, user: action.payload };
    case "UPDATE_PROFILE":
      return { ...state, user: { ...state.user, ...action.payload } };
    case "LOGOUT":
      return { ...state, user: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Real auth: these call the backend and may throw (caught by the form).
  const login = async ({ role, email, password }) => {
    const user = await api.login({ role, email, password });
    dispatch({ type: "LOGIN", payload: user });
    return user;
  };

  const signup = async (payload) => {
    const user = await api.signup(payload);
    dispatch({ type: "SIGNUP", payload: user });
    return user;
  };

  const logout = () => {
    clearToken();
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{ user: state.user, login, signup, logout, dispatch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
