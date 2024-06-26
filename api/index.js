require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserModel = require('./models/User');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const PostModel = require('./models/Post');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const admin = require('firebase-admin');

const nodemailer = require("nodemailer");

// Initialize Firebase Admin with environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "blogs-27e6d.appspot.com"
});
const bucket = admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() });

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

const corsOptions = {
    credentials: true,
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));
app.use(morgan('combined'));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
app.use(compression());

console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => res.send('Hello World!'));

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userDoc = await UserModel.create({ username, email, password: bcrypt.hashSync(password, salt), });
        res.json({ userDoc });
    } catch (e) {
        res.status(400).json(e);
    }
});

app.get('/login', (req, res) => {
    res.status(405).json({ error: 'Method not allowed' });
});


app.post('/login', async (req, res) => {
    console.log("Received login request:", req.body);
    const { username, password } = req.body;

    const userDoc = await UserModel.findOne({ username });
    console.log("User document found:", userDoc);

    if (!userDoc) {
        console.log("No user found for username:", username);
        return res.status(404).json({ error: 'User not found' });
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    console.log("Password comparison result:", passOk);

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
        console.log("Invalid credentials provided for user:", username);
        res.status(400).json({ error: 'Wrong credentials' });
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

app.post('/post', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'File must be uploaded' });
    }
    if (!req.body.title || !req.body.description || !req.body.content) {
        return res.status(400).json({ error: 'All post fields must be filled' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const blob = bucket.file(originalname);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: mimetype
        }
    });

    blobStream.on('error', err => res.status(500).json({ error: 'Failed to upload file', details: err.message }));

    blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(blob.name)}`;

        const { token } = req.cookies;
        jwt.verify(token, process.env.JWT_SECRET, {}, async (err, info) => {
            if (err) {
                return res.status(401).json({ error: 'Failed to authenticate token' });
            }

            const { title, description, content } = req.body;
            try {
                const postDoc = await PostModel.create({
                    title,
                    description,
                    content,
                    cover: publicUrl,
                    author: info.id,
                });
                res.json(postDoc);
            } catch (error) {
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        });
    });

    blobStream.end(buffer);
});

app.put('/post/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer } = req.file;
    const file = bucket.file(originalname);
    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    });

    stream.on('error', error => {
        console.error("Failed to upload file:", error);
        return res.status(500).json({ error: 'Failed to upload file', details: error.message });
    });

    stream.on('finish', async () => {
        await file.makePublic(); // Optionally make the file publicly accessible
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(file.name)}`;

        const { title, description, content, id } = req.body; // Assuming these fields are needed for the update
        if (!title || !description || !content) {
            return res.status(400).json({ error: 'All post fields must be filled' });
        }

        const postDoc = await PostModel.findById(id);
        if (!postDoc) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const updateData = {
            title,
            description,
            content,
            cover: publicUrl // Update the cover image URL
        };

        try {
            await postDoc.updateOne(updateData);
            res.json({ message: 'Post updated', post: updateData });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    stream.end(buffer);
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

// Set up nodemailer transport
const contactEmail = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Email sending route
app.post('/send-email', async (req, res) => {
    const { firstName, lastName, email, message, phone } = req.body;
    const name = `${firstName} ${lastName}`;
    const mail = {
        from: name,
        to: process.env.EMAIL_USER,
        subject: "Contact Form Submission - Portfolio",
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
        html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Phone: ${phone}</p><p>Message: ${message}</p>`,
    };

    try {
        await contactEmail.sendMail(mail);
        res.status(200).json({ status: "Message Sent" });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
app.get('/send-email', (req, res) => res.send('Hello World!'));


if (process.env.API_PORT) {
    app.listen(process.env.API_PORT);
}

module.exports = app;
