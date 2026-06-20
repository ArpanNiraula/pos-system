const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {

        const {
            username,
            password
        } = req.body;

        const result = await db.query(
            `
            SELECT *
            FROM users
            WHERE username = $1
            AND active = true
            `,
            [username]
        );

        if (!result.rows.length) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        const validPassword =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '12h'
            }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Login failed'
        });

    }
};

exports.me = async (req, res) => {
    try {

        const result = await db.query(
            `
            SELECT
                id,
                username,
                full_name,
                role
            FROM users
            WHERE id = $1
            `,
            [req.user.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Failed'
        });

    }
};