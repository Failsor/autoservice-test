const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для разбора JSON в теле запросов
app.use(express.json());

// Раздача статических файлов (index.html, CSS, JS) из текущей папки
app.use(express.static(__dirname));

// Простая база данных в памяти (для демонстрации)
const users = [];

// Эндпоинт регистрации
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

    return res.status(201).json({ message: 'Регистрация прошла успешно', user: { name: newUser.name, email: newUser.email } });
});

// Эндпоинт входа
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Неверный e-mail или пароль' });
    }

    return res.status(200).json({ message: 'Успешный вход', user: { name: user.name, email: user.email } });
});

// Отдача index.html при главном запросе
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});