import "dotenv/config";
import { runRulingPipeline } from "../lib/court/ruling-pipeline";
import { serializeCase } from "../lib/cases/serialize";

const caseId = process.argv[2];

if (!caseId) {
  console.error("Usage: npm run resolve-stuck <caseId>");
  process.exit(1);
}

const caseDoc = await runRulingPipeline(caseId);
console.log(JSON.stringify(serializeCase(caseDoc), null, 2));
