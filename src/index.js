const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function main() {
	try {
		/**
		 * We need to fetch all the inputs that were provided to our action
		 * and store them in variables for us to use.
		 **/
		const webhookUrl = core.getInput('webhook-url', { required: true });
		const username = core.getInput('username');
		const avatar_url = core.getInput('avatar-url');

		// get the release data from the publish event
		const { release } = github.context.payload;

		// add a mention for everyone
		const mention = 'Hi @everyone';

		// parse the intro part of the release changelog
		const highlights = release.body
			.split('\r\n\r\n### Data Grid\r\n\r\n')[0]
			.replace(/\s*<img.*?>\s*/g, '\r\n') // remove image tags
			.replace(/\(#(\d{4,})\)/g, '[#$1](https://github.com/mui/mui-x/issues/$1)'); // replace issue IDs with github links

		// generate the links for the release
		const link = `Check out the full [changelog](${release.html_url}) at GitHub!`;

		const payload = {
			content: [mention, highlights, link].join('\r\n\r\n').replace(/\((http.*?)\)/g, '(<$1>)'),
			username: username || null,
			avatar_url: avatar_url || null,
			allowed_mentions: {
				parse: ['everyone', 'users'],
			},
			embeds: [],
		};

		console.log('Sending message ...');
		await axios.post(`${webhookUrl}?wait=true`, payload, {
			headers: {
				'Content-Type': 'application/json',
				'X-GitHub-Event': process.env.GITHUB_EVENT_NAME,
			},
		});
		console.log('Message sent! Shutting down ...');
	} catch (error) {
		core.setFailed(error.message);
	}
}

main().catch(error => {
		console.error('Error:', error.response.status, error.response.statusText);
		console.error('Message:', error.response ? error.response.data : error.message);
		core.setFailed(error.message);
	},
);
