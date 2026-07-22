import User from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";

export const searchUser = async (req, res) => {
  try {
    const username = req.query.username?.trim().toLowerCase();

    if (!username) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "Username is required"
        )
      );
    }

    const user = await User.findOne({
      instagramUsername: username,
    }).select("instagramUsername");

    if (!user) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            exists: false,
          },
          "User not found"
        )
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          exists: true,
          username: user.instagramUsername,
        },
        "User found"
      )
    );

  } catch (error) {
    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        error.message
      )
    );
  }
};