require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rateLimiter = rateLimit({
    windowMs: 3 * 60 * 1000,    // 3 mins
    max: 100,
    message: 'Too many requests, please slow down!'
});

app.use(rateLimiter);

const mongoURI = process.env.NODE_ENV === 'production' ? process.env.MONGO_URI : process.env.MONGO_URI_LOCAL;

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30_000,  // close idle connections after 30s
        waitQueueTimeoutMS: 5000,   // throw error if waiting time > 5s
    });
}

const basepath = '/api';

const userRoute = require(path.resolve('.') + '/src/features/user/user.routes');
const workspaceRoute = require(path.resolve('.') + '/src/features/workspace/workspace.routes');

app.use(basepath + '/v1', userRoute);
app.use(basepath + '/v1', workspaceRoute);

module.exports = app;