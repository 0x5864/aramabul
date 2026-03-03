#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_DATA_DIR = path.join(ROOT, "data");

function parseArgs(argv) {
  const args = {
    dataDir: DEFAULT_DATA_DIR,
    output: "",
    sampleLimit: 250,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--data-dir") {
      const rawValue = String(argv[index + 1] || "").trim();
      if (rawValue) {
        args.dataDir = path.resolve(ROOT, rawValue);
      }
      index += 1;
      continue;
    }

    if (token === "--output") {
      const rawValue = String(argv[index + 1] || "").trim();
      if (rawValue) {
        args.output = path.resolve(ROOT, rawValue);
      }
      index += 1;
      continue;
    }

    if (token === "--sample-limit") {
      const value = Number(argv[index + 1]);
      args.sampleLimit = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 250;
      index += 1;
    }
  }

  return args;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function foldForCompare(value) {
  return normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function cityAliases(cityName) {
  const folded = foldForCompare(cityName);
  const aliases = new Set([folded]);

  if (folded === "afyonkarahisar") {
    aliases.add("afyon");
  }

  return aliases;
}

function districtTargetAliases(districtName) {
  const folded = foldForCompare(districtName);
  const aliases = new Set([folded]);

  if (folded === "19 mayis") {
    aliases.add("19mayis");
    aliases.add("ondokuzmayis");
    aliases.add("ondokuz mayis");
  }

  return aliases;
}

function districtTailChunk(rawSegment) {
  const cleaned = normalizeText(rawSegment);
  if (!cleaned) {
    return "";
  }

  const chunks = cleaned.split(/[,\u060C]/u).map((chunk) => normalizeText(chunk)).filter(Boolean);
  return chunks.length > 0 ? chunks[chunks.length - 1] : "";
}

function districtCandidates(rawDistrict, city) {
  const candidates = new Set();
  const cleaned = normalizeText(rawDistrict);

  if (!cleaned) {
    return candidates;
  }

  const addCandidate = (value) => {
    const normalized = normalizeText(value);
    if (normalized) {
      candidates.add(foldForCompare(normalized));
    }
  };

  addCandidate(cleaned);

  const parenthetical = cleaned.match(/^(.*?)\s*\(([^)]+)\)\s*$/u);
  if (parenthetical) {
    addCandidate(parenthetical[1]);
    addCandidate(parenthetical[2]);
  }

  const withoutMunicipality = cleaned.replace(/\s+belediyesi$/iu, "");
  if (withoutMunicipality !== cleaned) {
    addCandidate(withoutMunicipality);
  }

  const englishDistrict = cleaned.match(/^(.*?)\s+district$/iu);
  if (englishDistrict && cityAliases(city).has(foldForCompare(englishDistrict[1]))) {
    addCandidate("Merkez");
  }

  return candidates;
}

function slashTailMatchesRecord(address, city, district) {
  const match = normalizeText(address).match(/([^,/\u060C]+)\/([^,/\u060C]+)$/u);
  if (!match) {
    return true;
  }

  const rawCity = normalizeText(match[2]);
  if (!cityAliases(city).has(foldForCompare(rawCity))) {
    return false;
  }

  const rawDistrict = normalizeText(normalizeText(match[1] || "").replace(/^\d{5}\s+/u, ""));
  if (!rawDistrict) {
    return false;
  }

  const targetDistrictAliases = districtTargetAliases(district);
  const matches = Array.from(districtCandidates(rawDistrict, city)).some(
    (candidate) => Array.from(targetDistrictAliases).some(
      (targetDistrict) => candidate === targetDistrict || candidate.replace(/\s+merkez$/u, "") === targetDistrict.replace(/\s+merkez$/u, ""),
    ),
  );

  if (matches) {
    return true;
  }

  const foldedDistrict = foldForCompare(rawDistrict);
  const cityFolded = foldForCompare(city);
  const primaryTarget = foldForCompare(district);
  if (foldedDistrict.startsWith(`${cityFolded} `)) {
    const stripped = foldedDistrict.slice(cityFolded.length + 1);
    if (stripped === primaryTarget || stripped.replace(/\s+merkez$/u, "") === primaryTarget.replace(/\s+merkez$/u, "")) {
      return true;
    }
  }

  return false;
}

function listCandidateFiles(dataDir) {
  if (!fs.existsSync(dataDir)) {
    return [];
  }

  return fs
    .readdirSync(dataDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .filter((fileName) => !fileName.endsWith(".backup.json"))
    .filter((fileName) => !fileName.includes(".backup."))
    .filter((fileName) => !fileName.includes(".pre-address-layer-cleanup."))
    .filter((fileName) => fileName !== "districts.json")
    .filter((fileName) => !fileName.includes("report"))
    .filter((fileName) => !fileName.includes("progress"))
    .filter((fileName) => !fileName.includes("review"))
    .filter((fileName) => !fileName.includes(".example."))
    .map((fileName) => path.join(dataDir, fileName))
    .sort();
}

function readJson(filePath, fallbackValue) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return fallbackValue;
  }
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function ratio(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(4));
}

function detectIssues(record) {
  const issues = [];
  const name = normalizeText(record.name);
  const city = normalizeText(record.city);
  const district = normalizeText(record.district);
  const address = normalizeText(record.address);
  const neighborhood = normalizeText(record.neighborhood || record.mahalle);
  const postalCode = normalizeText(record.postalCode || record.postcode);

  const foldedAddress = foldForCompare(address);
  const foldedCity = foldForCompare(city);
  const foldedDistrict = foldForCompare(district);
  const foldedNeighborhood = foldForCompare(neighborhood);

  if (!postalCode) {
    issues.push("missing_postal_code");
  }

  if (!neighborhood) {
    issues.push("missing_neighborhood");
  }

  if (address && city && district) {
    const simpleA = foldedAddress.replace(/[^\p{L}\p{N}/, ]/gu, "");
    const simpleCity = foldedCity.replace(/[^\p{L}\p{N}]/gu, "");
    const simpleDistrict = foldedDistrict.replace(/[^\p{L}\p{N}]/gu, "");
    const equalsRegion =
      simpleA === `${simpleDistrict}, ${simpleCity}`
      || simpleA === `${simpleDistrict}/${simpleCity}`
      || simpleA === simpleDistrict
      || simpleA === simpleCity;
    if (equalsRegion) {
      issues.push("region_only_address");
    }
  }

  if (/mahellesi\b/iu.test(address)) {
    issues.push("misspelled_neighborhood_token");
  }

  if (/(^|[,\s-])mahallesi\b|(^|[,\s-])mahellesi\b|(^|[,\s-])mah\.?\b|(^|[,\s-])mh\.?\b/iu.test(address)) {
    const explicitToken =
      /(?:^|[,\s-])([A-Za-zÇĞİÖŞÜçğıöşü0-9]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü0-9]+){0,2})\s*(?:mahallesi|mahellesi|mah\.?|mh\.?)\b/iu;
    if (!explicitToken.test(address)) {
      issues.push("broken_neighborhood_phrase");
    }
  }

  if (address.includes("/") && city && district) {
    if (!slashTailMatchesRecord(address, city, district)) {
      issues.push("slash_tail_mismatch");
    }
  }

  if (neighborhood && address) {
    const neighborhoodBase = foldedNeighborhood.replace(/\s+mah\.?$/u, "");
    if (neighborhoodBase && !foldedAddress.includes(neighborhoodBase)) {
      issues.push("neighborhood_not_in_address");
    }
  }

  if (city && district && foldedCity === foldedDistrict) {
    issues.push("city_district_same");
  }

  if (name && name.length <= 1) {
    issues.push("very_short_name");
  }

  const letterCount = (address.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) || []).length;
  const upperCount = (address.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
  if (letterCount >= 14 && upperCount / letterCount >= 0.85) {
    issues.push("all_caps_address");
  }

  if (!address) {
    issues.push("empty_address");
  }

  return issues;
}

function summarizeFile(filePath, payload, sampleLimit) {
  const summary = {
    file: path.relative(ROOT, filePath),
    totalRecords: Array.isArray(payload) ? payload.length : 0,
    flaggedRecords: 0,
    issueCounts: {},
    samples: [],
  };

  if (!Array.isArray(payload)) {
    return summary;
  }

  payload.forEach((record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const issues = detectIssues(record);
    if (issues.length === 0) {
      return;
    }

    summary.flaggedRecords += 1;
    issues.forEach((issue) => {
      summary.issueCounts[issue] = (summary.issueCounts[issue] || 0) + 1;
    });

    if (summary.samples.length < sampleLimit) {
      summary.samples.push({
        issues,
        name: normalizeText(record.name),
        city: normalizeText(record.city),
        district: normalizeText(record.district),
        neighborhood: normalizeText(record.neighborhood || record.mahalle),
        postalCode: normalizeText(record.postalCode || record.postcode),
        address: normalizeText(record.address),
      });
    }
  });

  summary.flaggedRatio = ratio(summary.flaggedRecords, summary.totalRecords);
  summary.topIssues = Object.entries(summary.issueCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"))
    .slice(0, 10)
    .map(([issue, count]) => ({ issue, count }));

  return summary;
}

function buildReport(args) {
  const files = listCandidateFiles(args.dataDir);
  const fileReports = files.map((filePath) => {
    const payload = readJson(filePath, null);
    return summarizeFile(filePath, payload, args.sampleLimit);
  });

  const totals = {
    filesScanned: fileReports.length,
    totalRecords: 0,
    flaggedRecords: 0,
    issueCounts: {},
  };

  fileReports.forEach((fileReport) => {
    totals.totalRecords += fileReport.totalRecords;
    totals.flaggedRecords += fileReport.flaggedRecords;
    Object.entries(fileReport.issueCounts).forEach(([issue, count]) => {
      totals.issueCounts[issue] = (totals.issueCounts[issue] || 0) + count;
    });
  });

  const globalTopIssues = Object.entries(totals.issueCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"))
    .slice(0, 20)
    .map(([issue, count]) => ({ issue, count }));

  const mostProblematicFiles = [...fileReports]
    .sort((left, right) => {
      if (right.flaggedRatio !== left.flaggedRatio) {
        return right.flaggedRatio - left.flaggedRatio;
      }
      return right.flaggedRecords - left.flaggedRecords;
    })
    .slice(0, 15)
    .map((fileReport) => ({
      file: fileReport.file,
      flaggedRecords: fileReport.flaggedRecords,
      totalRecords: fileReport.totalRecords,
      flaggedRatio: fileReport.flaggedRatio,
      topIssues: fileReport.topIssues.slice(0, 5),
    }));

  return {
    generatedAt: new Date().toISOString(),
    dataDir: path.relative(ROOT, args.dataDir),
    totals: {
      ...totals,
      flaggedRatio: ratio(totals.flaggedRecords, totals.totalRecords),
      topIssues: globalTopIssues,
    },
    mostProblematicFiles,
    files: fileReports,
  };
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildReport(args);
  const outputPath = args.output || path.join(args.dataDir, "address-quality-report.json");

  writeJson(outputPath, report);

  console.log(`Rapor: ${path.relative(ROOT, outputPath)}`);
  console.log(`Taranan dosya: ${report.totals.filesScanned}`);
  console.log(`Toplam kayit: ${report.totals.totalRecords}`);
  console.log(`Isaretli kayit: ${report.totals.flaggedRecords}`);
  report.totals.topIssues.slice(0, 10).forEach((item) => {
    console.log(`- ${item.issue}: ${item.count}`);
  });
}

run();
