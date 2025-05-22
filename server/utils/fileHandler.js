const fs = require('fs').promises;
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');
const topicsFilePath = path.join(__dirname, '../data/topics.json'); // Новий шлях
const postsFilePath = path.join(__dirname, '../data/posts.json');   // Новий шлях

const readData = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        // Перевірка на порожній файл, щоб уникнути помилки JSON.parse
        if (data.trim() === '') {
            return []; // Або відповідну структуру за замовчуванням, наприклад {} для об'єкта
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`File not found: ${filePath}, returning empty array.`);
            return []; // Якщо файл не існує, створюємо його з порожнім масивом при першому записі
        }
        // Якщо помилка парсингу JSON через некоректний вміст (не порожній рядок)
        if (error instanceof SyntaxError) {
            console.error(`SyntaxError parsing JSON from file: ${filePath}`, error);
            console.warn(`File content might be corrupted. Returning empty array for ${filePath}.`);
            return []; // Повертаємо порожній масив, щоб уникнути падіння програми
        }
        console.error(`Error reading file from disk: ${filePath}`, error);
        throw error;
    }
};

const writeData = async (filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing file to disk: ${filePath}`, error);
        throw error;
    }
};

module.exports = {
    readData,
    writeData,
    usersFilePath,
    topicsFilePath, // Експортуємо
    postsFilePath   // Експортуємо
};