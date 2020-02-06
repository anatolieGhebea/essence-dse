<script>
	import DemoWrapper from '../components/DemoWrapper.svelte';

	let btn = `<button class="btn">Standard</button>`;
	
	let colors = [
		'is-primary',
		'is-secondary',
		'is-success',
		'is-danger',
		'is-warning',
		'is-info',
		'is-teal',
	];
	let colorsOutlined = [
		'is-outlined is-primary',
		'is-outlined is-secondary',
		'is-outlined is-success',
		'is-outlined is-danger',
		'is-outlined is-warning',
		'is-outlined is-info',
		'is-outlined is-teal',
	];

	let sizes = [
		'is-large',
		'is-medium',
		'is-normal',
		'is-small',
	];

	function generateButtons(classes, extraClasses = ''){
		let s = '';
		classes.forEach( cl => {
			let el = '<button class="button m-vert-05 '+extraClasses+' '+cl+'">'+cl+'</button>  ';
			s += el;
		})
		return s;
	}

</script>

<div class="page">
	<h1 class="main-section-title">Bulma Buttons</h1>
	<p>
		To style a button component, it is possible to combine multiple css classes. 
		Each class must belong to a different "#section".		
	</p>

	<h2 class="title">#Colors</h2>
	<h3 class="subtitle">##Full color</h3>
	<DemoWrapper>
		<div slot="graphic">
			<div class="d-flex">
				{@html generateButtons(colors)}
			</div>
		</div>
		<div slot="code">
			{generateButtons(colors)}
		</div>
	</DemoWrapper>
	<h3 class="subtitle">##Outlined color</h3>
	<DemoWrapper>
		<div slot="graphic">
			<div class="d-flex">
				{@html generateButtons(colorsOutlined, 'has-shadow')}
			</div>
		</div>
		<div slot="code">
			{generateButtons(colorsOutlined, 'has-shadow')}
		</div>
	</DemoWrapper>


	<h2 class="title">#Size</h2>
	<DemoWrapper>
		<div slot="graphic">
			<div class="d-flex">
				{@html generateButtons(sizes, 'is-primary')}
			</div>
		</div>
		<div slot="code">
			{generateButtons(sizes, 'is-primary')}
		</div>
	</DemoWrapper>

</div>

<style>

</style>