**PROJECT DEPLOYMENT DETAILS – SCANID365 Backend (EC2 + RDS PostgreSQL)**

**1. Server Overview:**

* **EC2 Instance Public IP / DNS**: Use this to SSH into the server.
* **OS**: Ubuntu (Amazon EC2)
* **Backend Type**: Node.js (with Sequelize + PostgreSQL)
* **Database**: AWS RDS PostgreSQL (`scanid365`)

---

**2. SSH into EC2 Instance**

Run the following command from your local machine:

```
ssh -i scanid365-backend.pem ubuntu@13.60.168.128
```

Replace:

* `/path/to/your-key.pem` with your `.pem` file path
* `<EC2_PUBLIC_IP>` with your EC2’s public IP address

---

**3. Backend App Location**

After logging into the server, your backend project is located at:

```
/home/ubuntu/backend
```

---

**4. Start / Restart the Server**

This project uses **PM2** to run the Node.js server.

**Start the server** (if not already running):

```
cd ~/backend
pm2 start ecosystem.config.js --env production
```

**Restart the server**:

```
pm2 restart all
```

**Stop the server**:

```
pm2 stop all
```

**View PM2 logs**:

```
pm2 logs
```

---

**5. Check Database Connection**

The server connects to a PostgreSQL database hosted on AWS RDS.

**Database details:**

* Host: `scanid365.c3gkcu2weu28.eu-north-1.rds.amazonaws.com`
* Port: `5432`
* Database: `postgres` *(Note: there is no custom `scanid365` database)*
* User: `scanid365`
* Password: `scanid365`

To manually test the DB connection from EC2:

```
PGPASSWORD=scanid365 psql -h scanid365.c3gkcu2weu28.eu-north-1.rds.amazonaws.com -p 5432 -U scanid365 -d postgres
```

---

**6. Important Notes**

* **Security Group**: Ensure port `5432` is open in **inbound rules** for your EC2 security group. Set the source to `Custom` → `Your EC2 private IP` or `0.0.0.0/0` (for open access, not recommended for production).
* **Environment Variables** are defined in your project under `.env.production`.
* The `ecosystem.config.js` file defines the production start command for PM2.

---

**7. To Deploy New Code:**

From your local machine:

* Connect via SSH
* Pull the latest code from Git or deploy manually
* Run:

  ```
  pm2 restart all
  ```

---

Let me know if you'd like this as a downloadable file or want to add deployment via GitHub Actions or CI/CD in future.
