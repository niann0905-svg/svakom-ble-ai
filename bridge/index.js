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

app.post("/mcp", (req, res) => {
  if (req.query.secret !== SECRET) return res.status(403).end();
  const { tool, params } = req.body;
  if (tool === "toy_status") {
    const online = Date.now() - lastSeen < 5000;
    return res.json({ result: online ? "在线" : "离线" });
  }
  if (tool === "toy_set_speed") {
    pendingCommand = { action: "speed", value: params.speed };
    return res.json({ result: "已发送" });
  }
  if (tool === "toy_set_pattern") {
    pendingCommand = { action: "pattern", mode: params.mode, level: params.level };
    return res.json({ result: "已发送" });
  }
  if (tool === "toy_stop") {
    pendingCommand = { action: "stop" };
    return res.json({ result: "已发送" });
  }
  res.status(400).json({ error: "未知工具" });
});

app.get("/mcp", (req, res) => {
  res.json({
    tools: [
      { name: "toy_status", description: "查询蓝牙中继是否在线", parameters: {} },
      { name: "toy_set_speed", description: "设置强度0到1", parameters: { speed: { type: "number" } } },
      { name: "toy_set_pattern", description: "设置振动花样", parameters: { mode: { type: "number" }, level: { type: "number" } } },
      { name: "toy_stop", description: "停止", parameters: {} }
    ]
  });
});

app.listen(process.env.PORT || 3000, () => console.log("启动成功"));
