const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();

// Читаем файл документации Swagger (если он у вас есть в формате yaml/json, 
// либо можно оставить базовый интерфейс, если документация подключается иначе)
// Убедитесь, что порт корректно подхватывается от Render (process.env.PORT)
const PORT = process.env.PORT || 3000;

// Разрешаем принимать JSON в запросах
app.use(express.json());

// 1. Главная страница сайта (отдает index.html из папки проекта)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Подключение Swagger документации (если файл swagger.yaml лежит в корне)
try {
    const swaggerDocument = YAML.load('./swagger.yaml');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.log('Файл swagger.yaml не найден, документация не подключена через yaml.');
}

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});