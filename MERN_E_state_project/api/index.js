import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user_route.js';
import authRouter from './routes/auth_route.js'
dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(() =>{
    console.log('Connected to MongoDB!');  
}).catch((err)=>{
    console.log(err);
});

const app = express();

app.use(express.json());

app.listen(5000,()=>{
    console.log('Server is running on port 5000!');
});

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);