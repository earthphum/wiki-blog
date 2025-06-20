# 📝 Wiki-Blog

**Wiki-Blog** is a simple, modern, Markdown-based wiki/blog application.  
It allows users to view, create, and edit `.md` files directly through a web interface.  
All content is stored on the server's file system, making it easy to manage and back up.

The app features real-time Markdown preview, a responsive UI, and basic authentication for editing.

---

## 🧱 Tech Stack

### Frontend

- React.js
- Tailwind CSS
- Axios
- react-markdown + remark-gfm
- Lunr.js (for search)
- react-syntax-highlighter

### Backend

- Node.js + Express.js
- `fs.promises` (read/write .md files)
- body-parser, cookie-parser, express-session, cors

---

## ⚙️ How to Run

### Backend

```bash
cd wiki-blog/backend
npm install
mkdir content              # Folder to store Markdown files
node index.js              # Runs at http://localhost:3001
```

### frontend

```bash
cd wiki-blog/frontend
npm install
npm run dev                # Opens at http://localhost:5173
```

### Login default !!

```bash
Username: admin
Password: password
```

### Quick Setup

```bash
chmod +x setup.sh kill.sh
./setup.sh
./kill.sh
```
