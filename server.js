const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-key-123'; // Секретный ключ для подписи токенов

app.use(express.json());
app.use(express.static(__dirname));

// Простая база данных пользователей в памяти
const users = [];

// --- Middleware для проверки Bearer токена ---
function authenticateBearerToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Отсутствует заголовок Authorization' });
    }

    const token = authHeader.split(' ')[1]; // Ожидаем формат: "Bearer <TOKEN>"
    if (!token) {
        return res.status(401).json({ message: 'Неверный формат Bearer токена' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Недействительный или истекший токен' });
        }
        req.user = user;
        next();
    });
}

// --- Маршруты (API Endpoints) ---

// Регистрация
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким Email уже существует' });
    }

    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);

    // Генерация JWT токена
    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.status(201).json({ 
        message: 'Регистрация прошла успешно', 
        token: token,
        user: { name: newUser.name, email: newUser.email } 
    });
});

// Вход (Авторизация)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Неверный e-mail или пароль' });
    }

    // Генерация JWT токена
    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.status(200).json({ 
        message: 'Успешный вход', 
        token: token,
        user: { name: user.name, email: user.email } 
    });
});

// Защищенный маршрут: получение данных текущего профиля
app.get('/api/me', authenticateBearerToken, (req, res) => {
    res.json({ message: 'Доступ разрешен', user: req.user });
});

// Защищенный маршрут: отправка заявки на ремонт
app.post('/api/booking', authenticateBearerToken, (req, res) => {
    const bookingData = req.body;
    console.log(`Принята заявка от ${req.user.email}:`, bookingData);
    
    res.status(200).json({ message: 'Заявка успешно отправлена на сервер' });
});

// Отдача фронтенда
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});