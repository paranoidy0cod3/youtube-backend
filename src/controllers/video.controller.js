import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy,
    sortType = 1,
    userId,
  } = req.query;

  let search = {};
  const searchByChannelName = await User.findOne({ username: query });
  if (searchByChannelName || userId) {
    search = { owner: searchByChannelName?._id || userId };
  } else {
    search = { title: { $regex: query } };
  }
  console.log(search);
  const videosQuery = await Video.aggregate([
    {
      $match: search,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  const sortCriteria = {};
  if (sortBy && sortType) {
    sortCriteria[sortBy] = sortType === "asc" ? 1 : -1; //assigning the search criteria
  } else {
    sortCriteria["createdAt"] = -1;
  }
  const options = {
    page: Number(page),
    limit: Number(limit),
    sort: sortCriteria,
  };
  const videos = await Video.aggregatePaginate(videosQuery, options);
  if (!videos.totalDocs === 0)
    throw new ApiError(404, "videos or channel doesn't exists.");
  res
    .status(200)
    .json(new ApiResponse(200, videos, "video fetch successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log(videoId);
  if (!videoId) throw new ApiError(400, "videoId is required!");

  const video = await Video.aggregate([{ $match: { _id: videoId } }]);

  if (!video) throw new ApiError(404, "requested video doesn't exists.");
  res
    .status(200)
    .json(new ApiResponse(200, video, "feched requested video successfully."));
});

const uploadVideo = asyncHandler(async (req, res) => {
  const isAuthenticated = req.user;
  if (!isAuthenticated) throw new ApiError(401, "unathorized user");
  const { title, description, isPublished = true } = req.body;
  if (
    [title, description, isPublished].some(
      (field) => field.trim() === "" || field === undefined
    )
  ) {
    throw new ApiError(400, "All fields must not be empty.");
  }
  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath && !videoLocalPath)
    throw new ApiError(400, "thumbnail image is mandatory");

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  console.log(thumbnail);

  const newVideo = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    title,
    description,
    duration: video.duration,
    isPublished,
  })
    .then((video) => {
      return res
        .status(200)
        .json(new ApiResponse(201, video, "video created successfully"));
    })
    .catch((err) => {
      throw new ApiError(500, err.message);
    });
});

export { uploadVideo, getAllVideos, getVideoById };
