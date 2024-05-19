const fs = require("fs");

const data = fs.readFileSync("res.json", "utf-8");
const json = JSON.parse(data);

const info = {};
info["assets"] = {};

Object.keys(json).forEach((key) => {
  if (key === "assets") {
    Object.keys(json["assets"]).forEach((name) => {
      const url = json["assets"][name];
      info["assets"][name] = {};
    });
  }
});

fs.writeFileSync(
  "res-lock.json",
  JSON.stringify(info, null, 2) + "\n",
  "utf-8"
);
