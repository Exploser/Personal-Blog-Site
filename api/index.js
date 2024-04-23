const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserModel = require('./models/User');
const jwt = require('jsonwebtoken')

const salt = bcrypt.genSaltSync(10);
const secret = '65tgrdt546sxzyhy7u6453w'; //Change this to a genSalt 

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
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


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await UserModel.findOne({ username });
    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json('ok');
        });
    } else {
        res.status(400).json('Wrong Credentails');
    }
});

app.listen(4000);
