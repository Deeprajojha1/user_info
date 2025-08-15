
import {config} from 'dotenv';
config();
import express from 'express';
import mongoose from 'mongoose';
import multer  from 'multer';
import { v2 as cloudinary } from 'cloudinary'
import path from 'path';
import { name } from 'ejs';
const app=express();


// Middleware to parse request body
app.use(express.urlencoded({ extended: true }));

// dependency for cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// mongoose connection

mongoose.connect(process.env.MONGODB_URI, { dbName: "Mongodb_connection" })
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
    // Render the login page First time

   app.get('/', (req, res) => {
       res.render('login.ejs',{url:null});
   });


//    render the register page
  app.get('/register', (req, res) => {
       res.render('register.ejs',{url:null});
   });

//   disk stroage for multer
   const storage = multer.diskStorage({
//   destination:  "public/uploades", 
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix)
  }
})
const upload = multer({ storage: storage })

// Mongoose model

const userSchema= new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    filename: String,
    public_id: String,
    url: String,

})
const User = mongoose.model('User', userSchema);


// wesite:  form npm multer  
   
app.post('/register', upload.single('file'), async (req, res) => {
    try {
        const file = req.file.path;
        const { name, email, password } = req.body;
        const cloudinaryResult = await cloudinary.uploader.upload(file, {
            folder: "Node.js-17-project-2",
        });

        // Save to MongoDB
        await User.create({
            name: name,
            email: email,
            password: password,
            filename: req.originalname,
            public_id: cloudinaryResult.public_id,
            url: cloudinaryResult.secure_url
        });

        res.redirect('/');
    } catch (err) {
        res.status(500).send('Upload failed');
    }
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    // console.log(email, password)
    let user = await User.findOne({email: email});
    if (user.email!=email && user.password !== password) {
        return res.status(401).send('Invalid email or password');
    }
    else{
       res.render('profile.ejs', {user: user});
    }
    // console.log(user);
    // res.redirect('/');
});


const port=process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
