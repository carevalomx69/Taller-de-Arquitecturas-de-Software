FROM nginx:alpine

# Reemplaza la configuración por defecto de Nginx (servir archivos) por la
# nuestra, que en vez de eso enruta peticiones a otros contenedores.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
