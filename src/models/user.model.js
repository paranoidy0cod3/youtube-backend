import mongoose, {Schema} from "mongoose";
import Jwt  from "jsonwebtoken";
import bcrypt from 'bcrypt';

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            unique:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            lowercase:true,
            unique:true
        },
        fullname:{
            type:String,
            required:true,
            trim:true
        },
        avatar:{
            type:String,
            required:true,

        },
        coverImage: {
            type:String
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password: {
            type:String,
            required:[true, 'User must have a Password!']
        },
        refreshToken:{
            type:String,            
        }
    }, {timestamps:true}
)
// password hashing and compare
userSchema.pre("save", async function(next){
    if(!this.modified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordMatched = async function(password){
    return await bcrypt.compare(password, this.password)
}
// creating jwt tokens
userSchema.methods.generateAccessToken = function(){
   return Jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return Jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )

}

export const User = mongoose.model("User", userSchema)