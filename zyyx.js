#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const data = fs.readFileSync("res.json", "utf-8");
const json = JSON.parse(data);

let info = {};
if (fs.existsSync("res-lock.json")) {
  const lockData = fs.readFileSync("res-lock.json", "utf-8");
  info = JSON.parse(lockData);
} else {
  info["assets"] = {};
}

function createDownloadClient(url) {
  const urlObj = new URL(url);
  const client = urlObj.protocol === "https:" ? https : http;
  return client;
}

let assetLength = 0;
let assetIndex = 0;
const tempDir = path.join(__dirname, "assets", "temp");

Object.keys(json).forEach((key) => {
  if (key === "assets") {
    assetLength = Object.keys(json["assets"]).length;
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
            assetIndex++;
            if (assetIndex === assetLength) {
              fs.rm(tempDir, { recursive: true, force: true }, () => {});
            }
          } else {
            console.log(`${name} download completed.`);
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hour = date.getHours().toString().padStart(2, "0");
            const minute = date.getMinutes().toString().padStart(2, "0");
            const second = date.getSeconds().toString().padStart(2, "0");
            const timezoneOffset = date.getTimezoneOffset();
            const hourOffset = Math.abs(timezoneOffset / 60);
            let sign = "";
            if (timezoneOffset <= 0) {
              sign = "+";
            } else {
              sign = "-";
            }
            const timezone = `${sign}${hourOffset
              .toString()
              .padStart(2, "0")}:00`;
            const update_time = `${year}-${month}-${day} ${hour}:${minute}:${second} ${timezone}`;
            info["assets"][name] = {
              update_time: update_time,
            };
            fs.writeFileSync(
              "res-lock.json",
              JSON.stringify(info, null, 2) + "\n",
              "utf-8"
            );
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
    });
  }
});
