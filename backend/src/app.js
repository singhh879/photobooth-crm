const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/events', require('./routes/events'));
app.use('/team', require('./routes/team'));
app.use('/dropdown', require('./routes/dropdown'));
app.use('/settings', require('./routes/settings'));
app.use('/notify', require('./routes/notify'));

app.use(errorHandler);

module.exports = app;
