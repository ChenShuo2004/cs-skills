import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node scripts/validate-product-pack.mjs <product-pack.json>");
  process.exit(1);
}

const errors = [];

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(label + " must be a non-empty string");
  }
}

function requiredArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(label + " must be a non-empty array");
  }
}

let productPack;
try {
  productPack = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
} catch (error) {
  console.error("Could not read product pack: " + error.message);
  process.exit(1);
}

if (!isObject(productPack)) {
  errors.push("product pack must be a JSON object");
} else {
  requiredString(productPack.schemaVersion, "schemaVersion");

  if (!isObject(productPack.product)) {
    errors.push("product must be an object");
  } else {
    requiredString(productPack.product.id, "product.id");
    requiredString(productPack.product.name, "product.name");
    requiredArray(productPack.product.claims, "product.claims");
    for (const [index, claim] of (productPack.product.claims ?? []).entries()) {
      const label = "product.claims[" + index + "]";
      if (!isObject(claim)) {
        errors.push(label + " must be an object");
        continue;
      }
      requiredString(claim.id, label + ".id");
      requiredString(claim.statement, label + ".statement");
      requiredArray(claim.evidenceIds, label + ".evidenceIds");
    }
    if (productPack.product.prohibitedClaims !== undefined && !Array.isArray(productPack.product.prohibitedClaims)) {
      errors.push("product.prohibitedClaims must be an array when provided");
    }
  }

  if (!isObject(productPack.assets)) {
    errors.push("assets must be an object");
  } else {
    requiredArray(productPack.assets.productEvidence, "assets.productEvidence");
    const evidenceIds = new Set();
    for (const [index, asset] of (productPack.assets.productEvidence ?? []).entries()) {
      const label = "assets.productEvidence[" + index + "]";
      if (!isObject(asset)) {
        errors.push(label + " must be an object");
        continue;
      }
      requiredString(asset.id, label + ".id");
      requiredString(asset.kind, label + ".kind");
      requiredString(asset.source, label + ".source");
      requiredString(asset.usage, label + ".usage");
      if (asset.id) {
        evidenceIds.add(asset.id);
      }
    }
    for (const claim of productPack.product?.claims ?? []) {
      for (const evidenceId of claim.evidenceIds ?? []) {
        if (!evidenceIds.has(evidenceId)) {
          errors.push("claim " + (claim.id ?? "<unknown>") + " references missing evidence id " + evidenceId);
        }
      }
    }
  }

  if (!isObject(productPack.delivery)) {
    errors.push("delivery must be an object");
  } else {
    requiredString(productPack.delivery.platform, "delivery.platform");
    requiredString(productPack.delivery.cta, "delivery.cta");
    for (const field of ["width", "height", "fps", "durationSeconds"]) {
      if (productPack.delivery[field] !== undefined && (!Number.isFinite(productPack.delivery[field]) || productPack.delivery[field] <= 0)) {
        errors.push("delivery." + field + " must be a positive number when provided");
      }
    }
  }

  if (!isObject(productPack.voice)) {
    errors.push("voice must be an object");
  } else {
    requiredString(productPack.voice.mode, "voice.mode");
    requiredString(productPack.voice.consentReference, "voice.consentReference");
  }

  if (!isObject(productPack.avatar)) {
    errors.push("avatar must be an object");
  } else {
    requiredString(productPack.avatar.mode, "avatar.mode");
  }

  if (!isObject(productPack.style)) {
    errors.push("style must be an object");
  } else {
    requiredString(productPack.style.id, "style.id");
  }

  if (!isObject(productPack.audio)) {
    errors.push("audio must be an object");
  } else if (productPack.audio.bgm !== "none") {
    errors.push('audio.bgm must be "none" for the current product-video baseline');
  }

  if (!isObject(productPack.approval)) {
    errors.push("approval must be an object");
  } else if (productPack.approval.mode !== "sample-then-batch") {
    errors.push('approval.mode must be "sample-then-batch"');
  }
}

if (errors.length > 0) {
  console.error("Product pack validation failed:");
  for (const error of errors) {
    console.error("- " + error);
  }
  process.exit(1);
}

console.log("Product pack validation passed.");
