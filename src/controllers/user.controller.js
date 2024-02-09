import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
     const user = await User.findById(userId)
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
     user.refreshToken = refreshToken
     await user.save({validateBeforeSave:false})

     return {accessToken, refreshToken}
     
    } catch (error) {
     throw new ApiError(500, "something went wrong while generating Access Token or refresh Token")
    }
}

const registerUser = asyncHandler( async (req, res) =>{
    // get user details
    const {username, fullname, email, password} = req.body
    // validate user details
    if([username,fullname,email,password].some((field)=> field?.trim() === "" || field === undefined)){
        throw new ApiError(400, "all fields are mandatory!")
    }
    console.log(req.files)
    // check for existing username and email
    const existingUser = await User.findOne({$or:[{ username }, { email }]})
    if(existingUser) throw new ApiError(400, 'user already exists.')

    // upload files using multer locally    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    // confirm image is selected successful
    if(!avatarLocalPath) throw new ApiError(400, 'avatar image is required')

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    // create user object for database
    const user = await User.create({
        username,
        email,
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password
    })
    // .then(user => res.status(201).json({user}))
    // .catch(err => console.log(err))
    // save data on DB
    // response if operation goes successful
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) throw new ApiError(500, "something went wrong while creating user")
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'user created successfully!')
    )

    
})

const loginUser = asyncHandler( async (req, res) => {
    // TODOS:
    //check if user is returning user by checking available localstorage refreshtoken
    // if returning user match last refresh token with saved-db token and generate new access token that let user login automagically
    // if above all failed redirect user to login with registered username and password
    const {username, email, password} = req.body;
    
    if( !(email || username)) throw new ApiError(400, 'email or username required')
    
    const user = await User.findOne({$or:[{username},{email}]}).select("")

    if(!user) throw new ApiError(404, "user doesn't exist")
    const validUser = await user.isPasswordMatched(password)
    
    if(!validUser) throw new ApiError(400, 'enter your valid password')
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {loggedInUser, accessToken, refreshToken}, "welcome to youtube-backend"))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {$unset:{refreshToken:1}}, // removes refreshtoken field
        {new:true}
        )
        const options = {
            httpOnly: true,
            secure: true
        }
    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{} ,'user logout successfully!'))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const existedToken = req.cookies.refreshToken || req.body.refreshToken
    if(!existedToken) throw new ApiError(404, "user doesn't exist")
    
    try {
        const userToken = jwt.verify(existedToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(userToken._id)

        if(!user) throw new ApiError(401, "invalid  Token")
        if(existedToken !== user.refreshToken) throw new ApiError(401, 'expired token or in use')

        const {accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        const options ={
            httpOnly:true,
            secure:true
        }

        res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,{accessToken, refreshToken}, 'Access token refreshed')
        )


        
    } catch (error) {
        throw new ApiError(501, error.message || " something went wrong while generate refresh token.")
    }


})

const changePassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body
    if(!(oldPassword || newPassword)) throw new ApiError(400, "old or new password is empty")
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordMatched(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(400, "old password didn't match")
     user.password = newPassword
    await user.save({validateBeforeSave:false})

    res.status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})

const authUser = asyncHandler( async (req, res) => {
    res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "user fetched successfully")
    )
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const {email, username, fullname} = req.body

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            email:email || req.user.email,
            username:username || req.user.username,
            fullname:fullname || req.user.fullname
        }},
        {new:true}

    ).select("-password -refreshToken")

    res
    .status(201)
    .json(
        new ApiResponse(201, user, "user updated successfully")
    )

})

const updateUserAvatar = asyncHandler( async (req, res) => {

    const localAvatarPath = await req.file?.path 
    if(!localAvatarPath) throw new ApiError(400, "avatar file doesn't exists")

    const avatar = await uploadOnCloudinary(localAvatarPath)
    if(!avatar.url) throw new ApiError(400, "Error while uploading avatar")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}        
    ).select("-password -refreshToken")

    res
    .status(201)
    .json(
        new ApiResponse(201, user, "avatar updated successfully")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateUserDetails,
    authUser,
    updateUserAvatar
    }