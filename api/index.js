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
app.use('/uploads', express.static(__dirname + '/uploads'))

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

        const { token } = req.cookies;

        jwt.verify(token, secret, {}, async (err, info) => {
            if (err) {
                return res.status(401).json({ error: 'Failed to authenticate token' });
            }
            const { title, description, content } = req.body;
            const postDoc = await PostModel.create({
                title,
                description,
                content,
                cover: newPath,
                author: info.id,
            });
            res.json(postDoc);
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.put('/post/', uploadMiddleware.single('file'), async (req, res) => {
    let newPath;

    if (req.file) {
        const { originalname, path } = req.file;

        if (!originalname || !originalname.includes('.')) {
            return res.status(400).json({ error: 'Invalid file name' });
        }
        const parts = originalname.split('.');
        const ext = parts.pop(); // Handles names like 'my.file.name.jpg'
        newPath = path + '.' + ext;

        try {
            fs.renameSync(path, newPath);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            return res.status(401).json({ error: 'Failed to authenticate token' });
        }

        const { title, description, content, id } = req.body;
        const postDoc = await PostModel.findById(id);
        if (!postDoc) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(403).json({ error: 'You are not the author' });
        }

        const updateData = {
            title,
            description,
            content,
            author: info.id
        };
        if (newPath) {
            updateData.cover = newPath; // Only update cover if a new file has been uploaded
        }

        try {
            await postDoc.updateOne(updateData);
            res.json(postDoc);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });
});

app.get('/post', async (req, res) => {
    res.json(
        await PostModel.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20)
    );

});

app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const postDoc = await PostModel.findById(id).populate('author');
    res.json(postDoc);
});

app.listen(4000);
