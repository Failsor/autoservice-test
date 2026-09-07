const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-key-123';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(__dirname));

// Инициализация базы данных в файле db.json
function loadData() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = { users: [], bookings: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { users: [], bookings: [] };
    }
}

function saveData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware для проверки Bearer токена
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

// Регистрация
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const db = loadData();
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким Email уже существует' });
    }

    const newUser = { id: Date.now().toString(), name, email, password };
    db.users.push(newUser);
    saveData(db);

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

// Авторизация
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' });
    }

    const db = loadData();
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

// GET: Получение всех записей авторизованного пользователя
app.get('/api/bookings', authenticateBearerToken, (req, res) => {
    const db = loadData();
    const userBookings = db.bookings.filter(b => b.userId === req.user.id);
    res.json(userBookings);
});

// POST: Создание новой записи
app.post('/api/booking', authenticateBearerToken, (req, res) => {
    const { firstName, lastName, carModel, carNumber, services, total, date, time, comment } = req.body;

    if (!carModel || !carNumber || !date || !time) {
        return res.status(400).json({ message: 'Заполните основные поля заявки' });
    }

    const db = loadData();
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
    saveData(db);

    res.status(201).json({ message: 'Запись успешно создана', booking: newBooking });
});

// PUT: Редактирование записи по ID
app.put('/api/bookings/:id', authenticateBearerToken, (req, res) => {
    const bookingId = req.params.id;
    const db = loadData();

    const bookingIndex = db.bookings.findIndex(b => b.id === bookingId && b.userId === req.user.id);
    if (bookingIndex === -1) {
        return res.status(404).json({ message: 'Запись не найдена или принадлежит другому пользователю' });
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

    saveData(db);
    res.json({ message: 'Запись успешно обновлена', booking: db.bookings[bookingIndex] });
});

// DELETE: Удаление записи по ID
app.delete('/api/bookings/:id', authenticateBearerToken, (req, res) => {
    const bookingId = req.params.id;
    const db = loadData();

    const initialLength = db.bookings.length;
    db.bookings = db.bookings.filter(b => !(b.id === bookingId && b.userId === req.user.id));

    if (db.bookings.length === initialLength) {
        return res.status(404).json({ message: 'Запись не найдена или у вас нет прав на её удаление' });
    }

    saveData(db);
    res.json({ message: 'Запись успешно удалена', id: bookingId });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});