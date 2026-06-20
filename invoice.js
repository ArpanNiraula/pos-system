function generateInvoice() {
    return "INV-" + Date.now();
}

module.exports = { generateInvoice };