import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changePassword, updateUserDetails, authUser, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getUserWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAuthUser } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register")
.post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ]),
    registerUser
)

router.route("/login").post(loginUser)
//secured route by verifyAuthUser middleware
router.route("/auth-user").get(verifyAuthUser, authUser)
router.route("/logout").post(verifyAuthUser, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").patch(verifyAuthUser, changePassword)
router.route("/update").patch(verifyAuthUser, updateUserDetails)
router.route("/update-avatar").patch(upload.single("avatar"), verifyAuthUser, updateUserAvatar)
router.route("/update-cover-image").patch(verifyAuthUser, upload.single("coverImage"), updateUserCoverImage)
router.route("/channel-profile").get(verifyAuthUser, getUserChannelProfile)
router.route("/watch-history").get(verifyAuthUser, getUserWatchHistory)

export default router