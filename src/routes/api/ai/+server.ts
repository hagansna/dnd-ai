import { json } from '@sveltejs/kit';
import { SECRET_OPENAI_KEY } from '$env/static/private';
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';
import { getTokens } from '$lib/tokenizer';
import type { RequestHandler } from './$types';
import fillForm from '$lib/pdf';
import { createParser } from 'eventsource-parser';

interface OpenAIStreamPayload {
	model: string;
	messages: { role: string; content: string }[];
	temperature: number;
	top_p: number;
	frequency_penalty: number;
	presence_penalty: number;
	max_tokens: number;
	stream: boolean;
	n: number;
}

// async function OpenAIStream(payload: OpenAIStreamPayload) {
// 	const encoder = new TextEncoder();
// 	const decoder = new TextDecoder();

// 	let counter = 0;

// 	const res = await fetch('https://api.openai.com/v1/chat/completions', {
// 		headers: {
// 			'Content-Type': 'application/json',
// 			Authorization: `Bearer ${SECRET_OPENAI_KEY}`
// 		},
// 		method: 'POST',
// 		body: JSON.stringify(payload)
// 	});

// 	const stream = new ReadableStream({
// 		async start(controller) {
// 			function onParse(event: any) {
// 				if (event.type === 'event') {
// 					const data = event.data;
// 					// console.log(data);
// 					// https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
// 					if (data === '[DONE]') {
// 						controller.close();
// 						return;
// 					}
// 					try {
// 						const json = JSON.parse(data);
// 						const text = json.choices[0].delta.content;
// 						// console.log(text);
// 						if (counter < 2 && (text.match(/\n/) || []).length) {
// 							// this is a prefix character (i.e., "\n\n"), do nothing
// 							return;
// 						}
// 						// console.log(text);
// 						const queue = encoder.encode(text);
// 						controller.enqueue(queue);
// 						counter++;
// 					} catch (e) {
// 						controller.error(e);
// 					}
// 				}
// 			}

// 			// stream response (SSE) from OpenAI may be fragmented into multiple chunks
// 			// this ensures we properly read chunks and invoke an event for each SSE event stream
// 			const parser = createParser(onParse);
// 			// https://web.dev/streams/#asynchronous-iteration
// 			for await (const chunk of res.body as any) {
// 				// console.log(decoder.decode(chunk));
// 				parser.feed(decoder.decode(chunk));
// 			}
// 		}
// 	});
// 	return stream;
// }

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!SECRET_OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set');
		}

		const requestData = await request.json();

		if (!requestData?.message) {
			throw new Error('No request data');
		}

		let tokenCount = 0;

		const tokens = getTokens(requestData.message);
		tokenCount += tokens;

		const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${SECRET_OPENAI_KEY}`
			},
			method: 'POST',
			body: JSON.stringify({
				input: requestData.message
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

		// const pdfKeys = [
		// 	'ClassLevel',
		// 	'Background',
		// 	'Backstory',
		// 	'CharacterName',
		// 	'CharacterName 2',
		// 	'Race ',
		// 	'Alignment',
		// 	'XP',
		// 	'Inspiration',
		// 	'STR',
		// 	'ProfBonus',
		// 	'AC',
		// 	'Initiative',
		// 	'Speed',
		// 	'PersonalityTraits ',
		// 	'STRmod',
		// 	'HPMax',
		// 	'ST Strength',
		// 	'DEX',
		// 	'ST Dexterity',
		// 	'ST Constitution',
		// 	'HPCurrent',
		// 	'Ideals',
		// 	'DEXmod ',
		// 	'ST Intelligence',
		// 	'ST Wisdom',
		// 	'ST Charisma',
		// 	'Bonds',
		// 	'CON',
		// 	'CONmod',
		// 	'Flaws',
		// 	'INT',
		// 	'INTmod',
		// 	'Wpn Name',
		// 	'Wpn1 AtkBonus',
		// 	'Wpn1 Damage',
		// 	'WIS',
		// 	'WISmod',
		// 	'CHA',
		// 	'CHamod',
		// 	'Passive',
		// 	'CP',
		// 	'EP',
		// 	'GP',
		// 	'PP',
		// 	'Equipment',
		// 	'Features and Traits',
		// 	'Age',
		// 	'Height',
		// 	'Weight',
		// 	'Eyes',
		// 	'Skin',
		// 	'Hair'
		// ];
		let prompt = `You are a Dungeons and Dragons expert who can create characters with whatever information is provided. Always provide the character name, class, race, background, backstory, physical description, and stats. Create a brand new character given whatever information is provided. Put the information in a JSON object`;

		if (tokenCount >= 10000) {
			throw new Error('Query too large');
		}

		const chatRequestOpts: OpenAIStreamPayload = {
			model: 'gpt-3.5-turbo',
			messages: [
				{ role: 'system', content: prompt },
				{ role: 'user', content: requestData.message }
			],
			temperature: 0.7,
			max_tokens: 2048,
			top_p: 1.0,
			frequency_penalty: 0.0,
			stream: true,
			presence_penalty: 0.0,
			n: 1
		};
		console.log('starting stream');

		// const stream = await OpenAIStream(chatRequestOpts);
		// console.log('here!');
		// return new Response(stream);

		// const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
		// 	headers: {
		// 		Authorization: `Bearer ${SECRET_OPENAI_KEY}`,
		// 		'Content-Type': 'application/json'
		// 	},
		// 	method: 'POST',
		// 	body: JSON.stringify(chatRequestOpts)
		// });

		// if (!chatResponse.ok) {
		// 	const err = await chatResponse.json();
		// 	throw new Error(err.error.message);
		// }

		// const chatRes = await chatResponse.json();
		// const chatResContent = chatRes.choices[0].message.content;
		// const pdfDoc = await fillForm(chatResContent, pdfKeys);

		// return new Response(pdfDoc, {
		// 	headers: {
		// 		'Content-Type': 'application/blob'
		// 	}
		// });

		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${SECRET_OPENAI_KEY}`
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.error.message);
		}

		return new Response(res.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		});
	} catch (err) {
		console.error(err);
		return json({ error: 'There was an error processing your request' }, { status: 500 });
	}
};
