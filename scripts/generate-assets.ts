import "dotenv/config";
import { generateAssets } from "../lib/assets/generate-assets";

const result = await generateAssets();
console.log(JSON.stringify(result, null, 2));
