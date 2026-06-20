# ── Giai đoạn 1: BUILD — dùng Node để build React/Vite ra thư mục dist ──
FROM node:20-alpine AS build
WORKDIR /app

# Copy file khai báo thư viện trước để cache lớp cài đặt
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn rồi build.
# Vite tự đọc .env.production khi build → bake sẵn URL của VPS vào bundle.
COPY . .
RUN npm run build

# ── Giai đoạn 2: SERVE — Nginx phục vụ các file tĩnh đã build ──
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
