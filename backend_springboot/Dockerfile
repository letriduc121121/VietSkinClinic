# ── Giai đoạn 1: BUILD — dùng Maven + JDK 17 để biên dịch ra file .jar ──
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom trước để Docker cache lớp tải thư viện (chỉ tải lại khi pom đổi)
COPY pom.xml .
COPY .mvn ./.mvn
RUN mvn -q -B dependency:go-offline || true

# Copy mã nguồn rồi đóng gói (bỏ qua test cho nhanh)
COPY src ./src
RUN mvn -q -B clean package -DskipTests

# ── Giai đoạn 2: RUN — ảnh gọn chỉ chứa Java Runtime để chạy .jar ──
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
