import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

type Rol = "ADMIN" | "CAJERO";

const prisma = new PrismaClient();

const PRODUCTOS: [string, string, string, number, number, number, boolean][] = [
  // --- BEBIDAS ---
  ["P001", "Inca Kola 1.5L", "Bebidas", 7.5, 7.5, 25, false],
  ["P002", "Coca Cola 1.5L", "Bebidas", 7.8, 7.8, 20, false],
  ["P003", "Pack (2 Coca Cola Sin Azúcar Lata 350ml)", "Bebidas", 14.99, 10.9, 20, false],
  ["P004", "Pack (2 Sprite Lata 350ml)", "Bebidas", 14.99, 10.9, 18, false],
  ["P005", "Pack 2 Gaseosa Coca Cola 600ml", "Bebidas", 7.38, 6.0, 25, false],
  ["P006", "Pack 2 Gaseosa Coca Cola Zero 600ml", "Bebidas", 7.38, 6.0, 30, false],
  ["P007", "Pack 2 Gaseosa Inca Kola 600ml", "Bebidas", 7.38, 6.0, 22, false],
  ["P008", "Pack 2 Gaseosa Inca Kola Zero 600ml", "Bebidas", 7.38, 6.0, 20, false],
  ["P009", "Pack (1 Hey Fit Piña Colada 350ml)", "Bebidas", 5.6, 5.6, 15, false],
  ["P010", "Sporade Cítrico 500ml", "Bebidas", 3.0, 3.0, 30, false],
  ["P011", "Red Bull 250ml", "Bebidas", 8.5, 8.5, 40, false],
  ["P012", "Cerveza Pilsen Callao 630ml", "Bebidas", 7.0, 7.0, 35, false],
  // --- SNACKS ---
  ["P013", "Papas Lays 160g", "Snacks", 5.2, 5.2, 30, false],
  ["P014", "Doritos Queso 140g", "Snacks", 4.8, 4.8, 15, false],
  ["P015", "Cheetos Queso 120g", "Snacks", 4.2, 4.2, 20, false],
  ["P016", "Cuates Picante 80g", "Snacks", 2.0, 2.0, 45, false],
  ["P017", "Cheese Tris 150g", "Snacks", 4.0, 4.0, 25, false],
  ["P018", "Pringles Original 124g", "Snacks", 10.5, 10.5, 12, false],
  ["P019", "Galletas Casino Menta", "Snacks", 2.5, 2.5, 40, false],
  ["P020", "Galletas Oreo 126g", "Snacks", 3.2, 3.2, 35, false],
  ["P021", "Chocolate Sublime 30g", "Snacks", 2.2, 2.2, 50, false],
  ["P022", "Chocolate Triángulo 30g", "Snacks", 2.2, 2.2, 48, false],
  ["P023", "Chocman 33g", "Snacks", 1.8, 1.8, 60, false],
  ["P024", "Maní Moto Salado 90g", "Snacks", 3.0, 3.0, 30, false],
  // --- COMIDA RÁPIDA ---
  ["P025", "Hamburguesa Prime Chicken", "Comida Rápida", 12.9, 12.9, 15, true],
  ["P026", "Hamburguesa Prime de Res", "Comida Rápida", 13.9, 13.9, 15, true],
  ["P027", "Hamburguesa Prime Black Brangus", "Comida Rápida", 12.9, 12.9, 10, true],
  ["P028", "Pack (1 Coca Cola 1L + 2 Hamburguesas Doble)", "Comida Rápida", 19.0, 15.9, 12, false],
  ["P029", "Pack (2 Hamburguesas a lo Pobre + 1 Coca Cola 1L)", "Comida Rápida", 21.49, 14.9, 10, false],
  ["P030", "Empanada de Carne", "Comida Rápida", 4.5, 4.5, 10, false],
  ["P031", "Sandwich de Pollo", "Comida Rápida", 5.5, 5.5, 12, false],
  ["P032", "Hot Dog Tambo Clásico", "Comida Rápida", 6.0, 6.0, 20, false],
  ["P033", "Hot Dog Tambo Gigante", "Comida Rápida", 8.5, 8.5, 15, false],
  ["P034", "Pizza Personal Pepperoni", "Comida Rápida", 9.9, 9.9, 8, false],
  ["P035", "Papa Rellena", "Comida Rápida", 5.0, 5.0, 10, false],
  ["P036", "Donut Glaseada", "Comida Rápida", 3.5, 3.5, 25, false],
  // --- ABARROTES ---
  ["P037", "Arroz Costeño 1kg", "Abarrotes", 4.9, 4.9, 40, false],
  ["P038", "Aceite Primor 1L", "Abarrotes", 9.5, 9.5, 18, false],
  ["P039", "Atún Florida Trozos 140g", "Abarrotes", 6.2, 6.2, 25, false],
  ["P040", "Fideos Don Vittorio 500g", "Abarrotes", 3.2, 3.2, 50, false],
  ["P041", "Leche Gloria Azul 395g", "Abarrotes", 4.2, 4.2, 60, false],
  ["P042", "Sugar Blond Azúcar 1kg", "Abarrotes", 4.5, 4.5, 35, false],
  ["P043", "Avena 3 Ositos 400g", "Abarrotes", 3.8, 3.8, 28, false],
  ["P044", "Café Nescafé Tradición 50g", "Abarrotes", 7.5, 7.5, 22, false],
  ["P045", "Mayonesa Alacena 200g", "Abarrotes", 4.8, 4.8, 30, false],
  ["P046", "Ketchup Alacena 200g", "Abarrotes", 3.9, 3.9, 30, false],
  ["P047", "Salsa de Tomate Pomarola", "Abarrotes", 2.8, 2.8, 40, false],
  ["P048", "Sal Marina Lobos 1kg", "Abarrotes", 2.0, 2.0, 50, false],
];

const CUPONES = [
  { codigo: "18892", montoDescuento: 5.0 },
  { codigo: "18893", montoDescuento: 10.0 },
  { codigo: "18894", montoDescuento: 15.0 },
];

async function sembrarUsuarios() {
  const usuarios = [
    { nombreUsuario: "admin", password: "admin123", nombre: "Administrador TAMBO", rol: "ADMIN" as Rol },
    { nombreUsuario: "cajero", password: "cajero123", nombre: "Cajero TAMBO", rol: "CAJERO" as Rol },
  ];

  for (const u of usuarios) {
    const existente = await prisma.usuario.findUnique({ where: { nombreUsuario: u.nombreUsuario } });
    if (existente) continue;
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.usuario.create({
      data: { nombreUsuario: u.nombreUsuario, passwordHash, nombre: u.nombre, rol: u.rol },
    });
  }

  console.log("Usuarios por defecto: admin/admin123 (ADMIN), cajero/cajero123 (CAJERO) — cambiar en producción.");
}

async function sembrarCupones() {
  for (const c of CUPONES) {
    await prisma.cupon.upsert({
      where: { codigo: c.codigo },
      create: c,
      update: {},
    });
  }
}

async function sembrarProductos() {
  for (const [codigo, nombre, categoria, precioRegular, precioOferta, stock, esPrime] of PRODUCTOS) {
    await prisma.producto.upsert({
      where: { codigo },
      create: {
        codigo,
        nombre,
        categoria,
        precioRegular,
        precioOferta,
        stock,
        esPrime,
        imagenUrl: `img/productos/${codigo.toLowerCase()}.jpg`,
      },
      update: {},
    });
  }
}

async function main() {
  await sembrarUsuarios();
  await sembrarCupones();
  await sembrarProductos();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
