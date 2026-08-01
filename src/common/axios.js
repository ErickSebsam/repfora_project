import axios from "axios";
import { Notify } from "quasar";

const requestAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function getStoredToken() {
  try {
    const raw = sessionStorage.getItem("storeUser");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed.token2 || parsed.token || "";
  } catch {
    return "";
  }
}

requestAxios.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.token = token;
  }
  return config;
});

requestAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && !error.config?.skipErrorNotify) {
      const data = error.response.data;
      const msg =
        data?.errors?.join(", ") || data?.msg || "Error en la petición";
      Notify.create({
        color: "negative",
        message: msg,
        icon: "error",
        position: "top",
        timeout: 4500,
      });
    }
    return Promise.reject(error);
  }
);

export { requestAxios };
