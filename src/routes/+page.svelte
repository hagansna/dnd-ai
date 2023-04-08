<script lang="ts">
    import type { PageData } from "./$types";
    import type { ChatCompletionRequestMessage } from 'openai'
    import {SSE} from 'sse.js'
    export let data: PageData;
    let selected: string;
    let loading = false;
    let chatMessages: ChatCompletionRequestMessage[] = []
    let answer: any;
    $: query = `Create a ${selected} character fill out the D&D character sheet for me.`

    // TODO: Yikes, make this cleaner
    const handleSubmit = async () => {
		loading = true
		chatMessages = [...chatMessages, { role: 'user', content: query }]
        const res = await fetch('/api/ai', {method: 'POST',
			body: JSON.stringify({ messages: chatMessages })})
        const blob = await res.blob()
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'file.pdf';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
		// const eventSource = new SSE('/api/ai', {
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	payload: JSON.stringify({ messages: chatMessages })
		// })
		// eventSource.addEventListener('error', handleError)
		// eventSource.addEventListener('message', (e) => {
		// 	try {
		// 		loading = false
		// 		if (e.data === '[DONE]') {
		// 			chatMessages = [...chatMessages, { role: 'assistant', content: answer }]
		// 			return
		// 		}
		// 		const completionResponse = JSON.parse(e.data)
		// 		const [{ delta }] = completionResponse.choices
		// 		if (delta.content) {
		// 			answer = (answer ?? '') + delta.content
		// 		}
        //         console.log(answer)
		// 	} catch (err) {
		// 		handleError(err)
		// 	}
		// })
		// eventSource.stream()
	}
	function handleError<T>(err: T) {
		loading = false
		answer = ''
		console.error(err)
	}
</script>

<form class="m-5" on:submit|preventDefault={() => handleSubmit()}>
    <label class="label my-2">
        <span>Class</span>
        <select name="class" class="select" bind:value={selected}>
            {#each data.body as { index, name }}
                <option value={index}>{name}</option>
            {/each}
        </select>
    </label>
    <button class="btn variant-filled-primary">Generate!</button>
</form>
