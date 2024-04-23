const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserModel = require('./models/User');

const salt = bcrypt.genSaltSync(10);

app.use(cors())
app.use(express.json());

mongoose.connect('mongodb+srv://asinghthakur:RjCByiEWWt9kF6c7@cluster0.pqh5skt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await UserModel.create({ username, password: bcrypt.hashSync(password, salt), });
        res.json({ userDoc });
    } catch (e) {
        res.status(400).json(e);
    }
});


app.listen(4000);
