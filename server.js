import express from "express";
import cors from "cors";

const app = express();

// Allow calls from anywhere (you can restrict later)
app.use(cors({ origin: "*" }));

// Basic health check for Render
app.get("/", (_req, res) => res.send("ok"));

// Proxy endpoint
app.get("/you/search", async (req, res) => {
  try {
    const query = req.query.query;
    const count = req.query.count ?? "5";
    const freshness = req.query.freshness; // optional

    if (!query) {
      return res.status(400).json({ error: "Missing query param: query" });
    }

    const apiKey = process.env.YOU_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing YOU_API_KEY env var" });
    }

    // Build upstream URL
    const url = new URL("https://api.ydc-index.io/search");
    url.searchParams.set("query", query);
    url.searchParams.set("count", String(count));
    if (freshness) url.searchParams.set("freshness", String(freshness));

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": apiKey
      }
    });

    const text = await upstream.text();
    // Pass-through content type
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (err) {
    return res.status(500).json({ error: "Proxy failed", details: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy listening on ${port}`));
