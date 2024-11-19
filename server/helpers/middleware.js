const jwt = require('./jwt');
exports.jwtVerification = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            const token = req.headers.authorization.split(' ').reverse()[0];
            const verifyToken = await jwt.verifyToken(token)
            if (verifyToken.id) {
                req.user = verifyToken;
                next();
            }
        } else {
            return res.status(404).json({
                status: 404,
                error: 'Invalid Auth token',
                data: null
            })
        }
    } catch (e) {
        return res.status(404).json({
            status: 404,
            error: e.message,
            data: null
        })
    }
}