<script>
	import DemoWrapper from '../components/DemoWrapper.svelte';

	let btn = `<button class="btn">Standard</button>`;
	
	let colors = [

	];


	let sizes = [
		'txt-12',
		'txt-14',
		'txt-16',
		'txt-18',
		'txt-20',
		'txt-24',
		'txt-30',
		'txt-36',
		'txt-48',
		'txt-60',
		'txt-72',
	];
	let weight = [
		'fw-light',
		'fw-normal',
		'fw-bold',
	];

	function generateCode(classes, extraClasses = ''){
		let s = '';
		classes.forEach( cl => {
			let el = '<div class="'+cl+' '+extraClasses +'">'+cl+'</div>  \n';
			s += el;
		})
		return s;
	}

</script>

<div class="page">
	<h1 class="main-section-title">Text</h1>
	<p>
		To style a button component, it is possible to combine multiple css classes. 
		Each class must belong to a different "#section".		
	</p>

	<h2 class="title">#Size</h2>
	<DemoWrapper
		graphic="{generateCode(sizes)}" 
		code="{generateCode(sizes)}"
		>
	</DemoWrapper>

	<h2 class="title">#Size</h2>
	<DemoWrapper
		graphic="{generateCode(weight, 'txt-18')}" 
		code="{generateCode(weight,'txt-18')}">
	</DemoWrapper>

</div>

<style>
</style>