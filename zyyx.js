const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

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
        if (!fs.existsSync("assets")) {
          fs.mkdirSync("assets");
        }
        const basename = path.basename(name);
        const tempDir = path.join(__dirname, "assets", "temp");
        const saveFilePath = path.join(__dirname, "assets", basename);
        const tempFilePath = path.join(__dirname, "assets", "temp", basename);
        let filePath = saveFilePath;
        let isTemp = false;
        if (fs.existsSync(saveFilePath)) {
          filePath = tempFilePath;
          isTemp = true;
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
          }
        }
        const stream = fs.createWriteStream(filePath);
        stream.on("close", () => {
          if (isTemp) {
            const saveContent = fs.readFileSync(saveFilePath);
            const tempContent = fs.readFileSync(tempFilePath);
            if (saveContent.equals(tempContent)) {
              console.log(`${name} is up to date.`);
            }
            fs.rmSync(tempFilePath);
            fs.rmdirSync(tempDir);
          } else {
            console.log(`${name} download completed.`);
          }
        });
        res.on("data", (data) => {
          stream.write(data);
        });
        res.on("end", () => {
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
