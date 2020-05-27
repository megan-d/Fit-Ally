import {
  REGISTER_SUCCESS,
  REGISTER_SUCCESS_DEMO,
  REGISTER_FAILURE,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOAD_USER_SUCCESS,
  LOAD_USER_FAILURE,
  LOGOUT,
  USER_DELETED,
  LOAD_USER_SUCCESS_DEMO,
} from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: null,
  user: null,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        isAuthenticated: true,
      };
    case REGISTER_SUCCESS_DEMO:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
        isAuthenticated: true,
      };
    case LOAD_USER_SUCCESS:
    case LOAD_USER_SUCCESS_DEMO:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
      };
    case LOAD_USER_FAILURE:
    case LOGIN_FAILURE:
    case REGISTER_FAILURE:
    case LOGOUT:
    case USER_DELETED:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}
