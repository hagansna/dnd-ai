import { json } from '@sveltejs/kit';
import { SECRET_OPENAI_KEY } from '$env/static/private';
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';
import { getTokens } from '$lib/tokenizer';
import type { RequestHandler } from './$types';
import fillForm from '$lib/pdf';

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!SECRET_OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set');
		}

		const requestData = await request.json();

		if (!requestData) {
			throw new Error('No request data');
		}

		const reqMessages: ChatCompletionRequestMessage[] = requestData.messages;

		if (!reqMessages) {
			throw new Error('no messages provided');
		}

		let tokenCount = 0;

		reqMessages.forEach((msg) => {
			const tokens = getTokens(msg.content);
			tokenCount += tokens;
		});

		const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${SECRET_OPENAI_KEY}`
			},
			method: 'POST',
			body: JSON.stringify({
				input: reqMessages[reqMessages.length - 1].content
			})
		});
		if (!moderationRes.ok) {
			const err = await moderationRes.json();
			throw new Error(err.error.message);
		}

		const moderationData = await moderationRes.json();
		const [results] = moderationData.results;

		if (results.flagged) {
			throw new Error('Query flagged by openai');
		}

		const pdfKeys = [
			'ClassLevel',
			'Background',
			'Backstory',
			'CharacterName',
			'CharacterName 2',
			'Race ',
			'Alignment',
			'XP',
			'Inspiration',
			'STR',
			'ProfBonus',
			'AC',
			'Initiative',
			'Speed',
			'PersonalityTraits ',
			'STRmod',
			'HPMax',
			'ST Strength',
			'DEX',
			'ST Dexterity',
			'ST Constitution',
			'HPCurrent',
			'Ideals',
			'DEXmod ',
			'ST Intelligence',
			'ST Wisdom',
			'ST Charisma',
			'Bonds',
			'CON',
			'CONmod',
			'Flaws',
			'INT',
			'INTmod',
			'Wpn Name',
			'Wpn1 AtkBonus',
			'Wpn1 Damage',
			'WIS',
			'WISmod',
			'CHA',
			'CHamod',
			'Passive',
			'CP',
			'EP',
			'GP',
			'PP',
			'Equipment',
			'Features and Traits',
			'Age',
			'Height',
			'Weight',
			'Eyes',
			'Skin',
			'Hair'
		];
		const prompt = `You are a Dungeons and Dragons expert who can create characters with whatever information is provided. You will always respond with a unique character in JSON format the following keys: ${pdfKeys}.`;
		tokenCount += getTokens(prompt);

		if (tokenCount >= 10000) {
			throw new Error('Query too large');
		}

		const messages: ChatCompletionRequestMessage[] = [
			{ role: 'system', content: prompt },
			...reqMessages
		];

		const chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			messages,
			temperature: 0.9,
			stream: false
		};

		const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${SECRET_OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		});

		if (!chatResponse.ok) {
			const err = await chatResponse.json();
			throw new Error(err.error.message);
		}

		const chatRes = await chatResponse.json();
		const chatResContent = chatRes.choices[0].message.content;
		const pdfDoc = await fillForm(chatResContent, pdfKeys);

		return new Response(pdfDoc, {
			headers: {
				'Content-Type': 'application/blob'
			}
		});
	} catch (err) {
		console.error(err);
		return json({ error: 'There was an error processing your request' }, { status: 500 });
	}
};
