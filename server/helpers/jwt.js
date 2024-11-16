const jwt = require('jsonwebtoken');
const privateKey = process.env.JWT_SECRET ?? 'w9aH00xpZa';

exports.generateToken = async info => {
    return jwt.sign((info), privateKey, {expiresIn: "1d"});
}

exports.verifyToken = async token => {
    return jwt.verify(token, privateKey);
}