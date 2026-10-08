import request from "supertest";
import { crearApp } from "../app";
import { prisma } from "../lib/prisma";

describe("API /api/categorias", () => {
  const app = crearApp();
  let adminToken: string;
  let cajeroToken: string;

  beforeAll(async () => {
    // Limpia restos de una corrida anterior contra la misma BD de test antes de crearlos de nuevo.
    await prisma.itemVenta.deleteMany({ where: { nombreProducto: "Paleta de fresa" } });
    await prisma.producto.deleteMany({ where: { nombre: "Paleta de fresa" } });
    await prisma.categoria.deleteMany({ where: { nombre: { in: ["Helados", "Otra"] } } });

    const admin = await request(app).post("/api/auth/login").send({
      nombreUsuario: "admin",
      password: "admin123",
    });
    adminToken = admin.body.token;

    const cajero = await request(app).post("/api/auth/login").send({
      nombreUsuario: "cajero",
      password: "cajero123",
    });
    cajeroToken = cajero.body.token;
  });

  afterAll(async () => {
    await prisma.itemVenta.deleteMany({ where: { nombreProducto: "Paleta de fresa" } });
    await prisma.producto.deleteMany({ where: { nombre: "Paleta de fresa" } });
    await prisma.categoria.deleteMany({ where: { nombre: { in: ["Helados", "Otra"] } } });
  });

  it("lista las categorías existentes", async () => {
    const res = await request(app).get("/api/categorias").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("crea una categoría nueva como ADMIN", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nombre: "Helados" });
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe("Helados");
  });

  it("rechaza una categoría duplicada", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ nombre: "Helados" });
    expect(res.status).toBe(400);
  });

  it("rechaza crear categorías si no es ADMIN", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .set("Authorization", `Bearer ${cajeroToken}`)
      .send({ nombre: "Otra" });
    expect(res.status).toBe(403);
  });

  it("permite crear un producto usando la categoría nueva", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Paleta de fresa",
        categoria: "Helados",
        precioRegular: 3.5,
        precioOferta: 3.5,
        stock: 20,
      });
    expect(res.status).toBe(201);
    expect(res.body.categoria).toBe("Helados");
  });

  it("rechaza crear un producto con una categoría inexistente", async () => {
    const res = await request(app)
      .post("/api/productos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Producto fantasma",
        categoria: "NoExiste",
        precioRegular: 3.5,
        precioOferta: 3.5,
        stock: 20,
      });
    expect(res.status).toBe(400);
  });
});
