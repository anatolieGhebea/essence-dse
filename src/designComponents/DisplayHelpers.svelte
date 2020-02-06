<script>
	import DemoWrapper from '../components/DemoWrapper.svelte';

	let btn = `<button class="btn">Standard</button>`;

	function generateButtons(classes, extraClasses = ''){
		let s = '';
		classes.forEach( cl => {
			let el = '<button class="btn '+extraClasses+' '+cl+'">'+cl+'</button>  ';
			s += el;
		})
		return s;
	}

</script>

<div class="page">
	<h1 class="main-section-title">Display </h1>
	<p>
		Display helper functions...		
	</p>

	<h2 class="title">#Flex</h2>
	<h3 class="subtitle">##</h3>
	<DemoWrapper>
		<div slot="graphic">
			<div class="d-flex">
				<!-- {@html generateButtons(colors)} -->
                <span>display helper classes:</span>
                <p>"d-flex" -> default to display flex direction row, with contente centered </p>
                <p>"d-flex-col" -> default to flex direction column, with content centered</p>
			</div>
		</div>
		<div slot="code">
		
			<!-- {generateButtons(colors)} -->
		</div>
	</DemoWrapper>




</div>

<style>

</style>