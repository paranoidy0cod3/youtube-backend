import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAuthUser } from "../middlewares/auth.middleware.js";
import {
  getAllVideos,
  getVideoById,
  uploadVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/upload").post(
  verifyAuthUser,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

router.route("/videos").get(getAllVideos);
router.route("/:videoId").get(getVideoById);

export default router;
