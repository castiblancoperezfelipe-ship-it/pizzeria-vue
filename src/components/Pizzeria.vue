<!--
  Pizzeria.vue — Componente de un solo archivo (Single File Component)
  Tiene 3 partes:
    1. <script setup>  → la LÓGICA (datos y funciones en JavaScript)
    2. <template>      → la VISTA (el HTML que se ve en pantalla)
    3. <style scoped>  → los ESTILOS (solo afectan a este componente)
-->

<script setup>
// ref() vuelve "reactiva" una variable: cuando cambia, Vue actualiza la pantalla sola.
// computed() crea un valor que se calcula a partir de otros y se recalcula solo.
// Traemos (importamos) las funciones ref y computed desde la librería Vue para poder usarlas aquí.
// onMounted() ejecuta código apenas el componente aparece en pantalla (lo usamos para pedir las pizzas a la API).
import { ref, computed, onMounted } from 'vue'

// ---------------------------------------------------------------
// DATOS: el menú de pizzas (los "productos" de la pizzería)
// Cada pizza tiene un precio distinto para cada tamaño.
// ---------------------------------------------------------------
// La lista de pizzas empieza VACÍA: los datos ya no están escritos aquí, ahora vienen de la API (db.json).
// Sigue dentro de ref([]) para que sea reactiva: cuando lleguen las pizzas de la API, el menú se dibuja solo.
const pizzas = ref([])

// Dirección de la API local que crea json-server (se enciende con: npm run api).
// Usa el puerto 3001 porque en este computador otro programa ya ocupa el 3000.
const URL_API = 'http://localhost:3001/pizzas'

// Mensaje de error de la API; si está vacío no se muestra nada (se usa con v-if en el template).
const errorApi = ref('')

// Los tres tamaños disponibles (se recorren con v-for en el selector)
// Esta lista NO usa ref porque nunca cambia: siempre son los mismos tres tamaños.
const tamanos = [
  // valor: lo que se guarda en tamanoElegido; etiqueta y porciones: lo que se lee en pantalla.
  { valor: 'personal', etiqueta: 'Personal', porciones: '4 porciones' },
  // El tamaño mediano.
  { valor: 'mediana', etiqueta: 'Mediana', porciones: '6 porciones' },
  // El tamaño familiar.
  { valor: 'familiar', etiqueta: 'Familiar', porciones: '8 porciones' }
// Cierra la lista de tamaños.
]

// Tamaño elegido. Está conectado con v-model a los botones de tamaño:
// si el usuario elige otro tamaño, esta variable cambia y TODOS los precios del menú se actualizan.
// Empieza en 'mediana', por eso al abrir la página ya aparece marcado ese tamaño.
const tamanoElegido = ref('mediana')

// El pedido empieza vacío (así se ve el v-if de "Tu pedido está vacío")
// Es una lista reactiva: cada pizza que el cliente agrega se guarda aquí.
const pedido = ref([])
// "let" (y no "const") porque este número va a ir aumentando: 1, 2, 3...
let siguienteId = 1 // contador para darle un id único a cada pizza del pedido

// Datos del formulario para agregar un sabor nuevo (conectados con v-model)
// Lo que el usuario escribe en "Nombre del sabor" (empieza vacío).
const nuevoNombre = ref('')
// Lo que el usuario escribe en "Ingredientes" (empieza vacío).
const nuevosIngredientes = ref('')
// Precio personal del sabor nuevo; null significa "todavía no hay número".
const nuevoPersonal = ref(null)
// Precio mediano del sabor nuevo.
const nuevoMediana = ref(null)
// Precio familiar del sabor nuevo.
const nuevoFamiliar = ref(null)
// Mensaje de error del formulario; si está vacío, el mensaje no se muestra (v-if).
const error = ref('')

// ---------------------------------------------------------------
// PAGO: la comanda pasa por 3 etapas
//   'pedido' → se ve la lista y el botón «Pagar»
//   'pago'   → se llena el formulario de pago
//   'listo'  → se muestra el recibo del pedido pagado
// ---------------------------------------------------------------
// Guarda en qué etapa está la comanda; empieza mostrando el pedido.
const etapa = ref('pedido')
// Nombre del cliente que escribe en el formulario de pago.
const clienteNombre = ref('')
// Dirección de entrega que escribe el cliente.
const clienteDireccion = ref('')
// Método de pago elegido; por defecto empieza en efectivo.
const metodoPago = ref('efectivo') // 'efectivo' | 'tarjeta' | 'nequi'
// Valor del billete con el que va a pagar; sirve para calcular las vueltas.
const pagaCon = ref(null) // billete con el que paga (solo en efectivo)
// Mensaje de error del formulario de pago (vacío = no hay error).
const errorPago = ref('')
// Aquí se guarda el recibo cuando se confirma el pago; null = todavía no hay recibo.
const recibo = ref(null) // copia del pedido ya pagado, para mostrar el recibo

// Lista de métodos de pago que se muestran como botones con v-for (no cambia, por eso no usa ref).
const metodos = [
  // Opción de pagar en efectivo.
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  // Opción de pagar con tarjeta.
  { valor: 'tarjeta', etiqueta: 'Tarjeta (datáfono)' },
  // Opción de pagar por Nequi.
  { valor: 'nequi', etiqueta: 'Nequi' }
// Cierra la lista de métodos de pago.
]

// ---------------------------------------------------------------
// COMPUTED: valores que se calculan solos
// ---------------------------------------------------------------

// Total del pedido: suma los precios de todas las pizzas del pedido.
// Cada vez que se agrega o se quita una pizza, el total se recalcula automáticamente.
// computed recibe una función; Vue la vuelve a ejecutar sola cuando cambia "pedido".
const total = computed(() => {
  // reduce recorre el pedido y va sumando: empieza en 0 y a "suma" le agrega el precio de cada pizza.
  return pedido.value.reduce((suma, item) => suma + item.precio, 0)
// Cierra la función y el computed.
})

// Cantidad de pizzas en el pedido
// .length dice cuántos elementos tiene la lista del pedido.
const cantidad = computed(() => pedido.value.length)

// Vueltas que hay que devolver cuando se paga en efectivo
// Resta: lo que entrega el cliente menos el total. "|| 0" usa 0 si todavía no escribió nada.
const cambio = computed(() => (pagaCon.value || 0) - total.value)

// ---------------------------------------------------------------
// FUNCIONES
// Nota: en el <script> se usa .value para leer o cambiar un ref.
// En el <template> NO se escribe .value, Vue lo hace por nosotros.
// ---------------------------------------------------------------

// Convierte un número a pesos colombianos. Ejemplo: 28000 → $ 28.000
// Recibe un número (valor) y devuelve un texto con formato de dinero.
function formatoPesos(valor) {
  // Intl.NumberFormat es una herramienta del navegador para dar formato a números; 'es-CO' = español de Colombia.
  return new Intl.NumberFormat('es-CO', {
    // style: 'currency' indica que el número es dinero (le pone el signo $).
    style: 'currency',
    // currency: 'COP' indica que la moneda es el peso colombiano.
    currency: 'COP',
    // maximumFractionDigits: 0 quita los decimales (no usamos centavos).
    maximumFractionDigits: 0
  // .format(valor) aplica todo lo anterior al número que recibimos.
  }).format(valor)
// Cierra la función formatoPesos.
}

// Agrega una pizza al pedido con el tamaño que esté elegido en ese momento
// Recibe la pizza en la que el usuario hizo clic en «Agregar».
function agregarAlPedido(pizza) {
  // push agrega un elemento nuevo al final de la lista del pedido.
  pedido.value.push({
    // siguienteId++ usa el número actual y luego le suma 1 para la próxima pizza.
    idLinea: siguienteId++, // identificador único para el :key del v-for
    // Copiamos el nombre de la pizza.
    nombre: pizza.nombre,
    // Guardamos el tamaño que está elegido en este momento.
    tamano: tamanoElegido.value,
    // Buscamos el precio de ese tamaño dentro de la pizza (por ejemplo precios['mediana']).
    precio: pizza.precios[tamanoElegido.value]
  // Cierra el objeto y el push.
  })
// Cierra la función agregarAlPedido.
}

// Quita una pizza del pedido usando su identificador
// Recibe el idLinea de la pizza que se quiere quitar.
function quitarDelPedido(idLinea) {
  // filter crea una lista nueva SOLO con las pizzas cuyo id es distinto: así la elegida desaparece.
  pedido.value = pedido.value.filter((item) => item.idLinea !== idLinea)
// Cierra la función quitarDelPedido.
}

// Paso 1: el botón «Pagar» abre el formulario de pago
// Función que se ejecuta al hacer clic en «Pagar».
function irAPagar() {
  // Si el pedido está vacío no hay nada que pagar, entonces "return" sale de la función sin hacer nada.
  if (pedido.value.length === 0) return
  // Borramos cualquier error viejo del formulario de pago.
  errorPago.value = ''
  // Cambiamos la etapa a 'pago': el v-else-if del template muestra el formulario de pago.
  etapa.value = 'pago'
// Cierra la función irAPagar.
}

// Volver a la lista del pedido sin pagar (por si quiere agregar o quitar algo)
// Función del botón «Volver».
function volverAlPedido() {
  // Borramos el mensaje de error.
  errorPago.value = ''
  // Regresamos a la etapa 'pedido' para ver otra vez la lista.
  etapa.value = 'pedido'
// Cierra la función volverAlPedido.
}

// Paso 2: validar los datos y "cobrar" (es una simulación, no se cobra dinero real)
// Función que se ejecuta al enviar el formulario de pago («Confirmar pago»).
function confirmarPago() {
  // trim() quita los espacios; "!" significa "no". Si falta el nombre o la dirección...
  if (!clienteNombre.value.trim() || !clienteDireccion.value.trim()) {
    // ...mostramos este mensaje de error...
    errorPago.value = 'Escribe tu nombre y la dirección de entrega.'
    // ...y salimos de la función sin pagar.
    return
  // Cierra el primer if.
  }
  // Si paga en efectivo y no escribió el valor, o el valor es menor que el total...
  if (metodoPago.value === 'efectivo' && (!pagaCon.value || pagaCon.value < total.value)) {
    // ...mostramos este mensaje de error...
    errorPago.value = 'El valor con el que pagas debe ser igual o mayor al total.'
    // ...y salimos de la función sin pagar.
    return
  // Cierra el segundo if.
  }

  // Guardamos una copia del pedido para el recibo, antes de vaciarlo
  // Creamos el objeto del recibo con todos los datos que se van a mostrar.
  recibo.value = {
    // Math.random() da un número al azar; con esta cuenta queda un número de pedido entre 1000 y 9999.
    numero: Math.floor(1000 + Math.random() * 9000),
    // Nombre del cliente sin espacios sobrantes.
    nombre: clienteNombre.value.trim(),
    // Dirección sin espacios sobrantes.
    direccion: clienteDireccion.value.trim(),
    // find busca en la lista de métodos el que está elegido y tomamos su etiqueta (ej: 'Nequi').
    metodo: metodos.find((m) => m.valor === metodoPago.value).etiqueta,
    // [...pedido.value] hace una COPIA de la lista, para no perderla cuando vaciemos el pedido.
    lineas: [...pedido.value],
    // Guardamos el total que se pagó.
    total: total.value,
    // Si pagó en efectivo guardamos las vueltas; con otro método las vueltas son 0.
    cambio: metodoPago.value === 'efectivo' ? cambio.value : 0
  // Cierra el objeto del recibo.
  }

  // Al dejar la lista vacía, el total vuelve a 0 y el horno se queda sin pizza.
  pedido.value = [] // el pedido queda vacío (y la pizza sale del horno)
  // Borramos el mensaje de error.
  errorPago.value = ''
  // Pasamos a la etapa 'listo': ahora el template muestra el recibo.
  etapa.value = 'listo'
// Cierra la función confirmarPago.
}

// Paso 3: empezar un pedido nuevo desde cero
// Función del botón «Hacer otro pedido»: deja todo como al principio.
function nuevoPedido() {
  // Borramos el recibo.
  recibo.value = null
  // Vaciamos el nombre del cliente.
  clienteNombre.value = ''
  // Vaciamos la dirección.
  clienteDireccion.value = ''
  // El método de pago vuelve a efectivo.
  metodoPago.value = 'efectivo'
  // Borramos el valor con el que pagaba.
  pagaCon.value = null
  // Volvemos a la etapa inicial: se ve otra vez "Tu pedido".
  etapa.value = 'pedido'
// Cierra la función nuevoPedido.
}

// ---------------------------------------------------------------
// API: traer (GET) y enviar (POST) pizzas con fetch
// ---------------------------------------------------------------

// Pide las pizzas a la API. "async" permite usar "await" para esperar la respuesta sin congelar la página.
async function cargarPizzas() {
  // try: intentamos hacer la petición; si algo falla (la API está apagada), saltamos al catch.
  try {
    // fetch hace una petición GET a la API y "await" espera a que responda.
    const respuesta = await fetch(URL_API)
    // respuesta.ok es true si el servidor respondió bien (códigos 200 a 299); si no, lanzamos un error.
    if (!respuesta.ok) throw new Error('La API respondió con error ' + respuesta.status)
    // .json() convierte la respuesta (texto) en una lista de JavaScript, y la guardamos en pizzas: el menú se dibuja solo.
    pizzas.value = await respuesta.json()
    // Si todo salió bien, borramos cualquier mensaje de error anterior.
    errorApi.value = ''
  // catch: aquí llegamos si no se pudo conectar con la API.
  } catch (e) {
    // Guardamos el mensaje; el v-if del template lo muestra en pantalla.
    errorApi.value = 'No se pudo conectar con la API. ¿Ejecutaste npm run api?'
  // Cierra el try/catch.
  }
// Cierra la función cargarPizzas.
}

// onMounted ejecuta cargarPizzas() una sola vez, apenas el componente aparece en pantalla.
onMounted(cargarPizzas)

// Agrega un sabor nuevo al menú con los datos del formulario
// Se ejecuta al enviar el formulario «Agregar un sabor al menú».
// Ahora es "async" porque tiene que esperar la respuesta de la API antes de mostrar la pizza.
async function agregarSabor() {
  // Validación sencilla: todos los campos son obligatorios
  // Si el nombre está vacío o falta alguno de los tres precios...
  if (!nuevoNombre.value.trim() || !nuevoPersonal.value || !nuevoMediana.value || !nuevoFamiliar.value) {
    // ...guardamos el mensaje de error (el v-if del template lo muestra en pantalla)...
    error.value = 'Escribe el nombre del sabor y sus tres precios.'
    // ...y salimos de la función sin agregar nada.
    return
  // Cierra el if de la validación.
  }

  // Armamos la pizza nueva SIN id: json-server le asigna el id automáticamente al guardarla.
  const nuevaPizza = {
    // Nombre escrito por el usuario, sin espacios sobrantes.
    nombre: nuevoNombre.value.trim(),
    // Si no escribió ingredientes, se usa el texto 'Receta de la casa'.
    ingredientes: nuevosIngredientes.value.trim() || 'Receta de la casa',
    // Abre el objeto con los tres precios.
    precios: {
      // Precio personal escrito en el formulario.
      personal: nuevoPersonal.value,
      // Precio mediano escrito en el formulario.
      mediana: nuevoMediana.value,
      // Precio familiar escrito en el formulario.
      familiar: nuevoFamiliar.value
    // Cierra el objeto de precios.
    }
  // Cierra el objeto de la pizza nueva.
  }

  // try: intentamos guardar la pizza en la API; si falla, saltamos al catch.
  try {
    // fetch con method 'POST' ENVÍA datos a la API para que los guarde en db.json.
    const respuesta = await fetch(URL_API, {
      // POST significa "crear un registro nuevo".
      method: 'POST',
      // Le avisamos a la API que los datos van en formato JSON.
      headers: { 'Content-Type': 'application/json' },
      // JSON.stringify convierte el objeto de JavaScript en texto JSON para poder enviarlo.
      body: JSON.stringify(nuevaPizza)
    // Cierra las opciones y el fetch.
    })
    // Si la API no respondió bien, lanzamos un error para ir al catch.
    if (!respuesta.ok) throw new Error('La API respondió con error ' + respuesta.status)
    // La API nos devuelve la pizza ya guardada (con el id que le asignó).
    const pizzaGuardada = await respuesta.json()
    // push agrega la pizza guardada al final del menú; como pizzas es un ref, la pantalla se actualiza sola.
    pizzas.value.push(pizzaGuardada)
  // catch: aquí llegamos si no se pudo guardar (por ejemplo, la API está apagada).
  } catch (e) {
    // Mostramos el error en el formulario y NO limpiamos los campos, para que el usuario no pierda lo escrito.
    error.value = 'No se pudo guardar el sabor. ¿Ejecutaste npm run api?'
    // Salimos de la función.
    return
  // Cierra el try/catch.
  }

  // Limpiar el formulario: como está enlazado con v-model, los campos se vacían solos
  // Vacía el campo del nombre.
  nuevoNombre.value = ''
  // Vacía el campo de ingredientes.
  nuevosIngredientes.value = ''
  // Vacía el precio personal.
  nuevoPersonal.value = null
  // Vacía el precio mediano.
  nuevoMediana.value = null
  // Vacía el precio familiar.
  nuevoFamiliar.value = null
  // Quita el mensaje de error, porque ya se agregó bien.
  error.value = ''
// Cierra la función agregarSabor.
}
</script>

<template>
  <div class="pagina">
    <!-- ENCABEZADO: el nombre queda iluminado por el horno, que está a la derecha -->
    <header class="encabezado">
      <h1>Pizzería La Esquina</h1>
      <p>Horno de leña en la esquina del barrio. Elige el tamaño, arma tu pedido y mira cómo cambia el total.</p>
    </header>

    <main class="contenido">
      <section class="menu">
        <!--
          SELECTOR DE TAMAÑO
          v-for recorre la lista de tamaños y crea un botón por cada uno.
          v-model conecta el botón elegido con la variable tamanoElegido.
        -->
        <fieldset class="tamanos">
          <legend>Tamaño</legend>
          <!--
            Esta etiqueta <label> se repite 3 veces:
            v-for="t in tamanos" crea un label por cada tamaño; en cada vuelta "t" es un tamaño distinto.
            :key="t.valor" le da a cada label un nombre único ('personal', 'mediana', 'familiar') para que Vue no los confunda.
            :class agrega dos clases: 'tamano--personal' (o mediana/familiar) para el tamaño del dibujo,
            y 'activo' SOLO si este tamaño es el que está elegido (tamanoElegido === t.valor).
          -->
          <label
            v-for="t in tamanos"
            :key="t.valor"
            class="tamano"
            :class="['tamano--' + t.valor, { activo: tamanoElegido === t.valor }]"
          >
            <!-- :value="t.valor" es el valor de este botón; v-model="tamanoElegido" guarda ese valor en la variable al elegirlo (y lo marca si ya está elegido) -->
            <input type="radio" name="tamano" :value="t.valor" v-model="tamanoElegido" />
            <!-- La pizza descansa sobre una tabla de servir de madera -->
            <span class="circulo" aria-hidden="true"></span>
            <span class="tamano-texto">
              <!-- {{ t.etiqueta }} escribe en pantalla el nombre del tamaño (ej: "Mediana") -->
              <strong>{{ t.etiqueta }}</strong>
              <!-- {{ t.porciones }} escribe cuántas porciones trae (ej: "6 porciones") -->
              <small>{{ t.porciones }}</small>
            </span>
          </label>
        </fieldset>

        <!--
          MENÚ DE PIZZAS: una tabla de madera con los sabores marcados a fuego
          v-for repite una fila por cada pizza de la lista.
          :key le da a Vue un identificador único para cada fila.
        -->
        <!-- v-if="errorApi": este aviso solo aparece si no se pudo conectar con la API; {{ errorApi }} escribe el mensaje -->
        <p v-if="errorApi" class="error">{{ errorApi }}</p>
        <ul class="lista-pizzas">
          <!-- v-for="pizza in pizzas" crea un <li> por cada pizza del menú; :key="pizza.id" usa el id de la pizza como identificador único -->
          <li v-for="pizza in pizzas" :key="pizza.id" class="pizza">
            <div class="pizza-info">
              <!-- {{ pizza.nombre }} muestra el nombre de la pizza de esta fila -->
              <h2>{{ pizza.nombre }}</h2>
              <!-- {{ pizza.ingredientes }} muestra sus ingredientes -->
              <p>{{ pizza.ingredientes }}</p>
              <!-- Las tres {{ }} de abajo llaman a formatoPesos() para mostrar cada precio como dinero ($ 28.000) -->
              <p class="otros-precios">
                Personal {{ formatoPesos(pizza.precios.personal) }} /
                Mediana {{ formatoPesos(pizza.precios.mediana) }} /
                Familiar {{ formatoPesos(pizza.precios.familiar) }}
              </p>
            </div>
            <div class="pizza-accion">
              <!-- El precio grande depende del tamaño elegido con v-model -->
              <!-- {{ }} busca el precio del tamaño elegido (pizza.precios[tamanoElegido]) y lo muestra en pesos; cambia solo al elegir otro tamaño -->
              <span class="precio">{{ formatoPesos(pizza.precios[tamanoElegido]) }}</span>
              <!-- @click ejecuta la función cuando se hace clic en el botón -->
              <!-- @click="agregarAlPedido(pizza)": al hacer clic, agrega ESTA pizza al pedido; {{ tamanoElegido }} escribe el tamaño en el botón -->
              <button type="button" class="boton" @click="agregarAlPedido(pizza)">
                Agregar {{ tamanoElegido }}
              </button>
            </div>
          </li>
        </ul>

        <!--
          FORMULARIO PARA AGREGAR UN SABOR: una losa de carbón
          @submit.prevent ejecuta agregarSabor() y evita que la página se recargue.
          v-model enlaza cada campo con su variable (en los dos sentidos).
          v-model.number convierte lo escrito en número.
        -->
        <!-- @submit.prevent="agregarSabor": al enviar el formulario llama a agregarSabor(); ".prevent" evita que la página se recargue -->
        <form class="formulario" @submit.prevent="agregarSabor">
          <h2>Agregar un sabor al menú</h2>

          <label class="campo campo--ancho">
            Nombre del sabor
            <!-- v-model="nuevoNombre": lo que se escribe aquí se guarda en nuevoNombre, y si nuevoNombre cambia, el campo también -->
            <input v-model="nuevoNombre" type="text" placeholder="Ej: Mexicana" />
          </label>

          <!-- Vista previa en vivo: muestra el enlace bidireccional de v-model -->
          <p class="vista-previa">
            <!-- {{ nuevoNombre || '…' }} muestra lo que se va escribiendo; si está vacío muestra '…' -->
            Escribiendo: <strong>{{ nuevoNombre || '…' }}</strong>
          </p>

          <label class="campo campo--ancho">
            Ingredientes
            <!-- v-model="nuevosIngredientes": conecta este campo con la variable nuevosIngredientes -->
            <input v-model="nuevosIngredientes" type="text" placeholder="Ej: Carne, jalapeños y fríjol" />
          </label>

          <div class="precios-nuevos">
            <label class="campo">
              Personal
              <!-- v-model.number="nuevoPersonal": guarda el precio en nuevoPersonal y ".number" lo convierte en número (no en texto) -->
              <input v-model.number="nuevoPersonal" type="number" min="0" step="500" placeholder="15000" />
            </label>
            <label class="campo">
              Mediana
              <!-- v-model.number="nuevoMediana": guarda el precio mediano como número -->
              <input v-model.number="nuevoMediana" type="number" min="0" step="500" placeholder="30000" />
            </label>
            <label class="campo">
              Familiar
              <!-- v-model.number="nuevoFamiliar": guarda el precio familiar como número -->
              <input v-model.number="nuevoFamiliar" type="number" min="0" step="500" placeholder="45000" />
            </label>
          </div>

          <!-- v-if: el mensaje de error solo aparece si hay un error -->
          <!-- v-if="error": este <p> solo existe si error tiene texto; {{ error }} escribe ese texto -->
          <p v-if="error" class="error">{{ error }}</p>

          <button type="submit" class="boton boton--receta">Agregar sabor</button>
        </form>
      </section>

      <!-- PEDIDO: el horno y, colgada debajo, la comanda -->
      <aside class="pedido">
        <!--
          EL HORNO (solo decoración, por eso aria-hidden).
          Truco: :key="cantidad" hace que Vue vuelva a crear el fuego y la pizza
          cada vez que cambia la cantidad del pedido. Al crearse de nuevo,
          su animación CSS vuelve a empezar: la pizza entra y las brasas se avivan.
        -->
        <div class="horno" aria-hidden="true">
          <div class="cupula">
            <div class="arco">
              <div class="boca">
                <!-- :key="cantidad": cuando cambia la cantidad de pizzas, Vue crea de nuevo este fuego y su animación se repite -->
                <div :key="cantidad" class="fuego">
                  <span class="resplandor"></span>
                  <span class="llama llama--1"></span>
                  <span class="llama llama--2"></span>
                  <span class="llama llama--3"></span>
                  <span class="lena"></span>
                </div>
                <!-- data-cantidad permite esconder la pizza con CSS cuando el pedido está vacío -->
                <!-- :key hace que la pizza vuelva a "entrar" al horno con cada cambio; :data-cantidad pone la cantidad como atributo para el CSS -->
                <span :key="'pizza-' + cantidad" class="pizza-al-horno" :data-cantidad="cantidad"></span>
              </div>
            </div>
          </div>
          <div class="solera"></div>
        </div>

        <!-- La comanda cuelga de un gancho debajo del horno -->
        <div class="comanda">
          <!-- {{ }} con condición (operador ?): según la etapa escribe 'Pagar pedido', '¡Pedido pagado!' o 'Tu pedido' -->
          <h2>{{ etapa === 'pago' ? 'Pagar pedido' : etapa === 'listo' ? '¡Pedido pagado!' : 'Tu pedido' }}</h2>

          <!-- ETAPA 3: recibo del pedido ya pagado -->
          <!-- v-if: este bloque solo se muestra si la etapa es 'listo' y ya existe un recibo -->
          <div v-if="etapa === 'listo' && recibo" class="recibo">
            <!-- {{ recibo.numero }} muestra el número de pedido que se creó al pagar -->
            <p class="recibo-numero">Pedido n.º {{ recibo.numero }}</p>
            <!-- {{ recibo.nombre }} y {{ recibo.direccion }} muestran los datos que escribió el cliente -->
            <p>Gracias, <strong>{{ recibo.nombre }}</strong>. Tu pedido va para <strong>{{ recibo.direccion }}</strong>.</p>
            <ul class="lineas">
              <!-- v-for crea una fila por cada pizza pagada (guardada en recibo.lineas); :key="item.idLinea" la identifica -->
              <li v-for="item in recibo.lineas" :key="item.idLinea" class="linea linea--recibo">
                <div>
                  <!-- {{ item.nombre }} muestra el nombre de la pizza -->
                  <strong>{{ item.nombre }}</strong>
                  <!-- {{ item.tamano }} muestra el tamaño de la pizza -->
                  <small>{{ item.tamano }}</small>
                </div>
                <!-- {{ formatoPesos(item.precio) }} muestra el precio de esa pizza en pesos -->
                <span>{{ formatoPesos(item.precio) }}</span>
              </li>
            </ul>
            <div class="total">
              <!-- {{ recibo.metodo }} muestra con qué se pagó (Efectivo, Tarjeta o Nequi) -->
              <span>Pagado con {{ recibo.metodo }}</span>
              <!-- {{ formatoPesos(recibo.total) }} muestra el total pagado -->
              <strong>{{ formatoPesos(recibo.total) }}</strong>
            </div>
            <!-- v-if: solo se muestra si hay vueltas (más de 0); {{ }} las escribe en pesos -->
            <p v-if="recibo.cambio > 0" class="nota-pago">Tus vueltas: {{ formatoPesos(recibo.cambio) }}</p>
            <!-- @click="nuevoPedido": al hacer clic, deja todo listo para empezar un pedido nuevo -->
            <button type="button" class="boton boton--pagar" @click="nuevoPedido">Hacer otro pedido</button>
          </div>

          <!-- ETAPA 2: formulario de pago -->
          <!-- v-else-if: se muestra solo si NO se cumplió el v-if anterior y la etapa es 'pago'; @submit.prevent llama a confirmarPago() sin recargar la página -->
          <form v-else-if="etapa === 'pago'" class="form-pago" @submit.prevent="confirmarPago">
            <div class="total total--arriba">
              <!-- {{ cantidad }} muestra cuántas pizzas hay; el operador ? escribe 'pizza' si es 1 y 'pizzas' si son más -->
              <span>{{ cantidad }} {{ cantidad === 1 ? 'pizza' : 'pizzas' }}</span>
              <!-- {{ formatoPesos(total) }} muestra el total a pagar -->
              <strong>{{ formatoPesos(total) }}</strong>
            </div>

            <label class="campo-pago">
              Nombre
              <!-- v-model="clienteNombre": lo escrito se guarda en la variable clienteNombre -->
              <input v-model="clienteNombre" type="text" autocomplete="name" placeholder="Ej: Ana Pérez" />
            </label>
            <label class="campo-pago">
              Dirección de entrega
              <!-- v-model="clienteDireccion": lo escrito se guarda en la variable clienteDireccion -->
              <input v-model="clienteDireccion" type="text" autocomplete="street-address" placeholder="Ej: Calle 10 # 5-20" />
            </label>

            <fieldset class="metodos">
              <legend>Método de pago</legend>
              <!-- v-for crea un botón por cada método de pago; :key="m.valor" lo identifica; :class agrega 'activo' al método elegido -->
              <label v-for="m in metodos" :key="m.valor" class="metodo" :class="{ activo: metodoPago === m.valor }">
                <!-- :value es el valor de esta opción; v-model="metodoPago" guarda en metodoPago la opción elegida -->
                <input type="radio" name="metodo" :value="m.valor" v-model="metodoPago" />
                <!-- {{ m.etiqueta }} escribe el nombre del método (ej: "Nequi") -->
                {{ m.etiqueta }}
              </label>
            </fieldset>

            <!-- Solo en efectivo se pregunta con cuánto paga, para calcular las vueltas -->
            <!-- v-if: este grupo solo aparece si el método elegido es efectivo (<template> agrupa sin crear etiqueta extra) -->
            <template v-if="metodoPago === 'efectivo'">
              <label class="campo-pago">
                ¿Con cuánto pagas?
                <!-- v-model.number="pagaCon": guarda el billete como número; :placeholder="total" muestra el total como ejemplo -->
                <input v-model.number="pagaCon" type="number" min="0" step="1000" :placeholder="total" />
              </label>
              <!-- v-if: solo muestra las vueltas si ya escribió con cuánto paga y alcanza para el total; {{ }} las escribe en pesos -->
              <p v-if="pagaCon && cambio >= 0" class="nota-pago">Vueltas: {{ formatoPesos(cambio) }}</p>
            </template>
            <!-- v-else-if: si no es efectivo pero sí tarjeta, muestra este mensaje -->
            <p v-else-if="metodoPago === 'tarjeta'" class="nota-pago">El domiciliario lleva el datáfono.</p>
            <!-- v-else: si no es efectivo ni tarjeta (o sea Nequi), muestra este mensaje -->
            <p v-else class="nota-pago">Al confirmar te enviamos el número de Nequi para transferir.</p>

            <!-- v-if="errorPago": el error solo aparece si hay un mensaje; {{ errorPago }} lo escribe -->
            <p v-if="errorPago" class="error error--pago">{{ errorPago }}</p>

            <div class="acciones-pago">
              <!-- @click="volverAlPedido": regresa a la lista del pedido sin pagar -->
              <button type="button" class="quitar" @click="volverAlPedido">Volver</button>
              <button type="submit" class="boton boton--pagar">Confirmar pago</button>
            </div>
          </form>

          <!--
            ETAPA 1: el pedido
            v-if / v-else: Vue muestra SOLO uno de los dos bloques.
            Si el pedido está vacío, sale el mensaje; si tiene pizzas, sale la lista.
          -->
          <!-- v-else-if: si no estamos en las etapas anteriores y el pedido no tiene pizzas (length === 0), se ve este mensaje -->
          <div v-else-if="pedido.length === 0" class="vacio">
            <p><strong>Tu pedido está vacío.</strong></p>
            <p>Elige un tamaño y presiona «Agregar» en cualquier pizza.</p>
          </div>

          <!-- v-else: si ninguna condición anterior se cumplió (hay pizzas en el pedido), se muestra la lista -->
          <div v-else>
            <ul class="lineas">
              <!-- v-for crea una fila por cada pizza del pedido; :key="item.idLinea" usa el id único de esa línea -->
              <li v-for="item in pedido" :key="item.idLinea" class="linea">
                <div>
                  <!-- {{ item.nombre }} muestra el nombre de la pizza -->
                  <strong>{{ item.nombre }}</strong>
                  <!-- {{ item.tamano }} muestra el tamaño que se eligió -->
                  <small>{{ item.tamano }}</small>
                </div>
                <!-- {{ formatoPesos(item.precio) }} muestra el precio de esa pizza -->
                <span>{{ formatoPesos(item.precio) }}</span>
                <!-- :aria-label arma el texto "Quitar Hawaiana" para lectores de pantalla; @click llama a quitarDelPedido() con el id de esta pizza -->
                <button
                  type="button"
                  class="quitar"
                  :aria-label="'Quitar ' + item.nombre"
                  @click="quitarDelPedido(item.idLinea)"
                >
                  Quitar
                </button>
              </li>
            </ul>

            <!-- total y cantidad son computed: se recalculan solos -->
            <div class="total">
              <!-- {{ cantidad }} muestra cuántas pizzas hay; el operador ? decide entre 'pizza' y 'pizzas' -->
              <span>{{ cantidad }} {{ cantidad === 1 ? 'pizza' : 'pizzas' }}</span>
              <!-- :key="total" repite el brillo de brasa cada vez que el total cambia -->
              <!-- {{ formatoPesos(total) }} muestra el total del pedido en pesos -->
              <strong :key="total">{{ formatoPesos(total) }}</strong>
            </div>

            <!-- Botón de pagar: solo aparece cuando ya hay al menos una pizza en el pedido -->
            <!-- @click="irAPagar": al hacer clic abre el formulario de pago; {{ formatoPesos(total) }} escribe el total en el botón -->
            <button type="button" class="boton boton--pagar" @click="irAPagar">
              Pagar {{ formatoPesos(total) }}
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
/* ---------- Estructura general ---------- */
/*
  Dos columnas: a la izquierda el encabezado y el menú; a la derecha el horno,
  que ocupa las dos filas y se queda quieto al bajar (sticky).
*/
.pagina {
  /* Dibujo de una pizza armada: se usa en el selector y dentro del horno */
  --dibujo-pizza:
    radial-gradient(circle at 30% 35%, var(--pepperoni) 0 11%, transparent 12%),
    radial-gradient(circle at 66% 30%, var(--pepperoni) 0 10%, transparent 11%),
    radial-gradient(circle at 55% 68%, var(--pepperoni) 0 11%, transparent 12%),
    radial-gradient(circle at 28% 70%, var(--queso) 0 9%, transparent 10%),
    radial-gradient(circle at 72% 55%, var(--queso) 0 8%, transparent 9%),
    radial-gradient(circle, var(--tomate) 0 68%, var(--corteza) 70% 80%, var(--masa) 82%);

  max-width: 1180px;
  margin: 0 auto;
  padding: 3.5rem 1.25rem 5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'encabezado pedido'
    'menu       pedido';
  column-gap: 3.5rem;
  row-gap: 2.75rem;
  align-items: start;
}

/* main no dibuja caja propia: sus hijos se acomodan directo en la cuadrícula de .pagina */
.contenido { display: contents; }

/* ---------- Encabezado ---------- */
.encabezado { grid-area: encabezado; }

/* El título grande «Pizzería La Esquina» */
.encabezado h1 {
  font-size: clamp(2.75rem, 6.5vw, 4.5rem);
  line-height: 0.98;
  max-width: 9ch;
  color: var(--ceniza);
  /*
    Cada letra tiene un filo encendido a la derecha, porque el horno está a ese lado.
    Es igual en todas las letras: la luz no "resalta" una palabra, ilumina todo el nombre.
  */
  text-shadow:
    2px 0 0 rgba(255, 194, 71, 0.85),
    5px 1px 14px rgba(255, 122, 26, 0.45);
}

/* El texto de bienvenida debajo del título */
.encabezado p {
  margin: 1.25rem 0 0;
  max-width: 32rem;
  font-size: 1.125rem;
  color: var(--humo);
}

/* ---------- Menú (columna izquierda) ---------- */
.menu {
  grid-area: menu;
  min-width: 0;
}

/* ---------- Selector de tamaño: pizzas sobre tablas de servir ---------- */
.tamanos {
  min-width: 0;
  border: none;
  padding: 0;
  margin: 0 0 2.5rem;
  display: flex;
  gap: 2.25rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

/* La palabra «Tamaño» encima del selector */
.tamanos legend {
  font-family: 'Alfa Slab One', Georgia, serif;
  font-size: 1.3rem;
  color: var(--ceniza);
  margin-bottom: 1.25rem;
}

/* Cada opción de tamaño (dibujo de la pizza + texto) */
.tamano {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  cursor: pointer;
  text-align: center;
}

/* El radio real queda oculto, pero sigue funcionando con teclado */
.tamano input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

/* Contorno de la pizza cuando se elige con el teclado */
.tamano:focus-within .circulo {
  outline: 3px solid var(--llama);
  outline-offset: 14px;
}

/* Sin elegir: masa cruda sobre una tabla de madera (los anillos de box-shadow son la tabla) */
.circulo {
  display: block;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #f7e1b5, var(--masa) 70%);
  box-shadow:
    0 0 0 9px var(--madera),
    0 0 0 11px var(--madera-oscura),
    0 14px 24px 6px rgba(0, 0, 0, 0.45);
  transition: transform 0.35s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.35s;
}

/* Tamaño del dibujo de la pizza personal */
.tamano--personal .circulo { width: 52px; height: 52px; }
/* Tamaño del dibujo de la pizza mediana */
.tamano--mediana .circulo  { width: 76px; height: 76px; }
/* Tamaño del dibujo de la pizza familiar */
.tamano--familiar .circulo { width: 104px; height: 104px; }

/* La pizza sube un poquito al pasar el mouse */
.tamano:hover .circulo { transform: translateY(-3px); }

/* Al elegir un tamaño, la pizza se "arma" y la tabla recibe el brillo del horno */
.tamano.activo .circulo {
  background: var(--dibujo-pizza);
  transform: rotate(40deg);
  box-shadow:
    0 0 0 9px var(--madera),
    0 0 0 11px var(--madera-oscura),
    0 0 46px 14px rgba(255, 122, 26, 0.4);
}

/* El nombre del tamaño y sus porciones */
.tamano-texto {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

/* El nombre del tamaño (Personal, Mediana, Familiar) */
.tamano-texto strong { font-size: 1.05rem; }

/* El texto de las porciones */
.tamano-texto small { color: var(--humo); }

/* El nombre del tamaño elegido se pinta color llama */
.tamano.activo .tamano-texto strong { color: var(--llama); }

/* ---------- Menú de pizzas: tabla de madera ---------- */
.lista-pizzas {
  list-style: none;
  margin: 0 0 2.75rem;
  padding: 0.75rem 0;
  color: var(--tinta);
  border-radius: 18px;
  /* Vetas de la madera + borde derecho más claro (le pega la luz del horno) */
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.12), transparent 18%, transparent 78%, rgba(255, 190, 110, 0.28)),
    repeating-linear-gradient(178deg, transparent 0 9px, rgba(90, 55, 25, 0.13) 9px 11px, transparent 11px 23px),
    var(--madera);
  box-shadow:
    inset 0 2px 0 rgba(255, 230, 190, 0.35),
    inset 0 -4px 0 var(--madera-oscura),
    0 26px 40px -22px rgba(0, 0, 0, 0.85);
}

/* Cada fila del menú (una pizza) */
.pizza {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.35rem 1.75rem;
  /* Línea quemada entre sabores */
  border-bottom: 2px solid rgba(60, 35, 15, 0.22);
}

/* La última fila del menú no lleva línea abajo */
.pizza:last-child { border-bottom: none; }

/* Nombre marcado a fuego: letra oscura con un borde claro debajo, como hundida en la madera */
.pizza h2 {
  font-size: 1.5rem;
  color: #3a200d;
  text-shadow: 0 1px 0 rgba(255, 225, 180, 0.45);
}

/* Los ingredientes de cada pizza */
.pizza-info p {
  margin: 0.35rem 0 0;
  max-width: 36rem;
}

/* La línea pequeña con los tres precios */
.otros-precios {
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

/* La zona derecha de cada fila: precio y botón «Agregar» */
.pizza-accion {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

/* El precio grande de cada pizza */
.precio {
  font-family: 'Alfa Slab One', Georgia, serif;
  font-size: 1.6rem;
  color: #3a200d;
  text-shadow: 0 1px 0 rgba(255, 225, 180, 0.45);
  font-variant-numeric: tabular-nums;
}

/* ---------- Botones ---------- */
/*
  Botón de hierro: una placa oscura con letra de brasa, como la manija de la puerta del horno.
  Así el naranja fuerte queda solo para el fuego y el menú no se llena de bloques iguales.
*/
.boton {
  background: linear-gradient(#3a2a22, var(--carbon));
  color: var(--llama);
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.15rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  /* Sombra sólida abajo: parece un botón que se puede presionar */
  box-shadow: inset 0 1px 0 rgba(255, 220, 180, 0.15), 0 4px 0 #120c0a;
  transition: transform 0.1s, box-shadow 0.15s, color 0.15s;
}

/* Al pasar el mouse, el hierro se calienta */
.boton:hover {
  color: #fff1c7;
  box-shadow: inset 0 1px 0 rgba(255, 220, 180, 0.15), 0 4px 0 #120c0a, 0 0 18px rgba(255, 122, 26, 0.55);
}

/* Al hacer clic, el botón "se hunde" */
.boton:active {
  transform: translateY(3px);
  box-shadow: inset 0 1px 0 rgba(255, 220, 180, 0.15), 0 1px 0 #120c0a;
}

/* En la losa de carbón el botón es de madera, como la pala */
.boton--receta {
  background: var(--madera);
  color: var(--tinta);
  box-shadow: inset 0 1px 0 rgba(255, 230, 190, 0.4), 0 4px 0 var(--madera-oscura);
}
/* Botón «Agregar sabor» al pasar el mouse */
.boton--receta:hover {
  color: var(--tinta);
  box-shadow: inset 0 1px 0 rgba(255, 230, 190, 0.4), 0 4px 0 var(--madera-oscura), 0 0 18px rgba(255, 122, 26, 0.35);
}
/* Botón «Agregar sabor» al hacer clic */
.boton--receta:active { box-shadow: 0 1px 0 var(--madera-oscura); }

/* ---------- Formulario: losa de carbón ---------- */
.formulario {
  background: var(--carbon);
  border: 1px solid rgba(217, 207, 196, 0.12);
  border-radius: 6px;
  padding: 1.75rem;
  box-shadow: 0 26px 40px -26px rgba(0, 0, 0, 0.9);
}

/* El título «Agregar un sabor al menú» */
.formulario h2 {
  font-size: 1.3rem;
  color: var(--ceniza);
  margin-bottom: 1.25rem;
}

/* Cada campo del formulario (texto + caja) */
.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Los campos son renglones de tiza sobre el carbón: sin caja, solo la línea */
.campo input {
  width: 100%;
  min-width: 0; /* evita que los campos de número se salgan del formulario */
  padding: 0.45rem 0.1rem;
  border: none;
  border-bottom: 2px dashed rgba(217, 207, 196, 0.45);
  border-radius: 0;
  background: transparent;
  color: var(--ceniza);
  font-size: 1.125rem;
  font-weight: 500;
}

/* El texto de ejemplo dentro de los campos */
.campo input::placeholder { color: #8a7d72; }

/* El campo en el que se está escribiendo */
.campo input:focus {
  border-bottom: 2px solid var(--llama);
  outline: none;
}

/* Los tres campos de precios en una fila */
.precios-nuevos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

/* Vista previa: el nombre se va marcando a fuego en una plaquita de madera, igual que en el menú */
.vista-previa {
  margin: 0 0 1.1rem;
  color: var(--humo);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

/* La plaquita de madera con el nombre que se escribe */
.vista-previa strong {
  font-family: 'Alfa Slab One', Georgia, serif;
  font-weight: 400;
  font-size: 1.2rem;
  color: #3a200d;
  text-shadow: 0 1px 0 rgba(255, 225, 180, 0.45);
  background:
    repeating-linear-gradient(178deg, transparent 0 7px, rgba(90, 55, 25, 0.13) 7px 9px, transparent 9px 17px),
    var(--madera);
  padding: 0.2rem 0.85rem;
  border-radius: 6px;
  box-shadow: inset 0 -3px 0 var(--madera-oscura);
  max-width: 100%;
  overflow-wrap: anywhere;
}

/* El mensaje de error del formulario */
.error {
  background: rgba(200, 50, 31, 0.2);
  color: var(--ceniza);
  border-left: 4px solid var(--brasa);
  padding: 0.6rem 0.8rem;
  border-radius: 4px;
}

/* ---------- Columna del pedido ---------- */
.pedido {
  grid-area: pedido;
  position: sticky;
  top: 1.5rem;
}

/* ---------- El horno de leña ---------- */
.horno {
  position: relative;
  padding-inline: 6px;
}

/* Cúpula de ladrillo: el SVG dibuja las juntas, los degradados le dan volumen */
.cupula {
  position: relative;
  aspect-ratio: 5 / 3.4;
  border-radius: 50% 50% 10px 10px / 72% 72% 10px 10px;
  background:
    radial-gradient(ellipse 70% 55% at 50% 100%, rgba(255, 122, 26, 0.38), transparent 70%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.45), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.3)),
    linear-gradient(rgba(0, 0, 0, 0.25), transparent 40%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='24'%3E%3Cpath d='M0 1H40M0 13H40M1 0V12M21 12V24' stroke='%23000' stroke-opacity='.4' stroke-width='2' fill='none'/%3E%3C/svg%3E"),
    var(--ladrillo);
  box-shadow: 0 0 60px rgba(255, 122, 26, 0.18);
}

/* Arco de ladrillos alrededor de la boca: un degradado cónico dibuja cada dovela */
.arco {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 62%;
  height: 64%;
  transform: translateX(-50%);
  padding: 12px 12px 0;
  border-radius: 50% 50% 0 0 / 82% 82% 0 0;
  background: repeating-conic-gradient(from -90deg at 50% 100%, var(--ladrillo-oscuro) 0 8deg, #2a120a 8deg 9deg);
}

/* La boca oscura del horno */
.boca {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 50% 50% 0 0 / 82% 82% 0 0;
  background: radial-gradient(ellipse at 50% 100%, #3d1a0c, #120a07 75%);
}

/* El fuego: al volver a crearse (cambia la cantidad) se aviva un momento */
.fuego {
  position: absolute;
  inset: 0;
  animation: avivar 1.4s ease-out;
}

/* Animación: el fuego se aviva al agregar o quitar una pizza */
@keyframes avivar {
  0%   { filter: brightness(1.5); transform: scale(1.25); transform-origin: 50% 100%; }
  100% { filter: brightness(1); transform: scale(1); transform-origin: 50% 100%; }
}

/* La luz amarilla del fuego dentro del horno */
.resplandor {
  position: absolute;
  inset: 20% -20% -30%;
  background: radial-gradient(ellipse at 50% 85%, rgba(255, 194, 71, 0.75), rgba(255, 122, 26, 0.35) 35%, transparent 65%);
}

/* Cada llama es una gota: la esquina recta queda arriba al girarla 45° */
.llama {
  position: absolute;
  bottom: 14%;
  width: 26%;
  aspect-ratio: 1;
  border-radius: 50% 0 50% 50%;
  background: radial-gradient(circle at 60% 60%, #fff3c4, var(--llama) 30%, var(--brasa) 62%, rgba(255, 80, 20, 0) 75%);
  transform: rotate(-45deg);
  filter: blur(1px);
  mix-blend-mode: screen;
  animation: titilar 1.6s ease-in-out infinite alternate;
}

/* Posición de la primera llama */
.llama--1 { left: 22%; animation-delay: -0.4s; }
/* Posición de la llama del centro (la más grande) */
.llama--2 { left: 38%; width: 32%; bottom: 18%; animation-duration: 1.2s; }
/* Posición de la tercera llama */
.llama--3 { left: 54%; animation-delay: -0.9s; animation-duration: 1.9s; }

/* Animación: las llamas se mueven sin parar */
@keyframes titilar {
  0%   { transform: rotate(-45deg) scale(1); opacity: 0.9; }
  50%  { transform: rotate(-42deg) scale(1.12, 1.2); opacity: 1; }
  100% { transform: rotate(-48deg) scale(0.92, 1.05); opacity: 0.85; }
}

/* Dos troncos cruzados al fondo del horno */
.lena {
  position: absolute;
  left: 50%;
  bottom: 9%;
  width: 46%;
  height: 9%;
  transform: translateX(-50%);
}

/* Los dos troncos de leña (forma y color) */
.lena::before,
.lena::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(#5a3418, #2a160a);
  box-shadow: inset 0 2px 0 rgba(255, 150, 60, 0.6);
}

/* Un tronco inclinado hacia un lado y el otro hacia el otro (quedan cruzados) */
.lena::before { transform: rotate(9deg); }
.lena::after  { transform: rotate(-9deg); }

/* La pizza entra al horno desde la izquierda, como sobre una pala */
.pizza-al-horno {
  position: absolute;
  left: 50%;
  bottom: 4%;
  width: 34%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--dibujo-pizza);
  /* Se ve un poco "acostada": así parece que está sobre el piso del horno */
  transform: translateX(-50%) scaleY(0.42);
  box-shadow: 0 0 18px rgba(255, 150, 50, 0.7);
  animation: meter-al-horno 0.9s cubic-bezier(0.2, 0.8, 0.3, 1);
}

/* Animación: la pizza entra al horno */
@keyframes meter-al-horno {
  0%   { transform: translateX(-320%) scaleY(0.42) rotate(-60deg); }
  100% { transform: translateX(-50%) scaleY(0.42) rotate(0); }
}

/* Con el pedido vacío no hay pizza en el horno */
.pizza-al-horno[data-cantidad='0'] { display: none; }

/* Piso de piedra del horno, con el reflejo de la brasa */
.solera {
  height: 18px;
  margin: 0 -6px;
  border-radius: 4px;
  background:
    radial-gradient(ellipse 40% 100% at 50% 0%, rgba(255, 122, 26, 0.5), transparent),
    linear-gradient(#6b5a50, #3e322c);
  box-shadow: 0 10px 20px -6px rgba(0, 0, 0, 0.8);
}

/* ---------- Comanda: papel colgado de un gancho, con borde rasgado ---------- */
.comanda {
  position: relative;
  margin: 2.6rem 0.75rem 0;
  background: var(--ceniza);
  color: var(--tinta);
  padding: 1.6rem 1.5rem 2.2rem;
  transform: rotate(-1.2deg);
  transform-origin: 50% 0;
  /* Dientes de sierra abajo, como papel arrancado del talonario */
  -webkit-mask:
    linear-gradient(#000 0 0) top / 100% calc(100% - 10px) no-repeat,
    conic-gradient(from -45deg at bottom, transparent, #000 1deg 89deg, transparent 90deg) bottom / 20px 10px repeat-x;
  mask:
    linear-gradient(#000 0 0) top / 100% calc(100% - 10px) no-repeat,
    conic-gradient(from -45deg at bottom, transparent, #000 1deg 89deg, transparent 90deg) bottom / 20px 10px repeat-x;
}

/* El gancho de alambre que sostiene la comanda (va en .horno porque la máscara de la comanda lo cortaría) */
.horno::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 18px;
  height: calc(2.6rem + 14px);
  transform: translateX(-50%);
  border: 3px solid #9b8e82;
  border-top: 0;
  border-radius: 0 0 10px 10px;
  z-index: 1;
}

/* El título de la comanda («Tu pedido») */
.comanda h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px dashed rgba(36, 23, 15, 0.3);
}

/* El mensaje de pedido vacío */
.vacio p { margin: 0 0 0.5rem; }
/* La segunda línea del mensaje de pedido vacío */
.vacio p:last-child { color: #5c4d42; }

/* La lista de pizzas del pedido */
.lineas {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Cada pizza dentro del pedido */
.linea {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.4rem;
  margin-inline: -0.4rem;
  border-bottom: 1px dashed rgba(36, 23, 15, 0.3);
  font-variant-numeric: tabular-nums;
  /* Cada pizza nueva "sale del horno": baja desde arriba con un brillo cálido */
  animation: salir-del-horno 0.7s ease-out;
}

/* Animación: cada pizza nueva aparece en el pedido */
@keyframes salir-del-horno {
  from {
    opacity: 0;
    transform: translateY(-12px);
    background: rgba(255, 122, 26, 0.45);
  }
  to { background: transparent; }
}

/* Nombre y tamaño de la pizza en el pedido */
.linea div {
  display: flex;
  flex-direction: column;
}

/* El tamaño de la pizza en el pedido */
.linea small {
  text-transform: capitalize;
  color: #5c4d42;
}

/* El botón «Quitar» (y «Volver») */
.quitar {
  background: none;
  border: 1px solid rgba(36, 23, 15, 0.35);
  color: var(--tinta);
  border-radius: 6px;
  padding: 0.25rem 0.65rem;
  cursor: pointer;
  font-size: 0.85rem;
}

/* El botón «Quitar» al pasar el mouse */
.quitar:hover {
  background: var(--tinta);
  color: var(--ceniza);
}

/* La fila del total del pedido */
.total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 3px double var(--tinta);
}

/* El valor del total en pesos */
.total strong {
  font-family: 'Alfa Slab One', Georgia, serif;
  font-size: 1.9rem;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--ladrillo);
  /* Cada total nuevo se enciende como una brasa soplada */
  animation: soplar 1.1s ease-out;
}

/* Animación: el total brilla cuando cambia */
@keyframes soplar {
  0% {
    color: var(--brasa);
    text-shadow: 0 0 14px rgba(255, 122, 26, 0.9), 0 0 2px var(--llama);
  }
}

/* ---------- Pago ---------- */
.boton--pagar {
  display: block;
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.85rem 1rem;
  font-size: 1.05rem;
}

/* El formulario de pago */
.form-pago { display: flex; flex-direction: column; gap: 0.9rem; }

/* El total arriba del formulario de pago */
.total--arriba { margin-top: 0; padding-top: 0; border-top: none; }

/* Cada campo del formulario de pago */
.campo-pago {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-weight: 600;
}

/* Las cajas de texto del formulario de pago */
.campo-pago input {
  padding: 0.45rem 0.1rem;
  border: none;
  border-bottom: 2px dashed rgba(36, 23, 15, 0.4);
  background: transparent;
  color: var(--tinta);
  font-size: 1rem;
}

/* El campo de pago en el que se está escribiendo */
.campo-pago input:focus { outline: none; border-bottom: 2px solid var(--ladrillo); }

/* El grupo de métodos de pago */
.metodos {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* El texto «Método de pago» */
.metodos legend { font-weight: 600; margin-bottom: 0.4rem; }

/* Cada botón de método de pago */
.metodo {
  border: 1px solid rgba(36, 23, 15, 0.35);
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  cursor: pointer;
  font-size: 0.9rem;
}

/* El círculo del radio queda oculto */
.metodo input { position: absolute; opacity: 0; pointer-events: none; }
/* Método de pago elegido con el teclado */
.metodo:focus-within { outline: 2px solid var(--ladrillo); outline-offset: 2px; }
/* El método de pago elegido */
.metodo.activo { background: var(--tinta); color: var(--ceniza); }

/* Los mensajes pequeños del pago (vueltas, datáfono, Nequi) */
.nota-pago { margin: 0; color: #5c4d42; font-size: 0.95rem; }

/* El mensaje de error del pago */
.error--pago { margin: 0; color: var(--tinta); }

/* La fila de botones «Volver» y «Confirmar pago» */
.acciones-pago { display: flex; gap: 0.75rem; align-items: center; }
/* El botón «Confirmar pago» dentro de esa fila */
.acciones-pago .boton--pagar { margin-top: 0; flex: 1; }

/* Los textos del recibo */
.recibo p { margin: 0 0 0.75rem; }
/* El número de pedido del recibo */
.recibo-numero {
  font-family: 'Alfa Slab One', Georgia, serif;
  color: var(--ladrillo);
  font-size: 1.15rem;
}
/* Cada pizza en el recibo (sin botón Quitar) */
.linea--recibo { grid-template-columns: 1fr auto; }

/* ---------- Celular y tablet ---------- */
@media (max-width: 860px) {
  /* En celular: una sola columna */
  .pagina {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas: 'encabezado' 'menu' 'pedido';
    padding-top: 2.25rem;
  }
  /* En celular: el pedido va abajo y centrado */
  .pedido { position: static; max-width: 420px; width: 100%; justify-self: center; }
  /* En celular: menos espacio entre tamaños */
  .tamanos { gap: 1.75rem; }
  /* En celular: cada pizza en columna */
  .pizza { flex-direction: column; padding-inline: 1.25rem; }
  /* En celular: precio y botón en una fila */
  .pizza-accion { flex-direction: row; justify-content: space-between; align-items: center; }
  /* En celular: los precios uno debajo del otro */
  .precios-nuevos { grid-template-columns: 1fr; }
}
</style>
