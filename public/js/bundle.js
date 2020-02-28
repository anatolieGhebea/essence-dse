
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var prism = createCommonjsModule(function (module) {
    /* **********************************************
         Begin prism-core.js
    ********************************************** */

    var _self = (typeof window !== 'undefined')
    	? window   // if in browser
    	: (
    		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    		? self // if in worker
    		: {}   // if in node js
    	);

    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     * MIT license http://www.opensource.org/licenses/mit-license.php/
     * @author Lea Verou http://lea.verou.me
     */

    var Prism = (function (_self){

    // Private helper vars
    var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    var uniqueId = 0;


    var _ = {
    	manual: _self.Prism && _self.Prism.manual,
    	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
    	util: {
    		encode: function (tokens) {
    			if (tokens instanceof Token) {
    				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
    			} else if (Array.isArray(tokens)) {
    				return tokens.map(_.util.encode);
    			} else {
    				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
    			}
    		},

    		type: function (o) {
    			return Object.prototype.toString.call(o).slice(8, -1);
    		},

    		objId: function (obj) {
    			if (!obj['__id']) {
    				Object.defineProperty(obj, '__id', { value: ++uniqueId });
    			}
    			return obj['__id'];
    		},

    		// Deep clone a language definition (e.g. to extend it)
    		clone: function deepClone(o, visited) {
    			var clone, id, type = _.util.type(o);
    			visited = visited || {};

    			switch (type) {
    				case 'Object':
    					id = _.util.objId(o);
    					if (visited[id]) {
    						return visited[id];
    					}
    					clone = {};
    					visited[id] = clone;

    					for (var key in o) {
    						if (o.hasOwnProperty(key)) {
    							clone[key] = deepClone(o[key], visited);
    						}
    					}

    					return clone;

    				case 'Array':
    					id = _.util.objId(o);
    					if (visited[id]) {
    						return visited[id];
    					}
    					clone = [];
    					visited[id] = clone;

    					o.forEach(function (v, i) {
    						clone[i] = deepClone(v, visited);
    					});

    					return clone;

    				default:
    					return o;
    			}
    		},

    		/**
    		 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
    		 *
    		 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
    		 *
    		 * @param {Element} element
    		 * @returns {string}
    		 */
    		getLanguage: function (element) {
    			while (element && !lang.test(element.className)) {
    				element = element.parentElement;
    			}
    			if (element) {
    				return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
    			}
    			return 'none';
    		},

    		/**
    		 * Returns the script element that is currently executing.
    		 *
    		 * This does __not__ work for line script element.
    		 *
    		 * @returns {HTMLScriptElement | null}
    		 */
    		currentScript: function () {
    			if (typeof document === 'undefined') {
    				return null;
    			}
    			if ('currentScript' in document) {
    				return document.currentScript;
    			}

    			// IE11 workaround
    			// we'll get the src of the current script by parsing IE11's error stack trace
    			// this will not work for inline scripts

    			try {
    				throw new Error();
    			} catch (err) {
    				// Get file src url from stack. Specifically works with the format of stack traces in IE.
    				// A stack will look like this:
    				//
    				// Error
    				//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
    				//    at Global code (http://localhost/components/prism-core.js:606:1)

    				var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
    				if (src) {
    					var scripts = document.getElementsByTagName('script');
    					for (var i in scripts) {
    						if (scripts[i].src == src) {
    							return scripts[i];
    						}
    					}
    				}
    				return null;
    			}
    		}
    	},

    	languages: {
    		extend: function (id, redef) {
    			var lang = _.util.clone(_.languages[id]);

    			for (var key in redef) {
    				lang[key] = redef[key];
    			}

    			return lang;
    		},

    		/**
    		 * Insert a token before another token in a language literal
    		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
    		 * we cannot just provide an object, we need an object and a key.
    		 * @param inside The key (or language id) of the parent
    		 * @param before The key to insert before.
    		 * @param insert Object with the key/value pairs to insert
    		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
    		 */
    		insertBefore: function (inside, before, insert, root) {
    			root = root || _.languages;
    			var grammar = root[inside];
    			var ret = {};

    			for (var token in grammar) {
    				if (grammar.hasOwnProperty(token)) {

    					if (token == before) {
    						for (var newToken in insert) {
    							if (insert.hasOwnProperty(newToken)) {
    								ret[newToken] = insert[newToken];
    							}
    						}
    					}

    					// Do not insert token which also occur in insert. See #1525
    					if (!insert.hasOwnProperty(token)) {
    						ret[token] = grammar[token];
    					}
    				}
    			}

    			var old = root[inside];
    			root[inside] = ret;

    			// Update references in other language definitions
    			_.languages.DFS(_.languages, function(key, value) {
    				if (value === old && key != inside) {
    					this[key] = ret;
    				}
    			});

    			return ret;
    		},

    		// Traverse a language definition with Depth First Search
    		DFS: function DFS(o, callback, type, visited) {
    			visited = visited || {};

    			var objId = _.util.objId;

    			for (var i in o) {
    				if (o.hasOwnProperty(i)) {
    					callback.call(o, i, o[i], type || i);

    					var property = o[i],
    					    propertyType = _.util.type(property);

    					if (propertyType === 'Object' && !visited[objId(property)]) {
    						visited[objId(property)] = true;
    						DFS(property, callback, null, visited);
    					}
    					else if (propertyType === 'Array' && !visited[objId(property)]) {
    						visited[objId(property)] = true;
    						DFS(property, callback, i, visited);
    					}
    				}
    			}
    		}
    	},
    	plugins: {},

    	highlightAll: function(async, callback) {
    		_.highlightAllUnder(document, async, callback);
    	},

    	highlightAllUnder: function(container, async, callback) {
    		var env = {
    			callback: callback,
    			container: container,
    			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    		};

    		_.hooks.run('before-highlightall', env);

    		env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

    		_.hooks.run('before-all-elements-highlight', env);

    		for (var i = 0, element; element = env.elements[i++];) {
    			_.highlightElement(element, async === true, env.callback);
    		}
    	},

    	highlightElement: function(element, async, callback) {
    		// Find language
    		var language = _.util.getLanguage(element);
    		var grammar = _.languages[language];

    		// Set language on the element, if not present
    		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

    		// Set language on the parent, for styling
    		var parent = element.parentNode;
    		if (parent && parent.nodeName.toLowerCase() === 'pre') {
    			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
    		}

    		var code = element.textContent;

    		var env = {
    			element: element,
    			language: language,
    			grammar: grammar,
    			code: code
    		};

    		function insertHighlightedCode(highlightedCode) {
    			env.highlightedCode = highlightedCode;

    			_.hooks.run('before-insert', env);

    			env.element.innerHTML = env.highlightedCode;

    			_.hooks.run('after-highlight', env);
    			_.hooks.run('complete', env);
    			callback && callback.call(env.element);
    		}

    		_.hooks.run('before-sanity-check', env);

    		if (!env.code) {
    			_.hooks.run('complete', env);
    			callback && callback.call(env.element);
    			return;
    		}

    		_.hooks.run('before-highlight', env);

    		if (!env.grammar) {
    			insertHighlightedCode(_.util.encode(env.code));
    			return;
    		}

    		if (async && _self.Worker) {
    			var worker = new Worker(_.filename);

    			worker.onmessage = function(evt) {
    				insertHighlightedCode(evt.data);
    			};

    			worker.postMessage(JSON.stringify({
    				language: env.language,
    				code: env.code,
    				immediateClose: true
    			}));
    		}
    		else {
    			insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    		}
    	},

    	highlight: function (text, grammar, language) {
    		var env = {
    			code: text,
    			grammar: grammar,
    			language: language
    		};
    		_.hooks.run('before-tokenize', env);
    		env.tokens = _.tokenize(env.code, env.grammar);
    		_.hooks.run('after-tokenize', env);
    		return Token.stringify(_.util.encode(env.tokens), env.language);
    	},

    	matchGrammar: function (text, strarr, grammar, index, startPos, oneshot, target) {
    		for (var token in grammar) {
    			if (!grammar.hasOwnProperty(token) || !grammar[token]) {
    				continue;
    			}

    			var patterns = grammar[token];
    			patterns = Array.isArray(patterns) ? patterns : [patterns];

    			for (var j = 0; j < patterns.length; ++j) {
    				if (target && target == token + ',' + j) {
    					return;
    				}

    				var pattern = patterns[j],
    					inside = pattern.inside,
    					lookbehind = !!pattern.lookbehind,
    					greedy = !!pattern.greedy,
    					lookbehindLength = 0,
    					alias = pattern.alias;

    				if (greedy && !pattern.pattern.global) {
    					// Without the global flag, lastIndex won't work
    					var flags = pattern.pattern.toString().match(/[imsuy]*$/)[0];
    					pattern.pattern = RegExp(pattern.pattern.source, flags + 'g');
    				}

    				pattern = pattern.pattern || pattern;

    				// Don’t cache length as it changes during the loop
    				for (var i = index, pos = startPos; i < strarr.length; pos += strarr[i].length, ++i) {

    					var str = strarr[i];

    					if (strarr.length > text.length) {
    						// Something went terribly wrong, ABORT, ABORT!
    						return;
    					}

    					if (str instanceof Token) {
    						continue;
    					}

    					if (greedy && i != strarr.length - 1) {
    						pattern.lastIndex = pos;
    						var match = pattern.exec(text);
    						if (!match) {
    							break;
    						}

    						var from = match.index + (lookbehind && match[1] ? match[1].length : 0),
    						    to = match.index + match[0].length,
    						    k = i,
    						    p = pos;

    						for (var len = strarr.length; k < len && (p < to || (!strarr[k].type && !strarr[k - 1].greedy)); ++k) {
    							p += strarr[k].length;
    							// Move the index i to the element in strarr that is closest to from
    							if (from >= p) {
    								++i;
    								pos = p;
    							}
    						}

    						// If strarr[i] is a Token, then the match starts inside another Token, which is invalid
    						if (strarr[i] instanceof Token) {
    							continue;
    						}

    						// Number of tokens to delete and replace with the new match
    						delNum = k - i;
    						str = text.slice(pos, p);
    						match.index -= pos;
    					} else {
    						pattern.lastIndex = 0;

    						var match = pattern.exec(str),
    							delNum = 1;
    					}

    					if (!match) {
    						if (oneshot) {
    							break;
    						}

    						continue;
    					}

    					if(lookbehind) {
    						lookbehindLength = match[1] ? match[1].length : 0;
    					}

    					var from = match.index + lookbehindLength,
    					    match = match[0].slice(lookbehindLength),
    					    to = from + match.length,
    					    before = str.slice(0, from),
    					    after = str.slice(to);

    					var args = [i, delNum];

    					if (before) {
    						++i;
    						pos += before.length;
    						args.push(before);
    					}

    					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias, match, greedy);

    					args.push(wrapped);

    					if (after) {
    						args.push(after);
    					}

    					Array.prototype.splice.apply(strarr, args);

    					if (delNum != 1)
    						_.matchGrammar(text, strarr, grammar, i, pos, true, token + ',' + j);

    					if (oneshot)
    						break;
    				}
    			}
    		}
    	},

    	tokenize: function(text, grammar) {
    		var strarr = [text];

    		var rest = grammar.rest;

    		if (rest) {
    			for (var token in rest) {
    				grammar[token] = rest[token];
    			}

    			delete grammar.rest;
    		}

    		_.matchGrammar(text, strarr, grammar, 0, 0, false);

    		return strarr;
    	},

    	hooks: {
    		all: {},

    		add: function (name, callback) {
    			var hooks = _.hooks.all;

    			hooks[name] = hooks[name] || [];

    			hooks[name].push(callback);
    		},

    		run: function (name, env) {
    			var callbacks = _.hooks.all[name];

    			if (!callbacks || !callbacks.length) {
    				return;
    			}

    			for (var i=0, callback; callback = callbacks[i++];) {
    				callback(env);
    			}
    		}
    	},

    	Token: Token
    };

    _self.Prism = _;

    function Token(type, content, alias, matchedStr, greedy) {
    	this.type = type;
    	this.content = content;
    	this.alias = alias;
    	// Copy of the full string this token was created from
    	this.length = (matchedStr || '').length|0;
    	this.greedy = !!greedy;
    }

    Token.stringify = function(o, language) {
    	if (typeof o == 'string') {
    		return o;
    	}

    	if (Array.isArray(o)) {
    		return o.map(function(element) {
    			return Token.stringify(element, language);
    		}).join('');
    	}

    	var env = {
    		type: o.type,
    		content: Token.stringify(o.content, language),
    		tag: 'span',
    		classes: ['token', o.type],
    		attributes: {},
    		language: language
    	};

    	if (o.alias) {
    		var aliases = Array.isArray(o.alias) ? o.alias : [o.alias];
    		Array.prototype.push.apply(env.classes, aliases);
    	}

    	_.hooks.run('wrap', env);

    	var attributes = Object.keys(env.attributes).map(function(name) {
    		return name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    	}).join(' ');

    	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + (attributes ? ' ' + attributes : '') + '>' + env.content + '</' + env.tag + '>';
    };

    if (!_self.document) {
    	if (!_self.addEventListener) {
    		// in Node.js
    		return _;
    	}

    	if (!_.disableWorkerMessageHandler) {
    		// In worker
    		_self.addEventListener('message', function (evt) {
    			var message = JSON.parse(evt.data),
    				lang = message.language,
    				code = message.code,
    				immediateClose = message.immediateClose;

    			_self.postMessage(_.highlight(code, _.languages[lang], lang));
    			if (immediateClose) {
    				_self.close();
    			}
    		}, false);
    	}

    	return _;
    }

    //Get current script and highlight
    var script = _.util.currentScript();

    if (script) {
    	_.filename = script.src;

    	if (script.hasAttribute('data-manual')) {
    		_.manual = true;
    	}
    }

    if (!_.manual) {
    	function highlightAutomaticallyCallback() {
    		if (!_.manual) {
    			_.highlightAll();
    		}
    	}

    	// If the document state is "loading", then we'll use DOMContentLoaded.
    	// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
    	// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
    	// might take longer one animation frame to execute which can create a race condition where only some plugins have
    	// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
    	// See https://github.com/PrismJS/prism/issues/2102
    	var readyState = document.readyState;
    	if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
    		document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
    	} else {
    		if (window.requestAnimationFrame) {
    			window.requestAnimationFrame(highlightAutomaticallyCallback);
    		} else {
    			window.setTimeout(highlightAutomaticallyCallback, 16);
    		}
    	}
    }

    return _;

    })(_self);

    if ( module.exports) {
    	module.exports = Prism;
    }

    // hack for components to work correctly in node.js
    if (typeof commonjsGlobal !== 'undefined') {
    	commonjsGlobal.Prism = Prism;
    }


    /* **********************************************
         Begin prism-markup.js
    ********************************************** */

    Prism.languages.markup = {
    	'comment': /<!--[\s\S]*?-->/,
    	'prolog': /<\?[\s\S]+?\?>/,
    	'doctype': {
    		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:(?!<!--)[^"'\]]|"[^"]*"|'[^']*'|<!--[\s\S]*?-->)*\]\s*)?>/i,
    		greedy: true
    	},
    	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
    	'tag': {
    		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
    		greedy: true,
    		inside: {
    			'tag': {
    				pattern: /^<\/?[^\s>\/]+/i,
    				inside: {
    					'punctuation': /^<\/?/,
    					'namespace': /^[^\s>\/:]+:/
    				}
    			},
    			'attr-value': {
    				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
    				inside: {
    					'punctuation': [
    						/^=/,
    						{
    							pattern: /^(\s*)["']|["']$/,
    							lookbehind: true
    						}
    					]
    				}
    			},
    			'punctuation': /\/?>/,
    			'attr-name': {
    				pattern: /[^\s>\/]+/,
    				inside: {
    					'namespace': /^[^\s>\/:]+:/
    				}
    			}

    		}
    	},
    	'entity': /&#?[\da-z]{1,8};/i
    };

    Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    	Prism.languages.markup['entity'];

    // Plugin to make entity title show the real entity, idea by Roman Komarov
    Prism.hooks.add('wrap', function(env) {

    	if (env.type === 'entity') {
    		env.attributes['title'] = env.content.replace(/&amp;/, '&');
    	}
    });

    Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    	/**
    	 * Adds an inlined language to markup.
    	 *
    	 * An example of an inlined language is CSS with `<style>` tags.
    	 *
    	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
    	 * case insensitive.
    	 * @param {string} lang The language key.
    	 * @example
    	 * addInlined('style', 'css');
    	 */
    	value: function addInlined(tagName, lang) {
    		var includedCdataInside = {};
    		includedCdataInside['language-' + lang] = {
    			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
    			lookbehind: true,
    			inside: Prism.languages[lang]
    		};
    		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

    		var inside = {
    			'included-cdata': {
    				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    				inside: includedCdataInside
    			}
    		};
    		inside['language-' + lang] = {
    			pattern: /[\s\S]+/,
    			inside: Prism.languages[lang]
    		};

    		var def = {};
    		def[tagName] = {
    			pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[[\s\S]*?\]\]>\s*|[\s\S])*?(?=<\/__>)/.source.replace(/__/g, tagName), 'i'),
    			lookbehind: true,
    			greedy: true,
    			inside: inside
    		};

    		Prism.languages.insertBefore('markup', 'cdata', def);
    	}
    });

    Prism.languages.xml = Prism.languages.extend('markup', {});
    Prism.languages.html = Prism.languages.markup;
    Prism.languages.mathml = Prism.languages.markup;
    Prism.languages.svg = Prism.languages.markup;


    /* **********************************************
         Begin prism-css.js
    ********************************************** */

    (function (Prism) {

    	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

    	Prism.languages.css = {
    		'comment': /\/\*[\s\S]*?\*\//,
    		'atrule': {
    			pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
    			inside: {
    				'rule': /@[\w-]+/
    				// See rest below
    			}
    		},
    		'url': {
    			pattern: RegExp('url\\((?:' + string.source + '|[^\n\r()]*)\\)', 'i'),
    			inside: {
    				'function': /^url/i,
    				'punctuation': /^\(|\)$/
    			}
    		},
    		'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
    		'string': {
    			pattern: string,
    			greedy: true
    		},
    		'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    		'important': /!important\b/i,
    		'function': /[-a-z0-9]+(?=\()/i,
    		'punctuation': /[(){};:,]/
    	};

    	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

    	var markup = Prism.languages.markup;
    	if (markup) {
    		markup.tag.addInlined('style', 'css');

    		Prism.languages.insertBefore('inside', 'attr-value', {
    			'style-attr': {
    				pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
    				inside: {
    					'attr-name': {
    						pattern: /^\s*style/i,
    						inside: markup.tag.inside
    					},
    					'punctuation': /^\s*=\s*['"]|['"]\s*$/,
    					'attr-value': {
    						pattern: /.+/i,
    						inside: Prism.languages.css
    					}
    				},
    				alias: 'language-css'
    			}
    		}, markup.tag);
    	}

    }(Prism));


    /* **********************************************
         Begin prism-clike.js
    ********************************************** */

    Prism.languages.clike = {
    	'comment': [
    		{
    			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
    			lookbehind: true
    		},
    		{
    			pattern: /(^|[^\\:])\/\/.*/,
    			lookbehind: true,
    			greedy: true
    		}
    	],
    	'string': {
    		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    		greedy: true
    	},
    	'class-name': {
    		pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
    		lookbehind: true,
    		inside: {
    			'punctuation': /[.\\]/
    		}
    	},
    	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    	'boolean': /\b(?:true|false)\b/,
    	'function': /\w+(?=\()/,
    	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
    	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    	'punctuation': /[{}[\];(),.:]/
    };


    /* **********************************************
         Begin prism-javascript.js
    ********************************************** */

    Prism.languages.javascript = Prism.languages.extend('clike', {
    	'class-name': [
    		Prism.languages.clike['class-name'],
    		{
    			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
    			lookbehind: true
    		}
    	],
    	'keyword': [
    		{
    			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
    			lookbehind: true
    		},
    		{
    			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    			lookbehind: true
    		},
    	],
    	'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
    	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    	'function': /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    	'operator': /--|\+\+|\*\*=?|=>|&&|\|\||[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?[.?]?|[~:]/
    });

    Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

    Prism.languages.insertBefore('javascript', 'keyword', {
    	'regex': {
    		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*[\s\S]*?\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
    		lookbehind: true,
    		greedy: true
    	},
    	// This must be declared before keyword because we use "function" inside the look-forward
    	'function-variable': {
    		pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
    		alias: 'function'
    	},
    	'parameter': [
    		{
    			pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		},
    		{
    			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
    			lookbehind: true,
    			inside: Prism.languages.javascript
    		}
    	],
    	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });

    Prism.languages.insertBefore('javascript', 'string', {
    	'template-string': {
    		pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
    		greedy: true,
    		inside: {
    			'template-punctuation': {
    				pattern: /^`|`$/,
    				alias: 'string'
    			},
    			'interpolation': {
    				pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
    				lookbehind: true,
    				inside: {
    					'interpolation-punctuation': {
    						pattern: /^\${|}$/,
    						alias: 'punctuation'
    					},
    					rest: Prism.languages.javascript
    				}
    			},
    			'string': /[\s\S]+/
    		}
    	}
    });

    if (Prism.languages.markup) {
    	Prism.languages.markup.tag.addInlined('script', 'javascript');
    }

    Prism.languages.js = Prism.languages.javascript;


    /* **********************************************
         Begin prism-file-highlight.js
    ********************************************** */

    (function () {
    	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
    		return;
    	}

    	/**
    	 * @param {Element} [container=document]
    	 */
    	self.Prism.fileHighlight = function(container) {
    		container = container || document;

    		var Extensions = {
    			'js': 'javascript',
    			'py': 'python',
    			'rb': 'ruby',
    			'ps1': 'powershell',
    			'psm1': 'powershell',
    			'sh': 'bash',
    			'bat': 'batch',
    			'h': 'c',
    			'tex': 'latex'
    		};

    		Array.prototype.slice.call(container.querySelectorAll('pre[data-src]')).forEach(function (pre) {
    			// ignore if already loaded
    			if (pre.hasAttribute('data-src-loaded')) {
    				return;
    			}

    			// load current
    			var src = pre.getAttribute('data-src');

    			var language, parent = pre;
    			var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    			while (parent && !lang.test(parent.className)) {
    				parent = parent.parentNode;
    			}

    			if (parent) {
    				language = (pre.className.match(lang) || [, ''])[1];
    			}

    			if (!language) {
    				var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
    				language = Extensions[extension] || extension;
    			}

    			var code = document.createElement('code');
    			code.className = 'language-' + language;

    			pre.textContent = '';

    			code.textContent = 'Loading…';

    			pre.appendChild(code);

    			var xhr = new XMLHttpRequest();

    			xhr.open('GET', src, true);

    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4) {

    					if (xhr.status < 400 && xhr.responseText) {
    						code.textContent = xhr.responseText;

    						Prism.highlightElement(code);
    						// mark as loaded
    						pre.setAttribute('data-src-loaded', '');
    					}
    					else if (xhr.status >= 400) {
    						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
    					}
    					else {
    						code.textContent = '✖ Error: File does not exist or is empty';
    					}
    				}
    			};

    			xhr.send(null);
    		});
    	};

    	document.addEventListener('DOMContentLoaded', function () {
    		// execute inside handler, for dropping Event as argument
    		self.Prism.fileHighlight();
    	});

    })();
    });

    /* src/components/Simple.svelte generated by Svelte v3.18.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/components/Simple.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (164:0) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("this is a message from the Simple component");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(164:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (91:0) {#if activeElement }
    function create_if_block(ctx) {
    	let h1;
    	let raw0_value = /*Locale*/ ctx[0].t(/*activeElement*/ ctx[1].displayName) + "";
    	let t0;
    	let p;
    	let raw1_value = /*Locale*/ ctx[0].t(/*mainDesc*/ ctx[2]) + "";
    	let t1;
    	let t2;
    	let if_block1_anchor;
    	let if_block0 = /*sections*/ ctx[4] && /*sections*/ ctx[4].length > 0 && create_if_block_2(ctx);
    	let if_block1 = /*variables*/ ctx[3].length > 0 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = space();
    			p = element("p");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h1, file, 91, 1, 1768);
    			add_location(p, file, 92, 1, 1825);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			h1.innerHTML = raw0_value;
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			p.innerHTML = raw1_value;
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Locale, activeElement*/ 3 && raw0_value !== (raw0_value = /*Locale*/ ctx[0].t(/*activeElement*/ ctx[1].displayName) + "")) h1.innerHTML = raw0_value;			if (dirty & /*Locale, mainDesc*/ 5 && raw1_value !== (raw1_value = /*Locale*/ ctx[0].t(/*mainDesc*/ ctx[2]) + "")) p.innerHTML = raw1_value;
    			if (/*sections*/ ctx[4] && /*sections*/ ctx[4].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*variables*/ ctx[3].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(91:0) {#if activeElement }",
    		ctx
    	});

    	return block;
    }

    // (97:1) {#if sections && sections.length > 0 }
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*sections*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*generateArr, sections, beautify, copyToClipboard, Locale*/ 17) {
    				each_value_1 = /*sections*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(97:1) {#if sections && sections.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (105:4) {#if section.classes != '' }
    function create_if_block_3(ctx) {
    	let h5;
    	let t0_value = /*Locale*/ ctx[0].t("example") + "";
    	let t0;
    	let t1;
    	let div;
    	let each_value_2 = generateArr(/*section*/ ctx[12].classes, /*section*/ ctx[12].example);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h5, file, 105, 5, 2206);
    			attr_dev(div, "class", "demoContainer svelte-180di5e");
    			add_location(div, file, 106, 5, 2246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Locale*/ 1 && t0_value !== (t0_value = /*Locale*/ ctx[0].t("example") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*beautify, generateArr, sections, copyToClipboard*/ 16) {
    				each_value_2 = generateArr(/*section*/ ctx[12].classes, /*section*/ ctx[12].example);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(105:4) {#if section.classes != '' }",
    		ctx
    	});

    	return block;
    }

    // (108:6) {#each generateArr(section.classes, section.example) as elm  }
    function create_each_block_2(ctx) {
    	let div4;
    	let div0;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let div2;
    	let div1;
    	let raw0_value = /*elm*/ ctx[15].el + "";
    	let div1_class_value;
    	let t4;
    	let div3;
    	let pre;
    	let code;
    	let raw1_value = beautify(/*elm*/ ctx[15].el) + "";
    	let t5;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*elm*/ ctx[15], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[8](/*elm*/ ctx[15], ...args);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Copy class";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Copy markup";
    			t3 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t4 = space();
    			div3 = element("div");
    			pre = element("pre");
    			code = element("code");
    			t5 = space();
    			attr_dev(span0, "class", "op opCopy svelte-180di5e");
    			add_location(span0, file, 110, 9, 2427);
    			attr_dev(span1, "class", "op opCopy svelte-180di5e");
    			add_location(span1, file, 111, 9, 2526);
    			attr_dev(div0, "class", "rowOperations svelte-180di5e");
    			add_location(div0, file, 109, 8, 2390);

    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*section*/ ctx[12].wrapperClass
    			? /*section*/ ctx[12].wrapperClass
    			: "") + " svelte-180di5e"));

    			add_location(div1, file, 114, 9, 2679);
    			attr_dev(div2, "class", "demoContainer-show svelte-180di5e");
    			add_location(div2, file, 113, 8, 2637);
    			attr_dev(code, "class", "language-html");
    			add_location(code, file, 119, 10, 2853);
    			add_location(pre, file, 118, 9, 2837);
    			attr_dev(div3, "class", "demoContainer-code svelte-180di5e");
    			add_location(div3, file, 117, 8, 2795);
    			attr_dev(div4, "class", "demoContainer-row svelte-180di5e");
    			add_location(div4, file, 108, 7, 2350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			div1.innerHTML = raw0_value;
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, pre);
    			append_dev(pre, code);
    			code.innerHTML = raw1_value;
    			append_dev(div4, t5);

    			dispose = [
    				listen_dev(span0, "click", click_handler, false, false, false),
    				listen_dev(span1, "click", click_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*sections*/ 16 && raw0_value !== (raw0_value = /*elm*/ ctx[15].el + "")) div1.innerHTML = raw0_value;
    			if (dirty & /*sections*/ 16 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*section*/ ctx[12].wrapperClass
    			? /*section*/ ctx[12].wrapperClass
    			: "") + " svelte-180di5e"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*sections*/ 16 && raw1_value !== (raw1_value = beautify(/*elm*/ ctx[15].el) + "")) code.innerHTML = raw1_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(108:6) {#each generateArr(section.classes, section.example) as elm  }",
    		ctx
    	});

    	return block;
    }

    // (99:2) {#each sections as section }
    function create_each_block_1(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t0_value = /*Locale*/ ctx[0].t(/*section*/ ctx[12].sectionName) + "";
    	let t0;
    	let t1;
    	let p;
    	let raw_value = /*Locale*/ ctx[0].t(/*section*/ ctx[12].description) + "";
    	let t2;
    	let t3;
    	let if_block = /*section*/ ctx[12].classes != "" && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(h2, "class", "sectionBlock-title svelte-180di5e");
    			add_location(h2, file, 101, 5, 2031);
    			add_location(p, file, 102, 5, 2109);
    			add_location(div0, file, 100, 4, 2019);
    			attr_dev(div1, "class", "sectionBlock svelte-180di5e");
    			add_location(div1, file, 99, 3, 1988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			p.innerHTML = raw_value;
    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Locale, sections*/ 17 && t0_value !== (t0_value = /*Locale*/ ctx[0].t(/*section*/ ctx[12].sectionName) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*Locale, sections*/ 17 && raw_value !== (raw_value = /*Locale*/ ctx[0].t(/*section*/ ctx[12].description) + "")) p.innerHTML = raw_value;
    			if (/*section*/ ctx[12].classes != "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(div1, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(99:2) {#each sections as section }",
    		ctx
    	});

    	return block;
    }

    // (137:1) {#if variables.length > 0 }
    function create_if_block_1(ctx) {
    	let div1;
    	let h3;
    	let t0_value = /*Locale*/ ctx[0].t("variables") + "";
    	let t0;
    	let t1;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t2_value = /*Locale*/ ctx[0].t("name") + "";
    	let t2;
    	let t3;
    	let th1;
    	let t4_value = /*Locale*/ ctx[0].t("default") + "";
    	let t4;
    	let t5;
    	let th2;
    	let t6_value = /*Locale*/ ctx[0].t("description") + "";
    	let t6;
    	let t7;
    	let tbody;
    	let each_value = /*variables*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t2 = text(t2_value);
    			t3 = space();
    			th1 = element("th");
    			t4 = text(t4_value);
    			t5 = space();
    			th2 = element("th");
    			t6 = text(t6_value);
    			t7 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file, 138, 3, 3196);
    			attr_dev(th0, "class", "svelte-180di5e");
    			add_location(th0, file, 143, 6, 3351);
    			attr_dev(th1, "class", "svelte-180di5e");
    			add_location(th1, file, 144, 6, 3387);
    			attr_dev(th2, "class", "svelte-180di5e");
    			add_location(th2, file, 145, 6, 3426);
    			attr_dev(tr, "class", "bg_neutral_500 text_white svelte-180di5e");
    			add_location(tr, file, 142, 5, 3306);
    			add_location(thead, file, 141, 5, 3293);
    			attr_dev(tbody, "class", "bg_white");
    			add_location(tbody, file, 148, 5, 3493);
    			attr_dev(table, "class", "svelte-180di5e");
    			add_location(table, file, 140, 4, 3279);
    			attr_dev(div0, "class", "bg_neutral_050 text_light");
    			add_location(div0, file, 139, 3, 3234);
    			attr_dev(div1, "class", "p_ver_05");
    			add_location(div1, file, 137, 2, 3170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(h3, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(th0, t2);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(th1, t4);
    			append_dev(tr, t5);
    			append_dev(tr, th2);
    			append_dev(th2, t6);
    			append_dev(table, t7);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Locale*/ 1 && t0_value !== (t0_value = /*Locale*/ ctx[0].t("variables") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*Locale*/ 1 && t2_value !== (t2_value = /*Locale*/ ctx[0].t("name") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*Locale*/ 1 && t4_value !== (t4_value = /*Locale*/ ctx[0].t("default") + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*Locale*/ 1 && t6_value !== (t6_value = /*Locale*/ ctx[0].t("description") + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*Locale, variables*/ 9) {
    				each_value = /*variables*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(137:1) {#if variables.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (150:6) {#each variables as item }
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item*/ ctx[9].variable + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*item*/ ctx[9].default + "";
    	let t2;
    	let t3;
    	let td2;
    	let raw_value = /*Locale*/ ctx[0].t(/*item*/ ctx[9].description) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = space();
    			attr_dev(td0, "class", "text_primary_800 svelte-180di5e");
    			add_location(td0, file, 151, 8, 3571);
    			attr_dev(td1, "class", "svelte-180di5e");
    			add_location(td1, file, 152, 8, 3631);
    			attr_dev(td2, "class", "svelte-180di5e");
    			add_location(td2, file, 153, 8, 3664);
    			attr_dev(tr, "class", "svelte-180di5e");
    			add_location(tr, file, 150, 7, 3558);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			td2.innerHTML = raw_value;
    			append_dev(tr, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables*/ 8 && t0_value !== (t0_value = /*item*/ ctx[9].variable + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*variables*/ 8 && t2_value !== (t2_value = /*item*/ ctx[9].default + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*Locale, variables*/ 9 && raw_value !== (raw_value = /*Locale*/ ctx[0].t(/*item*/ ctx[9].description) + "")) td2.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(150:6) {#each variables as item }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*activeElement*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			add_location(main, file, 89, 0, 1739);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function beautify(code, p1 = "html", p2 = "javascript") {
    	switch (p1) {
    		case "javascript":
    			p1 = prism.languages.javascript;
    			break;
    		default:
    			p1 = prism.languages.html;
    			break;
    	}

    	return prism.highlight(code, p1, p2);
    }

    function generateArr(classes, example) {
    	let res = [];

    	classes.forEach(cls => {
    		let s = example.replace(/%%cls%%/, cls).replace(/%%cls%%/, cls);
    		res.push({ class: cls, el: s });
    	});

    	return res;
    }

    function copyToClipboard(str) {
    	const el = document.createElement("textarea");
    	el.value = str;
    	el.setAttribute("readonly", "");
    	el.style.position = "absolute";
    	el.style.left = "-9999px";
    	document.body.appendChild(el);
    	el.select();
    	document.execCommand("copy");
    	document.body.removeChild(el);
    	alert("copiato");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { Locale } = $$props;
    	let { activeElement = {} } = $$props;
    	let { doc = {} } = $$props;

    	// 
    	let mainDesc = "";

    	let variables = [];
    	let sections = [];

    	function init(element, doc) {
    		console.log(element);
    		console.log(doc);

    		if (!(Object.keys(doc).length === 0 && doc.constructor === Object)) {
    			$$invalidate(2, mainDesc = doc.mainDescription);
    			$$invalidate(3, variables = doc.cssVariables);
    			$$invalidate(4, sections = doc.sections);
    		} else {
    			$$invalidate(2, mainDesc = "");
    			$$invalidate(3, variables = []);
    			$$invalidate(4, sections = []);
    		}
    	} // da implementare chiamata a server

    	
    	const writable_props = ["Locale", "activeElement", "doc"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Simple> was created with unknown prop '${key}'`);
    	});

    	const click_handler = elm => copyToClipboard(elm.class);
    	const click_handler_1 = elm => copyToClipboard(elm.el);

    	$$self.$set = $$props => {
    		if ("Locale" in $$props) $$invalidate(0, Locale = $$props.Locale);
    		if ("activeElement" in $$props) $$invalidate(1, activeElement = $$props.activeElement);
    		if ("doc" in $$props) $$invalidate(5, doc = $$props.doc);
    	};

    	$$self.$capture_state = () => {
    		return {
    			Locale,
    			activeElement,
    			doc,
    			mainDesc,
    			variables,
    			sections
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("Locale" in $$props) $$invalidate(0, Locale = $$props.Locale);
    		if ("activeElement" in $$props) $$invalidate(1, activeElement = $$props.activeElement);
    		if ("doc" in $$props) $$invalidate(5, doc = $$props.doc);
    		if ("mainDesc" in $$props) $$invalidate(2, mainDesc = $$props.mainDesc);
    		if ("variables" in $$props) $$invalidate(3, variables = $$props.variables);
    		if ("sections" in $$props) $$invalidate(4, sections = $$props.sections);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*activeElement, doc*/ 34) {
    			 init(activeElement, doc);
    		}
    	};

    	return [
    		Locale,
    		activeElement,
    		mainDesc,
    		variables,
    		sections,
    		doc,
    		init,
    		click_handler,
    		click_handler_1
    	];
    }

    class Simple extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { Locale: 0, activeElement: 1, doc: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Simple",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Locale*/ ctx[0] === undefined && !("Locale" in props)) {
    			console_1.warn("<Simple> was created without expected prop 'Locale'");
    		}
    	}

    	get Locale() {
    		throw new Error("<Simple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Locale(value) {
    		throw new Error("<Simple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeElement() {
    		throw new Error("<Simple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeElement(value) {
    		throw new Error("<Simple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get doc() {
    		throw new Error("<Simple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set doc(value) {
    		throw new Error("<Simple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var options = {
    	copyAfterParse: {
    		enabled: false,
    		copyDistTo: ""
    	}
    };
    var categories = [
    	{
    		componentType: "simple",
    		name: "Atomic Css",
    		items: [
    			{
    				displayName: "Breackpoints",
    				file: "_breackpoints",
    				relativePath: "../atomicCss/"
    			},
    			{
    				displayName: "Palette",
    				file: "_palette5",
    				relativePath: "../atomicCss/"
    			},
    			{
    				displayName: "Text",
    				file: "_text",
    				relativePath: "../atomicCss/"
    			},
    			{
    				displayName: "Spacing",
    				file: "_spacing",
    				relativePath: "../atomicCss/"
    			},
    			{
    				displayName: "Display helper",
    				file: "_viewport_helper",
    				relativePath: "../atomicCss/"
    			},
    			{
    				displayName: "Flex helper",
    				file: "_flex_helper",
    				relativePath: "../atomicCss/"
    			}
    		]
    	},
    	{
    		componentType: "simple",
    		name: "Layout",
    		items: [
    			{
    				displayName: "Simple grid",
    				file: "simple_grid",
    				relativePath: "../atomicCss/scss/"
    			}
    		]
    	}
    ];
    var config = {
    	options: options,
    	categories: categories
    };

    var example = "Esempio";
    var variables = "Variabili";
    var breackpoints_main_description = "Per i breack points vengono definite le seguenti variabili. Questo vengono usate dai diversi fogli di stile per la definizione delle regole di media query.";
    var variable_width_description = "Questa variabile viene usata per calcolare le larghezze delle colonne per il layout <i> simple_grid </i>";
    var variable_gutter_description = "Questa variabile viene usata per calcolare il gap tra le colonne per il layout <i> simple_grid </i>. Per il design sistema attuale, di default non è presente uno gap tra le colonne, gli elementi che vengono messi all'interno dovranno gestirsi la spaziatura tramite il margin o il padding.";
    var bkp_sm_description = "Si intende che sotto i 30em <i>(480px)</i> si è su un schermo xm <small>(extra small)</small>, da 30em in su e fino al <i>$breakpoint-md</i> lo schermo ha dimensione sm <small>{small}</small>";
    var bkp_md_description = "Si intende che sotto i 48em <i>(768px)</i> si è su un schermo sm <small>(small)</small>, da 48em in su e fino al <i>$breakpoint-lg</i> lo schermo ha dimensione md <small>{medeum}</small>";
    var bkp_lg_description = "Si intende che sotto i 64em <i>(1024px)</i> si è su un schermo md <small>(medeum)</small>, da 64em in su e fino al <i>$breakpoint-xl</i> lo schermo ha dimensione lg <small>{large}</small>";
    var bkp_xl_description = "Quando sono su schermi che hanno risoluzione maggiore di <i>(1360px)</i>";
    var section_spacing_description = "In questa pagina sono elencati i modificatori standard per le spaziature che si possono applicare";
    var section_spacing_padding = "Modificatori padding";
    var section_spacing_padding_description = "E' possibile applicare dei padding in maniera abbastanza granulare, partendo dal minimo di <i><b>0</b></i> fino ad un massimo di <i><b>2rem</b></i>.";
    var section_spacing_margin = "Modificatori margin";
    var section_spacing_margin_description = "E' possibile applicare dei margini in maniera abbastanza granulare, partendo dal minimo di <i><b>0</b></i> fino ad un massimo di <i><b>2rem</b></i>.";
    var s = "";
    var localization = {
    	example: example,
    	variables: variables,
    	breackpoints_main_description: breackpoints_main_description,
    	variable_width_description: variable_width_description,
    	variable_gutter_description: variable_gutter_description,
    	bkp_sm_description: bkp_sm_description,
    	bkp_md_description: bkp_md_description,
    	bkp_lg_description: bkp_lg_description,
    	bkp_xl_description: bkp_xl_description,
    	section_spacing_description: section_spacing_description,
    	section_spacing_padding: section_spacing_padding,
    	section_spacing_padding_description: section_spacing_padding_description,
    	section_spacing_margin: section_spacing_margin,
    	section_spacing_margin_description: section_spacing_margin_description,
    	s: s
    };

    const Locale = (function() {
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

    var mainDescription = "section_description";
    var sections = [
    	{
    		sectionName: "section_text_util",
    		description: "section_text_util_description",
    		classes: [
    			"text_left",
    			"text_center",
    			"text_right",
    			"text_bold",
    			"text_bolder",
    			"text_normal",
    			"text_thin"
    		],
    		example: " <div class=\"%%cls%%\"> %%cls%% </div>"
    	},
    	{
    		sectionName: "section_text_size",
    		description: "section_text_size_description",
    		classes: [
    			"text_s_12",
    			"text_s_14",
    			"text_s_16",
    			"text_s_18",
    			"text_s_20",
    			"text_s_24",
    			"text_s_32",
    			"text_s_48"
    		],
    		example: " <div class=\"%%cls%%\"> %%cls%% </div>"
    	},
    	{
    		sectionName: "section_text_relative_size",
    		description: "section_text_relative_size_description",
    		classes: [
    			"text_rs_half",
    			"text_rs_smaller",
    			"text_rs_normal",
    			"text_rs_bigger",
    			"text_rs_twice"
    		],
    		example: " <div class=\"%%cls%%\"> %%cls%% </div>"
    	}
    ];
    var cssVariables = [
    ];
    var textDoc = {
    	mainDescription: mainDescription,
    	sections: sections,
    	cssVariables: cssVariables
    };

    var mainDescription$1 = "section_description";
    var sections$1 = [
    	{
    		sectionName: "section_text_colors",
    		description: "section_text_colors_description",
    		classes: [
    			"text_base",
    			"text_dark",
    			"text_light",
    			"text_grey",
    			"text_light_grey",
    			"text_white bg_dark",
    			"text_black",
    			"text_neutral_050 bg_neutral_400",
    			"text_neutral_100",
    			"text_neutral_200",
    			"text_neutral_300",
    			"text_neutral_400",
    			"text_neutral_500",
    			"text_neutral_600",
    			"text_neutral",
    			"text_neutral_800",
    			"text_neutral_900",
    			"text_primary_050 bg_primary_400",
    			"text_primary_100",
    			"text_primary_200",
    			"text_primary_300",
    			"text_primary_400",
    			"text_primary_500",
    			"text_primary_600",
    			"text_primary",
    			"text_primary_800",
    			"text_primary_900",
    			"text_info_050 bg_info_400",
    			"text_info_100",
    			"text_info_200",
    			"text_info_300",
    			"text_info_400",
    			"text_info_500",
    			"text_info_600",
    			"text_info",
    			"text_info_800",
    			"text_info_900",
    			"text_danger_050 bg_danger_400",
    			"text_danger_100",
    			"text_danger_200",
    			"text_danger_300",
    			"text_danger_400",
    			"text_danger_500",
    			"text_danger_600",
    			"text_danger",
    			"text_danger_800",
    			"text_danger_900",
    			"text_success_050 bg_success_400",
    			"text_success_100",
    			"text_success_200",
    			"text_success_300",
    			"text_success_400",
    			"text_success_500",
    			"text_success_600",
    			"text_success",
    			"text_success_800",
    			"text_success_900",
    			"text_warning_050 bg_warning_400",
    			"text_warning_100",
    			"text_warning_200",
    			"text_warning_300",
    			"text_warning_400",
    			"text_warning_500",
    			"text_warning_600",
    			"text_warning",
    			"text_warning_800",
    			"text_warning_900",
    			"text_teal_050 bg_teal_400",
    			"text_teal_100",
    			"text_teal_200",
    			"text_teal_300",
    			"text_teal_400",
    			"text_teal_500",
    			"text_teal_600",
    			"text_teal",
    			"text_teal_800",
    			"text_teal_900"
    		],
    		example: " <div class=\"%%cls%%\"> %%cls%% </div>"
    	},
    	{
    		sectionName: "section_background_colors",
    		description: "section_background_description",
    		classes: [
    			"bg_base text_neutral_050",
    			"bg_dark text_neutral_050",
    			"bg_light text_neutral_050",
    			"bg_grey text_neutral_050",
    			"bg_light_grey",
    			"bg_white",
    			"bg_black text_neutral_050",
    			"bg_neutral_025",
    			"bg_neutral_050",
    			"bg_neutral_100",
    			"bg_neutral_200",
    			"bg_neutral_300",
    			"bg_neutral_400",
    			"bg_neutral_500 text_neutral_050",
    			"bg_neutral_600 text_neutral_050",
    			"bg_neutral_700 text_neutral_050",
    			"bg_neutral_800 text_neutral_050",
    			"bg_neutral_900 text_neutral_050",
    			"bg_primary_025",
    			"bg_primary_050",
    			"bg_primary_100",
    			"bg_primary_200",
    			"bg_primary_300",
    			"bg_primary_400",
    			"bg_primary_500 text_neutral_050",
    			"bg_primary_600 text_neutral_050",
    			"bg_primary text_neutral_050",
    			"bg_primary_800 text_neutral_050",
    			"bg_primary_900 text_neutral_050",
    			"bg_info_025",
    			"bg_info_050",
    			"bg_info_100",
    			"bg_info_200",
    			"bg_info_300",
    			"bg_info_400",
    			"bg_info_500 text_neutral_050",
    			"bg_info_600 text_neutral_050",
    			"bg_info text_neutral_050",
    			"bg_info_800 text_neutral_050",
    			"bg_info_900 text_neutral_050",
    			"bg_danger_025",
    			"bg_danger_050",
    			"bg_danger_100",
    			"bg_danger_200",
    			"bg_danger_300",
    			"bg_danger_400",
    			"bg_danger_500 text_neutral_050",
    			"bg_danger_600 text_neutral_050",
    			"bg_danger text_neutral_050",
    			"bg_danger_800 text_neutral_050",
    			"bg_danger_900 text_neutral_050",
    			"bg_success_025",
    			"bg_success_050",
    			"bg_success_100",
    			"bg_success_200",
    			"bg_success_300",
    			"bg_success_400",
    			"bg_success_500 text_neutral_050",
    			"bg_success_600 text_neutral_050",
    			"bg_success text_neutral_050",
    			"bg_success_800 text_neutral_050",
    			"bg_success_900 text_neutral_050",
    			"bg_warning_025",
    			"bg_warning_050",
    			"bg_warning_100",
    			"bg_warning_200",
    			"bg_warning_300",
    			"bg_warning_400",
    			"bg_warning_500 text_neutral_050",
    			"bg_warning_600 text_neutral_050",
    			"bg_warning text_neutral_050",
    			"bg_warning_800 text_neutral_050",
    			"bg_warning_900 text_neutral_050",
    			"bg_teal_025",
    			"bg_teal_050",
    			"bg_teal_100",
    			"bg_teal_200",
    			"bg_teal_300",
    			"bg_teal_400",
    			"bg_teal_500 text_neutral_050",
    			"bg_teal_600 text_neutral_050",
    			"bg_teal text_neutral_050",
    			"bg_teal_800 text_neutral_050",
    			"bg_teal_900 text_neutral_050"
    		],
    		example: " <div class=\"%%cls%%\"> %%cls%% </div>"
    	}
    ];
    var cssVariables$1 = [
    ];
    var paletteDoc = {
    	mainDescription: mainDescription$1,
    	sections: sections$1,
    	cssVariables: cssVariables$1
    };

    var mainDescription$2 = "section_spacing_description";
    var sections$2 = [
    	{
    		sectionName: "section_spacing_padding",
    		description: "section_spacing_padding_description",
    		classes: [
    			"no_padding",
    			"no_hpadding",
    			"no_vpadding",
    			"p_vert_0",
    			"p_top_0",
    			"p_bot_0",
    			"p_hor_0",
    			"p_left_0",
    			"p_right_0",
    			"p_vert_010",
    			"p_top_010",
    			"p_bot_010",
    			"p_hor_010",
    			"p_left_010",
    			"p_right_010",
    			"p_vert_025",
    			"p_top_025",
    			"p_bot_025",
    			"p_hor_025",
    			"p_left_025",
    			"p_right_025",
    			"p_vert_05",
    			"p_top_05",
    			"p_bot_05",
    			"p_hor_05",
    			"p_left_05",
    			"p_right_05",
    			"p_vert_1",
    			"p_top_1",
    			"p_bot_1",
    			"p_hor_1",
    			"p_left_1",
    			"p_right_1",
    			"p_vert_2",
    			"p_top_2",
    			"p_bot_2",
    			"p_hor_2",
    			"p_left_2",
    			"p_right_2"
    		],
    		example: "<div class=\"%%cls%%\"> <div class=\"bg_neutral_050\"> %%cls%% </div></div>",
    		wrapperClass: "box-borders bg_primary_100 m_bot_05 text_black"
    	},
    	{
    		sectionName: "section_spacing_margin",
    		description: "section_spacing_margin_description",
    		classes: [
    			"no_margin",
    			"no_vmargin",
    			"no_hmargin",
    			"m_vert_0",
    			"m_top_0",
    			"m_bot_0",
    			"m_hor_0",
    			"m_left_0",
    			"m_right_0",
    			"m_vert_010",
    			"m_top_010",
    			"m_bot_010",
    			"m_hor_010",
    			"m_left_010",
    			"m_right_010",
    			"m_vert_025",
    			"m_top_025",
    			"m_bot_025",
    			"m_hor_025",
    			"m_left_025",
    			"m_right_025",
    			"m_vert_05",
    			"m_top_05",
    			"m_bot_05",
    			"m_hor_05",
    			"m_left_05",
    			"m_right_05",
    			"m_vert_1",
    			"m_top_1",
    			"m_bot_1",
    			"m_hor_1",
    			"m_left_1",
    			"m_right_1",
    			"m_vert_2",
    			"m_top_2",
    			"m_bot_2",
    			"m_hor_2",
    			"m_left_2",
    			"m_right_2"
    		],
    		example: " <div class=\"%%cls%% bg_neutral_050\"> %%cls%% </div>",
    		wrapperClass: "box-borders bg_warning_100 no_padding m_bot_025"
    	}
    ];
    var cssVariables$2 = [
    ];
    var spacingDoc = {
    	mainDescription: mainDescription$2,
    	sections: sections$2,
    	cssVariables: cssVariables$2
    };

    var mainDescription$3 = "breackpoints_main_description";
    var cssVariables$3 = [
    	{
    		variable: "$width",
    		"default": "100%",
    		description: "variable_width_description"
    	},
    	{
    		variable: "$gutter",
    		"default": "0",
    		description: "variable_gutter_description"
    	},
    	{
    		variable: "$breakpoint-sm",
    		"default": "30em",
    		description: "bkp_sm_description"
    	},
    	{
    		variable: "$breakpoint-md",
    		"default": "48em",
    		description: "bkp_md_description"
    	},
    	{
    		variable: "$breakpoint-lg",
    		"default": "64em",
    		description: "bkp_lg_description"
    	},
    	{
    		variable: "$breakpoint-xl",
    		"default": "85em",
    		description: "bkp_xl_description"
    	}
    ];
    var breackpointsDoc = {
    	mainDescription: mainDescription$3,
    	cssVariables: cssVariables$3
    };

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/App.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (76:6) {#each catList.items as item }
    function create_each_block_1$1(ctx) {
    	let li;
    	let t_value = /*item*/ ctx[10].displayName + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*item*/ ctx[10], /*catList*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-1xcpyyh");
    			toggle_class(li, "active", /*activeElem*/ ctx[1].file == /*item*/ ctx[10].file);
    			add_location(li, file$1, 76, 7, 1570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*activeElem, categories*/ 10) {
    				toggle_class(li, "active", /*activeElem*/ ctx[1].file == /*item*/ ctx[10].file);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(76:6) {#each catList.items as item }",
    		ctx
    	});

    	return block;
    }

    // (72:3) {#each categories as catList }
    function create_each_block$1(ctx) {
    	let li;
    	let t0_value = /*catList*/ ctx[7].name + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*catList*/ ctx[7].items;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(ul, "class", "hoverable svelte-1xcpyyh");
    			add_location(ul, file$1, 74, 5, 1503);
    			attr_dev(li, "class", "heading-li svelte-1xcpyyh");
    			add_location(li, file$1, 72, 4, 1452);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activeElem, categories, setActiveElem*/ 26) {
    				each_value_1 = /*catList*/ ctx[7].items;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(72:3) {#each categories as catList }",
    		ctx
    	});

    	return block;
    }

    // (88:3) {#if componentType == 'simple' }
    function create_if_block$1(ctx) {
    	let current;

    	const simple = new Simple({
    			props: {
    				activeElement: /*activeElem*/ ctx[1],
    				doc: /*doc*/ ctx[0],
    				lang: "it",
    				Locale
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(simple.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(simple, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const simple_changes = {};
    			if (dirty & /*activeElem*/ 2) simple_changes.activeElement = /*activeElem*/ ctx[1];
    			if (dirty & /*doc*/ 1) simple_changes.doc = /*doc*/ ctx[0];
    			simple.$set(simple_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(simple.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(simple.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(simple, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(88:3) {#if componentType == 'simple' }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main1;
    	let main0;
    	let div2;
    	let div0;
    	let ul;
    	let t;
    	let div1;
    	let current;
    	let each_value = /*categories*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = /*componentType*/ ctx[2] == "simple" && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main1 = element("main");
    			main0 = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(ul, "class", "svelte-1xcpyyh");
    			add_location(ul, file$1, 70, 3, 1408);
    			attr_dev(div0, "class", "side-menu svelte-1xcpyyh");
    			add_location(div0, file$1, 69, 2, 1381);
    			attr_dev(div1, "class", "main-content svelte-1xcpyyh");
    			add_location(div1, file$1, 85, 2, 1890);
    			attr_dev(div2, "class", "container svelte-1xcpyyh");
    			add_location(div2, file$1, 68, 1, 1355);
    			add_location(main0, file$1, 66, 0, 1345);
    			add_location(main1, file$1, 65, 0, 1338);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main1, anchor);
    			append_dev(main1, main0);
    			append_dev(main0, div2);
    			append_dev(div2, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*categories, activeElem, setActiveElem*/ 26) {
    				each_value = /*categories*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*componentType*/ ctx[2] == "simple") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main1);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let doc = {};
    	let categories = config.categories;

    	function selectFirstEl(cats) {
    		if (cats.length > 0) {
    			if (cats[0].items.length > 0) {
    				let el = cats[0]["items"][3];
    				let cmpt = cats[0].componentType;
    				setActiveElem(el, cmpt);
    			}
    		}
    	}

    	// console.log(json);
    	// /config/default.json
    	let activeElem = null;

    	let componentType = null;

    	function setActiveElem(el, cmpt) {
    		$$invalidate(1, activeElem = el);
    		$$invalidate(2, componentType = cmpt);

    		switch (el.file) {
    			case "_text":
    				$$invalidate(0, doc = textDoc);
    				break;
    			case "_palette5":
    				$$invalidate(0, doc = paletteDoc);
    				break;
    			case "_spacing":
    				$$invalidate(0, doc = spacingDoc);
    				break;
    			case "_breackpoints":
    				$$invalidate(0, doc = breackpointsDoc);
    				break;
    			default:
    				$$invalidate(0, doc = {});
    				break;
    		}
    	}

    	const click_handler = (item, catList) => setActiveElem(item, catList.componentType);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("doc" in $$props) $$invalidate(0, doc = $$props.doc);
    		if ("categories" in $$props) $$invalidate(3, categories = $$props.categories);
    		if ("activeElem" in $$props) $$invalidate(1, activeElem = $$props.activeElem);
    		if ("componentType" in $$props) $$invalidate(2, componentType = $$props.componentType);
    	};

    	 selectFirstEl(categories);

    	return [
    		doc,
    		activeElem,
    		componentType,
    		categories,
    		setActiveElem,
    		selectFirstEl,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {

    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
