const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, usersFilePath } = require('../utils/fileHandler');
const { verifyToken } = require('../middleware/authMiddleware'); // Імпортуємо middleware

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Ім'я користувача та пароль є обов'язковими." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Пароль має містити щонайменше 6 символів." });
        }

        const users = await readData(usersFilePath);
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(409).json({ message: "Користувач з таким ім'ям вже існує." });
        }
        const existingEmail = email ? users.find(u => u.email === email) : null;
        if (email && existingEmail) {
             return res.status(409).json({ message: "Користувач з таким email вже існує." });
        }


        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = {
            id: uuidv4(),
            username,
            email: email || null, // Зберігаємо email, якщо він наданий
            passwordHash,
            isAdmin: false // За замовчуванням нові користувачі не адміни
                           // Можна додати логіку для першого зареєстрованого користувача як адміна
        };

        users.push(newUser);
        await writeData(usersFilePath, users);

        res.status(201).json({ message: 'Користувача успішно зареєстровано.', userId: newUser.id, username: newUser.username });

    } catch (error) {
        console.error('Помилка реєстрації:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера під час реєстрації.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Ім'я користувача та пароль є обов'язковими." });
        }

        const users = await readData(usersFilePath);
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ message: 'Неправильне ім\'я користувача або пароль.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Неправильне ім\'я користувача або пароль.' });
        }

        // Створюємо JWT токен
        const payload = {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin
            // Не додавайте сюди пароль або інші чутливі дані!
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Термін дії токена (наприклад, 1 година, 7d, 30d)
        );

        res.json({
            message: 'Вхід успішний!',
            token,
            user: { // Відправляємо деякі дані користувача на клієнт
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Помилка входу:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера під час входу.' });
    }
});

// GET /api/auth/status (або /me) - перевірка статусу авторизації
router.get('/status', verifyToken, async (req, res) => {
    // Якщо verifyToken спрацював успішно, req.user містить дані з токена
    try {
        // Для більшої надійності, можна ще раз перевірити користувача в "базі даних"
        // Це захистить від ситуації, коли користувач видалений, а токен ще дійсний
        const users = await readData(usersFilePath);
        const currentUser = users.find(u => u.id === req.user.id);

        if (!currentUser) {
            return res.status(404).json({ message: 'Користувача не знайдено (можливо, видалено).' });
        }
        
        res.json({
            isLoggedIn: true,
            user: {
                id: currentUser.id,
                username: currentUser.username,
                email: currentUser.email,
                isAdmin: currentUser.isAdmin
            }
        });
    } catch (error) {
        console.error('Помилка перевірки статусу:', error);
        res.status(500).json({ message: 'Внутрішня помилка сервера при перевірці статусу.' });
    }
});


// POST /api/auth/logout (для JWT це переважно клієнтська операція, але можна мати ендпоінт)
router.post('/logout', (req, res) => {
    // Для JWT-токенів, основна логіка виходу відбувається на клієнті
    // (видалення токена з localStorage/sessionStorage).
    // Цей ендпоінт може бути корисним, якщо ви використовуєте refresh-токени
    // або маєте логіку "чорного списку" токенів на сервері.
    // Зараз він просто підтверджує запит.
    res.json({ message: 'Вихід ініційовано. Будь ласка, видаліть токен на клієнті.' });
});


module.exports = router;