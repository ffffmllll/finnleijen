const axios = require("axios");
const fs = require("fs");
const { parseStringPromise } = require("xml2js");

// Your Atom feed URL
const ATOM_URL = "https://www.finnleijen.eu/atom.xml";

// Define Actor (ActivityPub Profile)
const actor = {
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://finnleijen.eu/activitypub/profile.json",
  "type": "Person",
  "preferredUsername": “rotweer,
  "name": “finn”,
  "summary": "Posts from my blog, I own all my own content.“,
  "inbox": "https://finnleijen.eu/activitypub/inbox.json",
  "outbox": "https://finnleijen.eu/activitypub/outbox.json",
};

// Fetch Atom Feed and Convert to ActivityPub
async function convertAtom() {
  try {
    const response = await axios.get(ATOM_URL);
    const feed = await parseStringPromise(response.data);
    const entries = feed.feed.entry;

    // Prepare ActivityPub JSON files
    let activities = [];
    fs.mkdirSync("activitypub", { recursive: true });

    for (const entry of entries) {
      const id = entry.id[0].split(":").pop(); // Extract ID from entry
      const activity = {
        "@context": "https://www.w3.org/ns/activitystreams",
        "type": "Create",
        "actor": actor.id,
        "id": `https://finnleijen.eu/activitypub/${id}.json`,
        "published": new Date(entry.updated[0]).toISOString(),
        "object": {
          "id": `https://finnleijen.eu/activitypub/${id}.json`,
          "type": "Article",
          "name": entry.title[0],
          "content": entry.summary ? entry.summary[0] : entry.content[0]._,
          "url": entry.link[0].$.href,
        },
      };
      activities.push(activity);

      // Save each activity as a JSON file
      fs.writeFileSync(`activitypub/${id}.json`, JSON.stringify(activity, null, 2));
    }

    // Save the profile JSON
    fs.writeFileSync("activitypub/profile.json", JSON.stringify(actor, null, 2));

    console.log("Atom to ActivityPub conversion completed!");
  } catch (error) {
    console.error("Error fetching or parsing Atom feed:", error);
  }
}

// Run the conversion
convertAtom();