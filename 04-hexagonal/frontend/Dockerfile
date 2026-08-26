FROM nginx:alpine

# Copiamos los archivos estáticos directamente a la carpeta que Nginx sirve
# por defecto. Nginx aquí NO actúa como proxy hacia el backend — solo sirve
# archivos. El navegador llama al backend directamente por su propio puerto.
# (La idea de "proxy inverso" se verá más adelante, en Microservicios.)
COPY public/ /usr/share/nginx/html/

EXPOSE 80
