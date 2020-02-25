<script>

	export let activeElement = {};
	export let doc = {};
	export let lang = 'it';

	$: init( activeElement );

	// 
	let mainDesc = '';
	let variables = [];

	let blockClasses = [];
	let elementClasses = [];
	let modifierClasses = [];

	function init( element ) {
		console.log(element);
		console.log(doc);
		
		if(doc){
			mainDesc = doc.mainDescription[lang];
			variables = doc.cssVariables;
			blockClasses = doc.blockClasses;
		}
		
		// da implementare chiamata a server

	}


	let labels = {
		'variables':{
			it: 'Variabili',
			en: 'Variables'
		},
		'block_css':{
			it: 'Classi per blocco',
			en: 'Block classes'
		},
		'element_css':{
			it: 'Classi di elemento',
			en: 'Element classes'
		},
		'modifier_css':{
			it: 'Classi modificatori',
			en: 'Modifier classes'
		},
	}

	function translate(lbl) {

		let lblTranslated = lbl;
		if(  labels.hasOwnProperty(lbl) ){
			if(labels[lbl][lang])
				lblTranslated = labels[lbl][lang];
		}

		return lblTranslated;
	}

</script>

<main>
{#if activeElement }
	<h1> { activeElement.displayName} </h1>
	<p>
		{ mainDesc }
	</p>

	{#if blockClasses.length > 0 } 
		<div>
			<h3>{ translate('block_css') }</h3>
			{#each blockClasses as item }
				<div> 
					<h4> .{ item.class } </h4>
					<p> { item.description[lang] } </p>
				</div>
				{#if item.example != '' }
					<h5> { translate('example') } </h5>
					<div>
						<div class="demo-area-show">
							{@html item.example }
						</div>
							<!-- <pre> -->
						<div class="demo-area-code">
							<pre>
								<code  class="language-html">
									{item.example}
								</code>
							</pre>
						</div>
						<!-- </pre> -->
					</div>
				{/if}
			{/each}

		</div>
	{/if}

	{#if elementClasses.length > 0 } 
		<div>
			<h3>{ translate('element_css') }</h3>
		
		</div>
	{/if}

	{#if modifierClasses.length > 0 } 
		<div>
			<h3>{ translate('modifier_css') }</h3>
		
		</div>
	{/if}

	{#if variables.length > 0 } 
		<div class="p_ver_05">
			<h3>{ translate('variables') }</h3>
			<div class="bg_neutral_050 text_light"> 
				<table >
					<thead>
					<tr class="bg_neutral_500 text_white">
						<th>{ translate("name") }</th>
						<th>{ translate("default") }</th>
						<th>{ translate("description") }</th>
					</tr>
					</thead>
					<tbody>
						{#each variables as item }
							<tr>
								<td class="text_primary_800"> {item.variable} </td>
								<td> {item.default}</td>
								<td> {@html item.description[lang] } </td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}


{:else}
		this is a message from the Simple component
{/if}
</main>

<style>

	table {
		border-collapse: collapse;
		border:0;
		/* border-color: #999; */
	}

	table tr {
		border-bottom: 1px solid var(--neutral_200);
	}
	table tr th {
		text-transform: capitalize;
		padding: .25rem 0;
	}

	table tr td {
		padding: .25rem 1rem .25rem 1rem; 
	}

	.demo-area-show {
		background:hsl(210, 36%, 96%);
		min-height: 15rem;
		height: auto;	
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.demo-area-code {
		/* border: 1px solid#ccc; */
		background:#2d2d2d;
		color: #fefefe;
		max-width: 100%;
		word-wrap: break-word;
		padding: .5rem 0;
	}
</style>