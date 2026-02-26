// server.js  (Express 5.1.0)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Set proper MIME types for JavaScript modules
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// 1) serve the whole project root
app.use(express.static(path.join(__dirname)));

// 2) SPA fallback – Express 5 syntax: named wildcard inside braces
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 3) ensure literal "/" still works
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () =>
  console.log(`ARS demo running → http://localhost:${PORT}`),
);
