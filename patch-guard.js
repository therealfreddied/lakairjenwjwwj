#!/usr/bin/env node
"use strict";
/*
 * OmniRoute strict /v1/models visibility filter — v2
 *
 * Patches dist/http-method-guard.cjs so GET /v1/models mirrors dashboard visibility:
 *   1. Only ACTIVE providers (provider_connections.is_active=1, not 'unavailable')
 *   2. Only provider nodes with an active connection (UUID -> prefix mapped)
 *   3. Dashboard-hidden models excluded — PROVIDER-SCOPED (fixes v1 cross-provider leak)
 *      honoring hiddenModalities.chat precedence exactly like the app
 *   4. auto/* hidden by default (?include_auto=true shows them)
 *   5. no-think/* hidden by default (?include_no_think=true shows them)
 *   6. Inactive/hidden user combos excluded; active combos kept
 *
 * Idempotent: always resets from the clean .orig.bak backup before injecting.
 * Rollback: cp <guard>.orig.bak <guard> && pm2 restart omniroute
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("OmniRoute /v1/models visibility patch v2\n");

/* ---------------- locate guard ---------------- */
function findGuardPath() {
  const candidates = [
    "/usr/lib/node_modules/omniroute/dist/http-method-guard.cjs",
    "/usr/local/lib/node_modules/omniroute/dist/http-method-guard.cjs",
    path.join(
      process.env.HOME || "",
      ".nvm/versions/node",
      process.version,
      "lib/node_modules/omniroute/dist/http-method-guard.cjs"
    ),
    path.join(process.cwd(), "dist/http-method-guard.cjs"),
    path.join(process.cwd(), "scripts/dev/http-method-guard.cjs"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    const candidate = path.join(globalRoot, "omniroute/dist/http-method-guard.cjs");
    if (fs.existsSync(candidate)) return candidate;
  } catch (e) {}
  return null;
}

const guardPath = findGuardPath();
if (!guardPath) {
  console.error("ERROR: could not find http-method-guard.cjs");
  process.exit(1);
}
console.log("Found guard:", guardPath);

/* ---------------- backup / reset ---------------- */
const backupPath = guardPath + ".orig.bak";
if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, guardPath);
  console.log("Reset from clean backup before applying");
} else {
  fs.copyFileSync(guardPath, backupPath);
  console.log("Backup created:", backupPath);
}

/* ---------------- inject filter ---------------- */
let code = fs.readFileSync(guardPath, "utf8");

const ALIASES = {"ghe-copilot":"ghe-copilot","xai-oauth":"xao","openference":"of","grok-cli":"gc","qoder":"if","agy":"agy","kiro":"kr","amazon-q":"aq","claude":"cc","codex":"cx","github":"gh","gitlab-duo":"gitlab-duo","cursor":"cu","zed":"zd","trae":"tr","kimi-coding":"kmc","kilocode":"kc","cline":"cl","clinepass":"cp","devin-cli":"dv","codebuddy-cn":"cbcn","muse-code":"mc","oneminai":"1min","cheaperinference":"cinf","freebuff":"freebuff","charm-hyper":"charm-hyper","agentrouter":"agentrouter","unorouter":"unorouter","command-code":"cmd","openrouter":"openrouter","opper":"opper","requesty":"requesty","zylo-api":"zylo","fastrouter":"fastrouter","anyapi":"anyapi","electronhub":"electronhub","llmgateway":"llmgateway","lyceum":"lyceum","llm-kiwi":"llmkiwi","literouter":"literouter","greenpt":"greenpt","eurouter":"eurouter","mnn-ai":"mnn-ai","meganova-ai":"meganova-ai","mixlayer":"mixlayer","speka":"speka","tokenreply":"tokenreply","yolo-auto":"yolo-auto","dxnt":"dxnt","cloudcode-one":"cloudcode-one","ofoxai":"ofoxai","zerolimitai":"zerolimitai","chatanywhere":"chatanywhere","helyxai":"helyxai","auriko":"auriko","poixe-ai":"poixe-ai","naga-ai":"naga-ai","chat-oripe":"chat-oripe","freeinference":"freeinference","free-ai":"free-ai","dgrid":"dgrid","qiniu":"qiniu","orcarouter":"orcarouter","api-airforce":"af","crof":"crof","bazaarlink":"bzl","synthetic":"synthetic","kilo-gateway":"kg","wafer":"wafer","opencode-zen":"opencode-zen","opencode-go":"opencode-go","dahl":"dahl","freetheai":"fta","g4f-groq":"g4fgroq","g4f-gemini":"g4fgem","g4f-pollinations":"g4fpol","g4f-ollama":"g4foll","g4f-nvidia":"g4fnv","vercel-ai-gateway":"vag","llm7":"llm7","llamagate":"llamagate","gitlawb":"glb","gitlawb-gmi":"glb-gmi","nanogpt":"nanogpt","aimlapi":"aiml","novita":"novita","piapi":"pi","getgoapi":"ggo","laozhang":"lz","thebai":"thebai","bai":"bai","fenayai":"fenayai","empower":"empower","poe":"poe","chutes":"chutes","factory":"factory","bluesminds":"bm","freemodel-dev":"fmd","freeaiapikey":"faik","zenmux":"zm","openadapter":"oad","dit":"dai","tokenrouter":"trk","token-kiosk":"tk","sumopod":"sumopod","x5lab":"x5lab","chenzk":"chenzk","kenari":"kenari","navy":"navy","ainative":"ainative","aion":"aion","routeway":"routeway","nara":"nara","xkiro":"xkiro","regolo":"regolo","naga-ac":"naga","void-ai":"void-ai","helixmind":"helixmind","logfare":"logfare","tabitoken":"tabitoken","seekai":"ska","openai":"openai","reka":"reka","pioneer":"pn","uc-direct":"ucd","anthropic":"anthropic","gemini":"gemini","groq":"groq","blackbox":"bb","xai":"xai","mistral":"mistral","perplexity":"pplx","perplexity-agent":"pplx-agent","cohere":"cohere","meta-llama":"meta","morph":"morph","galadriel":"galadriel","ai21":"ai21","venice":"venice","codestral":"codestral","upstage":"upstage","maritalk":"maritalk","nous-research":"nous","arcee-ai":"arcee","liquid":"liquid","inception":"inception","writer":"writer","together":"together","openvecta":"openvecta","openference-api":"ofa","poolside":"poolside","fireworks":"fireworks","cerebras":"cerebras","nvidia":"nvidia","nebius":"nebius","nube":"nube","siliconflow":"siliconflow","hyperbolic":"hyp","ollama-cloud":"ollamacloud","huggingface":"hf","deepinfra":"deepinfra","lambda-ai":"lambda","sambanova":"samba","nscale":"nscale","baseten":"baseten","publicai":"publicai","featherless-ai":"featherless","friendliai":"friendli","wandb":"wandb","inference-net":"inet","predibase":"predibase","bytez":"bytez","monsterapi":"monster","modelscope":"ms","byteplus":"bpm","digitalocean":"digitalocean","azure-openai":"azure","azure-ai":"azure-ai","bedrock":"bedrock","watsonx":"watsonx","oci":"oci","sap":"sap","modal":"mdl","vertex":"vertex","vertex-partner":"vp","cloudflare-ai":"cf","scaleway":"scw","ovhcloud":"ovh","heroku":"heroku","databricks":"databricks","datarobot":"datarobot","clarifai":"clarifai","snowflake":"snowflake","qianfan":"qianfan","glm":"glm","glm-cn":"glmcn","glmt":"glmt","bailian-coding-plan":"bcp","qwen-cloud":"qwc","qwen-cloud-token-plan":"qct","kimi":"kimi","kimi-coding-apikey":"kmca","minimax":"minimax","minimax-cn":"minimax-cn","deepseek":"ds","zai":"zai","alibaba":"ali","alibaba-cn":"ali-cn","longcat":"lc","moonshot":"moonshot","volcengine":"volcengine","volcengine-agent-plan":"veap","volcengine-coding-plan":"vecp","gigachat":"gigachat","xiaomi-mimo":"mimo","xiaomi-mimo-token-plan":"mimotp","baidu":"baidu","tencent":"tencent","iflytek":"iflytek","baichuan":"baichuan","yi":"yi","stepfun":"stepfun","coze":"coze","360ai":"360ai","doubao":"doubao","sensenova":"sensenova","sparkdesk":"sparkdesk","hcnsec":"hcnsec","agnes":"agnes","agnes-cn":"agnescn","sealion":"sealion","clova-studio":"clova","internlm":"internlm","ant-ling":"ling","sarvam":"sarvam","plamo":"plamo","typhoon":"typhoon","nlpcloud":"nlpc","runwayml":"runway","kie":"kie","pollinations":"pol","haiper":"hp","leonardo":"leo","ideogram":"ideo","magnific":"freepik","udio":"udio","v0-vercel":"v0","gitlab":"gitlab","voyage-ai":"voyage","jina-ai":"jina","fal-ai":"fal","stability-ai":"stability","black-forest-labs":"bfl","recraft":"recraft","topaz":"topaz","segmind":"segmind","dify":"dify","nomic":"nomic","mixedbread":"mxbai","jina-reader":"jr","tinyfish":"tf","deepai":"deepai","cursor-api":"cua","mlx-gemma":"mlx-gemma","mlx-qwen":"mlx-qwen","ollama-local":"ollama","lm-studio":"lmstudio","vllm":"vllm","lemonade":"lemonade","llamafile":"llamafile","llama-cpp":"llamacpp","triton":"triton","docker-model-runner":"dmr","xinference":"xinference","oobabooga":"ooba","sdwebui":"sdwebui","comfyui":"comfyui","devin-cli-agentic":"dva","opencode":"oc","duckduckgo-web":"ddgw","cloudflare-playground":"cfp","veoaifree-web":"veo-free","auggie":"aug","zcode":"zc","codex-app-server":"cxa","uncloseai":"unc","aihorde":"horde","perplexity-search":"pplx-search","serper-search":"serper-search","brave-search":"brave-search","exa-search":"exa-search","tavily-search":"tavily-search","anysearch-search":"anysearch","firecrawl":"fc","google-pse-search":"google-pse","nimble-search":"nimble","linkup-search":"linkup","searchapi-search":"searchapi","youcom-search":"youcom-search","searxng-search":"searxng","x-search":"x_search","xquik-search":"xquik","ollama-search":"ollama-search","context7":"context7","deepgram":"dg","assemblyai":"aai","soniox":"sx","elevenlabs":"el","cartesia":"cartesia","fishaudio":"fishaudio","playht":"playht","inworld":"inworld","aws-polly":"polly","gladia":"gladia","rev-ai":"revai","speechmatics":"sm","chatgpt-web-codex":"cgpt-codex","grok-web":"gw","gemini-web":"gweb","perplexity-web":"pplx-web","blackbox-web":"bb-web","muse-spark-web":"ms-web","claude-web":"cw","deepseek-web":"ds-web","copilot-web":"copilot","copilot-m365-web":"m365copilot","t3-web":"t3chat","inner-ai":"in-ai","adapta-web":"adp-web","lmarena":"lma","yuanbao-web":"ybw","tencent-aistudio-web":"tasw","huggingchat":"huggingchat","poe-web":"poe","venice-web":"ven","v0-vercel-web":"v0-vercel-web","kimi-web":"kimi-web","doubao-web":"db","zenmux-free":"zmf","tinycms-web":"tcw","zai-web":"zw","promptql":"pql","notion-web":"nw","adobe-firefly":"firefly","hyperagent":"ha","conol-web":"cnl","maxai":"mx","uc":"ucn","auto":"auto","jules":"jules","devin":"devin","codex-cloud":"codex-cloud"};

const filterLogic = `
// ==== OMNIROUTE /v1/models VISIBILITY FILTER (v2) ====
const V2_ALIAS_MAP = ${JSON.stringify(ALIASES)};

function v2GetDb() {
  const fs = require("fs");
  const path = require("path");
  const candidates = [
    process.env.DATA_DIR && path.join(process.env.DATA_DIR, "storage.sqlite"),
    path.join(process.env.HOME || "", ".omniroute", "storage.sqlite"),
    path.join(process.env.HOME || "", ".local/share/omniroute/storage.sqlite"),
    "/root/.omniroute/storage.sqlite",
    "/root/.local/share/omniroute/storage.sqlite",
  ].filter(Boolean);
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const { DatabaseSync } = require("node:sqlite");
      return new DatabaseSync(c, { readOnly: true });
    } catch (e) {}
    try {
      const Database = require("better-sqlite3");
      return new Database(c, { readonly: true });
    } catch (e) {}
  }
  return null;
}

// Mirrors src/lib/db/models/compat.ts::isOverrideHiddenForModality for chat:
// explicit hiddenModalities.chat wins; otherwise fall back to legacy isHidden.
function v2IsHiddenForChat(entry) {
  if (!entry || typeof entry !== "object") return false;
  const scoped =
    entry.hiddenModalities && typeof entry.hiddenModalities === "object"
      ? entry.hiddenModalities.chat
      : undefined;
  if (scoped !== undefined) return Boolean(scoped);
  return Boolean(entry.isHidden);
}

function v2GetFilterState() {
  const db = v2GetDb();
  if (!db) return null;
  try {
    // 1. Active providers: registry ids ( + aliases ) and node UUIDs
    const activeIds = new Set();
    const activeNodeIds = new Set();
    const connRows = db
      .prepare("SELECT provider, test_status FROM provider_connections WHERE is_active = 1")
      .all();
    for (const row of connRows) {
      if (row.test_status === "unavailable") continue;
      const p = String(row.provider || "").toLowerCase().trim();
      if (!p) continue;
      if (p.indexOf("openai-compatible-chat-") === 0) {
        activeNodeIds.add(p);
      } else {
        activeIds.add(p);
        const alias = V2_ALIAS_MAP[p];
        if (alias) activeIds.add(String(alias).toLowerCase());
      }
    }

    // 2. Node UUID -> prefix / name variants (only for nodes with an active connection)
    const nodeIdToPrefix = {};
    try {
      const nodeRows = db.prepare("SELECT id, name, prefix, type FROM provider_nodes").all();
      for (const n of nodeRows) {
        const id = String(n.id || "").toLowerCase();
        const prefix = String(n.prefix || "").toLowerCase().trim();
        if (!id || !prefix) continue;
        nodeIdToPrefix[id] = prefix;
        if (!activeNodeIds.has(id)) continue;
        activeIds.add(prefix);
        const name = String(n.name || "").toLowerCase().trim();
        if (name) {
          activeIds.add(name);
          activeIds.add(name.replace(/\\s+/g, "-"));
          activeIds.add(name.replace(/[^a-z0-9-]/g, ""));
        }
        const alias = V2_ALIAS_MAP[prefix];
        if (alias) activeIds.add(String(alias).toLowerCase());
      }
    } catch (e) {}

    // 3. User combos (skip isActive=false / isHidden=true recorded in data JSON)
    const activeCombos = new Set();
    try {
      const comboRows = db.prepare("SELECT name, data FROM combos").all();
      for (const r of comboRows) {
        if (!r.name) continue;
        let ok = true;
        try {
          const d = JSON.parse(r.data);
          if (d && (d.isActive === false || d.isHidden === true)) ok = false;
        } catch (e) {}
        if (ok) activeCombos.add(String(r.name).toLowerCase());
      }
    } catch (e) {}

    // 4. Hidden models, provider-scoped:
    //    key_value(namespace='modelCompatOverrides'|'customModels', key=providerId|nodeUUID)
    //    -> JSON array [{id, isHidden, hiddenModalities?}]
    const hiddenByPrefix = new Map(); // prefix/alias key (lc) -> Set(hidden model lc)
    const kvRows = db
      .prepare(
        "SELECT namespace, key, value FROM key_value WHERE namespace IN ('modelCompatOverrides','customModels')"
      )
      .all();
    for (const row of kvRows) {
      let list;
      try { list = JSON.parse(row.value); } catch (e) { continue; }
      if (!Array.isArray(list)) continue;
      const providerKey = String(row.key || "").toLowerCase();
      // node UUID key -> prefix; registry id key -> alias
      const targetKey =
        nodeIdToPrefix[providerKey] ||
        (V2_ALIAS_MAP[providerKey] ? String(V2_ALIAS_MAP[providerKey]).toLowerCase() : null) ||
        providerKey;
      if (!targetKey) continue;
      let hiddenSet = hiddenByPrefix.get(targetKey);
      if (!hiddenSet) {
        hiddenSet = new Set();
        hiddenByPrefix.set(targetKey, hiddenSet);
      }
      for (const entry of list) {
        if (!entry || typeof entry !== "object") continue;
        const modelId = typeof entry.id === "string" ? entry.id : null;
        if (!modelId) continue;
        if (!v2IsHiddenForChat(entry)) continue;
        hiddenSet.add(modelId.toLowerCase());
        // sub-prefixed entries ("z-ai/glm-5.3" under a node's list): scope the
        // leaf to THIS provider only — never globally (the v1 bug).
        if (modelId.indexOf("/") > 0) {
          const leaf = modelId.split("/").slice(1).join("/").toLowerCase();
          if (leaf) hiddenSet.add(leaf);
        }
      }
    }

    // 5. Dashboard settings (stored JSON-encoded in key_value namespace='settings')
    // hideNoThinkVariants is now redundant for /v1/models (no-think/* is always
    // hidden by default), but still read for forward-compatibility.
    let hideNoThink = true;
    try {
      const srow = db
        .prepare("SELECT value FROM key_value WHERE namespace = 'settings' AND key = 'hideNoThinkVariants'")
        .get();
      if (srow && String(srow.value).trim() === "true") hideNoThink = true;
    } catch (e) {}

    return { activeIds, activeCombos, hiddenByPrefix, hideNoThink };
  } catch (e) {
    return null;
  }
}

function wrapWithModelsFilter(listener) {
  return function v2ModelsFilterHandler(req, res) {
    const rawUrl = typeof req?.url === "string" ? req.url : "/";
    const isModelsRoute =
      (rawUrl === "/v1/models" ||
        rawUrl.indexOf("/v1/models?") === 0 ||
        rawUrl.indexOf("/v1/models/") === 0) &&
      req.method === "GET";

    if (!isModelsRoute) {
      return listener.call(this, req, res);
    }

    const origEnd = res.end;
    const origWrite = res.write;
    const chunks = [];
    const includeAuto =
      rawUrl.indexOf("include_auto=true") >= 0 ||
      rawUrl.indexOf("auto=true") >= 0 ||
      rawUrl.indexOf("virtual=true") >= 0;
    const includeNoThink =
      rawUrl.indexOf("include_no_think=true") >= 0 ||
      rawUrl.indexOf("no_think=true") >= 0;

    res.write = function (chunk, ...args) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    };

    res.end = function (chunk, encoding, callback) {
      if (typeof chunk === "function") { callback = chunk; chunk = null; }
      if (typeof encoding === "function") { callback = encoding; encoding = null; }
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));

      const raw = Buffer.concat(chunks).toString("utf8");

      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(raw);
          if (Array.isArray(json.data)) {
            const st = v2GetFilterState();
            if (st) {
              const { activeIds, activeCombos, hiddenByPrefix, hideNoThink } = st;
              json.data = json.data.filter((model) => {
                if (!model || !model.id) return false;
                const id = String(model.id).toLowerCase();
                const ownedBy = String(model.owned_by || "").toLowerCase();
                const slash = id.indexOf("/");
                const prefix = slash > 0 ? id.slice(0, slash) : "";
                const leaf = slash > 0 ? id.slice(slash + 1) : id;

                // 1. no-think/* gateway variants: hidden by default,
                //    shown with ?include_no_think=true
                if (prefix === "no-think") return includeNoThink;

                // 2. auto/* virtual combos: hidden unless ?include_auto=true
                if (prefix === "auto") return includeAuto;

                // 3. user-created combos: keep only active/visible ones
                if (ownedBy === "combo") return activeCombos.has(id);

                // 4. must belong to an active provider connection or node
                if (!activeIds.has(ownedBy) && !activeIds.has(prefix)) return false;

                // 5. provider-scoped hidden check (id or leaf within that provider)
                const hiddenSet = hiddenByPrefix.get(prefix) || hiddenByPrefix.get(ownedBy);
                if (hiddenSet && (hiddenSet.has(id) || hiddenSet.has(leaf))) return false;

                return true;
              });
            }
          }
          const newBody = JSON.stringify(json);
          if (!res.headersSent) {
            res.setHeader("content-length", Buffer.byteLength(newBody));
          }
          return origEnd.call(res, newBody, encoding, callback);
        } catch (err) {
          return origEnd.call(res, raw, encoding, callback);
        }
      }

      return origEnd.call(res, raw, encoding, callback);
    };

    return listener.call(this, req, res);
  };
}
// ==== END FILTER ====
`;

const ANCHOR = "function wrapRequestListenerWithMethodGuard(listener) {";
if (!code.includes(ANCHOR)) {
  console.error("ERROR: injection anchor missing — guard file layout changed?");
  process.exit(1);
}
if (code.includes("V2_ALIAS_MAP")) {
  console.log("Previous v2 injection detected — resetting from backup (idempotent)");
}

code = code.replace(
  ANCHOR,
  filterLogic + "\n" + ANCHOR + "\n  listener = wrapWithModelsFilter(listener);"
);

fs.writeFileSync(guardPath, code, "utf8");

/* ---------------- syntax check ---------------- */
try {
  new Function(code);
} catch (e) {
  // restore backup on failure
  fs.copyFileSync(backupPath, guardPath);
  console.error("ERROR: patched file failed syntax check — backup restored.", e.message);
  process.exit(1);
}

console.log("Filter injected successfully");
console.log("  - Active providers + provider nodes only");
console.log("  - Provider-scoped dashboard hidden models (hiddenModalities aware)");
console.log("  - auto/* hidden by default (use ?include_auto=true to show)");
console.log("  - no-think/* hidden by default (use ?include_no_think=true to show)");

if (process.env.SKIP_RESTART !== "1") {
  try {
    execSync("pm2 restart omniroute || sudo systemctl restart omniroute", { stdio: "inherit" });
    console.log("OmniRoute restarted");
  } catch (e) {
    console.log("Please restart omniroute (pm2 restart omniroute)");
  }
}
