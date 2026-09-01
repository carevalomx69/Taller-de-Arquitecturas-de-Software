# FAQ Técnico: Docker y Git en el Taller de Arquitecturas

Esta sección recopila los problemas técnicos más frecuentes que hemos
visto en clase, con su solución paso a paso. Si algo falla antes de
siquiera llegar al código de una práctica, revisa aquí primero antes de
escribirle al profesor.

---

# Parte 1 — Instalación y arranque de Docker

## Requisitos antes de instalar

- Windows 10/11 de 64 bits, macOS, o Linux.
- **Virtualización habilitada en el BIOS/UEFI** (Intel VT-x o AMD-V) —
  esto es una configuración de la tarjeta madre, independiente de Windows.
- (Solo Windows) **WSL2** instalado y configurado como backend de Docker.

Si tu máquina no cumple estos dos puntos, Docker Desktop se instala pero
no arranca — son, por mucho, la causa más común de problemas en este
curso.

---

## 1. "Docker Desktop requires a newer WSL kernel version" / "WSL 2 installation is incomplete"

**Síntoma:** Al abrir Docker Desktop en Windows, aparece un mensaje
pidiendo actualizar el kernel de WSL2, o Docker Desktop se queda cargando
indefinidamente sin arrancar.

**Causa:** En Windows, Docker Desktop usa WSL2 (Windows Subsystem for
Linux) como motor. Si no está instalado o está desactualizado, Docker no
puede arrancar.

**Solución:**
1. Abre **PowerShell como administrador**.
2. Ejecuta:
   ```
   wsl --install
   ```
3. Reinicia la máquina.
4. Si ya tenías WSL instalado pero sigue fallando, actualízalo:
   ```
   wsl --update
   ```
5. Abre Docker Desktop de nuevo.

---

## 2. "Hardware assisted virtualization... must be enabled in the BIOS" / Docker Desktop no arranca

**Síntoma:** Docker Desktop muestra un error mencionando "virtualization",
o simplemente no arranca. En el Administrador de tareas, pestaña
**Rendimiento > CPU**, dice "Virtualización: Deshabilitada".

**Causa:** La virtualización por hardware está apagada en el BIOS/UEFI —
es una configuración del firmware de la tarjeta madre, no de Windows.
Es común en laptops que traen esta opción desactivada de fábrica.

**Solución:**
1. Reinicia la máquina y entra al BIOS/UEFI (usualmente presionando
   `F2`, `F10`, `Supr` o `Esc` justo al encender — varía según el
   fabricante; búscalo si no sabes cuál es en tu equipo).
2. Busca una opción llamada **"Virtualization Technology"**,
   **"Intel VT-x"**, **"AMD-V"** o **"SVM Mode"** — normalmente dentro de
   un menú "Advanced" o "CPU Configuration".
3. Habilítala, guarda cambios (`F10` en la mayoría de los BIOS) y
   reinicia.
4. Confirma en Windows: Administrador de tareas > Rendimiento > CPU >
   "Virtualización" ahora debe decir **"Habilitado"**.

---

## 3. "Cannot connect to the Docker daemon. Is the docker daemon running?"

**Síntoma:** Cualquier comando `docker ...` en la terminal regresa este
error.

**Causa:** Docker Desktop no está corriendo, o no ha terminado de
arrancar.

**Solución:** Abre Docker Desktop y espera a que el ícono de la ballena
dej e de animarse (indica que el motor ya está listo). Puede tardar
30-60 segundos después de abrirlo.

---

## 4. "Error: bind: address already in use" / "port is already allocated"

**Síntoma:** Al hacer `docker run` o `docker-compose up`, un puerto
reporta que ya está en uso. Un caso muy específico y frecuente en este
curso:
```
Error response from daemon: ports are not available: exposing port
TCP 0.0.0.0:3306 -> 127.0.0.1:0: listen tcp 0.0.0.0:3306: bind:
Solo se permite un uso de cada dirección de socket...
```

**Causa:** Otro proceso ya está usando ese puerto. Para el puerto 3306 en
particular, la causa casi siempre es **un MySQL que ya vive en tu máquina
fuera de Docker** — muy frecuentemente XAMPP (¡el mismo que instalaste
para la Práctica 0!), o una instalación de MySQL Server que quedó
configurada para iniciar automáticamente con Windows, aunque no la hayas
abierto tú a propósito. Para 8080 o 80, suele ser Skype, IIS
("World Wide Web Publishing Service" de Windows) u otro proyecto de
Docker que dejaste corriendo.

**Solución:**
- A partir de esta práctica, el `docker-compose.yml` ya expone MySQL en el
  puerto **3307** (no 3306) del lado de tu máquina, precisamente para
  evitar este choque tan común — asegúrate de tener la versión más
  reciente del repo.
- Si el conflicto persiste (en 3307, 8080, 4000 u 8081), identifica qué lo
  está usando con el método de la siguiente sección, y detén ese programa
  o cambia el puerto expuesto (el número de la **izquierda** en
  `"host:contenedor"`, por ejemplo `"3308:3306"`).
- Revisa también qué sigue corriendo de Docker: `docker ps`, y detén lo
  que ya no necesites: `docker stop <id>`, o `docker-compose down` dentro
  de la carpeta de esa práctica.

---

## 5. Puertos ocupados: cómo saber qué los está usando

Antes de cambiar cualquier puerto a ciegas, vale la pena identificar qué
lo está ocupando — a veces es más rápido cerrar ese programa que editar
`docker-compose.yml`.

**Windows — línea de comandos (PowerShell o CMD):**
```
netstat -ano | findstr :3306
```
La última columna es el **PID** (identificador del proceso). Para saber
qué programa es:
```
tasklist /FI "PID eq <el número que salió>"
```

**Windows — más visual, sin comandos:** abre el **Monitor de recursos**
(escribe `resmon` en el menú Inicio) → pestaña **Red** → sección
**Puertos de escucha**. Ahí puedes ordenar por puerto y ver el nombre del
programa directamente, sin tener que cruzar el PID a mano.

**macOS / Linux:**
```
lsof -i :3306
```

**Si el proceso resulta ser XAMPP o un servicio de MySQL:** no necesitas
desinstalar nada — basta con apagarlo mientras trabajas en esta práctica.
Para XAMPP, usa el botón **Stop** en su panel de control (el mismo que ya
conoces de la Práctica 0). Para un servicio de MySQL de Windows, búscalo
en `services.msc` y detenlo ahí, o configúralo para que no inicie
automáticamente si vas a usar Docker con frecuencia.

*(Este método de `netstat`/`resmon` no es exclusivo de Docker — te va a
servir en cualquier materia donde levantes un servidor local, XAMPP
incluido.)*

---

## 6. Docker Desktop pide reiniciar en bucle, o el ícono nunca termina de cargar

**Causa común:** Un antivirus de terceros (no el Defender de Windows) o
una política de seguridad institucional está bloqueando Hyper-V o el
servicio de virtualización.

**Solución:** Revisa si tienes instalado un antivirus distinto al de
Windows y agrega una excepción para Docker Desktop. Si tu equipo es
institucional (de la universidad) y sigue sin funcionar, es posible que
tenga políticas restringidas — consulta con el área de sistemas.

---

## 7. (Mac con Apple Silicon: M1/M2/M3) "no matching manifest for linux/arm64" o el contenedor no arranca

**Causa:** Algunas imágenes de Docker Hub no publican una versión para
arquitectura ARM (Apple Silicon).

**Solución:** Agrega `platform: linux/amd64` al servicio correspondiente
en `docker-compose.yml`. Corre un poco más lento (emulado), pero
funciona.

---

## 8. "npm no se reconoce como nombre de un cmdlet..." (o "npm: command not found")

**Síntoma:** Al correr `npm install` o `npm test` fuera de Docker (por
ejemplo, en la Práctica 4, para `test_domain.js`), PowerShell o la
terminal responde que `npm` no existe.

**Causa:** Node.js no está instalado en tu máquina — hasta ahora, todas
las prácticas corrían completamente dentro de Docker, así que nunca hizo
falta. A partir de la Práctica 4, `test_domain.js` se corre a propósito
**fuera** de Docker, y eso requiere que tu máquina tenga su propio
`node`/`npm`.

**Solución:**
1. Instala Node.js (versión LTS) desde https://nodejs.org — o, en
   Windows, desde PowerShell como administrador: `winget install OpenJS.NodeJS.LTS`
2. **Cierra y vuelve a abrir tu terminal.** Es el paso que más se
   olvida — el `PATH` no se actualiza en una ventana que ya estaba
   abierta antes de instalar.
3. Confirma con `node --version` y `npm --version` — ambos deben mostrar
   un número de versión.

---

## ¿Cómo confirmar que mi máquina puede correr Docker, antes de instalar?

- **Windows:** Administrador de tareas > pestaña Rendimiento > CPU >
  confirma que diga "Virtualización: Habilitada".
- También puedes correr `systeminfo` en PowerShell y revisar la sección
  "Requisitos de Hyper-V" — todos los renglones deben decir "Sí".

## Si nada de esto resuelve tu problema (Docker)

Escríbele al profesor con:
1. Captura de pantalla del error **exacto** (texto completo, no solo
   "no me funciona").
2. Sistema operativo (Windows/Mac/Linux) y si es equipo propio o
   institucional.
3. El resultado de correr `docker --version` y, si el comando corre,
   también `docker info`.

---

# Parte 2 — Descargar solo la práctica que necesitas (Git)

El repositorio completo tiene 9 prácticas — no necesitas descargarlo
entero cada vez que trabajas en una. Como ya usaron Git en el taller
correspondiente de Métodos Ágiles, aquí van las opciones desde terminal.

## Opción A — La más simple: clonar todo una sola vez

Si no te preocupa tener las 9 carpetas en tu disco (el repo es solo
código y texto, no pesa casi nada), esta es la opción más simple y con
menos pasos:

```
git clone <URL-del-repositorio>
cd gestor-tareas-arquitecturas
```

Y luego simplemente entras a la carpeta de la práctica que toca
(`cd 03-capas-mvc`). Un solo `clone` te sirve para las 9 prácticas del
semestre — no necesitas repetirlo.

## Opción B — Descargar (sparse-checkout) solo una carpeta

Si prefieres que tu carpeta local solo muestre la práctica en la que
estás trabajando — por ejemplo, para no confundirte con archivos de
otras prácticas — usa `git sparse-checkout`:

```
git clone --no-checkout <URL-del-repositorio>
cd gestor-tareas-arquitecturas
git sparse-checkout init --cone
git sparse-checkout set 03-capas-mvc
git checkout main
```

Esto descarga el repositorio completo por dentro (el historial), pero
solo **muestra** en tu carpeta de trabajo `03-capas-mvc/` (más los
archivos generales de la raíz, como este FAQ y el README principal).

**Para cambiar a otra práctica más adelante**, no necesitas volver a
clonar — solo cambia qué carpeta quieres ver:

```
git sparse-checkout set 04-hexagonal
```

**Para ver varias carpetas a la vez** (por ejemplo, si quieres comparar
dos prácticas con el explorador de archivos de tu sistema, no solo con
GitHub):

```
git sparse-checkout set 03-capas-mvc 04-hexagonal
```

**Para volver a ver el repositorio completo:**

```
git sparse-checkout disable
```

## ¿Cuál opción debería usar?

- Si tu computadora tiene espacio de sobra y no te estorba ver las 9
  carpetas: usa la **Opción A** — es un comando menos que recordar.
- Si prefieres que tu explorador de archivos solo muestre la práctica
  activa (o si de plano quieres practicar `sparse-checkout` porque ya
  lo vieron en el taller de Git): usa la **Opción B**.

## Si nada de esto resuelve tu problema (Git)

Revisa primero el material del taller de Git de Métodos Ágiles — cubre
los comandos básicos de `clone`, `pull` y `checkout` con más detalle. Si
el problema persiste, escríbele al profesor con el mensaje de error
exacto que te muestra la terminal.

