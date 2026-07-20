/**
 * Print eval scoreboard v1 vs v2 summary.
 * Run: pnpm --filter @beyoracle/oracle eval:scoreboard
 */
import { formatScoreboardReport, runScoreboard } from "../src/eval-scoreboard.js";

const report = runScoreboard();
console.log(formatScoreboardReport(report));
console.log("");
console.log(JSON.stringify(report, null, 2));
