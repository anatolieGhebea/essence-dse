<script>

	import Prism from 'prismjs';
	// import  { Locale }  from '../localization/localization.js';
	export let Locale;

	export let activeElement = {};
	export let doc = {};

	$: init( activeElement, doc );

	// 
	let mainDesc = '';
	let variables = [];

	let sections = [];
	

	function init( element, doc ) {
		console.log(element);
		console.log(doc);
		
		if(!(Object.keys(doc).length === 0 && doc.constructor === Object)){
			mainDesc = doc.mainDescription;
			variables = doc.cssVariables;
			sections = doc.sections;
		} else {
			mainDesc = '';
			variables = [];
			sections = [];
		}
		
		// da implementare chiamata a server

	}

	// not used, Prism by default higlights <code  class="language-html">
	function beautify( code , p1 = 'html', p2 = 'javascript' ) {
		switch (p1) {
			case 'javascript':
				p1 = Prism.languages.javascript;
				break;
		
			default:
				p1 = Prism.languages.html;
				break;
		}
		return Prism.highlight(code, p1, p2);
	} 

	function generate( classes, example ){

		let res = '';
		classes.forEach( cls => {
			let s = example.replace(/%%cls%%/, cls).replace(/%%cls%%/, cls);
			res += s + '\n';
		});

		return res;
	}

	function generateArr( classes, example ){

		let res = [];
		classes.forEach( cls => {
			let s = example.replace(/%%cls%%/, cls).replace(/%%cls%%/, cls);
			res.push( { class: cls, el: s } );
		});

		return res;
	}

	function copyToClipboard( str ) {
		const el = document.createElement('textarea');
		el.value = str;
		el.setAttribute('readonly', '');
		el.style.position = 'absolute';
		el.style.left = '-9999px';
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);

		alert('copiato');
	};


</script>

<main>
{#if activeElement }
	<h1> {@html Locale.t(activeElement.displayName) } </h1>
	<p>
		{@html Locale.t(mainDesc) }
	</p>

	{#if sections && sections.length > 0 } 
		<!-- <h3>{ translate('block_css') }</h3> -->
		{#each sections as section }
			<div class="sectionBlock">
				<div> 
					<h2 class="sectionBlock-title"> {  Locale.t(section.sectionName) } </h2>
					<p> {@html Locale.t(section.description) } </p>
				</div>
				{#if section.classes != '' }
					<h5> { Locale.t('example') } </h5>
					<div class="demoContainer">
						{#each generateArr(section.classes, section.example) as elm  }
							<div class="demoContainer-row">
								<div class="rowOperations">
									<span class="op opCopy" on:click="{ () => copyToClipboard(elm.class) }">Copy class</span>
									<span class="op opCopy" on:click="{ () => copyToClipboard(elm.el) }">Copy markup</span>
								</div>
								<div class="demoContainer-show">
									<div class="{ (section.wrapperClass ? section.wrapperClass: '' ) }"> {@html elm.el } </div>
								</div>

								<div class="demoContainer-code">
									<pre>
										<code  class="language-html">
											<!-- mostro il codice sorgente -->
											{@html beautify(elm.el) }
										</code>
									</pre>
								</div>
							</div>
						{/each}
							<!-- <pre> -->
						<!-- </pre> -->
					</div>
				{/if}
			</div>
		{/each}
	{/if}


	{#if variables.length > 0 } 
		<div class="p_ver_05">
			<h3>{ Locale.t('variables') }</h3>
			<div class="bg_neutral_050 text_light"> 
				<table >
					<thead>
					<tr class="bg_neutral_500 text_white">
						<th>{ Locale.t("name") }</th>
						<th>{ Locale.t("default") }</th>
						<th>{ Locale.t("description") }</th>
					</tr>
					</thead>
					<tbody class="bg_white">
						{#each variables as item }
							<tr>
								<td class="text_primary_800"> {item.variable} </td>
								<td> {item.default}</td>
								<td> {@html Locale.t(item.description) } </td>
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

	.sectionBlock {
		margin-top:1rem;
	}
	.sectionBlock-title {
		border-bottom: 1px solid #2d2d2d;
	}

	.demoContainer {
		width: 100%;
		/* display: flex; */
		font-size: 1.2rem;
	}

	.demoContainer-row  {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		background: #fff;
		padding: .25rem;
		margin-bottom: .5rem;
		border-radius: .5rem;
		align-items: center;
	}

	.demoContainer-row:hover .rowOperations {
		display: block;
	}
	.demoContainer-show  {
		margin: 0 1.5rem;
		flex-grow: 100;
		min-width: 20rem;
	}
	.demoContainer-show > div > div {
		padding: .5rem;
	}

	.demoContainer-code {
		/* border: 1px solid#ccc; */
		background:#2d2d2d;
		color: #fff;
		word-wrap: break-word;
		border-radius: .5rem;
		flex-basis: 50%;
		min-width: 20rem;
		flex-grow: 1
	}

	.rowOperations {
		display: none;
		position: absolute;
		top: 0;
		right: 0;
		background: var(--neutral_100);
		color: var(--neutral_800);
		padding: .2rem;
		border-radius: .25rem;
		box-shadow: 0 2px 2px 0 #ccc;
		font-size: 16px;
	}
	.rowOperations .op {
		padding: .2rem;
		opacity: .6;
	}
	.rowOperations .op:hover {
		opacity: 1;
		cursor: pointer;
	}
</style>