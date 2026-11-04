# Pizzería La Esquina · Vue.js 3

Exposición SENA — Tecnólogo ADSO · Tema 6: Frontend con Vue.js

## Cómo ejecutarlo

1. Abrir esta carpeta en VS Code (File → Open Folder).
2. Abrir la terminal (Ctrl+ñ) y ejecutar:

```
npm install
npm run dev
```

3. Abrir http://localhost:5173

## Qué muestra

- `v-for`: el menú de pizzas, los tamaños y las líneas del pedido.
- `v-model`: el selector de tamaño y el formulario para agregar sabores.
- `v-if` / `v-else`: «Tu pedido está vacío» o el detalle del pedido.
- `computed`: el total y la cantidad de pizzas del pedido.
- `@click` y `@submit.prevent`: eventos de botones y formulario.

El código está en `src/components/Pizzeria.vue`, comentado en español.
