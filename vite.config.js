// Importa defineConfig desde Vite: ayuda a escribir la configuración (y el editor sugiere las opciones).
import { defineConfig } from 'vite'
// Importa el plugin oficial de Vue para Vite.
import vue from '@vitejs/plugin-vue'

// Configuración de Vite: le decimos que use el plugin de Vue
// para que entienda los archivos .vue
// "export default" entrega esta configuración a Vite cuando se ejecuta npm run dev o npm run build.
export default defineConfig({
  // plugins: lista de complementos; vue() activa el soporte para archivos .vue.
  plugins: [vue()],
// Cierra el objeto de configuración y la función defineConfig.
})
