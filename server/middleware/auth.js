import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token format invalid, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aurafinancedefaultsecret987654321');
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};

export default auth;
