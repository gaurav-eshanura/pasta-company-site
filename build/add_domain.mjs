/**
 * Map a custom domain to Firebase Hosting via the REST API.
 *
 * The Firebase CLI has no `hosting:domains` command, and this uses the same
 * OAuth refresh token the CLI itself holds. Every outbound request is pinned
 * to an allowlisted Google host over HTTPS, and no token material is ever
 * logged — only whether the call succeeded.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const PROJECT = process.argv[2] || "pastacompany-eshanura";
const DOMAIN = process.argv[3] || "pasta.eshanura.com";

const ALLOWED_HOSTS = new Set([
  "oauth2.googleapis.com",
  "firebasehosting.googleapis.com",
]);
const API = "https://firebasehosting.googleapis.com";

function assertAllowed(url) {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new Error(`refusing non-HTTPS: ${url}`);
  if (!ALLOWED_HOSTS.has(u.hostname)) throw new Error(`refusing off-allowlist host: ${u.hostname}`);
  return url;
}

function credentialsPath() {
  const roaming = process.env.APPDATA;
  const candidates = [
    roaming && join(roaming, "firebase", "gaurav_edi1_gmail.com_application_default_credentials.json"),
    join(homedir(), ".config", "gcloud", "application_default_credentials.json"),
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      return p;
    } catch {}
  }
  return candidates[0];
}

async function accessToken() {
  const path = credentialsPath();
  const raw = readFileSync(path, "utf8");
  const cred = JSON.parse(raw);
  if (cred.type !== "authorized_user") throw new Error(`unexpected credential type at ${path}`);

  const body = new URLSearchParams({
    client_id: cred.client_id,
    client_secret: cred.client_secret,
    refresh_token: cred.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch(
    assertAllowed("https://oauth2.googleapis.com/token"),
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }
  );
  if (!res.ok) throw new Error(`token exchange failed: HTTP ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

async function api(token, path, init = {}) {
  const res = await fetch(assertAllowed(`${API}${path}`), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

async function main() {
  const token = await accessToken();
  console.log("obtained OAuth access token");

  const listed = await api(
    token,
    `/v1beta1/projects/${PROJECT}/sites?pageSize=100`
  );
  if (listed.status !== 200) {
    console.error("could not list sites:", listed.status, JSON.stringify(listed.json).slice(0, 300));
    process.exit(1);
  }

  const site = (listed.json.sites || [])[0];
  if (!site) {
    console.error("no hosting site found for", PROJECT);
    process.exit(1);
  }
  console.log(`hosting site: ${site.name}`);
  console.log(`default URL:  ${site.defaultUrl}`);

const domains = await api(token, `/v1beta1/${site.name}/domains`);
  const existing = (domains.json.domains || []).map((d) => d.domainName);
  console.log("existing custom domains:", existing.length ? existing.join(", ") : "(none)");

  if (existing.includes(DOMAIN)) {
    console.log(`${DOMAIN} is already mapped — nothing to do`);
    return;
  }

  // sites.domains.create: POST v1beta1/{parent}/domains with a Domain body.
  const created = await api(token, `/v1beta1/${site.name}/domains`, {
    method: "POST",
    body: JSON.stringify({ domainName: DOMAIN }),
  });

  if (created.status >= 200 && created.status < 300) {
    console.log(`\n✓ ${DOMAIN} added to ${site.name}`);
    console.log("name:", created.json.name || "(created)");
    console.log("status:", created.json.status || "(pending)");
    if (created.json.provisioning?.certificateStatus) {
      console.log("certificate:", created.json.provisioning.certificateStatus);
    }
    const dns = created.json.requiredDnsUpdates || created.json.provisioning?.dns;
    if (dns) console.log("DNS updates required:", JSON.stringify(dns).slice(0, 500));
    console.log(
      "\nCertificate provisioning and DNS verification run automatically." +
        (created.json.status === "VERIFIED"
          ? ""
          : "\nIf it stays pending, check the Firebase console for a required TXT record.")
    );
  } else {
    console.error(`\n✗ could not add ${DOMAIN}: HTTP ${created.status}`);
    console.error(JSON.stringify(created.json).slice(0, 500));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});