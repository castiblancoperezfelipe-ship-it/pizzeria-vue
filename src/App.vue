<!-- Parte de la lógica de App.vue: "setup" permite escribir el código de forma corta (Composition API) -->
<script setup>
// App.vue es el componente raíz: solo importa y muestra el menú de la pizzería
// Importa el componente Pizzeria.vue para poder usarlo como etiqueta <Pizzeria /> abajo.
import Pizzeria from './components/Pizzeria.vue'
// La siguiente etiqueta cierra la parte de la lógica.
</script>

<!-- Parte de la vista: lo que se dibuja en pantalla -->
<template>
  <!-- Muestra el componente Pizzeria (toda la página de la pizzería está dentro de él) -->
  <Pizzeria />
<!-- Cierra la vista -->
</template>
