<script>
	import Prims from 'prismjs';

	// atoms to create the html code for the Dome element to be shown 
	
	export let jsn = { cls: 'pippo', cnt: 'ciao' };
	

	export let domElementOpen = '<div';
	export let domElementContent = 'test';
	export let domeElementClose = '</div>';
	export let domElementProperties = ''; 
	export let elBaseClassString = ''; // the defult class to be applied [ type => String ]
	export let elTailClassString  = ''; // some extra class to be applied [ type => String ]

	export let listExclusiveClasses = []; // as radio buttons
	export let listModifierClasses = []; // as option buttons
	export let atomicClasses = [];

	let selectedClass = '';
	let selectedModifiers = [];
	let selectedAtomicClasses = [];

	$: selectedModifiersString = converToString(selectedModifiers);
	$: selectedAtomicString = converToString(selectedAtomicClasses);

	function converToString(arr){
		let s = '';
		if( arr.length > 0 ){
			s = arr.join(' ');
		}

		return s;
	}

	// $: htmlCode = 	domElementOpen + ' '+
	// 				'class="' + elBaseClassString +' '+ selectedClass +' '+ selectedModifiersString +' '+selectedAtomicString+' '+ elTailClassString +' " ' +
	// 				domElementProperties + '>' + domElementContent + 
	// 				domeElementClose;
	
	$: htmlCode = createDomElement(selectedClass, selectedModifiersString,  selectedAtomicString);

	export let domLiteral = '<button class="%%cls%%">%%cnt%%</button>';

	// passing as parameters only the variables that may change
	function createDomElement( selectedClass, selectedModifiersString,  selectedAtomicString ){
		let stringElem = domElementOpen + ' '+ 'class="';

		let dynamicClasses = [];
		if( elBaseClassString.trim() != '' )
			dynamicClasses.push(elBaseClassString);
		
		if( selectedClass.trim() != '' )
			dynamicClasses.push(selectedClass);
		
		if( selectedModifiersString.trim() != '' )
			dynamicClasses.push(selectedModifiersString);
		
		if( selectedAtomicString.trim() != '' )
			dynamicClasses.push(selectedAtomicString);
		
		if( elTailClassString.trim() != '' )
			dynamicClasses.push(elTailClassString);

		let cls = converToString(dynamicClasses);

		stringElem += cls +'" ' +domElementProperties + '>' + domElementContent + domeElementClose ; // close class property

		// stringElem = `<button class="${cls}">${jsn.cnt}</button>`;
		stringElem = domLiteral.replace(/%%cls%%/, cls).replace(/%%cnt%%/, jsn.cnt);
		
		return stringElem;
	}

	let htmlPritty = '';
	// Returns a highlighted HTML string
	$: htmlPritty = Prism.highlight(htmlCode, Prism.languages.html, 'javascript');
	
</script>

<div class="demo-area ds">
	<div class="d_flex flex_justify_between">
		<div class="col-sx">
			<div class="demo-area-show">
				{@html htmlCode}
			</div>
				<!-- <pre> -->
			<div class="demo-area-code">
				<pre>
					<code  class="language-html">
						{@html htmlPritty }
					</code>
				</pre>
			</div>
			<!-- </pre> -->
		</div>

		<div class="col-dx demo-area-options">
			<div>
				<h4>Exclusive classes</h4>
				{#each listExclusiveClasses as className }
					<div>
						<input type="radio" bind:group="{selectedClass}" value="{className}" />
						{ className }
					</div>
				{/each}
			</div>
			<div>
				<h4>Modifier classes</h4>
				{#each listModifierClasses as className }
					<div>
						<input type="checkbox" bind:group="{selectedModifiers}" value="{className}" />
						{ className }
					</div>
				{/each}
			</div>
			<div>
				<h4>Atomic classes</h4>
				{#each atomicClasses as atomClassName }
					<div>
						<input type="checkbox" bind:group="{selectedAtomicClasses}" value="{atomClassName}" />
						{ atomClassName }
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
h4 {
	margin: 0;
}

.demo-area {
	width: 90%;
	/* background:#f8f8f8; */
	border-radius: 5px;
	overflow:hidden;
	/* box-shadow:  1px 4px 7px 2px #ccc; */
	/* border-top: 1px solid #ebebeb; */
	margin-bottom: 2.5rem;
}

.col-sx {
	flex-grow: 1;
}

.demo-area-show {
	background:hsl(210, 36%, 96%);
	min-height: 15rem;
	height: auto;	
	display: flex;
	justify-content: center;
	align-items: center;
	

}

.demo-area-options {
	padding: 0rem .5rem .2rem 1rem;
	max-width: 20rem;
	min-width: 15rem;
	/* max-height: 20rem; */
	overflow-y: scroll;
	overflow-x: hidden;
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