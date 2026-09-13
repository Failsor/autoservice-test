const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = 'super-secret-key-123';

// Хранилище в памяти для Vercel (вместо db.json)
let db = {
    users: [],
    bookings: []
};

app.use(express.json());
app.use(express.static(__dirname));

function authenticateBearerToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Отсутствует заголовок Authorization' });
    }

    const token = authHeader.split(' ')[1];
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

// --- API Endpoints ---

app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким Email уже существует' });
    }

    const newUser = { id: Date.now().toString(), name, email, password };
    db.users.push(newUser);

    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.status(201).json({
        message: 'Регистрация прошла успешно',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Неверный e-mail или пароль' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.status(200).json({
        message: 'Успешный вход',
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
});

app.get('/api/bookings', authenticateBearerToken, (req, res) => {
    const userBookings = db.bookings.filter(b => b.userId === req.user.id);
    res.json(userBookings);
});

// Новый эндпоинт: получение последней созданной записи пользователя
app.get('/api/booking/latest', authenticateBearerToken, (req, res) => {
    const userBookings = db.bookings.filter(b => b.userId === req.user.id);
    
    if (userBookings.length === 0) {
        return res.status(404).json({ message: 'Записи не найдены' });
    }

    // Запись с самым свежим createdAt
    const latestBooking = userBookings.reduce((latest, current) => {
        return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });

    res.json(latestBooking);
});

app.post('/api/booking', authenticateBearerToken, (req, res) => {
    const { firstName, lastName, carModel, carNumber, services, total, date, time, comment } = req.body;

    if (!carModel || !carNumber || !date || !time) {
        return res.status(400).json({ message: 'Заполните основные поля заявки' });
    }

    const newBooking = {
        id: "REQ-" + Date.now().toString().slice(-6),
        userId: req.user.id,
        firstName,
        lastName,
        carModel,
        carNumber: carNumber.toUpperCase(),
        services: services || 'Диагностика',
        total: total || 0,
        date,
        time,
        comment: comment || '',
        status: 'Принят',
        createdAt: new Date().toISOString()
    };

    db.bookings.push(newBooking);

    res.status(201).json({ message: 'Запись успешно создана', booking: newBooking });
});

app.put('/api/bookings/:id', authenticateBearerToken, (req, res) => {
    const bookingId = req.params.id;
    const bookingIndex = db.bookings.findIndex(b => b.id === bookingId && b.userId === req.user.id);
    
    if (bookingIndex === -1) {
        return res.status(404).json({ message: 'Запись не найдена' });
    }

    const { carModel, carNumber, services, total, date, time, comment } = req.body;

    db.bookings[bookingIndex] = {
        ...db.bookings[bookingIndex],
        carModel: carModel || db.bookings[bookingIndex].carModel,
        carNumber: carNumber ? carNumber.toUpperCase() : db.bookings[bookingIndex].carNumber,
        services: services !== undefined ? services : db.bookings[bookingIndex].services,
        total: total !== undefined ? total : db.bookings[bookingIndex].total,
        date: date || db.bookings[bookingIndex].date,
        time: time || db.bookings[bookingIndex].time,
        comment: comment !== undefined ? comment : db.bookings[bookingIndex].comment
    };

    res.json({ message: 'Запись успешно обновлена', booking: db.bookings[bookingIndex] });
});

app.delete('/api/bookings/:id', authenticateBearerToken, (req, res) => {
    const bookingId = req.params.id;
    const initialLength = db.bookings.length;
    db.bookings = db.bookings.filter(b => !(b.id === bookingId && b.userId === req.user.id));

    if (db.bookings.length === initialLength) {
        return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json({ message: 'Запись успешно удалена', id: bookingId });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск для локальной разработки
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
}

// Экспорт модуля для Vercel Serverless
module.exports = app;