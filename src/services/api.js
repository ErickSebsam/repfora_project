import { requestAxios } from "../common/axios";

export const get = (url, params = {}, config = {}) =>
  requestAxios.get(url, { params, ...config }).then((r) => r.data);

export const post = (url, data) =>
  requestAxios.post(url, data).then((r) => r.data);

export const put = (url, data) =>
  requestAxios.put(url, data).then((r) => r.data);

export const del = (url) =>
  requestAxios.delete(url).then((r) => r.data);

export const postRaw = (url, data) =>
  requestAxios.post(url, data);
