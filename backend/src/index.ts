import { crearApp } from "./app";

const PORT = process.env.PORT || 3000;
const app = crearApp();

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
