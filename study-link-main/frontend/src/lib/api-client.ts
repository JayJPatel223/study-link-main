import { createAuthClient } from "better-auth/react";
import axios from "axios";
import { API_BASE_URL } from "./env";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
