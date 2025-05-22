// server/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // fs потрібен для перевірки існування buildPath

// Імпортуємо маршрути
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
    'http://localhost:5173', // Для локальної розробки React
    'https://roman-petrushenko.github.io' // Для цього сайту на GitHub Pages
];

app.use(cors({
    origin: function (origin, callback) {
        // Дозволити запити без origin (наприклад, Postman, мобільні додатки, або якщо origin не встановлено)
        // АБО запити з дозволених доменів
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS: Запит з недозволеного домену: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json()); // Дозволяє Express обробляти JSON у тілі запиту
app.use(express.urlencoded({ extended: true })); // Дозволяє Express обробляти дані форм (url-encoded)


// --- Статична віддача завантажених файлів ---
// Робимо папку 'uploads' публічно доступною за шляхом '/uploads'
// Наприклад, файл server/uploads/image.jpg буде доступний за http://localhost:3001/uploads/image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- API Маршрути ---
app.get('/api/test', (req, res) => {
    const currentTime = new Date().toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kiev' });
    res.json({ message: 'Привіт від Express сервера! Зараз на сервері: ' + currentTime });
});

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes); // Підключаємо маршрути аналітики


// --- Обслуговування статичних файлів React-додатку (для продакшену) ---
const buildPath = path.join(__dirname, '../client/dist');
// console.log(`Перевірка шляху для статичних файлів: ${buildPath}`); // Можна закоментувати для зменшення логів

if (fs.existsSync(buildPath)) {
    // console.log(`Папка ${buildPath} існує. Налаштовуємо віддачу статичних файлів.`); // Можна закоментувати
    app.use(express.static(buildPath));

    app.get(/^\/(?!api).*/, (req, res) => {
        const indexPath = path.join(buildPath, 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('Помилка при віддачі index.html:', err);
                if (!fs.existsSync(indexPath)) {
                    console.error(`Файл ${indexPath} не знайдено.`);
                    return res.status(404).send(`Файл index.html не знайдено у ${buildPath}`);
                }
                if (!res.headersSent) { 
                    res.status(500).send(err.message || 'Помилка сервера при віддачі сторінки');
                }
            }
        });
    });
} else {
    console.warn(`ПОПЕРЕДЖЕННЯ: Папка зібраного React-додатку ${buildPath} не існує!`);
    console.warn('Будь ласка, виконайте "npm run build" у папці клієнта.');
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return next();
        }
        res.status(404).send('React додаток не зібрано або шлях до папки dist невірний. Виконайте "npm run build" в папці клієнта.');
    });
}

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер WebMeteo запущено на порту ${PORT}`);
    console.log(`Режим: ${process.env.NODE_ENV || 'development'}`);
});