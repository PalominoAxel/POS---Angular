import request from "supertest";
import { crearApp } from "../app";

describe("API /api/productos", () => {
  const app = crearApp();
  let token: string;

  beforeAll(async () => {
    const login = await request(app).post("/api/auth/login").send({
      nombreUsuario: "admin",
      password: "admin123",
    });
    token = login.body.token;
  });

  it("rechaza peticiones sin token", async () => {
    const res = await request(app).get("/api/productos");
    expect(res.status).toBe(401);
  });

  it("lista los productos existentes", async () => {
    const res = await request(app).get("/api/productos").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("crea un producto nuevo", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "Producto de prueba",
        categoria: "Snacks",
        precioRegular: 5,
        precioOferta: 4,
        stock: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.nombre).toBe("Producto de prueba");
  });

  it("rechaza un producto sin datos requeridos", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Incompleto" });
    expect(res.status).toBe(400);
  });

  it("devuelve 404 para un producto inexistente", async () => {
    const res = await request(app).get("/api/productos/999999").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
