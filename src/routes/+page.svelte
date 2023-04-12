<script lang="ts">
    import type { PageData } from "./$types";
    import type { ChatCompletionRequestMessage } from 'openai'
    export let data: PageData;
    let selected: string;
    let loading = false;
    let chatMessages: ChatCompletionRequestMessage[] = []
    let answer: any;
    $: query = `Create a ${selected} character fill out the D&D character sheet for me.`

    // TODO: Yikes, make this cleaner
    const handleSubmit = async () => {
		loading = true
		try {
			chatMessages = [{ role: 'user', content: query }]
			const res = await fetch('/api/ai', {method: 'POST',
				body: JSON.stringify({ messages: chatMessages })})
			const blob = await res.blob()
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.download = 'file.pdf';
			link.href = url;
			link.click();
			URL.revokeObjectURL(url);
			loading = false;
		} catch(e) {
			handleError(e)
		}
	}
	function handleError<T>(err: T) {
		loading = false
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
    <button aria-busy={loading} class:variant-filled-secondary={loading} class="btn variant-filled-primary">{#if !loading}Generate!{:else}Generating...{/if}</button>
</form>
