/*
 * Requires Node 18+ (built-in fetch). No external dependencies.
 *
 * Usage:  node <File Nzme>
 *         (you will be prompted to paste the published Google Doc link)
 */

const readline = require("node:readline/promises");

const NAMED_ENTITIES = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
};

function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
        if (body[0] === "#") {
            const isHex = body[1] === "x" || body[1] === "X";
            const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
            return Number.isNaN(code) ? match : String.fromCodePoint(code);
        }
        return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    });
}

function cellText(cellHtml) {
    return decodeEntities(cellHtml.replace(/<[^>]*>/g, ""));
}

/** Pulls { x, char, y } records out of the document's table rows. */
function parsePoints(html) {
    const points = [];
    const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

    for (const row of rows) {
        const cells = (row.match(/<td[\s\S]*?<\/td>/gi) ?? []).map(cellText);
        if (cells.length < 3) continue;

        const x = Number.parseInt(cells[0].trim(), 10);
        const y = Number.parseInt(cells[2].trim(), 10);
        if (Number.isNaN(x) || Number.isNaN(y)) continue; // skips the header row

        // Strip only line breaks so a legitimate space character is preserved.
        const char = Array.from(cells[1].replace(/[\r\n]/g, ""))[0] ?? " ";
        points.push({ x, y, char });
    }
    return points;
}

/** Builds the printable grid as a string. Missing positions become spaces. */
function renderGrid(points) {
    if (points.length === 0) return "";

    const maxX = Math.max(...points.map((p) => p.x));
    const maxY = Math.max(...points.map((p) => p.y));

    const grid = Array.from({ length: maxY + 1 }, () =>
        Array(maxX + 1).fill(" ")
    );
    for (const { x, y, char } of points) grid[y][x] = char;

    // y = 0 is the bottom row, so print from the top (maxY) downward.
    return grid
        .reverse()
        .map((row) => row.join(""))
        .join("\n");
}

async function decodeSecretMessage(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch document: HTTP ${response.status}`);
    }
    const html = await response.text();
    console.log(renderGrid(parsePoints(html)));
}

module.exports = { decodeSecretMessage, parsePoints, renderGrid };

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const url = (await rl.question("Enter the Google Doc link: ")).trim();
    rl.close();

    if (!url) {
        console.error("No link entered.");
        process.exit(1);
    }
    await decodeSecretMessage(url);
}

if (require.main === module) {
    main().catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}