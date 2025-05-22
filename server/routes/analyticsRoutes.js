// server/routes/analyticsRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // Використовуємо fs.promises для асинхронних операцій з файлами

const { readData, writeData, topicsFilePath, postsFilePath } = require('../utils/fileHandler');
// Переконуємося, що isAdmin імпортовано, якщо він у вас в окремому файлі authMiddleware
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); 

const router = express.Router();

// --- Налаштування Multer (залишається без змін) ---
const UPLOADS_DIR = path.join(__dirname, '../uploads');
// ... (код для UPLOADS_DIR, storage, imageMimeTypes, documentMimeTypes, fileFilter, upload) ...
if (!fs.existsSync(UPLOADS_DIR)){
    try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    } catch (err) {
        console.error(`Помилка створення папки uploads: ${err}`);
    }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOADS_DIR); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
const documentMimeTypes = [
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'
];
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "postImage") {
    if (imageMimeTypes.includes(file.mimetype)) cb(null, true);
    else { const err = new Error('Для головного зображення дозволено лише формати JPG, PNG, GIF.'); err.code = 'UNSUPPORTED_IMAGE_TYPE'; cb(err, false); }
  } else if (file.fieldname === "attachmentFiles") {
    if (documentMimeTypes.includes(file.mimetype) || imageMimeTypes.includes(file.mimetype)) cb(null, true);
    else { const err = new Error('Для додаткових файлів дозволено: PDF, DOC(X), TXT та зображення.'); err.code = 'UNSUPPORTED_ATTACHMENT_TYPE'; cb(err, false); }
  } else cb(null, false);
};
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 }, fileFilter: fileFilter });


// --- Маршрути для Тем ---
// GET /api/analytics/topics (без змін)
router.get('/topics', async (req, res) => {
    // ... (код з попереднього кроку)
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchQuery = req.query.search || '';
        let allTopics = await readData(topicsFilePath);
        let filteredTopics = allTopics;
        if (searchQuery) {
            filteredTopics = allTopics.filter(topic => 
                topic.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        filteredTopics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const results = filteredTopics.slice(startIndex, endIndex);
        const totalItems = filteredTopics.length;
        const totalPages = Math.ceil(totalItems / limit);
        res.json({
            data: results, currentPage: page, totalPages: totalPages, totalItems: totalItems, itemsPerPage: limit, searchQuery: searchQuery
        });
    } catch (error) { 
        console.error('Error fetching topics:', error);
        res.status(500).json({ message: 'Помилка отримання списку тем.' });
    }
});

// POST /api/analytics/topics (без змін)
router.post('/topics', verifyToken, async (req, res) => {
    // ... (код з попереднього кроку)
    try {
        const { title } = req.body;
        if (!title || title.trim() === '') return res.status(400).json({ message: 'Назва теми не може бути порожньою.' });
        let topics = await readData(topicsFilePath);
        const newTopic = { id: uuidv4(), title: title.trim(), authorId: req.user.id, authorUsername: req.user.username, createdAt: new Date().toISOString(), postCount: 0 };
        topics.push(newTopic); 
        await writeData(topicsFilePath, topics);
        res.status(201).json(newTopic);
    } catch (error) { 
        console.error('Error creating topic:', error);
        res.status(500).json({ message: 'Помилка створення теми.' });
    }
});

// GET /api/analytics/topics/:topicId (без змін)
router.get('/topics/:topicId', async (req, res) => {
    // ... (код з попереднього кроку)
    try {
        const topics = await readData(topicsFilePath);
        const topic = topics.find(t => t.id === req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Тему не знайдено.' });
        res.json(topic);
    } catch (error) { 
        console.error(`Error fetching topic ${req.params.topicId}:`, error);
        res.status(500).json({ message: 'Помилка отримання теми.' });
    }
});

// DELETE /api/analytics/topics/:topicId - Видалити тему та всі пов'язані пости (тільки адміністратор)
router.delete('/topics/:topicId', verifyToken, isAdmin, async (req, res) => {
    try {
        const { topicId } = req.params;

        let topics = await readData(topicsFilePath);
        const topicIndex = topics.findIndex(t => t.id === topicId);

        if (topicIndex === -1) {
            return res.status(404).json({ message: 'Тему не знайдено.' });
        }

        // 1. Знайти та підготувати до видалення всі пости, що належать цій темі
        let allPosts = await readData(postsFilePath);
        const postsToDelete = allPosts.filter(p => p.topicId === topicId);
        const postsToKeep = allPosts.filter(p => p.topicId !== topicId);

        // 2. Видалити файли, пов'язані з кожним постом, що видаляється
        if (postsToDelete.length > 0) {
            const fileDeletionPromises = [];
            postsToDelete.forEach(post => {
                if (post.attachments && post.attachments.length > 0) {
                    post.attachments.forEach(attachment => {
                        const filePathOnServer = path.join(UPLOADS_DIR, path.basename(attachment.path));
                        fileDeletionPromises.push(
                            fs.promises.unlink(filePathOnServer).catch(err => {
                                console.error(`Не вдалося видалити файл вкладення ${filePathOnServer}:`, err.message);
                                // Не перериваємо процес, якщо файл не знайдено або інша помилка
                            })
                        );
                    });
                }
            });
            await Promise.all(fileDeletionPromises); // Чекаємо завершення всіх операцій видалення файлів
        }

        // 3. Оновити файл posts.json (зберігаємо лише ті пости, що не належать темі, яка видаляється)
        await writeData(postsFilePath, postsToKeep);

        // 4. Видалити саму тему з topics.json
        topics.splice(topicIndex, 1);
        await writeData(topicsFilePath, topics);

        res.status(200).json({ message: `Тему "${topics[topicIndex]?.title || topicId}" та всі пов'язані пости успішно видалено.` }); // topics[topicIndex] тут вже не існує, тому краще topicId

    } catch (error) {
        console.error(`Error deleting topic ${req.params.topicId} and its posts:`, error);
        res.status(500).json({ message: 'Помилка видалення теми.' });
    }
});


// --- Маршрути для Постів (залишаються без змін) ---
// ... (код для GET /topics/:topicId/posts, POST /topics/:topicId/posts, PUT /posts/:postId, DELETE /posts/:postId) ...
router.get('/topics/:topicId/posts', async (req, res) => {
    try {
        const { topicId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const topics = await readData(topicsFilePath);
        const topicExists = topics.some(t => t.id === topicId);
        if (!topicExists) return res.status(404).json({ message: 'Тему не знайдено.' });
        const allPosts = await readData(postsFilePath);
        let postsForTopic = allPosts.filter(p => p.topicId === topicId);
        postsForTopic.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const results = postsForTopic.slice(startIndex, endIndex);
        const totalItems = postsForTopic.length;
        const totalPages = Math.ceil(totalItems / limit);
        res.json({ data: results, currentPage: page, totalPages: totalPages, totalItems: totalItems, itemsPerPage: limit });
    } catch (error) { 
        console.error(`Error fetching posts for topic ${req.params.topicId}:`, error);
        res.status(500).json({ message: 'Помилка отримання постів для теми.' });
    }
});

router.post(
    '/topics/:topicId/posts', 
    verifyToken, 
    (req, res, next) => {
        const uploader = upload.fields([
            { name: 'postImage', maxCount: 1 },
            { name: 'attachmentFiles', maxCount: 4 }
        ]);
        uploader(req, res, function (err) {
            if (err instanceof multer.MulterError) { return res.status(400).json({ message: `Multer error: ${err.message}` }); }
            else if (err) { return res.status(400).json({ message: err.message || 'Помилка типу файлу.' }); }
            next(); 
        });
    },
    async (req, res) => {
    try {
        const { topicId } = req.params;
        const { content } = req.body;
        if (!content || content.trim() === '') return res.status(400).json({ message: 'Вміст поста не може бути порожнім.' });
        let topics = await readData(topicsFilePath);
        const topicIndex = topics.findIndex(t => t.id === topicId);
        if (topicIndex === -1) return res.status(404).json({ message: 'Тему для додавання поста не знайдено.' });
        const attachments = [];
        if (req.files) {
            if (req.files.postImage && req.files.postImage[0]) {
                const imageFile = req.files.postImage[0];
                attachments.push({ type: 'image', fieldname: imageFile.fieldname, filename: imageFile.originalname, path: `/uploads/${imageFile.filename}`, mimetype: imageFile.mimetype, size: imageFile.size });
            }
            if (req.files.attachmentFiles && req.files.attachmentFiles.length > 0) {
                req.files.attachmentFiles.forEach(file => {
                    let fileType = 'document'; 
                    if (imageMimeTypes.includes(file.mimetype)) fileType = 'image';
                    else if (file.mimetype === 'application/pdf') fileType = 'pdf';
                    attachments.push({ type: fileType, fieldname: file.fieldname, filename: file.originalname, path: `/uploads/${file.filename}`, mimetype: file.mimetype, size: file.size });
                });
            }
        }
        let posts = await readData(postsFilePath);
        const newPost = { id: uuidv4(), topicId, authorId: req.user.id, authorUsername: req.user.username, content: content.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attachments: attachments };
        posts.push(newPost);
        await writeData(postsFilePath, posts);
        topics[topicIndex].postCount = (topics[topicIndex].postCount || 0) + 1;
        await writeData(topicsFilePath, topics);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post with files (after upload middleware):', error);
        res.status(500).json({ message: 'Помилка створення поста з файлами.' });
    }
});

router.put('/posts/:postId', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body; 
        if (!content || content.trim() === '') return res.status(400).json({ message: 'Вміст поста не може бути порожнім.' });
        let posts = await readData(postsFilePath);
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return res.status(404).json({ message: 'Пост не знайдено.' });
        const postToUpdate = posts[postIndex];
        if (postToUpdate.authorId !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: 'Доступ заборонено.' });
        posts[postIndex].content = content.trim();
        posts[postIndex].updatedAt = new Date().toISOString();
        await writeData(postsFilePath, posts);
        res.json(posts[postIndex]);
    } catch (error) {
        console.error(`Error updating post ${req.params.postId}:`, error);
        res.status(500).json({ message: 'Помилка оновлення поста.' });
    }
});

router.delete('/posts/:postId', verifyToken, async (req, res) => {
    try {
        const { postId } = req.params;
        let posts = await readData(postsFilePath);
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return res.status(404).json({ message: 'Пост не знайдено.' });
        const postToDelete = posts[postIndex];
        if (postToDelete.authorId !== req.user.id && !req.user.isAdmin) return res.status(403).json({ message: 'Доступ заборонено.' });
        if (postToDelete.attachments && postToDelete.attachments.length > 0) {
            const deletePromises = postToDelete.attachments.map(attachment => {
                const filePathOnServer = path.join(UPLOADS_DIR, path.basename(attachment.path)); 
                return fs.promises.unlink(filePathOnServer).catch(err => {
                    console.error(`Failed to delete attachment file ${filePathOnServer}:`, err.message);
                });
            });
            await Promise.all(deletePromises);
        }
        const topicId = postToDelete.topicId; 
        posts.splice(postIndex, 1);
        await writeData(postsFilePath, posts);
        let topics = await readData(topicsFilePath);
        const topicToUpdateIndex = topics.findIndex(t => t.id === topicId);
        if (topicToUpdateIndex !== -1) {
            topics[topicToUpdateIndex].postCount = Math.max(0, (topics[topicToUpdateIndex].postCount || 0) - 1);
            await writeData(topicsFilePath, topics);
        }
        res.status(200).json({ message: 'Пост успішно видалено.' });
    } catch (error) {
        console.error(`Error deleting post ${req.params.postId}:`, error);
        res.status(500).json({ message: 'Помилка видалення поста.' });
    }
});

module.exports = router;