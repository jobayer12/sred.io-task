const jwt = require('./jwt');
exports.jwtVerification = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            const token = req.headers.authorization.split(' ').reverse()[0];
            const verifyToken = await jwt.verifyToken(token)
            if (verifyToken.id) {
                req.loggedInUserInfo = verifyToken;
                next();
            }
        } else {
            return res.status(404).json({
                statusCode: 404,
                errors:{
                    message: 'Invalid Auth token',
                },
            })
        }
    } catch (e) {
        return res.status(404).json({
            statusCode: 404,
            errors:{
                message: e.message,
            },
        })
    }
}