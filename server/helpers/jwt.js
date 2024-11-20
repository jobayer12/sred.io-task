import jwt from 'jsonwebtoken';

const privateKey = process.env.JWT_SECRET ?? 'w9aH00xpZa';

export const generateToken = async (info) => {
    return jwt.sign(info, privateKey, { expiresIn: "1d" });
};

export const verifyToken = async (token) => {
    return jwt.verify(token, privateKey);
};