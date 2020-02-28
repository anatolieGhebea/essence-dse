'use strict';

// Object.defineProperty(exports, '__esModule', { value:true });
import localization from './it.json';

export const Locale = (function() {
	function translate(label) {

		let lbl = label;
		if( localization.hasOwnProperty(label) )
			lbl = localization[label];
			
		return lbl;
	}

	return {
		t: translate
	}
})();

// exports.Translations = Translations;