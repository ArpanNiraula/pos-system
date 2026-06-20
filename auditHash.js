const crypto = require('crypto');

function createAuditHash(data) {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
}

module.exports = createAuditHash;