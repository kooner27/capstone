
# **Capstone Note-Taking App**
## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Please try to use Linux for development.\
For grading please try to use the linux running instructions.\
Although windows development instructions are given later, it is much easier to setup on linux.
## **Running Inustructions for Developers (Linux)**
### **1. Install prerequisites**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
pip3 --version
python3 --version
node --version
```
It is recommended to install nodejs for linux using nvm with npm:\
https://nodejs.org/en/download

If MongoDB is not installed on your system, install it:
https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#std-label-install-mdb-community-ubuntu
Do not use sudo apt install mongodb. Get the community edition. Also the vscode mongodb extension and mongosh maybe useful for development to see your collections.

---


### **2. Clone the Repository**
Clone the repository to your local machine from github or the git ECE server.

```bash
git clone https://github.com/kooner27/capstone.git
cd capstone
```

---
### **3. Start MongoDB Locally**
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
---
### **4. Set Up a Virtual Environment**
Create and activate a Python virtual environment:

  ```bash
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  ```
---

### **5. Install Required Dependencies**
Ensure all dependencies are installed using `requirements.txt`:

```bash
pip3 install -r requirements.txt
```

### **6. Start the Flask Backend**
Once MongoDB is running, start the backend. Remember to do it in a venv.

```bash
python3 app.py
```

By default, Flask will run on http://127.0.0.1:5000.\
Check the api status endpoint in your browser:\
http://127.0.0.1:5000/api/\
alternatively you can check with curl:\
curl http://127.0.0.1:5000/api/

---

## **Frontend Setup (Electron + React)**

### **7. Navigate to the Electron App**
```bash
cd electron-note-app
```

### **8. Install Dependencies**
```bash
npm install
```

### **9. Start the Electron App**
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

# Mongo setup
cd backend
mkdir mongodb-data
mongod --dbpath=mongodb-data

# Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 app.py

# Frontend Setup
cd electron-note-app
npm install
npm run dev
```
---

## **Running Inustructions for Developers (Windows)**
Please install python, nodejs, mongodb:\
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


## **Testing Instructions**

### **Backend Testing**
Please follow the running instructions.
You need to have at least MongoDB running. Other components are optional.

```bash
# Navigate to the project directory
cd capstone
cd backend

# Run the test script
bash run_tests.sh
```
---

### **Frontend and End to End testing**
Again please follow the running instructions. MongoDB and Flask should be running. You do not need the Electron app itself to be running.

```bash
# Navigate to the project directory
cd capstone
cd electron-note-app

# Install test requirements
cd tests
pip3 install -r requirements.txt

# Navigate back to the electron-note-app directory
cd ..

# Run the setup script to prepare test environment
python3 tests/setup.py

# Run Playwright tests
npx playwright test
```

### **Troubleshooting Tests**
- If a test case fails, try running the setup script again: `python3 tests/setup.py`
- Some tests may fail due to timing issues if elements render too slowly
- To view detailed failure reports including screenshots and videos, click the localhost link provided in the terminal after test execution
- To run a specific test file, use: `npx playwright test tests/filename.spec.js`
