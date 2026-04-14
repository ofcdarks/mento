# Usamos uma imagem super leve de servidor web (Alpine Nginx)
FROM nginx:alpine

# Copiamos todos os arquivos locais pra pasta pública do Web Server
COPY . /usr/share/nginx/html

# Expõe a rede padrão pra web
EXPOSE 80

# Inicia o serviço do Nginx
CMD ["nginx", "-g", "daemon off;"]
