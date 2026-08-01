import { describe, it, expect, vi } from "vitest";
import { get, post, put, del, postRaw } from "./api.js";

vi.mock("../common/axios", () => ({
  requestAxios: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { requestAxios } from "../common/axios";

describe("api.js — funciones HTTP", () => {
  it("get() debe llamar requestAxios.get con URL y params, y retornar response.data", async () => {
    requestAxios.get.mockResolvedValue({ data: [{ id: 1, name: "Test" }] });

    const result = await get("/instructors", { status: 1 });

    expect(requestAxios.get).toHaveBeenCalledWith("/instructors", {
      params: { status: 1 },
    });
    expect(result).toEqual([{ id: 1, name: "Test" }]);
  });

  it("get() sin params debe pasar objeto vacío por defecto", async () => {
    requestAxios.get.mockResolvedValue({ data: [] });

    await get("/towns");

    expect(requestAxios.get).toHaveBeenCalledWith("/towns", { params: {} });
  });

  it("post() debe llamar requestAxios.post con URL y body, y retornar response.data", async () => {
    const payload = { name: "Nuevo", code: "ABC" };
    requestAxios.post.mockResolvedValue({ data: { id: 10, ...payload } });

    const result = await post("/programs", payload);

    expect(requestAxios.post).toHaveBeenCalledWith("/programs", payload);
    expect(result).toEqual({ id: 10, name: "Nuevo", code: "ABC" });
  });

  it("put() debe llamar requestAxios.put con URL y body, y retornar response.data", async () => {
    const payload = { name: "Actualizado" };
    requestAxios.put.mockResolvedValue({ data: { id: 5, ...payload } });

    const result = await put("/instructors/5", payload);

    expect(requestAxios.put).toHaveBeenCalledWith("/instructors/5", payload);
    expect(result).toEqual({ id: 5, name: "Actualizado" });
  });

  it("del() debe llamar requestAxios.delete con la URL y retornar response.data", async () => {
    requestAxios.delete.mockResolvedValue({ data: { deleted: true } });

    const result = await del("/users/3");

    expect(requestAxios.delete).toHaveBeenCalledWith("/users/3");
    expect(result).toEqual({ deleted: true });
  });

  it("postRaw() debe retornar la respuesta completa de axios (no solo .data)", async () => {
    const fullResponse = {
      data: { months: ["01-2024"], events: {} },
      status: 200,
    };
    requestAxios.post.mockResolvedValue(fullResponse);

    const result = await postRaw("/reports/reporttemp", { fiche: 123 });

    expect(requestAxios.post).toHaveBeenCalledWith("/reports/reporttemp", {
      fiche: 123,
    });
    expect(result).toBe(fullResponse);
    expect(result).toEqual({ data: { months: ["01-2024"], events: {} }, status: 200 });
  });
});
