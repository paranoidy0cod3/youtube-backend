import mongoose from "mongoose";
import {DB_NAME} from '../constants.js'


const  connectDB = async () => {
    try {
       const dbInstances = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`Mongodb is connected on host: ${dbInstances.connection.host}`)
    } catch (error) {
        console.log('DB connection error::', error)
        process.exit(1)
    }
}

export default connectDB