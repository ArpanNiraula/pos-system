const db = require('../db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                id,
                username,
                full_name,
                role,
                active
            FROM users
            ORDER BY full_name
            `
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to fetch users'
        });
    }
};

exports.createUser = async (req, res) => {
    const {
        username,
        full_name,
        password,
        role
    } = req.body;

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await db.query(
            `
            INSERT INTO users (
                username,
                full_name,
                password_hash,
                role
            )
            VALUES ($1,$2,$3,$4)
            RETURNING id, username, full_name, role
            `,
            [
                username,
                full_name,
                passwordHash,
                role
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: 'Failed to create user'
        });
    }
};