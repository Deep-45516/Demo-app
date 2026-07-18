import AnonymousProfile from "../models/anonymousProfile.model.js";
import { generateAnonymousName } from "../utils/generateAnonymousName.js";

export const createAnonymousProfile = async (userId) => {
  // Already exists?
  const existingProfile = await AnonymousProfile.findOne({ userId });

  if (existingProfile) {
    return existingProfile;
  }

  let anonymousName;
  let nameExists = true;//true becuz below loop should run atleast once
  /*Generate name
↓
Already taken?
Yes → Generate another
No → Stop */

  // Retry until we find a unique name
  while (nameExists) {
    anonymousName = generateAnonymousName();
//just like .findOne but exists only check if doc is exists(more efficient here)
    nameExists = await AnonymousProfile.exists({
      anonymousName,
    });
  }
//creates AnonymousProfile with that userId,anonymous name,other feild as default
  const profile = await AnonymousProfile.create({
    userId,
    anonymousName,
  });

  return profile;
};