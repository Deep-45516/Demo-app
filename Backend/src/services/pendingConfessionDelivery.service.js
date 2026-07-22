import mongoose from "mongoose";

import PendingConfession from "../models/pendingConfession.model.js";
import Confession from "../models/confession.model.js";

export const deliverPendingConfessions = async (user) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pending = await PendingConfession.find({
      recipientInstagramUsername: user.instagramUsername,
      delivered: false,
    }).session(session);

    if (pending.length === 0) {
      await session.commitTransaction();
      session.endSession();
      return;
    }

    const docs = pending.map((p) => ({
      senderUser: p.senderUser,
      senderAnonymousProfile: p.senderAnonymousProfile,
      senderAnonymousName: p.senderAnonymousName,

      recipientUser: user._id,
      recipientInstagramUsername: user.instagramUsername,

      message: p.message,
      imageUrls: p.imageUrls,
    }));

    await Confession.insertMany(docs, {
      session,
    });

    await PendingConfession.updateMany(
      {
        _id: {
          $in: pending.map((p) => p._id),
        },
      },
      {
        delivered: true,
      },
      {
        session,
      },
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};