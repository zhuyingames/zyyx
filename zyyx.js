const fs = require("fs");
const http = require("http");
const https = require("https");

const data = fs.readFileSync("res.json", "utf-8");
const json = JSON.parse(data);

const info = {};
info["assets"] = {};

function createDownloadClient(url) {
  const urlObj = new URL(url);
  const client = urlObj.protocol === "https:" ? https : http;
  return client;
}

Object.keys(json).forEach((key) => {
  if (key === "assets") {
    Object.keys(json["assets"]).forEach((name) => {
      const url = json["assets"][name];
      const client = createDownloadClient(url);
      const req = client.get(url, (res) => {
        if (res.statusCode !== 200) {
          console.error(
            `${name} download failed, status code: ${res.statusCode}`
          );
          return;
        }
        const stream = fs.createWriteStream(name);
        res.on("data", (data) => {
          stream.write(data);
        });
        res.on("end", () => {
          console.log(`${name} download completed.`);
          stream.end();
        });
      });
      req.on("error", (err) => {
        console.error(err);
      });
      info["assets"][name] = {};
    });
  }
});

fs.writeFileSync(
  "res-lock.json",
  JSON.stringify(info, null, 2) + "\n",
  "utf-8"
);
