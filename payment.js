const router = require("express").Router();

router.post("/esewa", (req, res) => {
    res.json({ message: "eSewa verification placeholder" });
});

router.post("/khalti", (req, res) => {
    res.json({ message: "Khalti verification placeholder" });
});

module.exports = router;