const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method === "GET" && req.query.url) {
    const targetUrl = req.query.url;

    try {
      const { data, headers } = await axios.get(targetUrl, { responseType: "arraybuffer" });
      
      res.setHeader("Content-Type", headers["content-type"] || "application/json");
      res.status(200).send(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send("Proxy error");
    }
  } else {
    res.status(400).send("Missing 'url' query parameter");
  }
};
