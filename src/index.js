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
		const username = core.getInput('username', { required: true });
		const avatar_url = core.getInput('avatar-url');
		const separator = core.getInput('separator');

		console.log('separator', separator);

		// get the release data from the publish event
		const { release } = github.context.payload;

		// add a mention for everyone
		const mention = 'Hi @everyone';

		// generate the links for the release
		const link = `Check out the full [changelog](${release.html_url}) at GitHub!`;

		// split the full body with the separator (or with max chars and add an ellipsis)
		const rawHighlights = separator
			? release.body
				.split(separator)[0]
				.trim()
			: release.body.slice(0, 1990 - link.length).trim() + ' ...';

		/**
		 * parse the intro part of the release changelog
		 * 1. step: remove image tags
		 * 2. step: replace issue IDs with github links
		 * 3. step: parse the github aliases and link them to the profile
		 **/
		const highlights = rawHighlights
			.replace(/\s*<img.*?>\s*/g, '\r\n')
			.replace(/\(#(\d{4,})\)/g, '[#$1](https://github.com/mui/mui-x/issues/$1)')
			.replace(/\s@(.*?)\s/g, '[@$1](https://github.com/$1)');

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
