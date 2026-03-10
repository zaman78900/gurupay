import { createContext, useContext, useReducer, useEffect } from "react";
import { LS_KEYS } from "../constants/appConstants";

const AppContext = createContext();

const initialState = {
  batches: [],
  students: [],
  payments: [],
  businessProfile: {
    name: "",
    gstin: "",
    address: "",
    phone: "",
    email: "",
  },
  settings: {
    enableGST: true,
    enableDiscounts: true,
    enableLateFees: true,
    enableWhatsApp: true,
    csvExport: true,
    compactMode: false,
  },
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_BATCHES":
      return { ...state, batches: action.payload };
    case "ADD_BATCH":
      return { ...state, batches: [...state.batches, action.payload] };
    case "UPDATE_BATCH":
      return {
        ...state,
        batches: state.batches.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case "DELETE_BATCH":
      return {
        ...state,
        batches: state.batches.filter((b) => b.id !== action.payload),
      };

    case "SET_STUDENTS":
      return { ...state, students: action.payload };
    case "ADD_STUDENT":
      return { ...state, students: [...state.students, action.payload] };
    case "UPDATE_STUDENT":
      return {
        ...state,
        students: state.students.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case "DELETE_STUDENT":
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.payload),
      };

    case "SET_PAYMENTS":
      return { ...state, payments: action.payload };
    case "ADD_PAYMENT":
      return { ...state, payments: [...state.payments, action.payload] };
    case "UNDO_PAYMENT":
      return {
        ...state,
        payments: state.payments.filter((p) => p.id !== action.payload),
      };

    case "SET_PROFILE":
      return {
        ...state,
        businessProfile: { ...state.businessProfile, ...action.payload },
      };
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

function loadFromStorage() {
  try {
    return {
      batches: JSON.parse(localStorage.getItem(LS_KEYS.BATCHES) || "[]"),
      students: JSON.parse(localStorage.getItem(LS_KEYS.STUDENTS) || "[]"),
      payments: JSON.parse(localStorage.getItem(LS_KEYS.PAYMENTS) || "[]"),
      businessProfile: JSON.parse(
        localStorage.getItem(LS_KEYS.PROFILE) ||
          JSON.stringify(initialState.businessProfile)
      ),
      settings: JSON.parse(
        localStorage.getItem(LS_KEYS.SETTINGS) ||
          JSON.stringify(initialState.settings)
      ),
    };
  } catch {
    return initialState;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadFromStorage);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.BATCHES, JSON.stringify(state.batches));
  }, [state.batches]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.STUDENTS, JSON.stringify(state.students));
  }, [state.students]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify(state.payments));
  }, [state.payments]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.PROFILE, JSON.stringify(state.businessProfile));
  }, [state.businessProfile]);
  useEffect(() => {
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(state.settings));
  }, [state.settings]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
