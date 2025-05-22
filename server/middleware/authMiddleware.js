const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Bearer TOKEN
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Токен не надано. Доступ заборонено.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Помилка верифікації токена:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Термін дії токена вийшов.' });
            }
            return res.status(401).json({ message: 'Недійсний токен.' });
        }
        req.user = decoded; // Додаємо розкодовані дані користувача (напр., id, username) до об'єкту запиту
        next();
    });
};

const isAdmin = (req, res, next) => {
    // Ця перевірка спрацює після verifyToken, тому req.user має існувати
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Доступ заборонено. Потрібні права адміністратора.' });
    }
};


module.exports = { verifyToken, isAdmin };