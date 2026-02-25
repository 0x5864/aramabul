#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DISTRICTS_PATH = path.join(ROOT, "data", "districts.json");
const PROGRESS_PATH = path.join(ROOT, "data", "veteriner-single-progress.json");
const FETCH_SCRIPT = path.join(ROOT, "scripts", "fetch-google-veteriner.js");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeForCompare(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const args = {
    city: "",
    district: "",
    fromCity: "",
    fromDistrict: "",
    maxDistricts: 0,
    resetProgress: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--city") {
      args.city = normalizeText(argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (token === "--district") {
      args.district = normalizeText(argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (token === "--from-city") {
      args.fromCity = normalizeText(argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (token === "--from-district") {
      args.fromDistrict = normalizeText(argv[i + 1] || "");
      i += 1;
      continue;
    }

    if (token === "--max-districts") {
      const value = Number(argv[i + 1]);
      args.maxDistricts = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
      i += 1;
      continue;
    }

    if (token === "--reset-progress") {
      args.resetProgress = true;
    }
  }

  return args;
}

function districtTargets(districtMap) {
  const targets = [];
  const cityNames = Object.keys(districtMap).sort((left, right) => left.localeCompare(right, "tr"));

  cityNames.forEach((city) => {
    const districts = Array.isArray(districtMap[city]) ? districtMap[city] : [];
    districts
      .map((district) => normalizeText(district))
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right, "tr"))
      .forEach((district) => {
        targets.push({ city, district });
      });
  });

  return targets;
}

function applyFilters(targets, args, progress) {
  let filtered = [...targets];

  if (args.city) {
    const cityNeedle = normalizeForCompare(args.city);
    filtered = filtered.filter((item) => normalizeForCompare(item.city) === cityNeedle);
  }

  if (args.district) {
    const districtNeedle = normalizeForCompare(args.district);
    filtered = filtered.filter((item) => normalizeForCompare(item.district) === districtNeedle);
  }

  if (args.fromCity) {
    const fromCityNeedle = normalizeForCompare(args.fromCity);
    const fromDistrictNeedle = normalizeForCompare(args.fromDistrict);
    const startIndex = filtered.findIndex((item) => {
      if (normalizeForCompare(item.city) !== fromCityNeedle) {
        return false;
      }
      if (!fromDistrictNeedle) {
        return true;
      }
      return normalizeForCompare(item.district) === fromDistrictNeedle;
    });

    if (startIndex >= 0) {
      filtered = filtered.slice(startIndex);
    }
  }

  if (!args.city && !args.district && progress && progress.lastCity && progress.lastDistrict) {
    const lastCity = normalizeForCompare(progress.lastCity);
    const lastDistrict = normalizeForCompare(progress.lastDistrict);
    const afterLastIndex = filtered.findIndex(
      (item) =>
        normalizeForCompare(item.city) === lastCity &&
        normalizeForCompare(item.district) === lastDistrict,
    );

    if (afterLastIndex >= 0) {
      filtered = filtered.slice(afterLastIndex + 1);
    }
  }

  if (args.maxDistricts > 0) {
    filtered = filtered.slice(0, args.maxDistricts);
  }

  return filtered;
}

function runSingleDistrict(city, district) {
  const env = { ...process.env };
  const result = spawnSync(
    process.execPath,
    [FETCH_SCRIPT, "--city", city, "--district", district],
    {
      cwd: ROOT,
      env,
      stdio: "inherit",
    },
  );

  return Number.isInteger(result.status) ? result.status : 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const districtMap = readJson(DISTRICTS_PATH, null);

  if (!districtMap || typeof districtMap !== "object" || Array.isArray(districtMap)) {
    console.error("districts.json okunamadi veya format hatali.");
    process.exitCode = 1;
    return;
  }

  if (args.resetProgress && fs.existsSync(PROGRESS_PATH)) {
    fs.unlinkSync(PROGRESS_PATH);
  }

  const progress = readJson(PROGRESS_PATH, null);
  const allTargets = districtTargets(districtMap);
  const targets = applyFilters(allTargets, args, progress);

  if (targets.length === 0) {
    console.log("Islenecek ilce kalmadi.");
    return;
  }

  console.log(`Toplam ilce hedefi: ${targets.length}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const item = targets[i];
    console.log(`[${i + 1}/${targets.length}] ${item.city} / ${item.district}`);

    const status = runSingleDistrict(item.city, item.district);
    if (status === 0) {
      successCount += 1;
    } else {
      failCount += 1;
      console.error(`  ! ilce calismasi basarisiz: ${item.city} / ${item.district}`);
    }

    writeJson(PROGRESS_PATH, {
      lastCity: item.city,
      lastDistrict: item.district,
      updatedAt: new Date().toISOString(),
      successCount,
      failCount,
      remaining: Math.max(0, targets.length - (i + 1)),
    });
  }

  console.log(`Tamamlandi. Basarili: ${successCount}, Basarisiz: ${failCount}`);
}

main();
