import PendingConfession from "../models/pendingConfession.model.js";

export const createPendingConfession = async (data) => {
  return PendingConfession.create({//create into mongoDB
    ...data,//Copy all properties from data into this new object.
    expiresAt: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000//Current time + 7 days.
    ),
  });
};

/*
this won't delete automatically after 7 days
This service only sets expiresAt.

Actual automatic deletion depends on your PendingConfession schema having something like a MongoDB TTL index on expiresAt.

We'll check that model later. If there's no TTL index or cleanup job, expiresAt is just a date sitting in the database—it doesn't magically delete anything. */