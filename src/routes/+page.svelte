<script lang="ts">
	import ModeSwitcher from '#lib/components/Dark-Light-Mode/Mode-Switcher.svelte';
	import { Button } from '#lib/components/ui/button/index.js';

	let count = $state(0);
	const increaser = () => count++;
</script>

<Button onclick={increaser}>click me to increase the number: {count}</Button>
<ModeSwitcher />
