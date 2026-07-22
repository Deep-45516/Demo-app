import PendingConfession from "../models/pendingConfession.model.js";

export const createPendingConfession = async (data) => {
  return PendingConfession.create({
    ...data,
    expiresAt: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ),
  });
};