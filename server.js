const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем принимать JSON
app.use(express.json());

// --- МИДЛВЭР ДЛЯ ЛОГИРОВАНИЯ ЗАПРОСОВ (Видно и в консоли ПК, и в логах Render) ---
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} запрос на адрес: ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log('📦 Тело запроса (Payload):', JSON.stringify(req.body));
    }
    next();
});

// 1. Главная страница сайта
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. ПРИМЕР ЭНДПОИНТА АВТОРИЗАЦИИ С ПРАВИЛЬНЫМИ СТАТУС-КОДАМИ
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Проверка на пустые поля (Негативный сценарий: Bad Request)
    if (!email || !password) {
        console.log('❌ Ошибка авторизации: поля не заполнены');
        return res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Поля email и password обязательны для заполнения'
        });
    }

    // Тестовые данные для примера (в будущем здесь будет база данных)
    const validEmail = 'admin@autoservice.com';
    const validPassword = '123';

    if (email === validEmail && password === validPassword) {
        console.log(`✅ Успешный вход пользователя: ${email}`);
        return res.status(200).json({
            success: true,
            message: 'Авторизация прошла успешно',
            token: 'fake-jwt-token-example-12345'
        });
    } else {
        console.log(`❌ Ошибка авторизации: неверные данные для ${email}`);
        // 401 Unauthorized — стандартный код для неверных учетных данных
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Неверный логин или пароль'
        });
    }
});

// 3. Подключение Swagger документации
try {
    const swaggerDocument = YAML.load('./swagger.yaml');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.log('⚠️ Файл swagger.yaml не найден локально.');
}

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер автосервиса успешно запущен на порту ${PORT}`);
});