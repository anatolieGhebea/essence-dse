<script>
	// import components
	import Buttons from './designComponents/Buttons.svelte';
	// import ButtonsBulma from './designComponents/ButtonsBulma.svelte';
	import DisplayHelpers from './designComponents/DisplayHelpers.svelte';
	import Text from './designComponents/Text.svelte';

	let componentList = [
		'Buttons',
		'Text',
		'DisplayHelpers' ,
		'Helpers' ,
		'Layout' ,
		'Tables' ,
		];

	let activeElement = componentList[0];

	function setActive(active){
		activeElement = active;
	}

</script>

<main>
	
	<div class="container">
		<div class="side-menu">
			<ul>
			{#each componentList as cmp}
				<li class:active="{activeElement == cmp}" on:click="{ () => setActive(cmp)}">{cmp}</li>
			{/each}
			</ul>
		</div>

		<div class="main-content">
			{#if activeElement == 'Buttons'} 
				<Buttons></Buttons>
			{:else if activeElement == 'Text'}
				<Text></Text>
			{:else if activeElement == 'DisplayHelpers'}
				<DisplayHelpers></DisplayHelpers>
			{/if}
			
		</div>
	</div>

</main>

<style>

.container {
	position: relative;
	width: 100%;
	top:0;
	left:0;
	display: flex;
	flex-direction: row nowrap;
	justify-content: flex-start;
	align-items: flex-start;
	height: 100vh;
	overflow: scroll;
}

.container .side-menu {
	width: 13rem;
	min-width: 13rem;
	background: #333;
	height: 100%;
	position: sticky;
	top: 0;
	color: #fff;
}
.container .main-content {
	flex-grow: 1;
	padding-left: 2.5rem;
}

.side-menu ul {
	padding-left: 0rem; 
	margin-left: 0rem; 
}

.side-menu ul li {
	cursor: pointer;
	list-style: none;
	padding-left: .5rem;
	border-left:2px solid transparent;
}

.side-menu ul li:hover,
.side-menu ul li.active {
	background: rgba(0, 0, 0, 0.2);
	border-left: 2px solid #1870af;
	
}

</style>