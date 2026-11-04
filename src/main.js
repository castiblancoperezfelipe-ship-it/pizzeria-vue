// Punto de arranque: crea la app de Vue con el componente App
// y la monta dentro del <div id="app"> de index.html
// Importa la función createApp desde Vue: es la que crea la aplicación.
import { createApp } from 'vue'
// Importa los estilos globales (colores, fuentes y fondo de toda la página).
import './style.css'
// Importa el componente raíz App.vue, que es el "primer bloque" de la aplicación.
import App from './App.vue'

// createApp(App) crea la aplicación usando App.vue, y .mount('#app') la dibuja dentro del <div id="app"> del index.html.
createApp(App).mount('#app')
