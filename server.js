const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
// Эта строка позволяет серверу отдавать ваш index.html пользователям
app.use(express.static(path.join(__dirname)));

// Временная база данных в памяти (позже можно заменить на реальную БД)
let bookings = [
    { id: 1, firstName: 'Иван', lastName: 'Иванов', carModel: 'Toyota Corolla', carNumber: 'А123ВЕ777', serviceType: 'Замена масла', bookDate: '2026-06-10', bookTime: '10:00', carComment: 'Тестовая заявка' }
];

// 1. GET: Получить все заявки
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// 2. POST: Создать новую заявку
app.post('/api/bookings', (req, res) => {
    const newBooking = {
        id: Date.now(),
        ...req.body
    };
    bookings.push(newBooking);
    res.status(201).json({ message: 'Заявка успешно создана', booking: newBooking });
});

// 3. PUT: Полное обновление заявки
app.put('/api/bookings/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = bookings.findIndex(b => b.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Заявка не найдена' });
    }

    bookings[index] = { id, ...req.body };
    res.json({ message: 'Заявка полностью обновлена', booking: bookings[index] });
});

// 4. PATCH: Частичное обновление заявки
app.patch('/api/bookings/:id', (req, res) => {
    const id = Number(req.params.id);
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
        return res.status(404).json({ error: 'Заявка не найдена' });
    }

    Object.assign(booking, req.body);
    res.json({ message: 'Заявка частично обновлена', booking });
});

// 5. DELETE: Удаление заявки
app.delete('/api/bookings/:id', (req, res) => {
    const id = Number(req.params.id);
    const lengthBefore = bookings.length;
    bookings = bookings.filter(b => b.id !== id);

    if (bookings.length === lengthBefore) {
        return res.status(404).json({ error: 'Заявка не найдена' });
    }

    res.json({ message: 'Заявка успешно удалена' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});