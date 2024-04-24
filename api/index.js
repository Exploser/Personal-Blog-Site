const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserModel = require('./models/User');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const PostModel = require('./models/Post');

const salt = bcrypt.genSaltSync(10);
const secret = '65tgrdt546sxzyhy7u6453w'; //Change this to a genSalt 

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json());
app.use(cookieParser());

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
            res.cookie('token', token).json({
                id: userDoc._id,
                username,
            });
        });
    } else {
        res.status(400).json('Wrong Credentails');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, secret, {}, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Failed to authenticate token' });
        }
        res.json(decoded);
    });
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'File must be uploaded' });
    }
    if (!req.body.title || !req.body.description || !req.body.content) {
        return res.status(400).json({ error: 'All post fields must be filled' });
    }

    const { originalname, path } = req.file;

    if (!originalname || !originalname.includes('.')) {
        return res.status(400).json({ error: 'Invalid file name' });
    }
    const parts = originalname.split('.');
    const ext = parts.pop(); // Handles names like 'my.file.name.jpg'
    const newPath = path + '.' + ext;

    try {
        fs.renameSync(path, newPath);

        const { title, description, content } = req.body;
        const postDoc = await PostModel.create({
            title,
            description,
            content,
            cover: newPath,
        });

        res.json(postDoc);
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(4000);
