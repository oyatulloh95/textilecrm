# TextileCRM

To'qimachilik (tekstil) kompaniyasi uchun kichik CRM tizimi. Mijozlar, mahsulotlar
(mato turlari) va buyurtmalarni boshqarish imkonini beradi. Ushbu loyiha BTEC
**Unit 6: Cloud Networking** topshirig'i doirasida bulutga (AWS) joylashtirish,
CI/CD pipeline va Auto Scaling / Load Balancing'ni amaliy ko'rsatish uchun
tayyorlangan.

## Texnologiyalar

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React (Vite) + Nginx
- **Konteynerizatsiya:** Docker, Docker Compose
- **CI/CD:** GitHub Actions (test → build → ECR push → ASG instance refresh)
- **Bulut infratuzilmasi:** AWS VPC, ALB, EC2 Auto Scaling Group (Terraform)

## Loyiha tuzilishi

```
textilecrm/
├── backend/              # FastAPI ilovasi (CRUD: customers, products, orders)
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # React (Vite) ilovasi
│   ├── src/
│   ├── nginx.conf
│   └── Dockerfile
├── aws/                  # AWS infratuzilmasi (Terraform + EC2 bootstrap)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── ec2-user-data.sh
├── .github/workflows/    # CI/CD pipeline
│   └── ci-cd.yml
└── docker-compose.yml    # Lokal ishga tushirish
```

## Lokal ishga tushirish (Docker Compose)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API hujjatlari (Swagger): http://localhost:8000/docs

## API endpointlari

| Resurs    | Metodlar                              |
|-----------|----------------------------------------|
| /customers | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| /products  | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| /orders    | GET, POST, GET/{id}, PUT/{id}, DELETE/{id} |
| /health    | GET (ALB health check uchun)          |
| /healthz   | GET (frontend, Nginx health check)    |
| /dashboard/summary | GET (umumiy statistika)        |

## CI/CD Pipeline (GitHub Actions)

`main` branchga push qilinganda quyidagi bosqichlar avtomatik ishlaydi:

1. **Build & Test** — backend va frontend kodlari kompilyatsiya/build qilinadi.
2. **Build & Push** — Docker image'lar yaratiladi va Amazon ECR'ga yuklanadi
   (`textilecrm-backend`, `textilecrm-frontend`).
3. **Deploy** — Auto Scaling Group'da "instance refresh" ishga tushiriladi —
   yangi EC2 nusxalari eng so'nggi image'larni avtomatik tortib oladi va
   eski nusxalar bosqichma-bosqich almashtiriladi (rolling deployment).

Quyidagi GitHub Secrets sozlanishi kerak:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `ASG_NAME` — Terraform `asg_name` outputi
- `VITE_API_URL` — ALB'ning public DNS manzili (masalan, `http://textilecrm-alb-xxxx.eu-central-1.elb.amazonaws.com`)

## AWS infratuzilmasi (Terraform)

`aws/` papkasida quyidagilar tasvirlangan:

- **VPC** (2 ta public subnet, 2 AZ'da — yuqori mavjudlik uchun)
- **Application Load Balancer (ALB)** — kiruvchi trafikni frontend va
  backend target group'lariga yo'naltiradi (`/customers`, `/products`,
  `/orders`, `/health` → backend; qolgani → frontend)
- **Auto Scaling Group (ASG)** — minimum 2, maksimum 6 EC2 nusxasi,
  CPU 50% bo'yicha target-tracking auto-scaling siyosati bilan
- **Launch Template + user-data** — har bir yangi EC2 nusxasi Docker'ni
  o'rnatadi, ECR'dan eng so'nggi image'larni tortib oladi va konteynerlarni
  ishga tushiradi

### Joylashtirish

```bash
cd aws
terraform init
terraform apply -var="ami_id=<sizning_AMI_ID>"
```

`terraform apply` natijasida ALB'ning public DNS manzili chiqadi — shu manzil
orqali ilova brauzerda ochiladi.

## Yuqori yuklama va auto-scaling'ni sinash

Yuklama generatori (masalan, `hey` yoki `ab`) bilan ALB manzilini
yuklab, CloudWatch'da ASG instance'lari CPU 50%'dan oshganda yangi
EC2 nusxalari avtomatik qo'shilishini va ALB ularni avtomatik target
group'ga qo'shib trafikni taqsimlashini kuzatish mumkin.
