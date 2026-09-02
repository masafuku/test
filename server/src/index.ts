import express from "express";
import path from "node:path";
import { clubsRouter } from "./routes/clubs";
import { shotsRouter } from "./routes/shots";
import { shotsFromTextRouter } from "./routes/shotsFromText";
import { sessionsRouter } from "./routes/sessions";

// CommonJS output (see server/tsconfig.json) provides __dirname natively.
const app = express();

app.use(express.json());

app.use("/api/clubs", clubsRouter);
// Mounted before /api/shots so it isn't shadowed by shotsRouter's own routes.
app.use("/api/shots/from-text", shotsFromTextRouter);
app.use("/api/shots", shotsRouter);
app.use("/api/sessions", sessionsRouter);

// Serve the built client as static files in production (npm run build -w client first).
// nginx strips the /golf/ prefix before proxying here (see deploy/nginx.conf.example),
// so this process serves everything at its own root.
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

const port = Number(process.env.PORT ?? 4002);
app.listen(port, () => {
  console.log(`golf-app server listening on :${port}`);
});
