<script>
	import Prims from 'prismjs';

	export let code = '';
	export let graphic = '';
	// Returns a highlighted HTML string
	$: htmlCode = Prism.highlight(graphic, Prism.languages.html, 'javascript');

</script>

<div class="demo-area ds">
	<div class="demo-area-show">
		<slot name="graphic">
			{@html graphic}
		</slot>
	</div>
	<!-- <pre> -->
	
		<div class="demo-area-code">
			<slot name="code-area">
				<textarea bind:value="{graphic}"></textarea>
				<pre>
					<code  class="language-html">
						{@html htmlCode }
					</code>
				</pre>
			</slot>
		</div>
	
	<!-- </pre> -->
</div>

<style>

.demo-area {
	width: 90%;
	/* background:#f8f8f8; */
	border-radius: 5px;
	overflow:hidden;
	box-shadow:  1px 4px 7px 2px #ccc;
	/* border-top: 1px solid #ebebeb; */
	margin-bottom: 2.5rem;
}

.demo-area > div {
	padding: 1rem;
}

.demo-area-show {
	background:#f8f8f8;
}

.demo-area-code {
	/* border: 1px solid#ccc; */
	background:#2d2d2d;
	color: #fefefe;
	max-width: 100%;
	word-wrap: break-word;
}

</style>