import mongoose from "mongoose";

import PendingConfession from "../models/pendingConfession.model.js";
import Confession from "../models/confession.model.js";
//when the pending recipent joins , then this file called.

//ABC has joined. Find all undelivered confessions waiting for ABC, move them into the normal Confession collection, and mark the old pending ones as delivered

//transaction means it is like a payment ,if you failed some where you rollback whle processes
//here to steps are like create confessopn then mark pending delivary as successed if joined
export const deliverPendingConfessions = async (user) => {
  const session = await mongoose.startSession();//his session is related to MongoDB transactions.

  try {
    session.startTransaction();//The following database operations belong together.


    /*user.instagramUsername = "abc"
MongoDB asks:
Give me every pending confession where recipient is abc AND it hasn't already been delivered. */
    const pending = await PendingConfession.find({
      recipientInstagramUsername: user.instagramUsername,
      delivered: false,
    }).session(session);

    if (pending.length === 0) {
      await session.commitTransaction();
      session.endSession();
      return;
    }
/*Suppose:
pending
[A, B, C]
Then:
pending.map(...)
produces:
docs
[newA, newB, newC] */
    const docs = pending.map((p) => ({
      senderUser: p.senderUser,
      senderAnonymousProfile: p.senderAnonymousProfile,
      senderAnonymousName: p.senderAnonymousName,

      recipientUser: user._id,//we allocate them a userid here
      recipientInstagramUsername: user.instagramUsername,

      message: p.message,
      imageUrls: p.imageUrls,

      publicConsent: p.publicConsent,
      theme: p.theme,
    }));
/*docs
[A, B, C]
   ↓
insertMany()
   ↓
confessions collection */

    await Confession.insertMany(docs, {
      session,
    });
//mark delivered true
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

    await session.commitTransaction();//make this changes permanant
  } catch (error) {
    await session.abortTransaction();//Roll back the transaction.
    throw error;
  } finally {
    session.endSession();
  }
};