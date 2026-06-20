const db = require("../db");
const crypto = require("crypto");

async function logIR(invoice, subtotal, vat, total) {

    const hash = crypto
        .createHash("sha256")
        .update(invoice + subtotal + vat + total)
        .digest("hex");

    await db.query(
        "INSERT INTO ird_logs (invoice_no,hash) VALUES ($1,$2)",
        [invoice, hash]
    );
}

module.exports = { logIR };