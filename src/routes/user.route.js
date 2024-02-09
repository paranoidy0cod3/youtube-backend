import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changePassword, updateUserDetails, authUser, updateUserAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAuthUser } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register")
.post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ])
    ,registerUser
    )

router.route("/login").post(loginUser)
//secured route by verifyAuthUser middleware
router.route("/auth-user").get(verifyAuthUser, authUser)
router.route("/logout").post(verifyAuthUser, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyAuthUser, changePassword)
router.route("/update").post(verifyAuthUser, updateUserDetails)
router.route("/update-avatar").post(upload.single("avatar"), verifyAuthUser, updateUserAvatar)

export default router