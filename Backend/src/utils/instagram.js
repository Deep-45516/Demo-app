export const createInstagramMedia = async ({ imageUrl, caption }) => {
  const url = `https://graph.facebook.com/v25.0/${process.env.IG_USER_ID}/media`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: process.env.IG_ACCESS_TOKEN,
    }),
  });

  return await res.json();
};

export const publishInstagramMedia = async (creationId) => {
  const url = `https://graph.facebook.com/v25.0/${process.env.IG_USER_ID}/media_publish`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: process.env.IG_ACCESS_TOKEN,
    }),
  });

  return await res.json();
};
