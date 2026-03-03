#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const TOKEN_ONLY_PATTERN = /^(mahallesi|mahellesi|mah\.?|mh\.?)$/iu;
const LEADING_TOKEN_PATTERN = /^(mahallesi|mahellesi|mah\.?|mh\.?)\s*(.*)$/iu;
const INLINE_MISSPELL_PATTERN = /\bmahellesi\b/giu;
const INLINE_TOKEN_PATTERN = /\b(mahallesi|mahellesi|mah\.?|mh\.?)\b/iu;
const STREET_HINT_PATTERN =
  /\b(caddesi|cadde|cad\.?|cd\.?|bulvari|bulvarı|bulvar|blv\.?|sokagi|sokağı|sokak|sok\.?|sk\.?|yolu|yol|bloku|blok|no\b|numara\b)\b/iu;

function parseArgs(argv) {
  const args = {
    file: path.join(ROOT, "data", "venues.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--file") {
      const rawValue = String(argv[index + 1] || "").trim();
      if (rawValue) {
        args.file = path.resolve(ROOT, rawValue);
      }
      index += 1;
    }
  }

  return args;
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

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCaseTr(value) {
  return normalizeText(value)
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLocaleLowerCase("tr");
      if (!lower) {
        return "";
      }
      return `${lower.charAt(0).toLocaleUpperCase("tr")}${lower.slice(1)}`;
    })
    .join(" ");
}

function normalizeNeighborhood(value) {
  const cleaned = normalizeText(
    String(value || "")
      .replace(/\b(mahallesi|mahellesi|mah\.?|mh\.?)\b/giu, " ")
      .replace(/[.,;:]+/g, " "),
  );

  if (!cleaned) {
    return "";
  }

  return `${toTitleCaseTr(cleaned)} Mahallesi`;
}

function splitParts(address) {
  return normalizeText(address)
    .split(",")
    .map((part) => normalizeText(part))
    .filter(Boolean);
}

function joinParts(parts) {
  return parts.map((part) => normalizeText(part)).filter(Boolean).join(", ");
}

function looksLikeNeighborhood(part) {
  const cleaned = normalizeText(part);
  if (!cleaned) {
    return false;
  }

  if (cleaned.includes("/") || /\d/.test(cleaned)) {
    return false;
  }

  if (STREET_HINT_PATTERN.test(cleaned)) {
    return false;
  }

  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  return wordCount >= 1 && wordCount <= 3;
}

function maybeSetNeighborhood(record, rawValue) {
  if (normalizeText(record.neighborhood)) {
    return false;
  }

  const normalized = normalizeNeighborhood(rawValue);
  if (!normalized) {
    return false;
  }

  record.neighborhood = normalized.replace(/\bMahallesi$/u, "Mah.");
  return true;
}

function fixLeadingTokenOnly(parts, record) {
  if (parts.length < 2 || !TOKEN_ONLY_PATTERN.test(parts[0]) || !looksLikeNeighborhood(parts[1])) {
    return false;
  }

  const neighborhoodLabel = normalizeNeighborhood(parts[1]);
  if (!neighborhoodLabel) {
    return false;
  }

  parts[0] = neighborhoodLabel;
  parts.splice(1, 1);
  maybeSetNeighborhood(record, parts[0]);
  return true;
}

function fixTokenOnlyBetweenParts(parts, record) {
  let changed = false;

  for (let index = 1; index < parts.length; index += 1) {
    if (!TOKEN_ONLY_PATTERN.test(parts[index])) {
      continue;
    }

    const previous = parts[index - 1];
    const next = parts[index + 1] || "";

    if (looksLikeNeighborhood(previous) && !INLINE_TOKEN_PATTERN.test(previous)) {
      parts[index - 1] = normalizeNeighborhood(previous);
      parts.splice(index, 1);
      maybeSetNeighborhood(record, parts[index - 1]);
      changed = true;
      index -= 1;
      continue;
    }

    if (looksLikeNeighborhood(next)) {
      parts[index] = normalizeNeighborhood(next);
      parts.splice(index + 1, 1);
      maybeSetNeighborhood(record, parts[index]);
      changed = true;
    }
  }

  return changed;
}

function fixLeadingTokenWithRemainder(parts, record) {
  let changed = false;

  for (let index = 1; index < parts.length; index += 1) {
    const match = parts[index].match(LEADING_TOKEN_PATTERN);
    if (!match) {
      continue;
    }

    const remainder = normalizeText(match[2]);
    const previous = parts[index - 1];

    if (looksLikeNeighborhood(previous) && !INLINE_TOKEN_PATTERN.test(previous)) {
      parts[index - 1] = normalizeNeighborhood(previous);
      maybeSetNeighborhood(record, parts[index - 1]);
      if (remainder) {
        parts[index] = remainder;
      } else {
        parts.splice(index, 1);
        index -= 1;
      }
      changed = true;
      continue;
    }

    if (index === 0 && parts[index + 1] && looksLikeNeighborhood(parts[index + 1])) {
      const neighborhoodLabel = normalizeNeighborhood(parts[index + 1]);
      parts[index] = neighborhoodLabel;
      parts.splice(index + 1, 1);
      maybeSetNeighborhood(record, neighborhoodLabel);
      changed = true;
    }
  }

  return changed;
}

function fixInlineMisspelling(parts, record) {
  let changed = false;

  for (let index = 0; index < parts.length; index += 1) {
    const before = parts[index];
    const after = normalizeText(before.replace(INLINE_MISSPELL_PATTERN, "Mahallesi"));
    if (after && after !== before) {
      parts[index] = after;
      changed = true;
    }

    if (!normalizeText(record.neighborhood)) {
      const neighborhoodMatch = parts[index].match(
        /^([A-Za-zÇĞİÖŞÜçğıöşü0-9]+(?:\s+[A-Za-zÇĞİÖŞÜçğıöşü0-9]+){0,2})\s+Mahallesi\b/iu,
      );
      if (neighborhoodMatch) {
        maybeSetNeighborhood(record, neighborhoodMatch[1]);
      }
    }
  }

  return changed;
}

function fixBrokenNeighborhoodForRecord(record) {
  if (!record || typeof record !== "object") {
    return false;
  }

  const originalAddress = normalizeText(record.address);
  if (!originalAddress || !/mahellesi|(^|[ ,])mahallesi($|[ ,])|(^|[ ,])mah\.($|[A-Za-zÇĞİÖŞÜçğıöşü])|(^|[ ,])mh\.($|[A-Za-zÇĞİÖŞÜçğıöşü])/iu.test(originalAddress)) {
    return false;
  }

  const parts = splitParts(originalAddress);
  if (parts.length === 0) {
    return false;
  }

  let changed = false;
  changed = fixInlineMisspelling(parts, record) || changed;
  changed = fixLeadingTokenOnly(parts, record) || changed;
  changed = fixTokenOnlyBetweenParts(parts, record) || changed;
  changed = fixLeadingTokenWithRemainder(parts, record) || changed;

  if (!changed) {
    return false;
  }

  const nextAddress = joinParts(parts);
  if (nextAddress && nextAddress !== originalAddress) {
    record.address = nextAddress;
  }

  return true;
}

function backupPathFor(filePath) {
  if (filePath.endsWith(".json")) {
    return filePath.replace(/\.json$/u, ".pre-venues-neighborhood-fix.backup.json");
  }

  return `${filePath}.pre-venues-neighborhood-fix.backup.json`;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const payload = readJson(args.file, null);

  if (!Array.isArray(payload) || payload.length === 0) {
    console.error("Hedef dosya okunamadi veya bos.");
    process.exitCode = 1;
    return;
  }

  const originalPayload = JSON.parse(JSON.stringify(payload));
  let changedCount = 0;
  const examples = [];

  payload.forEach((record) => {
    const beforeAddress = normalizeText(record?.address);
    const beforeNeighborhood = normalizeText(record?.neighborhood);

    if (!fixBrokenNeighborhoodForRecord(record)) {
      return;
    }

    changedCount += 1;
    if (examples.length < 20) {
      examples.push({
        name: normalizeText(record.name),
        city: normalizeText(record.city),
        district: normalizeText(record.district),
        beforeAddress,
        afterAddress: normalizeText(record.address),
        beforeNeighborhood,
        afterNeighborhood: normalizeText(record.neighborhood),
      });
    }
  });

  console.log(`Dosya: ${path.relative(ROOT, args.file)}`);
  console.log(`Degisen kayit: ${changedCount}`);
  examples.forEach((item) => {
    console.log(`- ${item.city}/${item.district} | ${item.name}`);
    console.log(`  once: ${item.beforeAddress}`);
    console.log(`  sonra: ${item.afterAddress}`);
    if (item.beforeNeighborhood !== item.afterNeighborhood) {
      console.log(`  mahalle: ${item.beforeNeighborhood || "-"} -> ${item.afterNeighborhood || "-"}`);
    }
  });

  if (DRY_RUN || changedCount === 0) {
    if (DRY_RUN) {
      console.log("Dry-run modunda calisti. Dosya yazilmadi.");
    }
    return;
  }

  writeJson(backupPathFor(args.file), originalPayload);
  writeJson(args.file, payload);
}

run();
