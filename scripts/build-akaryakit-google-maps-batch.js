#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DISTRICTS_PATH = path.join(DATA_DIR, "districts.json");
const FETCH_SCRIPT = path.join(__dirname, "fetch-google-maps-search-example.js");
const MERGE_SCRIPT = path.join(__dirname, "merge-google-maps-akaryakit-single.js");

function parseArgs(argv) {
  const args = {
    port: 9223,
    city: "",
    district: "",
    start: 0,
    limit: 0,
    maxScrolls: 28,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = String(argv[index] || "");
    const next = argv[index + 1];

    if (token === "--port" && next) {
      args.port = Number.parseInt(String(next), 10) || args.port;
      index += 1;
      continue;
    }

    if (token === "--city" && next) {
      args.city = String(next).trim();
      index += 1;
      continue;
    }

    if (token === "--district" && next) {
      args.district = String(next).trim();
      index += 1;
      continue;
    }

    if (token === "--start" && next) {
      args.start = Math.max(0, Number.parseInt(String(next), 10) || 0);
      index += 1;
      continue;
    }

    if (token === "--limit" && next) {
      args.limit = Math.max(0, Number.parseInt(String(next), 10) || 0);
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

function readDistrictMap() {
  return JSON.parse(fs.readFileSync(DISTRICTS_PATH, "utf8"));
}

function buildTargets(districtMap, filters) {
  const rows = [];
  const cityFilter = String(filters.city || "").trim();
  const districtFilter = String(filters.district || "").trim();

  for (const [city, districts] of Object.entries(districtMap)) {
    if (cityFilter && city !== cityFilter) {
      continue;
    }

    for (const district of districts) {
      if (districtFilter && district !== districtFilter) {
        continue;
      }

      rows.push({ city, district });
    }
  }

  rows.sort((leftRow, rightRow) => {
    const cityDiff = leftRow.city.localeCompare(rightRow.city, "tr");
    if (cityDiff !== 0) {
      return cityDiff;
    }
    return leftRow.district.localeCompare(rightRow.district, "tr");
  });

  if (filters.start > 0) {
    rows.splice(0, filters.start);
  }

  if (filters.limit > 0) {
    return rows.slice(0, filters.limit);
  }

  return rows;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });

  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    const stdout = String(result.stdout || "").trim();
    throw new Error(stderr || stdout || `${command} failed`);
  }

  return String(result.stdout || "").trim();
}

function buildTempOutputPath(city, district) {
  const safeCity = city.replace(/[^\p{L}\p{N}]+/gu, "-");
  const safeDistrict = district.replace(/[^\p{L}\p{N}]+/gu, "-");
  return path.join(os.tmpdir(), `akaryakit-google-${safeCity}-${safeDistrict}.json`);
}

function main() {
  const args = parseArgs(process.argv);
  const districtMap = readDistrictMap();
  const targets = buildTargets(districtMap, args);

  if (targets.length === 0) {
    throw new Error("Çalışacak ilçe bulunamadı.");
  }

  const summary = [];

  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    const query = `${target.district} ${target.city} akaryakıt istasyonları`;
    const tempOutput = buildTempOutputPath(target.city, target.district);

    console.log(`[${index + 1}/${targets.length}] ${target.city} / ${target.district}`);

    runCommand("node", [
      FETCH_SCRIPT,
      "--port",
      String(args.port),
      "--query",
      query,
      "--output",
      tempOutput,
      "--max-scrolls",
      String(args.maxScrolls),
    ]);

    const mergeOutput = runCommand("node", [
      MERGE_SCRIPT,
      "--city",
      target.city,
      "--district",
      target.district,
      "--source",
      tempOutput,
    ]);

    const mergePayload = JSON.parse(mergeOutput);
    summary.push({
      city: target.city,
      district: target.district,
      importedUniqueCount: mergePayload.importedUniqueCount,
      previousDistrictCount: mergePayload.previousDistrictCount,
    });
  }

  console.log(JSON.stringify({ processed: targets.length, summary }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
