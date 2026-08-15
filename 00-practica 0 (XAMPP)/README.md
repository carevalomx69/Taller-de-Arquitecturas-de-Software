# Práctica 0 — Disección de XAMPP

## Objetivo

Antes de tocar Docker, vamos a diseccionar algo que ya conocen: XAMPP. La
meta no es aprender PHP — es que "monolito" deje de ser una palabra
abstracta y se convierta en algo que ya vieron con sus propios ojos:
Apache, MySQL y su código, todos corriendo juntos en la misma máquina, sin
separación de red.

**Nota para el grupo:** esta práctica usa un dominio distinto al del
gestor de tareas que usarán en las 9 prácticas de Docker (aquí es una
mini "biblioteca": lectores y préstamos). Es intencional — no queremos que
se mezcle con el hilo conductor del semestre; esta es solo la demostración
de un día.

## Qué construimos sobre la práctica anterior

Nada — es la Práctica 0. Es anterior incluso a la Práctica 1 (Monolito con
Docker) y no depende de ella. Lo que sí construye es el **modelo mental**
que usarán al llegar a Docker: cuando vean `docker-compose up` levantando un
contenedor de MySQL y uno de la app por separado, ya habrán vivido antes,
en XAMPP, lo que significa que esas dos cosas normalmente están juntas.

## Requisitos previos

- Instalar XAMPP: https://www.apachefriends.org/ (Windows, macOS o Linux).
- Ninguna experiencia previa en PHP — no la necesitas para esta práctica.

## Estructura de archivos

```
00-practica-0-xampp/
├── README.md
├── sql/
│   └── schema.sql       ← crea la base de datos y las tablas de ejemplo
└── php/
    └── index.php        ← el "monolito": un solo archivo resuelve todo
```

## Instrucciones paso a paso

### Fase 1 — El panel de control: ¿qué se prende y se apaga?

1. Abre el Panel de Control de XAMPP y dale **Start** a **Apache**.
   - Apache no es "una página" — es un programa que se queda escuchando el
     puerto 80 (o 443) de la red, esperando peticiones.
2. Dale **Start** a **MySQL**.
   - Es un motor de datos completamente independiente de Apache — se
     enciende y se apaga por su cuenta.
3. **Demostración de red:** con Apache encendido, apaga MySQL. Entra a
   cualquier proyecto que use base de datos y observa el error de
   conexión. Apache sigue vivo, pero la app no funciona — eso ya es una
   pista de cuántas piezas independientes hay detrás de "una sola
   aplicación".

### Fase 2 — La anatomía de `htdocs`: ¿dónde vive el código?

1. Copia la carpeta `php/` de esta práctica a
   `C:/xampp/htdocs/biblioteca-monolito/` (Windows) o la ruta equivalente
   de `htdocs` en tu sistema operativo.
2. Abre `http://localhost/phpmyadmin/`, crea una nueva consulta y pega el
   contenido de `sql/schema.sql` para crear la base de datos y las tablas.
3. Abre `http://localhost/biblioteca-monolito/` en el navegador. Deberías
   ver una respuesta JSON con los datos de un préstamo.
4. En Chrome, haz clic derecho → **Ver código fuente**. Nota que no hay
   ni rastro de `<?php ... ?>` — el servidor lo ejecutó y desapareció,
   dejando solo el resultado. El navegador nunca ve PHP, solo su salida.

### Fase 3 — La disección del monolito

1. Abre `php/index.php` y ubica la consulta SQL (`INNER JOIN`). Un solo
   archivo, una sola conexión, puede leer datos de lectores *y* de
   préstamos al mismo tiempo, sin pedirle permiso a nadie más.
2. **Condición 1 — despliegue unificado:** si borraras la carpeta
   `biblioteca-monolito/` completa, se va todo el negocio: la lógica, las
   rutas, todo. No hay manera de "borrar solo una parte".
3. **Condición 2 — base de datos central:** vuelve a apagar MySQL desde el
   panel de XAMPP y refresca la página. Aunque el código PHP esté
   perfectamente intacto, la aplicación completa colapsa. Un solo punto de
   falla para *todas* las funciones del sistema.
4. **El experimento modular (a nivel conceptual, sin implementarlo):**
   imagina dos carpetas separadas, `htdocs/servicio-lectores/` y
   `htdocs/servicio-prestamos/`, cada una con su propio `index.php` y
   pensando en su propia base de datos. Discute con el grupo: ¿qué tendría
   que pasar para que `servicio-prestamos` supiera el nombre de un lector,
   si ya no puede hacer el `INNER JOIN` directo? (No lo vamos a programar
   hoy — esa implementación real la haremos, con mejores herramientas,
   cuando lleguemos a la Práctica 5 de microservicios.)

## Qué deberías observar

- Apache y MySQL son procesos independientes, aunque los enciendas desde
  el mismo panel — ya estás viendo "servicios separados en una misma
  máquina" antes incluso de tocar Docker.
- El monolito no es solo "poco código" — es la *ausencia de fronteras*
  entre las partes: cualquier línea del archivo puede tocar cualquier dato.
- Un solo punto de falla (la base de datos) puede tumbar una aplicación
  entera, sin que el código tenga ningún error.

## Preguntas de reflexión

1. Cuando apagaste MySQL y la app dejó de funcionar, ¿se cayó "la red" o
   se cayó "el software"? ¿Por qué importa esa distinción?
2. ¿Qué tendría que cambiar en `index.php` si `servicio-lectores` y
   `servicio-prestamos` vivieran en bases de datos completamente separadas?
3. XAMPP hace que Apache, MySQL y tu código convivan en una sola máquina.
   ¿Es eso lo mismo que "un solo proceso"? ¿En qué se parece y en qué no
   se parece a lo que vamos a ver como "Monolito" en la Práctica 1 con
   Docker?

## Entregable

Esta práctica **no se califica** — es una demostración guiada en clase.
Si quieres una constancia de participación, pide a los alumnos una
captura de pantalla del JSON de respuesta en su navegador.
