# frontend/Dockerfile
FROM nginx:alpine
COPY ./ /usr/share/nginx/html
# 可自定义 nginx.conf，默认即可
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]