import express from "express";
import { createServer } from "http";

import webhookHandler from "./webhookHandler.js";
import getPAGEID from "./getPageID.js";

const VALIDATION_TOKEN = process.env.VALIDATION_TOKEN;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const webhookByID = new Map();

for (const secret in process.env) {
    if (secret.startsWith("WEBHOOK_URL_") && secret.length > 12) {
        const name = secret.slice(12);

        if (!(`PAGE_ACCESS_TOKEN_${name}` in process.env)) {
            console.error(`[ INTERNAL ] PAGE_ACCESS_TOKEN_${name} not found`);
            continue;
        }

        const id = await getPAGEID(
            process.env[`PAGE_ACCESS_TOKEN_${name}`],
            name
        );
        if (id === null) continue;

        webhookByID.set(String(id), process.env[secret]);

        console.log(
            `[ INTERNAL ] ACCEPTED WEBHOOK_URL_${name} = ${process.env[secret]}`
        );
    }
}

const handler = webhookHandler(webhookByID);

const server = createServer(app);
app.get("/", (_req, res) => {
    res.send("Home page. Server running okay.");
});
app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === VALIDATION_TOKEN) {
        console.log("Webhook validated");
        return res.send(req.query["hub.challenge"]);
    }

    console.log("Wrong validation token");

    return res.send("Error, wrong validation token");
});

app.post("/webhook", function (req, res) {
    const entries = req.body.entry;
    for (const entry of entries) {
        const messaging = entry.messaging;
        if (!Array.isArray(messaging))
            return console.error("messaging is not Iterable");

        handler(messaging).catch((e) => {
            console.error(`Error in webhookHandler: ${e.message || e}`);
            if (e.stack) console.error(e.stack);
        });
    }
    res.status(200).send("OK");
});

app.set("port", process.env.PORT || 5000);
app.set("ip", process.env.IP || "0.0.0.0");
server.listen(app.get("port"), app.get("ip"), async function () {
    try {
        console.log(
            `Server running on ${
                app.get("ip") === "0.0.0.0"
                    ? "http://localhost"
                    : `https://${app.get("ip")}`
            }:${app.get("port")}`
        );
        console.log();
    } catch (e) {
        console.error(e);
        process.exit(0);
    }
});
