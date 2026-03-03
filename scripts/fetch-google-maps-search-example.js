#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_DEBUG_PORT = 9222;
const DEFAULT_QUERY = "Kadıköy akaryakıt istasyonları";
const DEFAULT_LANGUAGE = "tr";
const DEFAULT_REGION = "TR";
const DEFAULT_OUTPUT = path.join(
  path.resolve(__dirname, ".."),
  "data",
  "google-maps-kadikoy-akaryakit.example.json",
);

function parseArgs(argv) {
  const args = {
    port: DEFAULT_DEBUG_PORT,
    query: DEFAULT_QUERY,
    output: DEFAULT_OUTPUT,
    maxScrolls: 28,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = String(argv[index] || "");
    const next = argv[index + 1];

    if (token === "--port" && next) {
      args.port = Number.parseInt(String(next), 10) || DEFAULT_DEBUG_PORT;
      index += 1;
      continue;
    }

    if (token === "--query" && next) {
      args.query = String(next);
      index += 1;
      continue;
    }

    if (token === "--output" && next) {
      args.output = path.resolve(String(next));
      index += 1;
      continue;
    }

    if (token === "--max-scrolls" && next) {
      args.maxScrolls = Math.max(1, Number.parseInt(String(next), 10) || args.maxScrolls);
      index += 1;
    }
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function createTarget(port) {
  const response = await fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: "PUT",
  });

  if (!response.webSocketDebuggerUrl) {
    throw new Error("Chrome debug target created but webSocketDebuggerUrl missing.");
  }

  return response;
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);

    await new Promise((resolve, reject) => {
      const handleOpen = () => {
        cleanup();
        resolve();
      };
      const handleError = (error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        this.socket.removeEventListener("open", handleOpen);
        this.socket.removeEventListener("error", handleError);
      };

      this.socket.addEventListener("open", handleOpen);
      this.socket.addEventListener("error", handleError);
    });

    this.socket.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data || "{}"));
      if (payload.id && this.pending.has(payload.id)) {
        const pending = this.pending.get(payload.id);
        this.pending.delete(payload.id);

        if (payload.error) {
          pending.reject(new Error(payload.error.message || "CDP error"));
          return;
        }

        pending.resolve(payload.result || {});
        return;
      }

      this.events.push(payload);
    });
  }

  async send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;

    const payload = JSON.stringify({ id, method, params });

    const resultPromise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.socket.send(payload);
    return resultPromise;
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    return result?.result?.value;
  }

  async close() {
    if (!this.socket) {
      return;
    }

    try {
      this.socket.close();
    } catch (_error) {
      // Ignore close errors.
    }
  }
}

function buildSearchUrl(query) {
  const url = new URL(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
  url.searchParams.set("hl", DEFAULT_LANGUAGE);
  url.searchParams.set("gl", DEFAULT_REGION);
  return url.toString();
}

function extractResultsExpression() {
  return `
    (() => {
      const closeButtons = [...document.querySelectorAll('button, div[role="button"]')];
      for (const button of closeButtons) {
        const text = (button.getAttribute('aria-label') || button.textContent || '').trim();
        if (/reject all|tumunu reddet|tümünü reddet|kabul etme/i.test(text)) {
          button.click();
          break;
        }
      }

      const feed =
        document.querySelector('div[role="feed"]') ||
        document.querySelector('div[aria-label*="Sonuçlar"] div[role="feed"]') ||
        document.querySelector('div[aria-label*="Results"] div[role="feed"]');

      if (!feed) {
        return { items: [], hasFeed: false, scrollTop: 0, scrollHeight: 0 };
      }

      const cards = [...feed.querySelectorAll('a[href*="/maps/place/"], a[href*="/maps/search/"]')];
      const items = [];
      const seen = new Set();

      for (const link of cards) {
        const href = link.href || '';
        if (!href || seen.has(href)) {
          continue;
        }

        const card =
          link.closest('div.Nv2PK') ||
          link.closest('div[role="article"]') ||
          link.closest('div[jsaction]');
        if (!card) {
          continue;
        }

        const nameNode =
          card.querySelector('.qBF1Pd') ||
          card.querySelector('div[role="heading"]') ||
          link.querySelector('.qBF1Pd') ||
          link;
        const name = (nameNode?.textContent || link.getAttribute('aria-label') || '').trim();
        if (!name) {
          continue;
        }

        const textChunks = [...card.querySelectorAll('span, div')]
          .map((node) => (node.textContent || '').trim())
          .filter(Boolean)
          .filter((value, index, array) => array.indexOf(value) === index)
          .slice(0, 18);

        const combinedText = textChunks.join(' | ');
        const phoneMatch = combinedText.match(/(?:\\+?90\\s?)?(?:0)?\\d{3,4}[\\s-]?\\d{2,4}[\\s-]?\\d{2,4}/);
        const ratingMatch = combinedText.match(/(?:^|\\s)([1-5](?:[\\.,]\\d)?)(?:\\s|$)/);

        seen.add(href);
        items.push({
          name,
          url: href,
          text: combinedText,
          phone: phoneMatch ? phoneMatch[0] : '',
          rating: ratingMatch ? ratingMatch[1] : '',
        });
      }

      return {
        items,
        hasFeed: true,
        scrollTop: feed.scrollTop,
        scrollHeight: feed.scrollHeight,
      };
    })();
  `;
}

function scrollExpression() {
  return `
    (() => {
      const feed =
        document.querySelector('div[role="feed"]') ||
        document.querySelector('div[aria-label*="Sonuçlar"] div[role="feed"]') ||
        document.querySelector('div[aria-label*="Results"] div[role="feed"]');

      if (!feed) {
        return false;
      }

      feed.scrollBy(0, Math.max(900, Math.floor(feed.clientHeight * 0.9)));
      return true;
    })();
  `;
}

function normalizeItem(item) {
  return {
    name: String(item?.name || "").trim(),
    url: String(item?.url || "").trim(),
    phone: String(item?.phone || "").trim(),
    rating: String(item?.rating || "").trim(),
    text: String(item?.text || "").trim(),
  };
}

async function collectResults(client, maxScrolls) {
  const merged = new Map();
  let noGrowthRounds = 0;

  for (let round = 0; round < maxScrolls; round += 1) {
    const snapshot = await client.evaluate(extractResultsExpression());
    const items = Array.isArray(snapshot?.items) ? snapshot.items.map(normalizeItem) : [];
    for (const item of items) {
      const key = item.url || item.name;
      if (!key) {
        continue;
      }
      merged.set(key, item);
    }

    const before = merged.size;
    await client.evaluate(scrollExpression());
    await sleep(1500);

    const afterSnapshot = await client.evaluate(extractResultsExpression());
    const afterItems = Array.isArray(afterSnapshot?.items) ? afterSnapshot.items.map(normalizeItem) : [];
    for (const item of afterItems) {
      const key = item.url || item.name;
      if (!key) {
        continue;
      }
      merged.set(key, item);
    }

    if (merged.size === before) {
      noGrowthRounds += 1;
    } else {
      noGrowthRounds = 0;
    }

    if (noGrowthRounds >= 4) {
      break;
    }
  }

  return [...merged.values()];
}

async function closeTarget(port, targetId) {
  try {
    await fetch(`http://127.0.0.1:${port}/json/close/${targetId}`);
  } catch (_error) {
    // Ignore close errors.
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const target = await createTarget(args.port);
  const client = new CdpClient(target.webSocketDebuggerUrl);

  try {
    await client.connect();
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Page.navigate", { url: buildSearchUrl(args.query) });

    await sleep(5500);
    const results = await collectResults(client, args.maxScrolls);

    const payload = {
      query: args.query,
      fetchedAt: new Date().toISOString(),
      count: results.length,
      results,
    };

    fs.writeFileSync(args.output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({ output: args.output, count: results.length }, null, 2));
  } finally {
    await client.close();
    await closeTarget(args.port, target.id);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
