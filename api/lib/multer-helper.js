const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB max
});

function parseMultipart(req, res, fieldName) {
    return new Promise((resolve, reject) => {
        const handler = upload.single(fieldName);
        handler(req, res, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

module.exports = { parseMultipart };
