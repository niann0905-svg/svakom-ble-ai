import express from "express";

const app = express();
app.use(express.json());

const SECRET = process.env.BRIDGE_SECRET || "abc123";
let pendingCommand = null;
let lastSeen = 0;

app.get("/toy-poll", (req, res) => {
  if (req.query.secret !== SECRET) return res.status(403).end();
  lastSeen = Date.now();
  if (pendingCommand) {
    const cmd = pendingCommand;
    pendingCommand = null;
    res.json(cmd);
  } else {
    res.json({ action: "none" });
  }
});

app.get("/mcp", (req, res) => {
  if (req.query.secret !== SECRET) return res.status(403).end();
  res.json({
    schema_version: "v1",
    name_for_human: "Toy Controller",
    name_for_model: "toy_controller",
    description_for_human: "控制SVAKOM玩具",
    description_for_model: "控制蓝牙玩具的强度和振动花样",
    auth: { type: "none" },
    api: { type: "openapi", url: `https://${req.headers.host}/openapi.json?secret=${req.query.secret}` }
  });
});

app.get("/openapi.json", (req, res) => {
  if (req.query.secret !== SECRET) return res.status(403).end();
  res.json({
    openapi: "3.0.0",
    info: { title: "Toy Controller", version: "1.0.0" },
    servers: [{ url: `https://${req.headers.host}` }],
    paths: {
      "/toy/speed": {
        post: {
          operationId: "toy_set_speed",
          summary: "设置玩具强度",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    speed: { type: "number", description: "强度0到1" },
                    secret: { type: "string" }
                  }
                }
              }
            }
          },
          responses: { "200": { description: "成功" } }
        }
      },
      "/toy/stop": {
        post: {
          operationId: "toy_stop",
          summary: "停止玩具",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { secret: { type: "string" } }
                }
              }
            }
          },
          responses: { "200": { description: "成功" } }
        }
      },
      "/toy/status": {
        get: {
          operationId: "toy_status",
          summary: "查询是否在线",
          parameters: [{ name: "secret", in: "query", schema: { type: "string" } }],
          responses: { "200": { description: "成功" } }
        }
      }
    }
  });
});

app.post("/toy/speed", (req, res) => {
  if (req.body.secret !== SECRET) return res.status(403).end();
  pendingCommand = { action: "speed", value: req.body.speed };
  res.json({ result: "已发送" });
});

app.post("/toy/stop", (req, res) => {
  if (req.body.secret !== SECRET) return res.status(403).end();
  pendingCommand = { action: "stop" };
  res.json({ result: "已发送" });
});

app.get("/toy/status", (req, res) => {
  if (req.query.secret !== SECRET) return res.status(403).end();
  const online = Date.now() - lastSeen < 5000;
  res.json({ online, status: online ? "在线" : "离线" });
});

app.listen(process.env.PORT || 3000, () => console.log("启动成功"));
