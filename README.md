# Restaurant Management System

## 1. Giới thiệu

Restaurant Management System là hệ thống quản lý nhà hàng được triển khai bằng Docker Compose.

Hệ thống hỗ trợ quản lý món ăn, bàn ăn và đơn hàng. Ngoài chức năng nghiệp vụ, hệ thống còn tích hợp Reverse Proxy, giám sát hệ thống, thu thập log tập trung và các cấu hình hardening nhằm tăng tính an toàn khi triển khai.

## 2. Chức năng chính

- Dashboard tổng quan nhà hàng.
- Quản lý món ăn.
- Thêm, sửa và xóa món ăn.
- Quản lý bàn ăn.
- Quản lý đơn hàng.
- Theo dõi doanh thu.
- Kiểm tra trạng thái kết nối cơ sở dữ liệu.
- Giám sát hệ thống bằng Prometheus và Grafana.
- Thu thập log tập trung bằng Loki và Promtail.

## 3. Công nghệ sử dụng

### Application
- Node.js
- Express.js
- HTML
- CSS
- JavaScript

### Database
- PostgreSQL 15
- pgAdmin 4

### Infrastructure
- Docker
- Docker Compose
- Nginx

### Monitoring
- Prometheus
- Grafana
- cAdvisor
- PostgreSQL Exporter

### Logging
- Loki
- Promtail

## 4. Kiến trúc hệ thống

Luồng truy cập ứng dụng:

```text
Client
  |
  v
Nginx :80
  |
  v
Node.js / Express :3000
  |
  v
PostgreSQL :5432
```

Hệ thống monitoring:

```text
Application --------\
PostgreSQL Exporter ---> Prometheus ---> Grafana
cAdvisor -----------/
```

Hệ thống logging:

```text
Docker Containers
       |
       v
    Promtail
       |
       v
      Loki
       |
       v
    Grafana
```

## 5. Cấu trúc thư mục

```text
restaurant-management/
├── app/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── database/
│   └── init.sql
├── nginx/
│   └── default.conf
├── prometheus/
│   └── prometheus.yml
├── loki/
│   └── loki-config.yml
├── promtail/
│   └── promtail-config.yml
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 6. Các Docker Service

Hệ thống gồm các container:

- restaurant-app
- restaurant-postgres
- restaurant-pgadmin
- restaurant-nginx
- restaurant-prometheus
- restaurant-grafana
- restaurant-cadvisor
- restaurant-postgres-exporter
- restaurant-loki
- restaurant-promtail

## 7. Cấu hình môi trường

Tạo file `.env` tại thư mục gốc của project.

Ví dụ:

```env
POSTGRES_DB=restaurant_db
POSTGRES_USER=restaurant_user
POSTGRES_PASSWORD=your_strong_password

PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=your_strong_password
```

Không commit file `.env` lên GitHub.

File `.gitignore` đã cấu hình bỏ qua:

```text
.env
node_modules/
*.log
*.bak
```

## 8. Khởi chạy hệ thống

Tại thư mục project:

```bash
sudo docker-compose up -d --build
```

Kiểm tra các container:

```bash
sudo docker-compose ps
```

Dừng hệ thống:

```bash
sudo docker-compose down
```

Không sử dụng `docker-compose down -v` nếu muốn giữ dữ liệu PostgreSQL và Grafana.

## 9. Địa chỉ truy cập

Thay `<SERVER_IP>` bằng địa chỉ IP của máy chủ.

| Dịch vụ | Địa chỉ |
|---|---|
| Restaurant Management | `http://<SERVER_IP>` |
| pgAdmin | `http://<SERVER_IP>:5050` |
| Prometheus | `http://<SERVER_IP>:9090` |
| Grafana | `http://<SERVER_IP>:3001` |

Loki chỉ được expose trong Docker network và không public trực tiếp port 3100 ra bên ngoài.

## 10. Kiểm tra ứng dụng

Kiểm tra API Health:

```bash
curl http://localhost/api/health
```

Kết quả:

```json
{
  "status": "OK",
  "database": "CONNECTED"
}
```

Kiểm tra HTTP Security Headers:

```bash
curl -I http://localhost
```

## 11. Nginx Reverse Proxy

Nginx tiếp nhận request tại port 80 và chuyển tiếp tới container `restaurant-app` tại port 3000.

Một số cấu hình bảo mật được sử dụng:

- Ẩn phiên bản Nginx.
- X-Frame-Options.
- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Giới hạn kích thước request.
- Thiết lập proxy timeout.

## 12. Monitoring

Prometheus thu thập metrics từ:

- Node.js application.
- cAdvisor.
- PostgreSQL Exporter.

Grafana sử dụng Prometheus làm Data Source để trực quan hóa:

- Trạng thái dịch vụ.
- CPU Usage.
- Memory Usage.
- PostgreSQL Status.

Endpoint metrics của ứng dụng:

```text
/metrics
```

## 13. Logging

Promtail thu thập log của các Docker container và gửi tới Loki.

Grafana sử dụng Loki làm Data Source.

Một số LogQL Query:

```logql
{container="restaurant-app"}
```

```logql
{container="restaurant-nginx"}
```

```logql
{container=~".+"} |~ "(?i)error|failed|exception"
```

## 14. Security Hardening

Các biện pháp hardening đã áp dụng:

- Application container chạy bằng user `node`, không chạy bằng root.
- Sử dụng `no-new-privileges`.
- PostgreSQL không public port 5432 ra host.
- Node.js application không public port 3000 ra host.
- Loki không public port 3100 ra host.
- Truy cập ứng dụng thông qua Nginx Reverse Proxy.
- Ẩn thông tin `X-Powered-By` của Express.
- Ẩn phiên bản Nginx.
- Sử dụng HTTP Security Headers.
- Thông tin mật khẩu được lưu trong `.env`.
- `.env` không được commit lên Git.

## 15. Kiểm tra Hardening

Kiểm tra user của application container:

```bash
sudo docker inspect restaurant-app --format 'User={{.Config.User}}'
```

Kết quả mong muốn:

```text
User=node
```

Kiểm tra `no-new-privileges`:

```bash
sudo docker inspect restaurant-app --format 'SecurityOpt={{.HostConfig.SecurityOpt}}'
```

Kết quả:

```text
SecurityOpt=[no-new-privileges:true]
```

## 16. Kết luận

Hệ thống Restaurant Management đã được container hóa bằng Docker Compose và tích hợp đầy đủ các thành phần ứng dụng, cơ sở dữ liệu, Reverse Proxy, Monitoring, Logging và Security Hardening.

Hệ thống có thể được sử dụng để minh họa quy trình triển khai và quản trị một hệ thống phần mềm trên môi trường Linux.
