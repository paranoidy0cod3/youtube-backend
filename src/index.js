import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({path:'./.env'})
const PORT = process.env.PORT || 5000

connectDB()
.then(()=>{
    app.listen(PORT, () => console.log(`app is serving on port:${PORT}`))
})
.catch((err)=> console.log(`mongodb connetion error::`,err))