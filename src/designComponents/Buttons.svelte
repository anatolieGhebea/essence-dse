<script>
	import DemoWrapper from '../components/DemoWrapper.svelte';
	import DemoCard from '../components/DemoCard.svelte';



	let btn = `<button class="btn">Standard</button>`;
	
	let colors = [
		'btn-primary',
		'btn-secondary',
		'btn-success',
		'btn-danger',
		'btn-warning',
		'btn-info',
		'btn-teal',
	];
	let colorsOutlined = [
		'btn-o-primary',
		'btn-o-secondary',
		'btn-o-success',
		'btn-o-danger',
		'btn-o-warning',
		'btn-o-info',
		'btn-o-teal',
	];

	let sizes = [
		'btn-lg',
		'btn-md',
		'btn',
		'btn-sm',
		'btn-xm',
	];

	let atomicClasses = [
		'txt-12',
		'txt-14',
		'txt-16',
		'txt-18',
		'txt-20',
		'txt-24',
	]

	function generateButtons(classes, extraClasses = ''){
		let s = '';
		classes.forEach( cl => {
			let el = '<button class="btn '+extraClasses+' '+cl+'">'+cl+'</button>  \n';
			s += el;
		})
		return s;
	}

</script>

<div class="page">
	<h1 class="main-section-title">Buttons</h1>
	<p>
		To style a button component, it is possible to combine multiple css classes. 
		Each class must belong to a different "#section".		
	</p>

	<DemoCard 
		domElementOpen="<button"
		domeElementClose="</button>"
		domElementContent="Button" 
		elBaseClassString="btn" 
		listExclusiveClasses="{colors}" 
		listModifierClasses="{sizes}"
		atomicClasses="{atomicClasses}"

		/>

</div>

<style>

</style>