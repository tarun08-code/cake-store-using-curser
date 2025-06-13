Video demonstration - https://drive.google.com/drive/folders/1Tnb1AnmHiBnQQDaa5Ra-bfkErtGC6_zu?usp=sharing

🍰 Cake Store Management System
This is a full-stack web application for managing a cake store — from product listings to order management — built under some... unique circumstances. 😅

🧠 Why I Made This
Let’s be honest. This wasn’t a planned, well-paced, perfect sprint of a project. This whole thing started as a wild experiment:

I wanted to test whether AI tools like Cursor AI, ChatGPT, and Gemini AI could build an entire website from scratch. The question was simple:

Can AI actually make a fully working website?

💥 Verdict?
No.
AI can definitely help a lot — it wrote chunks of code, gave ideas, debugged a few things, and made suggestions.
But in the end, I had to manually clean up and fix every single error. AI might be fast, but it's not perfect, and it's still no replacement for real developers.

🎬 Backstory: The Midnight Hustle
This was actually a last-minute life-saver for a friend's college project (seema) . I had just 12 hours — one single night — to create this entire system because the submission deadline was the next day.

It wasn’t pretty. There was coffee, mild panic, and a lot of copy-pasting. But hey, it got done.

🛠️ Tech Stack
🌐 Frontend
HTML
CSS
JavaScript

🧩 Backend
Node.js (Express)

🗃️ Database
MongoDB (via MongoDB Atlas)
MongoDB Compas

🎯 Main Objective
The real goal behind this project was not to make a perfect cake store — it was to explore how capable AI is when it comes to building real-world projects. It was a hands-on stress test for AI-assisted development.

Spoiler: AI is a great assistant, but you still need to know your stuff 🤧.

🚀 How to Run
---

## 🧰 Prerequisites Before Running the Project

### 1. ✅ Install Node.js

Node.js is required to run the backend server.

* Go to: [https://nodejs.org](https://nodejs.org)
* Download the **LTS (Long-Term Support)** version for your OS.
* Install it — the Node.js installer will also install `npm` (Node Package Manager).

To check if it's installed properly, open your terminal and run:

```bash
node -v
npm -v
```

You should see version numbers if it worked.

---

### 2. 🍃 Set Up MongoDB Atlas (Cloud Database)

1. Go to: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. Sign up or log in.

3. Click **"Build a Database"**, choose **Shared** and select a free tier cluster.

4. Select a cloud provider (e.g., AWS) and region.

5. Create a cluster name (or leave default), then click **Create**.

6. Once your cluster is ready:

   * Click **"Connect"**
   * Choose **“Connect your application”**
   * Copy the connection string. It will look something like this:

     ```
     mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
     ```

7. Replace `<username>` and `<password>` with your Atlas credentials.

8. In your project folder, create a file called `.env` and add:

   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cake-store?retryWrites=true&w=majority
   ```

---

## 🚀 How to Run the Project

Assuming your project has a basic structure like:

```
project-folder/
│
├── backend/
│   ├── index.js
│   ├── routes/
│   ├── models/
│   └── .env
│
└── frontend/
    └── index.html
```

### 1. Install Backend Dependencies

Open terminal and go to the `backend/` folder:

```bash
cd backend
npm install
```

This will install all required npm packages (like Express, Mongoose, etc.)

---

### 2. Start the Backend Server

```bash
node index.js
```

Or if you use `nodemon` for live reloading:

```bash
npx nodemon index.js
```

You should see a message like:

```
Server running on http://localhost:5000
Connected to MongoDB
```

---

### 3. Run the Frontend

Just open `frontend/index.html` in your browser.

Or serve it using Live Server (VS Code extension) for a better experience.

---
Note - keep the (node server.js) running in terminal always while using website

Admin login - admin@cakestore.com 
              Admin@123

🙏 Final Note
This project was chaotic, rushed, and kind of fun. Thanks to the AI tools that helped — and to the bugs that reminded me humans are still needed.
