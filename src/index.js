const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');

async function main() {
	try {
		/**
		 * We need to fetch all the inputs that were provided to our action
		 * and store them in variables for us to use.
		 **/
		const webhookUrl = core.getInput('webhook-url', { required: true });

		// get the release data from the publish event
		const { release } = github.context.payload;

		// add a mention for everyone
		const mention = 'Hi @everyone';

		// remove images from the intro
		const highlights = release.body.split('\r\n\r\n### Data Grid\r\n\r\n')[0].replace(/\s*<img.*?>\s*/g, '\r\n');

		// generate the links for the release
		const link = `Check out the full [changelog](${release.html_url}) at GitHub!`;

		const payload = {
			content: [mention, highlights, link].join('\r\n\r\n'),
			username: 'MUI Releases',
			// avatar_url: '',
			allowed_mentions: {
				parse: ['everyone'],
			},
		};

		console.log('Sending message ...');
		await axios.post(`${webhookUrl}?wait=true`, payload, {
			headers: {
				'Content-Type': 'application/json',
				'X-GitHub-Event': process.env.GITHUB_EVENT_NAME,
			},
		});
		console.log('Message sent ! Shutting down ...');
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
