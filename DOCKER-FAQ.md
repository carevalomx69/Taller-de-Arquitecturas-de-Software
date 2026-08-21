# FAQ Técnico: Instalación y arranque de Docker

Esta sección recopila los problemas de instalación más frecuentes que
hemos visto en clase, con su solución paso a paso. Si Docker Desktop no
arranca o algo falla antes de siquiera llegar a `docker build`, puedes revisar
aquí primero antes de consultar al profesor.

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
reporta que ya está en uso.

**Causa:** Otro proceso — muy probablemente un contenedor de una práctica
anterior que no cerraste — ya está usando ese puerto.

**Solución:**
- Revisa qué sigue corriendo: `docker ps`
- Detén lo que ya no necesites: `docker stop <id>`, o `docker-compose down`
  dentro de la carpeta de esa práctica.
- Si necesitas correr dos prácticas al mismo tiempo, cambia el puerto
  expuesto (por ejemplo `-p 3001:3000` en vez de `-p 3000:3000`).

---

## 5. Docker Desktop pide reiniciar en bucle, o el ícono nunca termina de cargar

**Causa común:** Un antivirus de terceros (no el Defender de Windows) o
una política de seguridad institucional está bloqueando Hyper-V o el
servicio de virtualización.

**Solución:** Revisa si tienes instalado un antivirus distinto al de
Windows y agrega una excepción para Docker Desktop. Si tu equipo es
institucional (de la universidad) y sigue sin funcionar, es posible que
tenga políticas restringidas — consulta con el área de sistemas.

---

## 6. (Mac con Apple Silicon: M1/M2/M3) "no matching manifest for linux/arm64" o el contenedor no arranca

**Causa:** Algunas imágenes de Docker Hub no publican una versión para
arquitectura ARM (Apple Silicon).

**Solución:** Agrega `platform: linux/amd64` al servicio correspondiente
en `docker-compose.yml`. Corre un poco más lento (emulado), pero
funciona.

---

## ¿Cómo confirmar que mi máquina puede correr Docker, antes de instalar?

- **Windows:** Administrador de tareas > pestaña Rendimiento > CPU >
  confirma que diga "Virtualización: Habilitada".
- También puedes correr `systeminfo` en PowerShell y revisar la sección
  "Requisitos de Hyper-V" — todos los renglones deben decir "Sí".

## Si nada de esto resuelve tu problema

Escríbele al profesor con:
1. Captura de pantalla del error **exacto** (texto completo, no solo
   "no me funciona").
2. Sistema operativo (Windows/Mac/Linux) y si es equipo propio o
   institucional.
3. El resultado de correr `docker --version` y, si el comando corre,
   también `docker info`.
