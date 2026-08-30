const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем принимать JSON в теле запроса
app.use(express.json());

// Раздача статических файлов из текущей директории (HTML, CSS, картинки)
app.use(express.static(__dirname));

// --- МИДЛВЭР ДЛЯ ЛОГИРОВАНИЯ ЗАПРОСОВ ---
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} запрос на адрес: ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Тело запроса (Payload):', JSON.stringify(req.body));
    }
    next();
});

// 1. Главная страница сайта
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. ЭНДПОИНТ АВТОРИЗАЦИИ
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('❌ Ошибка авторизации: поля не заполнены');
        return res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Поля email и password обязательны для заполнения'
        });
    }

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
        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Неверный логин или пароль'
        });
    }
});

// 3. ЭНДПОИНТ РЕГИСТРАЦИИ
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        console.log('❌ Ошибка регистрации: поля не заполнены');
        return res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Все поля обязательны для заполнения'
        });
    }

    console.log(`✅ Успешная регистрация пользователя: ${email}`);
    return res.status(201).json({
        success: true,
        message: 'Регистрация прошла успешно',
        token: 'fake-jwt-token-example-12345'
    });
});

// 4. Подключение Swagger документации
try {
    const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.log('⚠️ Файл swagger.yaml не найден локально.');
}

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер автосервиса успешно запущен на порту ${PORT}`);
});