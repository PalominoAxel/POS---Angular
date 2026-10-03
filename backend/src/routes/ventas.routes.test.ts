import request from "supertest";
import { crearApp } from "../app";

describe("API /api/ventas", () => {
  const app = crearApp();
  let token: string;
  let adminToken: string;
  let productoBebida: any;
  let productoAbarrote: any;

  beforeAll(async () => {
    const login = await request(app).post("/api/auth/login").send({
      nombreUsuario: "cajero",
      password: "cajero123",
    });
    token = login.body.token;

    const loginAdmin = await request(app).post("/api/auth/login").send({
      nombreUsuario: "admin",
      password: "admin123",
    });
    adminToken = loginAdmin.body.token;

    const productos = await request(app).get("/api/productos").set("Authorization", `Bearer ${token}`);
    productoBebida = productos.body.find((p: any) => p.codigo === "P001");
    productoAbarrote = productos.body.find((p: any) => p.codigo === "P037");
  });

  it("rechaza login con credenciales inválidas", async () => {
    const res = await request(app).post("/api/auth/login").send({ nombreUsuario: "cajero", password: "mala" });
    expect(res.status).toBe(401);
  });

  it("rechaza una venta si no hay caja abierta", async () => {
    const res = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipoComprobante: "BOLETA",
        metodoPago: "EFECTIVO",
        cliente: { tipoDocumento: null, numeroDocumento: null },
        items: [{ productoId: productoAbarrote.id, cantidad: 1 }],
      });
    expect(res.status).toBe(409);
  });

  it("el admin abre caja", async () => {
    const res = await request(app)
      .post("/api/caja/abrir")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ montoApertura: 100 });
    expect(res.status).toBe(201);
    expect(res.body.estado).toBe("ABIERTA");
  });

  it("aplica la promo de combo bebida (-S/1.00) y descuenta stock al vender", async () => {
    const stockInicial = productoBebida.stock;

    const res = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipoComprobante: "BOLETA",
        metodoPago: "EFECTIVO",
        cliente: { tipoDocumento: null, numeroDocumento: null },
        items: [
          { productoId: productoBebida.id, cantidad: 1 },
          { productoId: productoAbarrote.id, cantidad: 1 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.descuentoAplicado).toBeCloseTo(1.0, 2);
    expect(res.body.totalPagar).toBeCloseTo(
      productoBebida.precioOferta + productoAbarrote.precioOferta - 1.0,
      2,
    );
    expect(res.body.numeroComprobante).toMatch(/^B001-\d{6}$/);

    const productoActualizado = await request(app)
      .get(`/api/productos/${productoBebida.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(productoActualizado.body.stock).toBe(stockInicial - 1);
  });

  it("rechaza un cupón inválido", async () => {
    const res = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipoComprobante: "BOLETA",
        metodoPago: "EFECTIVO",
        cliente: { tipoDocumento: null, numeroDocumento: null },
        cuponCodigo: "00000",
        items: [{ productoId: productoAbarrote.id, cantidad: 1 }],
      });
    expect(res.status).toBe(400);
  });

  it("rechaza una factura sin RUC válido", async () => {
    const res = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipoComprobante: "FACTURA",
        metodoPago: "EFECTIVO",
        cliente: { ruc: "123", razonSocial: "Empresa SAC" },
        items: [{ productoId: productoAbarrote.id, cantidad: 1 }],
      });
    expect(res.status).toBe(400);
  });

  it("rechaza un método de pago inválido", async () => {
    const res = await request(app)
      .post("/api/ventas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tipoComprobante: "BOLETA",
        metodoPago: "CRIPTO",
        cliente: { tipoDocumento: null, numeroDocumento: null },
        items: [{ productoId: productoAbarrote.id, cantidad: 1 }],
      });
    expect(res.status).toBe(400);
  });

  it("un cajero no puede acceder al historial de ventas (solo ADMIN)", async () => {
    const res = await request(app).get("/api/ventas").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("el admin cierra caja y obtiene el resumen", async () => {
    const res = await request(app)
      .post("/api/caja/cerrar")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ montoCierreDeclarado: 100 });
    expect(res.status).toBe(200);
    expect(res.body.caja.estado).toBe("CERRADA");
    expect(res.body.numeroVentas).toBeGreaterThan(0);
  });
});
