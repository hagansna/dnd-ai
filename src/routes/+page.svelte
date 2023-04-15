<script lang="ts">
	import { SSE } from "sse.js";
    import type { PageData } from "./$types";
    export let data: PageData;
    let selected: string;
    let loading = false;
	let endStream = false;
	let searchResponse = "";
	let rawResponse = "";
    $: query = `Create a ${selected} character. Fill out the D&D character sheet for me.`

	function parseInput(chatInput: string) {
		const re = /({[\s\S*]+})/i;
		const input = chatInput.match(re) ?? [];
		const jsonInput = input.length > 1 ? JSON.parse(input[1]) : {};
		return jsonInput;
	}

	async function handleSubmit() {
		if (loading) return;
		searchResponse = '';
		endStream = false;
		loading = true;
		const eventSource = new SSE('/api/ai', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ message: query })
		})
		// eventSource.addEventListener('error', handleError)
		eventSource.addEventListener('message', (e) => {
			try {
				if (e.data === '[DONE]') {
					searchResponse = parseInput(rawResponse)
					loading = false
					return
				}
				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices
				if (delta.content) {
					rawResponse = (rawResponse ?? '') + delta.content
				}
			} catch (err) {
				console.log(err)
			}
		})
		eventSource.stream()
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
    <button aria-busy={loading} class:variant-filled-secondary={loading} class="btn variant-filled-primary">{#if !loading}Generate!{:else}Generating...{/if}</button>
	{#if searchResponse}
		{#each Object.entries(searchResponse) as [key, val]}
			{#if typeof val === "object"}
				<ul>
				{#each Object.entries(val) as [valKey, valVal]}
					<li><span class="font-bold">{valKey}</span>: {valVal}</li>
				{/each}
				</ul>
			{:else}
				<div><span class="font-bold">{key}</span>: {val}</div>
			{/if}
		{/each}
	{/if}
</form>
