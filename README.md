
# **Capstone Note-Taking App**
## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Please try to use Linux for development and to run for grading if possible. \
Although windows development instructions are given later, it is much easier to setup on linux.
## **Running Inustructions for Developers (Linux)**
### **1. Install prerequisites**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
pip3 --version
python3 --version
```
If MongoDB is not installed on your system, install it:
https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#std-label-install-mdb-community-ubuntu
Do not use sudo apt install mongodb. Get the community edition. Also the vscode mongodb extension and mongosh maybe useful for development to see your collections.

---


### **2. Clone the Repository**
First, clone the repository to your local machine:

```bash
git clone https://github.com/your-username/capstone-note-app.git
cd capstone-note-app
```

---

### **3. Navigate to the Backend Folder**
```bash
cd backend
```

### **4. Set Up a Virtual Environment**
Create and activate a Python virtual environment:

- **Linux/macOS:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
- **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```
---

### **5. Install Required Dependencies**
Ensure all dependencies are installed using `requirements.txt`:

```bash
pip3 install -r requirements.txt
```

### **6. Start MongoDB Locally**
Start mongodb with a custom path for development: 
```bash
cd backend
mkdir mongodb-data
mongod --dbpath=mongodb-data
```
If you want auto restart on boot, admin priviliges or it running in the background you can do it this way.
In production it will be run like this but for most development please use the above method.
```bash
sudo systemctl start mongod
```


### **7. Start the Flask Backend**
Once MongoDB is running, start the backend. Remember to do it in a venv.

```bash
source venv/bin/activate
cd backend
python3 app.py
```

By default, Flask will run on **http://127.0.0.1:5000**.\
Check the api status endpoint in your browser:\
**http://127.0.0.1:5000/api/**\
alternatively you can check with curl:\
curl http://127.0.0.1:5000/api/

---

## **Frontend Setup (Electron + React)**

### **8. Navigate to the Electron App**
```bash
cd electron-note-app
```

### **9. Install Dependencies**
```bash
npm install
```

### **10. Start the Electron App**
Run the app in development mode:

```bash
npm run dev
```

This should launch the Electron app.

---

## **Summary of Commands**
```bash
# Clone repo or get access to it from the ECE git server
git clone https://github.com/kooner27/capstone.git
cd capstone

# Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
mongod --dbpath=mongodb-data
python3 app.py

# Frontend Setup
cd electron-note-app
npm install
npm run dev
```
---

## **Running Inustructions for Developers (Windows)**
Please install python, nodejs, mongodb
https://www.python.org/downloads/windows/\
https://nodejs.org/en\
https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows-unattended/\
https://www.mongodb.com/try/download/community

Make sure to choose the options for installing mongodb compass. And make sure python is in your path.\
Please install python from the website instead of using your microsoft app store installation.

```bash
python --version
pip --version
node --version
```


Start Mongodb on windows. If you installed it as a net service you can type the following command into an admin powershell instance:
```bash
net start MongoDB
```
You should now be able to use MongoDB Compass which provides a GUI for managin your connections.\
Create a new connection, leaving the URI the default one which is: mongodb://localhost:27017

Next we setup the backend:
```bash
git clone https://github.com/kooner27/capstone.git
cd capstone
cd backend
python -m venv venv
pip3 install -r requirements.txt
python app.py
```

Finally we setup the frontend and run the app
```bash
cd electron-note-app
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
npm run dev
```



## **Additional Notes**
- Ensure **MongoDB is running** before starting Flask.
- The **frontend will connect to `http://127.0.0.1:5000/api/`**.
- You may also try to use change the env file to the url shown below to test connecting to the deployed app
---
### Deployment

- Host **Flask** and **MongoDB** on a VPS
- Update the `.env` file in the frontend folder with the VPS's ip
  ```env
  VITE_API_URL=http://162.246.157.130:5000/api
- Use electron's build tools to build executable for windows and linux
---