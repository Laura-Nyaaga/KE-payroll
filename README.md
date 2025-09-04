# 💼 KE Payroll System

A full-stack **HR and payroll management system** built to streamline payroll operations, automate processes, and improve data security.  
Developed using **Next.js, React, Tailwind CSS, Node.js, Express, and MySQL**.

---

## ✨ Features
- 👥 **Employee Management** — Add, update, and track employee data securely.  
- 💵 **Payroll Processing** — Automates salary computation and eliminates manual Excel workflows.  
- 📧 **Payslip Delivery** — Auto-generates and emails payslips via Gmail SMTP.  
- 🔑 **Authentication & Security** — JWT and session cookies for role-based secure access.  
- ⚙️ **CI/CD Integration** — Automated workflows with GitHub Actions.  
- 🌐 **Deployment** — Configured with Nginx reverse proxy, SSL certificates, and hosted on Namecheap.  

---

## 🧰 Tech Stack
**Frontend:** [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](#) [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](#) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](#)  
**Backend:** [![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](#) [![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](#)  
**Database:** [![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)](#)  
**Tools:** [![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](#) [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](#) [![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)](#)  

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL (local or hosted instance)
- Git


<img width="1833" height="922" alt="image" src="https://github.com/user-attachments/assets/6acce088-75b1-4dab-a0f8-5fecfca1d8f2" />
<img width="1833" height="922" alt="image" src="https://github.com/user-attachments/assets/58c96e54-159b-4a3c-a19e-eb1f4ba73454" />
<img width="1833" height="922" alt="image" src="https://github.com/user-attachments/assets/516a91c5-f8c2-4514-82c6-48eabb6238a1" />
<img width="1833" height="922" alt="image" src="https://github.com/user-attachments/assets/e3b2b8e1-421a-4c04-ac1c-ac52f46beeae" />
<img width="1833" height="922" alt="image" src="https://github.com/user-attachments/assets/1d0fc6da-d62f-41e9-9e62-efc81edc79d8" />
<img width="794" height="762" alt="image" src="https://github.com/user-attachments/assets/cc189098-c53d-429e-81ad-e20a2040811c" />

### Installation
```bash
# Clone the repository
git clone https://github.com/Laura-Nyaaga/KE-payroll.git
cd KE-payroll

# Run the frontend
cd client
npm install 
npm run dev
App will be available at: http://localhost:3000

# Run the backend
cd server
# Install dependencies
npm install
Database Setup
Create a MySQL database (e.g., ke_payroll).

Update database credentials in .env.

Run migrations or import the schema file.

📦 Deployment
Deployed with Nginx reverse proxy + SSL (Let's Encrypt).

CI/CD pipelines set up with GitHub Actions for automated builds and deploys.

