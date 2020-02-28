<script>
	// import fs from 'fs';
	// console.log(fs);
	import Simple from './components/Simple.svelte';
	import  config from './config/default.json';
	
	// let lang = 'it';
	import  { Locale }  from './localization/localization.js';

	// partials
	import  textDoc from './atomicCss/doc/_text.json';
	import  paletteDoc from './atomicCss/doc/_palette5.json';
	import  spacingDoc from './atomicCss/doc/_spacing.json';
	import  breackpointsDoc from './atomicCss/doc/_breackpoints.json';

	let doc = {};

	let categories = config.categories;
	$: selectFirstEl(categories);

	function selectFirstEl(cats) {
		if( cats.length > 0 ){		
			if(cats[0].items.length > 0 ) {
				let el = cats[0]['items'][3];
				let cmpt = cats[0].componentType;
				setActiveElem(el, cmpt );
			}
		}
	}

	// console.log(json);
	// /config/default.json
	let activeElem = null;
	let componentType = null;

	function setActiveElem( el, cmpt ){
		activeElem = el;
		componentType = cmpt;
		switch (el.file) {
			case '_text':
				doc = textDoc;	
				break;
			case '_palette5':
				doc = paletteDoc;	
				break;
			case '_spacing':
				doc = spacingDoc;	
				break;
			case '_breackpoints':
				doc = breackpointsDoc;	
				break;
		
			default:
				doc = {}
				break;
		}

	}

	// function isActive(activeLink, al) {
	// 	return activeLink == al;
	// }

</script>

<main>
<main>
	
	<div class="container">
		<div class="side-menu">
			<ul >
			{#each categories as catList }
				<li class="heading-li">
					{ catList.name }
					<ul class="hoverable">
						{#each catList.items as item }
							<li class:active="{ activeElem.file == item.file  }" on:click="{ () => setActiveElem( item, catList.componentType ) }">{ item.displayName }</li>
						{/each}
					</ul>
				</li>
				<!-- <li class:active="{ activeElement == cmp }" on:click="{ () => setActive( cmp ) }">{ cmp }</li> -->
			{/each}
			</ul>
		</div>

		<div class="main-content">
			<!-- slected element { activeElem.displayName } -->
			{#if componentType == 'simple' }
				<Simple activeElement="{activeElem}" doc="{doc}" lang="it" {Locale}></Simple>
			{/if}
		</div>
	</div>

</main>
	

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
	padding-left: 1rem; 
}
.container .main-content {
	flex-grow: 1;
	padding: 2.5rem;
	width: calc( 100% - 13rem)
}

.side-menu ul {
	padding-left: 0rem; 
	margin-left: 0rem; 
}

.side-menu ul li {
	list-style: none;
}
.side-menu ul.hoverable li {
	cursor: pointer;
	padding-left: .5rem;
	border-left:2px solid transparent;
}

.side-menu ul.hoverable li:hover,
.side-menu ul.hoverable li.active {
	background: rgba(0, 0, 0, 0.5);
	border-right: 3px solid #1870af;
	
}
</style>