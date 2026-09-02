# Práctica 4 — Arquitectura Hexagonal (Puertos y Adaptadores)

## Objetivo

Aislar la lógica de negocio de la tecnología que la rodea, al punto de
poder probarla **sin Docker, sin MySQL, sin ningún servidor corriendo**.

## Qué construimos sobre la práctica anterior

El `frontend/` y el `db/` son idénticos a la Práctica 3. Lo que cambia es
cómo se organiza el `backend/` — ya no en capas horizontales
(rutas → controladores → modelos), sino alrededor de un núcleo protegido:

| Práctica 3 (Capas) | Práctica 4 (Hexagonal) |
|---|---|
| `routes/` → `controllers/` → `models/` | `domain/` (el núcleo) rodeado de `adapters/` |
| El Controlador conoce Express (`req`/`res`) | El dominio no conoce ni Express ni MySQL |
| Para probar la lógica, hay que levantar el servidor y la BD | El dominio se prueba solo, con `node test_domain.js` |

La lógica de negocio (qué es registrar un usuario, qué es completar una
tarea) es exactamente la misma que en la Práctica 3 — nada más que ahora
vive separada de "cómo llega la petición" (HTTP) y "dónde se guardan los
datos" (MySQL).

## Requisitos previos

- **Antes de empezar:** si tienes contenedores de otra práctica corriendo,
  ciérralos primero — ver
  ["Flujo de trabajo entre prácticas"](../README.md#flujo-de-trabajo-entre-prácticas)
  en el README raíz.
- Práctica 3 completada.
- Haber revisado la diapositiva **"Patrón 'Hexagonal' (Puertos y
  adaptadores)"**.
- **Node.js instalado en tu propia máquina** (no solo en Docker). Esta es
  la **primera** práctica del curso que lo necesita: `test_domain.js` se
  corre a propósito **fuera** de Docker, así que tu máquina necesita su
  propio `node`/`npm`. Dos formas de instalarlo (Windows):
  - **Recomendado, más rápido:** en PowerShell como administrador,
    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```
  - O descárgalo directo desde https://nodejs.org (versión LTS).

  En ambos casos, **cierra y vuelve a abrir tu terminal** antes de
  continuar — el `PATH` no se actualiza en una ventana que ya estaba
  abierta antes de instalar.

## Estructura de archivos

```
04-hexagonal/
├── docker-compose.yml
├── frontend/                (sin cambios respecto a la Práctica 3)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js              ← ensambla el dominio con los adaptadores reales
│   ├── test_domain.js         ← prueba el dominio SIN Docker ni MySQL
│   ├── domain/                 (EL HEXÁGONO: lógica pura, sin dependencias)
│   │   ├── userDomain.js
│   │   └── taskDomain.js
│   └── adapters/                (los "traductores" hacia el mundo exterior)
│       ├── apiAdapter.js         (traduce HTTP ↔ dominio)
│       └── dbAdapter.js          (traduce MySQL ↔ dominio)
└── db/
    └── init.sql                  (idéntico a la Práctica 3)
```

## Instrucciones paso a paso

### Parte 1 — Probar el dominio en aislamiento (sin Docker)

1. Abre una terminal en `04-hexagonal/backend/`.
2. Instala las dependencias: `npm install`
3. Corre las pruebas del dominio:
   ```
   node test_domain.js
   ```
4. Deberías ver 10 pruebas exitosas — **sin haber levantado Docker, sin
   MySQL corriendo.** `test_domain.js` le da al dominio un adaptador falso
   en memoria en vez del real. Esa es la demostración central de esta
   práctica.

### Parte 2 — Correr el sistema completo (con Docker)

1. En `04-hexagonal/`, levanta los servicios:
   ```
   docker-compose up --build
   ```
2. Abre `http://localhost:8080` y verifica que la app se comporte igual
   que en la Práctica 3.

## Qué deberías observar

- **El dominio no importa `express` ni `mysql2`.** Abre `domain/userDomain.js`
  y `domain/taskDomain.js` — ni un solo `require('express')` o
  `require('mysql2')`. Reciben un `repo` genérico y confían en que cumpla
  el contrato.
- **`dbAdapter.js` traduce errores de MySQL a un lenguaje que el dominio
  entiende.** Busca `ER_DUP_ENTRY` — ese es un código específico de MySQL;
  el adaptador lo convierte a `DUPLICATE_USERNAME` antes de que el dominio
  lo vea. Si cambiaran de base de datos, solo este archivo se toca.
- **`test_domain.js` usa un adaptador falso, no la base de datos real.**
  Es la prueba de que el "puerto" (el contrato) es lo único que le importa
  al dominio — no quién lo implementa.
- **El comportamiento observable de la app no cambió respecto a la
  Práctica 3.** Mismos endpoints, mismas respuestas.

## Preguntas frecuentes sobre el código

**¿A qué nos referimos exactamente como "el dominio"?**

Son, muy concretamente, dos archivos: `domain/userDomain.js` y
`domain/taskDomain.js` — las funciones que ya viste pasar sus 10 pruebas
en `test_domain.js`. El dominio es el conjunto de **reglas del negocio**,
expresadas en código, sin ninguna referencia a cómo se exponen (HTTP,
Express) ni a dónde se guardan (MySQL, memoria). Es la respuesta a
preguntas como "¿qué significa registrar un usuario?" (que no exista ya
ese username) o "¿qué significa completar una tarea?" (que exista, y que
el nuevo estado sea válido). Esas son decisiones de **negocio**, no de
tecnología — por eso viven separadas.

La prueba más clara de que el dominio de verdad no sabe nada de
tecnología: recibe un `repo` genérico y le pide cosas
(`repo.updateTaskStatus(...)`) sin saber si ese `repo` habla con MySQL de
verdad o es el arreglo falso en memoria de `test_domain.js`.

**¿Cuál es el papel de Node.js en todo esto?**

Aquí es fácil confundirse, así que vale la pena decirlo con todas sus
letras: **Node.js no es parte del patrón Hexagonal**. Es simplemente el
motor que ejecuta JavaScript fuera de un navegador — el programa que leyó
`test_domain.js`, entendió los `require(...)`, corrió las funciones línea
por línea, y te imprimió el resultado en la terminal. Node.js es el
terreno común donde corre **todo**: tanto el dominio puro como los
adaptadores con Express y MySQL. La aislación de la que habla Hexagonal no
es "aislar del lenguaje o del motor que lo ejecuta" — sería imposible, y
no tendría sentido. Lo que se aísla es la infraestructura que sí podría
cambiar algún día (el framework web, el motor de base de datos). Node.js,
en cambio, es la base fija sobre la que se construye absolutamente todo,
incluidas las pruebas.

**¿"Modelo" (Práctica 3) y "Dominio" (Práctica 4) son lo mismo?**

No, y es una confusión muy razonable de tener porque ambos nombres suenan
a "la entidad de negocio". Pero comparando el código real, el mapeo es
distinto de lo que el nombre sugiere:

| Capas/MVC (Práctica 3) | Hexagonal (Práctica 4) |
|---|---|
| `models/taskModel.js` — solo SQL, sin reglas de negocio | `adapters/dbAdapter.js` — solo SQL, sin reglas de negocio |
| `controllers/taskController.js` — reglas de negocio **y** manejo de HTTP, mezclados en el mismo archivo | Se separa en dos: las reglas de negocio se van a `domain/taskDomain.js`; el manejo de HTTP se va a `adapters/apiAdapter.js` |

Es decir: lo que más se parece al **Modelo** de Capas es, de hecho, el
**`dbAdapter`** de Hexagonal — ambos son "el único lugar que sabe SQL, sin
opinar de reglas". El **Dominio**, en cambio, es la mitad "reglas de
negocio" de lo que antes era el Controlador, ahora separada de su otra
mitad ("hablar HTTP"). Compara tú mismo `controllers/taskController.js`
de la Práctica 3 contra `domain/taskDomain.js` de esta práctica — vas a
encontrar casi la misma validación de `status`, casi el mismo `404`, solo
que ya sin ningún `req`/`res` de por medio.

**¿Qué es, exactamente, un adaptador?**

Un adaptador es el archivo que **sí** conoce una tecnología concreta, y
cuyo único trabajo es traducir entre "el lenguaje" de esa tecnología y el
contrato abstracto que el dominio espera (el **puerto**). En este
proyecto hay dos:

- `adapters/apiAdapter.js` — el único archivo que importa `express`.
  Traduce en ambas direcciones: toma una petición HTTP (`req.body`) y la
  convierte en argumentos sencillos para el dominio (`username`,
  `password`); y toma la respuesta del dominio (`{data, status}` o
  `{error, status}`) y la convierte en una respuesta HTTP real
  (`res.status(...).json(...)`).
- `adapters/dbAdapter.js` — el único archivo que importa `mysql2`. Traduce
  las llamadas abstractas que el dominio hace (`repo.createUser(...)`) en
  consultas SQL reales, y traduce los errores específicos de MySQL
  (`ER_DUP_ENTRY`) a un código genérico (`DUPLICATE_USERNAME`) que el
  dominio pueda entender sin saber que MySQL existe.

La forma más sencilla de reconocerlos en cualquier proyecto: **un
adaptador es el único lugar donde aparece el `require()` de la tecnología
concreta** (`express`, `mysql2`, lo que sea) — el dominio jamás los
importa.

Una analogía que suele ayudar: el adaptador es como un **traductor en una
reunión diplomática**. El dominio "habla" reglas de negocio; la
tecnología "habla" HTTP o SQL. El traductor convierte de un idioma al
otro, pero nunca opina ni decide nada por su cuenta — esa parte (las
reglas) le corresponde al dominio, no a él.

Y aquí se cierra el círculo con `test_domain.js`: aunque no vive en la
carpeta `adapters/`, cumple exactamente el mismo rol — es un **tercer
adaptador**, uno falso, que traduce las llamadas del dominio hacia
arreglos de JavaScript en memoria en vez de hacia MySQL. Por eso las
pruebas corren igual de bien sin Docker: el dominio nunca supo que estaba
hablando con un traductor distinto.

## Postman (opcional)

Misma colección de siempre -- el contrato de la API sigue sin cambiar,
aunque por dentro ahora sea un hexágono con adaptadores. Importa
`postman_collection.json` de esta carpeta para probarlo tú mismo. Opcional,
no se califica. (Los diagramas de secuencia de esta práctica -- incluyendo
uno mostrando `test_domain.js` hablándole al dominio sin pasar por ningún
adaptador -- llegan en la próxima actualización del repo.)

## Errores comunes y solución

| Problema | Causa probable | Solución |
|---|---|---|
| `npm no se reconoce...` / `npm: command not found` | Node.js no está instalado en tu máquina (esta es la primera práctica que lo necesita fuera de Docker) | Ver [`FAQ-TECNICO.md`](../FAQ-TECNICO.md#8-npm-no-se-reconoce-como-nombre-de-un-cmdlet-o-npm-command-not-found) |
| `npm : ... la ejecución de scripts está deshabilitada` (PowerShell) | Política de ejecución de scripts de Windows, no un problema de Node.js | Ver [`FAQ-TECNICO.md`](../FAQ-TECNICO.md#9-npm--no-se-puede-cargar-el-archivo--porque-la-ejecución-de-scripts-está-deshabilitada-powershell) |
| `node test_domain.js` no corre / `Cannot find module` | No corriste `npm install` primero | Ejecuta `npm install` dentro de `backend/` antes de las pruebas |
| Los mismos errores de Docker de prácticas anteriores | Misma causa que antes | Revisa el [`FAQ-TECNICO.md`](../FAQ-TECNICO.md) |

## Preguntas de reflexión

1. En `test_domain.js`, el "adaptador falso" no usa base de datos alguna.
   ¿Por qué esto demuestra que la lógica de negocio está bien aislada?
   ¿Qué hubiera pasado si `domain/taskDomain.js` importara `mysql2`
   directamente?
2. Si mañana quisieras agregar una versión de la app que funcione desde la
   línea de comandos (sin navegador), ¿qué archivo(s) tendrías que crear?
   ¿Tendrías que tocar `domain/`?
3. Compara el esfuerzo de "probar que la lógica funciona" en esta práctica
   contra la Práctica 3 (Capas). ¿Vale la pena esta separación adicional
   para un proyecto tan pequeño como este? ¿Cuándo empezaría a valer la
   pena en un proyecto real?

## Entregable

1. Captura de la terminal mostrando las 10 pruebas de `test_domain.js`
   pasando.
2. Captura de pantalla de la app funcionando en `http://localhost:8080`.
3. `REFLEXION.md` con tus respuestas a las 3 preguntas.
