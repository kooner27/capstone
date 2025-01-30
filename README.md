
# **Capstone Note-Taking App**
## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## **Getting Started with Development**

### **1. Clone the Repository**
First, clone the repository to your local machine:

```bash
git clone https://github.com/your-username/capstone-note-app.git
cd capstone-note-app
```

---

## **Backend Setup (Flask + MongoDB)**

### **2. Navigate to the Backend Folder**
```bash
cd backend
```

### **3. Set Up a Virtual Environment**
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

### **4. Install Required Dependencies**
Ensure all dependencies are installed using `requirements.txt`:

```bash
pip install -r requirements.txt
```

### **5. Install MongoDB**
If MongoDB is not installed on your system, install it:

https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#std-label-install-mdb-community-ubuntu

Do not use sudo apt install mongodb. Get the community edition. Also the vscode mongodb extension and mongosh maybe useful for development to see your collections.

### **6. Start MongoDB Locally**
I like to run it manually with a custom dbpath so i can see the collections in vscode and output on the terminal.
I think this is better for development:
```bash
cd backend
mkdir mongodb-data
mongod --dbpath=mongodb-data
```
Or if you want auto restart on boot, admin privileges, logging and config managed, and it running in the background.
Of course in production it will be run like this:
```bash
sudo systemctl start mongod
```


### **7. Start the Flask Backend**
Once MongoDB is running, start the backend. Remember to do it in a venv.

```bash
source venv/bin/activate
cd backend
python app.py
```

By default, Flask will run on **http://127.0.0.1:5000**. Open your browser and check if it’s running.

Check **http://127.0.0.1:5000/api**
and **http://127.0.0.1:5000/api/notes**

---

## **Frontend Setup (Electron + React)**

### **8. Navigate to the Electron App**
```bash
cd ../electron-note-app
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
# Clone repo
git clone https://github.com/your-username/capstone-note-app.git
cd capstone-note-app

# Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mongod --dbpath=mongodb-data
python3 app.py

# Frontend Setup
cd ../electron-note-app
npm install
npm run dev
```
---

## **Additional Notes**
- Ensure **MongoDB is running** before starting Flask.
- The **frontend will connect to `http://127.0.0.1:5000/api`**.


For deployment we will use mongodb atlas for the database. Then we just have to change the .env in the backend folder to use the cloud URI. The flask rest api can be hosted on vps. We just need to change the .env in the electron-note-app folder to use the hosted flask api url instead of localhost. We can run the electron build script to generate app images for linux or .exe for windows.

---