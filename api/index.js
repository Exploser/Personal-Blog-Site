require('dotenv').config();
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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

const corsOptions = {
    credentials: true,
    origin: function(origin, callback) {
        if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(helmet());
app.use(limiter);
app.use(morgan('combined')); // Use 'combined' for detailed log format
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
app.use(compression());

mongoose.connect(process.env.MONGO_URI);

app.get('/', (req, res) => res.send('Hello World!'));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await UserModel.create({ username, password: bcrypt.hashSync(password, salt), });
        res.json({ userDoc });
    } catch (e) {
        res.status(400).json(e);
    }
});

app.get('/login', (req, res) => {
    res.status(405).json({ error: 'Method not allowed' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await UserModel.findOne({ username });
    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
        if (!process.env.JWT_SECRET) {
            console.error('JWT secret is not set.');
            return res.status(500).json({ error: 'Internal server error' });
        }
        jwt.sign({ username, id: userDoc._id }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) {
                console.error('Error signing token:', err);
                return res.status(500).json({ error: 'Error generating token' });
            }
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
            res.json({ id: userDoc._id, username });
        });
    } else {
        res.status(400).json('Wrong Credentials');
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

if (process.env.API_PORT) {
    app.listen(process.env.API_PORT);
}

module.exports = app;
