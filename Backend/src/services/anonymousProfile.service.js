import AnonymousProfile from "../models/anonymousProfile.model.js";
import { generateAnonymousName } from "../utils/generateAnonymousName.js";

export const createAnonymousProfile = async (userId) => {
  // Already exists?
  const existingProfile = await AnonymousProfile.findOne({ userId });

  if (existingProfile) {
    return existingProfile;
  }

  let anonymousName;
  let nameExists = true;

  // Retry until we find a unique name
  while (nameExists) {
    anonymousName = generateAnonymousName();

    nameExists = await AnonymousProfile.exists({
      anonymousName,
    });
  }

  const profile = await AnonymousProfile.create({
    userId,
    anonymousName,
  });

  return profile;
};