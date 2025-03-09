const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cheerio = require("cheerio");
const axios = require("axios");
const app = express();

const proxyOptions = {
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyRes: async (proxyRes, req, res) => {
    let body = Buffer.from([]);
    proxyRes.on("data", chunk => (body = Buffer.concat([body, chunk])));
    proxyRes.on("end", async () => {
      const contentType = proxyRes.headers["content-type"];
      let responseBody = body.toString();
      if (contentType && contentType.includes("text/html")) {
        const $ = cheerio.load(responseBody);
        $("script, link, iframe, img, source").each((_, el) => {
          const attr = $(el).prop("tagName") === "SCRIPT" ? "src" : $(el).prop("tagName") === "LINK" ? "href" : "src";
          if ($(el).attr(attr)) {
            $(el).attr(attr, `/proxy?url=${encodeURIComponent($(el).attr(attr))}`);
          }
        });
        responseBody = $.html();
      }
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(responseBody);
    });
  },
};

app.use("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing URL");
  try {
    const { data, headers } = await axios.get(targetUrl, { responseType: "arraybuffer" });
    res.set(headers).send(data);
  } catch (error) {
    res.status(500).send("Proxy error");
  }
});

app.use("/", createProxyMiddleware(proxyOptions));

app.listen(3000);
