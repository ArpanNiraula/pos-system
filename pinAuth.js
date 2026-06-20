const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/login-pin', async (req, res) => {
    try {

        const { pin } = req.body;

        if (!pin) {
            return res.status(400).json({
                message: 'PIN required'
            });
        }

        const result = await db.query(
            `
            SELECT id, full_name, role, username
            FROM users
            WHERE pin = $1 AND is_active = true
            `,
            [pin]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid PIN'
            });
        }

        const user = result.rows[0];

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            token,
            user
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'PIN login failed'
        });
    }
});

module.exports = router;