
const axios = require('axios');
const fs = require('fs');
const { parseStringPromise } = require('xml2js');

const RSS_URL = 'https://www.finnleijen.eu/atom.xml'; 

const actor = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  'id': 'https://finnleijen.eu/activitypub/profile.json',
  'type': 'Person',
  'preferredUsername': 'rotweerxml',
  'name': 'Finn',
  'summary': 'Finns RSS/Activitypub feed',  
  'inbox': 'https://finnleijen.eu/activitypub/inbox.json',
  'outbox': 'https://finnleijen.eu/activitypub/outbox.json',
};

async function convertRSS() {
  try {
    const response = await axios.get(RSS_URL);
    const feed = await parseStringPromise(response.data);
    const items = feed.feed.entry;

    let activities = [];
    fs.mkdirSync('activitypub', { recursive: true });

    for (const item of items) {
      const id = item.id[0];
      const activity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        'type': 'Create',
        'actor': actor.id,
        'id': 'https://finnleijen.eu/activitypub/' + id + '.json',
        'published': new Date(item.updated[0]).toISOString(),
        'object': {
          'id': 'https://finnleijen.eu/activitypub/' + id + '.json',
          'type': 'Article',
          'name': item.title[0],
          'content': item.summary ? item.summary[0] : item.content[0]._ || '',
          'url': item.link[0].$.href,
        },
      };
      activities.push(activity);

      // Save each activity as a JSON file
      fs.writeFileSync('activitypub/' + id.split('/').pop() + '.json', JSON.stringify(activity, null, 2));
    }

    // Save the profile JSON
    fs.writeFileSync('activitypub/profile.json', JSON.stringify(actor, null, 2));

    console.log('RSS to ActivityPub conversion completed!');
  } catch (error) {
    console.error('Error fetching or parsing RSS:', error);
  }
}

convertRSS();

