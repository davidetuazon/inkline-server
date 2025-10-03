require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoURI = process.env.NODE_ENV === 'production' ? process.env.MONGO_URI : process.env.MONGO_URI_LOCAL;

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

const basepath = '/api';

const userRoute = require(path.resolve('.') + '/src/features/user/user.routes');
const workspaceRoute = require(path.resolve('.') + '/src/features/workspace/workspace.routes');

app.use(basepath + '/v1', userRoute);
app.use(basepath + '/v1', workspaceRoute);

module.exports = app;