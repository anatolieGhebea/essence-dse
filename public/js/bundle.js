
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
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
    function get_binding_group_value(group) {
        const value = [];
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.push(group[i].__value);
        }
        return value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
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

    /* src/components/DemoWrapper.svelte generated by Svelte v3.18.1 */
    const file = "src/components/DemoWrapper.svelte";
    const get_code_area_slot_changes = dirty => ({});
    const get_code_area_slot_context = ctx => ({});
    const get_graphic_slot_changes = dirty => ({});
    const get_graphic_slot_context = ctx => ({});

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let textarea;
    	let t1;
    	let pre;
    	let code_1;
    	let dispose_code_area_slot;
    	let current;
    	const graphic_slot_template = /*$$slots*/ ctx[4].graphic;
    	const graphic_slot = create_slot(graphic_slot_template, ctx, /*$$scope*/ ctx[3], get_graphic_slot_context);
    	const code_area_slot_template = /*$$slots*/ ctx[4]["code-area"];
    	const code_area_slot = create_slot(code_area_slot_template, ctx, /*$$scope*/ ctx[3], get_code_area_slot_context);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (graphic_slot) graphic_slot.c();
    			t0 = space();
    			div1 = element("div");

    			if (!code_area_slot) {
    				textarea = element("textarea");
    				t1 = space();
    				pre = element("pre");
    				code_1 = element("code");
    			}

    			if (code_area_slot) code_area_slot.c();
    			attr_dev(div0, "class", "demo-area-show svelte-1xqe6t5");
    			add_location(div0, file, 11, 1, 244);

    			if (!code_area_slot) {
    				add_location(textarea, file, 20, 4, 414);
    				attr_dev(code_1, "class", "language-html");
    				add_location(code_1, file, 22, 5, 474);
    				add_location(pre, file, 21, 4, 463);
    			}

    			attr_dev(div1, "class", "demo-area-code svelte-1xqe6t5");
    			add_location(div1, file, 18, 2, 354);
    			attr_dev(div2, "class", "demo-area ds svelte-1xqe6t5");
    			add_location(div2, file, 10, 0, 216);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			if (!graphic_slot) {
    				div0.innerHTML = /*graphic*/ ctx[0];
    			}

    			if (graphic_slot) {
    				graphic_slot.m(div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			if (!code_area_slot) {
    				append_dev(div1, textarea);
    				set_input_value(textarea, /*graphic*/ ctx[0]);
    				append_dev(div1, t1);
    				append_dev(div1, pre);
    				append_dev(pre, code_1);
    				code_1.innerHTML = /*htmlCode*/ ctx[1];
    				dispose_code_area_slot = listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[5]);
    			}

    			if (code_area_slot) {
    				code_area_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!graphic_slot) {
    				if (!current || dirty & /*graphic*/ 1) div0.innerHTML = /*graphic*/ ctx[0];			}

    			if (graphic_slot && graphic_slot.p && dirty & /*$$scope*/ 8) {
    				graphic_slot.p(get_slot_context(graphic_slot_template, ctx, /*$$scope*/ ctx[3], get_graphic_slot_context), get_slot_changes(graphic_slot_template, /*$$scope*/ ctx[3], dirty, get_graphic_slot_changes));
    			}

    			if (!code_area_slot) {
    				if (dirty & /*graphic*/ 1) {
    					set_input_value(textarea, /*graphic*/ ctx[0]);
    				}

    				if (!current || dirty & /*htmlCode*/ 2) code_1.innerHTML = /*htmlCode*/ ctx[1];			}

    			if (code_area_slot && code_area_slot.p && dirty & /*$$scope*/ 8) {
    				code_area_slot.p(get_slot_context(code_area_slot_template, ctx, /*$$scope*/ ctx[3], get_code_area_slot_context), get_slot_changes(code_area_slot_template, /*$$scope*/ ctx[3], dirty, get_code_area_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(graphic_slot, local);
    			transition_in(code_area_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(graphic_slot, local);
    			transition_out(code_area_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (graphic_slot) graphic_slot.d(detaching);

    			if (!code_area_slot) {
    				dispose_code_area_slot();
    			}

    			if (code_area_slot) code_area_slot.d(detaching);
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

    function instance($$self, $$props, $$invalidate) {
    	let { code = "" } = $$props;
    	let { graphic = "" } = $$props;
    	const writable_props = ["code", "graphic"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DemoWrapper> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function textarea_input_handler() {
    		graphic = this.value;
    		$$invalidate(0, graphic);
    	}

    	$$self.$set = $$props => {
    		if ("code" in $$props) $$invalidate(2, code = $$props.code);
    		if ("graphic" in $$props) $$invalidate(0, graphic = $$props.graphic);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { code, graphic, htmlCode };
    	};

    	$$self.$inject_state = $$props => {
    		if ("code" in $$props) $$invalidate(2, code = $$props.code);
    		if ("graphic" in $$props) $$invalidate(0, graphic = $$props.graphic);
    		if ("htmlCode" in $$props) $$invalidate(1, htmlCode = $$props.htmlCode);
    	};

    	let htmlCode;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*graphic*/ 1) {
    			// Returns a highlighted HTML string
    			 $$invalidate(1, htmlCode = Prism.highlight(graphic, Prism.languages.html, "javascript"));
    		}
    	};

    	return [graphic, htmlCode, code, $$scope, $$slots, textarea_input_handler];
    }

    class DemoWrapper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { code: 2, graphic: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DemoWrapper",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get code() {
    		throw new Error("<DemoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<DemoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get graphic() {
    		throw new Error("<DemoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set graphic(value) {
    		throw new Error("<DemoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/DemoCard.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/components/DemoCard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    // (92:4) {#each listExclusiveClasses as className }
    function create_each_block_2(ctx) {
    	let div;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*className*/ ctx[24] + "";
    	let t1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*className*/ ctx[24];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[18][2].push(input);
    			add_location(input, file$1, 93, 6, 2795);
    			add_location(div, file$1, 92, 5, 2783);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = input.__value === /*selectedClass*/ ctx[3];
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[17]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*listExclusiveClasses*/ 1 && input_value_value !== (input_value_value = /*className*/ ctx[24])) {
    				prop_dev(input, "__value", input_value_value);
    			}

    			input.value = input.__value;

    			if (dirty & /*selectedClass*/ 8) {
    				input.checked = input.__value === /*selectedClass*/ ctx[3];
    			}

    			if (dirty & /*listExclusiveClasses*/ 1 && t1_value !== (t1_value = /*className*/ ctx[24] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*$$binding_groups*/ ctx[18][2].splice(/*$$binding_groups*/ ctx[18][2].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(92:4) {#each listExclusiveClasses as className }",
    		ctx
    	});

    	return block;
    }

    // (101:4) {#each listModifierClasses as className }
    function create_each_block_1(ctx) {
    	let div;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*className*/ ctx[24] + "";
    	let t1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			input.__value = input_value_value = /*className*/ ctx[24];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[18][1].push(input);
    			add_location(input, file$1, 102, 6, 3023);
    			add_location(div, file$1, 101, 5, 3011);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = ~/*selectedModifiers*/ ctx[4].indexOf(input.__value);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			dispose = listen_dev(input, "change", /*input_change_handler_1*/ ctx[19]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*listModifierClasses*/ 2 && input_value_value !== (input_value_value = /*className*/ ctx[24])) {
    				prop_dev(input, "__value", input_value_value);
    			}

    			input.value = input.__value;

    			if (dirty & /*selectedModifiers*/ 16) {
    				input.checked = ~/*selectedModifiers*/ ctx[4].indexOf(input.__value);
    			}

    			if (dirty & /*listModifierClasses*/ 2 && t1_value !== (t1_value = /*className*/ ctx[24] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*$$binding_groups*/ ctx[18][1].splice(/*$$binding_groups*/ ctx[18][1].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(101:4) {#each listModifierClasses as className }",
    		ctx
    	});

    	return block;
    }

    // (110:4) {#each atomicClasses as atomClassName }
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*atomClassName*/ ctx[21] + "";
    	let t1;
    	let t2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			input.__value = input_value_value = /*atomClassName*/ ctx[21];
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[18][0].push(input);
    			add_location(input, file$1, 111, 6, 3254);
    			add_location(div, file$1, 110, 5, 3242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = ~/*selectedAtomicClasses*/ ctx[5].indexOf(input.__value);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			dispose = listen_dev(input, "change", /*input_change_handler_2*/ ctx[20]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*atomicClasses*/ 4 && input_value_value !== (input_value_value = /*atomClassName*/ ctx[21])) {
    				prop_dev(input, "__value", input_value_value);
    			}

    			input.value = input.__value;

    			if (dirty & /*selectedAtomicClasses*/ 32) {
    				input.checked = ~/*selectedAtomicClasses*/ ctx[5].indexOf(input.__value);
    			}

    			if (dirty & /*atomicClasses*/ 4 && t1_value !== (t1_value = /*atomClassName*/ ctx[21] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*$$binding_groups*/ ctx[18][0].splice(/*$$binding_groups*/ ctx[18][0].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(110:4) {#each atomicClasses as atomClassName }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div8;
    	let div7;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let pre;
    	let code;
    	let t1;
    	let div6;
    	let div3;
    	let h40;
    	let t3;
    	let t4;
    	let div4;
    	let h41;
    	let t6;
    	let t7;
    	let div5;
    	let h42;
    	let t9;
    	let each_value_2 = /*listExclusiveClasses*/ ctx[0];
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*listModifierClasses*/ ctx[1];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*atomicClasses*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			pre = element("pre");
    			code = element("code");
    			t1 = space();
    			div6 = element("div");
    			div3 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Exclusive classes";
    			t3 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t4 = space();
    			div4 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Modifier classes";
    			t6 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div5 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Atomic classes";
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "demo-area-show svelte-zbbmxx");
    			add_location(div0, file$1, 74, 3, 2405);
    			attr_dev(code, "class", "language-html");
    			add_location(code, file$1, 80, 5, 2531);
    			add_location(pre, file$1, 79, 4, 2520);
    			attr_dev(div1, "class", "demo-area-code svelte-zbbmxx");
    			add_location(div1, file$1, 78, 3, 2487);
    			attr_dev(div2, "class", "col-sx svelte-zbbmxx");
    			add_location(div2, file$1, 73, 2, 2381);
    			attr_dev(h40, "class", "svelte-zbbmxx");
    			add_location(h40, file$1, 90, 4, 2704);
    			add_location(div3, file$1, 89, 3, 2694);
    			attr_dev(h41, "class", "svelte-zbbmxx");
    			add_location(h41, file$1, 99, 4, 2934);
    			add_location(div4, file$1, 98, 3, 2924);
    			attr_dev(h42, "class", "svelte-zbbmxx");
    			add_location(h42, file$1, 108, 4, 3169);
    			add_location(div5, file$1, 107, 3, 3159);
    			attr_dev(div6, "class", "col-dx demo-area-options svelte-zbbmxx");
    			add_location(div6, file$1, 88, 2, 2652);
    			attr_dev(div7, "class", "d_flex flex_justify_between");
    			add_location(div7, file$1, 72, 1, 2337);
    			attr_dev(div8, "class", "demo-area ds svelte-zbbmxx");
    			add_location(div8, file$1, 71, 0, 2309);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div2);
    			append_dev(div2, div0);
    			div0.innerHTML = /*htmlCode*/ ctx[7];
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, pre);
    			append_dev(pre, code);
    			code.innerHTML = /*htmlPritty*/ ctx[6];
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div3);
    			append_dev(div3, h40);
    			append_dev(div3, t3);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div3, null);
    			}

    			append_dev(div6, t4);
    			append_dev(div6, div4);
    			append_dev(div4, h41);
    			append_dev(div4, t6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div4, null);
    			}

    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, h42);
    			append_dev(div5, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*htmlCode*/ 128) div0.innerHTML = /*htmlCode*/ ctx[7];			if (dirty & /*htmlPritty*/ 64) code.innerHTML = /*htmlPritty*/ ctx[6];
    			if (dirty & /*listExclusiveClasses, selectedClass*/ 9) {
    				each_value_2 = /*listExclusiveClasses*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*listModifierClasses, selectedModifiers*/ 18) {
    				each_value_1 = /*listModifierClasses*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*atomicClasses, selectedAtomicClasses*/ 36) {
    				each_value = /*atomicClasses*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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

    function converToString(arr) {
    	let s = "";

    	if (arr.length > 0) {
    		s = arr.join(" ");
    	}

    	return s;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { domElementOpen = "<div" } = $$props;
    	let { domElementContent = "test" } = $$props;
    	let { domeElementClose = "</div>" } = $$props;
    	let { domElementProperties = "" } = $$props;
    	let { elBaseClassString = "" } = $$props; // the defult class to be applied [ type => String ]
    	let { elTailClassString = "" } = $$props; // some extra class to be applied [ type => String ]
    	let { listExclusiveClasses = [] } = $$props; // as radio buttons
    	let { listModifierClasses = [] } = $$props; // as option buttons
    	let { atomicClasses = [] } = $$props;
    	let selectedClass = "";
    	let selectedModifiers = [];
    	let selectedAtomicClasses = [];

    	// passing as parameters only the variables that may change
    	function createDomElement(selectedClass, selectedModifiersString, selectedAtomicString) {
    		let stringElem = domElementOpen + " " + "class=\"";
    		let dynamicClasses = [];
    		if (elBaseClassString.trim() != "") dynamicClasses.push(elBaseClassString);
    		if (selectedClass.trim() != "") dynamicClasses.push(selectedClass);
    		if (selectedModifiersString.trim() != "") dynamicClasses.push(selectedModifiersString);
    		if (selectedAtomicString.trim() != "") dynamicClasses.push(selectedAtomicString);
    		if (elTailClassString.trim() != "") dynamicClasses.push(elTailClassString);
    		let cls = converToString(dynamicClasses);
    		stringElem += cls + "\" " + domElementProperties + ">" + domElementContent + domeElementClose; // close class property
    		return stringElem;
    	}

    	let htmlPritty = "";

    	const writable_props = [
    		"domElementOpen",
    		"domElementContent",
    		"domeElementClose",
    		"domElementProperties",
    		"elBaseClassString",
    		"elTailClassString",
    		"listExclusiveClasses",
    		"listModifierClasses",
    		"atomicClasses"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DemoCard> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[], [], []];

    	function input_change_handler() {
    		selectedClass = this.__value;
    		$$invalidate(3, selectedClass);
    	}

    	function input_change_handler_1() {
    		selectedModifiers = get_binding_group_value($$binding_groups[1]);
    		$$invalidate(4, selectedModifiers);
    	}

    	function input_change_handler_2() {
    		selectedAtomicClasses = get_binding_group_value($$binding_groups[0]);
    		$$invalidate(5, selectedAtomicClasses);
    	}

    	$$self.$set = $$props => {
    		if ("domElementOpen" in $$props) $$invalidate(8, domElementOpen = $$props.domElementOpen);
    		if ("domElementContent" in $$props) $$invalidate(9, domElementContent = $$props.domElementContent);
    		if ("domeElementClose" in $$props) $$invalidate(10, domeElementClose = $$props.domeElementClose);
    		if ("domElementProperties" in $$props) $$invalidate(11, domElementProperties = $$props.domElementProperties);
    		if ("elBaseClassString" in $$props) $$invalidate(12, elBaseClassString = $$props.elBaseClassString);
    		if ("elTailClassString" in $$props) $$invalidate(13, elTailClassString = $$props.elTailClassString);
    		if ("listExclusiveClasses" in $$props) $$invalidate(0, listExclusiveClasses = $$props.listExclusiveClasses);
    		if ("listModifierClasses" in $$props) $$invalidate(1, listModifierClasses = $$props.listModifierClasses);
    		if ("atomicClasses" in $$props) $$invalidate(2, atomicClasses = $$props.atomicClasses);
    	};

    	$$self.$capture_state = () => {
    		return {
    			domElementOpen,
    			domElementContent,
    			domeElementClose,
    			domElementProperties,
    			elBaseClassString,
    			elTailClassString,
    			listExclusiveClasses,
    			listModifierClasses,
    			atomicClasses,
    			selectedClass,
    			selectedModifiers,
    			selectedAtomicClasses,
    			htmlPritty,
    			selectedModifiersString,
    			selectedAtomicString,
    			htmlCode
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("domElementOpen" in $$props) $$invalidate(8, domElementOpen = $$props.domElementOpen);
    		if ("domElementContent" in $$props) $$invalidate(9, domElementContent = $$props.domElementContent);
    		if ("domeElementClose" in $$props) $$invalidate(10, domeElementClose = $$props.domeElementClose);
    		if ("domElementProperties" in $$props) $$invalidate(11, domElementProperties = $$props.domElementProperties);
    		if ("elBaseClassString" in $$props) $$invalidate(12, elBaseClassString = $$props.elBaseClassString);
    		if ("elTailClassString" in $$props) $$invalidate(13, elTailClassString = $$props.elTailClassString);
    		if ("listExclusiveClasses" in $$props) $$invalidate(0, listExclusiveClasses = $$props.listExclusiveClasses);
    		if ("listModifierClasses" in $$props) $$invalidate(1, listModifierClasses = $$props.listModifierClasses);
    		if ("atomicClasses" in $$props) $$invalidate(2, atomicClasses = $$props.atomicClasses);
    		if ("selectedClass" in $$props) $$invalidate(3, selectedClass = $$props.selectedClass);
    		if ("selectedModifiers" in $$props) $$invalidate(4, selectedModifiers = $$props.selectedModifiers);
    		if ("selectedAtomicClasses" in $$props) $$invalidate(5, selectedAtomicClasses = $$props.selectedAtomicClasses);
    		if ("htmlPritty" in $$props) $$invalidate(6, htmlPritty = $$props.htmlPritty);
    		if ("selectedModifiersString" in $$props) $$invalidate(14, selectedModifiersString = $$props.selectedModifiersString);
    		if ("selectedAtomicString" in $$props) $$invalidate(15, selectedAtomicString = $$props.selectedAtomicString);
    		if ("htmlCode" in $$props) $$invalidate(7, htmlCode = $$props.htmlCode);
    	};

    	let selectedModifiersString;
    	let selectedAtomicString;
    	let htmlCode;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedModifiers*/ 16) {
    			 $$invalidate(14, selectedModifiersString = converToString(selectedModifiers));
    		}

    		if ($$self.$$.dirty & /*selectedAtomicClasses*/ 32) {
    			 $$invalidate(15, selectedAtomicString = converToString(selectedAtomicClasses));
    		}

    		if ($$self.$$.dirty & /*selectedClass, selectedModifiersString, selectedAtomicString*/ 49160) {
    			// $: htmlCode = 	domElementOpen + ' '+
    			// 				'class="' + elBaseClassString +' '+ selectedClass +' '+ selectedModifiersString +' '+selectedAtomicString+' '+ elTailClassString +' " ' +
    			// 				domElementProperties + '>' + domElementContent + 
    			// 				domeElementClose;
    			 $$invalidate(7, htmlCode = createDomElement(selectedClass, selectedModifiersString, selectedAtomicString));
    		}

    		if ($$self.$$.dirty & /*htmlCode*/ 128) {
    			// Returns a highlighted HTML string
    			 $$invalidate(6, htmlPritty = Prism.highlight(htmlCode, Prism.languages.html, "javascript"));
    		}
    	};

    	return [
    		listExclusiveClasses,
    		listModifierClasses,
    		atomicClasses,
    		selectedClass,
    		selectedModifiers,
    		selectedAtomicClasses,
    		htmlPritty,
    		htmlCode,
    		domElementOpen,
    		domElementContent,
    		domeElementClose,
    		domElementProperties,
    		elBaseClassString,
    		elTailClassString,
    		selectedModifiersString,
    		selectedAtomicString,
    		createDomElement,
    		input_change_handler,
    		$$binding_groups,
    		input_change_handler_1,
    		input_change_handler_2
    	];
    }

    class DemoCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			domElementOpen: 8,
    			domElementContent: 9,
    			domeElementClose: 10,
    			domElementProperties: 11,
    			elBaseClassString: 12,
    			elTailClassString: 13,
    			listExclusiveClasses: 0,
    			listModifierClasses: 1,
    			atomicClasses: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DemoCard",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get domElementOpen() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set domElementOpen(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get domElementContent() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set domElementContent(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get domeElementClose() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set domeElementClose(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get domElementProperties() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set domElementProperties(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elBaseClassString() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elBaseClassString(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elTailClassString() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elTailClassString(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listExclusiveClasses() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listExclusiveClasses(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listModifierClasses() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listModifierClasses(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get atomicClasses() {
    		throw new Error("<DemoCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set atomicClasses(value) {
    		throw new Error("<DemoCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/designComponents/Buttons.svelte generated by Svelte v3.18.1 */
    const file$2 = "src/designComponents/Buttons.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let current;

    	const democard = new DemoCard({
    			props: {
    				domElementOpen: "<button",
    				domeElementClose: "</button>",
    				domElementContent: "Button",
    				elBaseClassString: "btn",
    				listExclusiveClasses: /*colors*/ ctx[0],
    				listModifierClasses: /*sizes*/ ctx[1],
    				atomicClasses: /*atomicClasses*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Buttons";
    			t1 = space();
    			p = element("p");
    			p.textContent = "To style a button component, it is possible to combine multiple css classes. \n\t\tEach class must belong to a different \"#section\".";
    			t3 = space();
    			create_component(democard.$$.fragment);
    			attr_dev(h1, "class", "main-section-title");
    			add_location(h1, file$2, 56, 1, 888);
    			add_location(p, file$2, 57, 1, 933);
    			attr_dev(div, "class", "page");
    			add_location(div, file$2, 55, 0, 868);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);
    			mount_component(democard, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(democard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(democard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(democard);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self) {
    	let btn = `<button class="btn">Standard</button>`;

    	let colors = [
    		"btn-primary",
    		"btn-secondary",
    		"btn-success",
    		"btn-danger",
    		"btn-warning",
    		"btn-info",
    		"btn-teal"
    	];

    	let colorsOutlined = [
    		"btn-o-primary",
    		"btn-o-secondary",
    		"btn-o-success",
    		"btn-o-danger",
    		"btn-o-warning",
    		"btn-o-info",
    		"btn-o-teal"
    	];

    	let sizes = ["btn-lg", "btn-md", "btn", "btn-sm", "btn-xm"];
    	let atomicClasses = ["txt-12", "txt-14", "txt-16", "txt-18", "txt-20", "txt-24"];

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("btn" in $$props) btn = $$props.btn;
    		if ("colors" in $$props) $$invalidate(0, colors = $$props.colors);
    		if ("colorsOutlined" in $$props) colorsOutlined = $$props.colorsOutlined;
    		if ("sizes" in $$props) $$invalidate(1, sizes = $$props.sizes);
    		if ("atomicClasses" in $$props) $$invalidate(2, atomicClasses = $$props.atomicClasses);
    	};

    	return [colors, sizes, atomicClasses];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/designComponents/DisplayHelpers.svelte generated by Svelte v3.18.1 */
    const file$3 = "src/designComponents/DisplayHelpers.svelte";

    // (26:2) <div slot="graphic">
    function create_graphic_slot(ctx) {
    	let div0;
    	let div1;
    	let span;
    	let t1;
    	let p0;
    	let t3;
    	let p1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "display helper classes:";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "\"d-flex\" -> default to display flex direction row, with contente centered";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "\"d-flex-col\" -> default to flex direction column, with content centered";
    			add_location(span, file$3, 28, 16, 633);
    			add_location(p0, file$3, 29, 16, 686);
    			add_location(p1, file$3, 30, 16, 784);
    			attr_dev(div1, "class", "d-flex");
    			add_location(div1, file$3, 26, 3, 551);
    			attr_dev(div0, "slot", "graphic");
    			add_location(div0, file$3, 25, 2, 527);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			append_dev(div1, span);
    			append_dev(div1, t1);
    			append_dev(div1, p0);
    			append_dev(div1, t3);
    			append_dev(div1, p1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_graphic_slot.name,
    		type: "slot",
    		source: "(26:2) <div slot=\\\"graphic\\\">",
    		ctx
    	});

    	return block;
    }

    // (34:2) <div slot="code">
    function create_code_slot(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "slot", "code");
    			add_location(div, file$3, 33, 2, 884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_code_slot.name,
    		type: "slot",
    		source: "(34:2) <div slot=\\\"code\\\">",
    		ctx
    	});

    	return block;
    }

    // (25:1) <DemoWrapper>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(25:1) <DemoWrapper>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let h2;
    	let t5;
    	let h3;
    	let t7;
    	let current;

    	const demowrapper = new DemoWrapper({
    			props: {
    				$$slots: {
    					default: [create_default_slot],
    					code: [create_code_slot],
    					graphic: [create_graphic_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Display";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Display helper functions...";
    			t3 = space();
    			h2 = element("h2");
    			h2.textContent = "#Flex";
    			t5 = space();
    			h3 = element("h3");
    			h3.textContent = "##";
    			t7 = space();
    			create_component(demowrapper.$$.fragment);
    			attr_dev(h1, "class", "main-section-title");
    			add_location(h1, file$3, 17, 1, 361);
    			add_location(p, file$3, 18, 1, 407);
    			attr_dev(h2, "class", "title");
    			add_location(h2, file$3, 22, 1, 451);
    			attr_dev(h3, "class", "subtitle");
    			add_location(h3, file$3, 23, 1, 481);
    			attr_dev(div, "class", "page");
    			add_location(div, file$3, 16, 0, 341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);
    			append_dev(div, h2);
    			append_dev(div, t5);
    			append_dev(div, h3);
    			append_dev(div, t7);
    			mount_component(demowrapper, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const demowrapper_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				demowrapper_changes.$$scope = { dirty, ctx };
    			}

    			demowrapper.$set(demowrapper_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(demowrapper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(demowrapper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(demowrapper);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self) {
    	let btn = `<button class="btn">Standard</button>`;

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("btn" in $$props) btn = $$props.btn;
    	};

    	return [];
    }

    class DisplayHelpers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DisplayHelpers",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/designComponents/Text.svelte generated by Svelte v3.18.1 */
    const file$4 = "src/designComponents/Text.svelte";

    // (49:1) <DemoWrapper   graphic="{generateCode(sizes)}"    code="{generateCode(sizes)}"   >
    function create_default_slot_1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(49:1) <DemoWrapper   graphic=\\\"{generateCode(sizes)}\\\"    code=\\\"{generateCode(sizes)}\\\"   >",
    		ctx
    	});

    	return block;
    }

    // (56:1) <DemoWrapper   graphic="{generateCode(weight, 'txt-18')}"    code="{generateCode(weight,'txt-18')}">
    function create_default_slot$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(56:1) <DemoWrapper   graphic=\\\"{generateCode(weight, 'txt-18')}\\\"    code=\\\"{generateCode(weight,'txt-18')}\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let h20;
    	let t5;
    	let t6;
    	let h21;
    	let t8;
    	let current;

    	const demowrapper0 = new DemoWrapper({
    			props: {
    				graphic: generateCode(/*sizes*/ ctx[0]),
    				code: generateCode(/*sizes*/ ctx[0]),
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const demowrapper1 = new DemoWrapper({
    			props: {
    				graphic: generateCode(/*weight*/ ctx[1], "txt-18"),
    				code: generateCode(/*weight*/ ctx[1], "txt-18"),
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Text";
    			t1 = space();
    			p = element("p");
    			p.textContent = "To style a button component, it is possible to combine multiple css classes. \n\t\tEach class must belong to a different \"#section\".";
    			t3 = space();
    			h20 = element("h2");
    			h20.textContent = "#Size";
    			t5 = space();
    			create_component(demowrapper0.$$.fragment);
    			t6 = space();
    			h21 = element("h2");
    			h21.textContent = "#Size";
    			t8 = space();
    			create_component(demowrapper1.$$.fragment);
    			attr_dev(h1, "class", "main-section-title");
    			add_location(h1, file$4, 41, 1, 589);
    			add_location(p, file$4, 42, 1, 631);
    			attr_dev(h20, "class", "title");
    			add_location(h20, file$4, 47, 1, 777);
    			attr_dev(h21, "class", "title");
    			add_location(h21, file$4, 54, 1, 908);
    			attr_dev(div, "class", "page");
    			add_location(div, file$4, 40, 0, 569);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);
    			append_dev(div, h20);
    			append_dev(div, t5);
    			mount_component(demowrapper0, div, null);
    			append_dev(div, t6);
    			append_dev(div, h21);
    			append_dev(div, t8);
    			mount_component(demowrapper1, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const demowrapper0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				demowrapper0_changes.$$scope = { dirty, ctx };
    			}

    			demowrapper0.$set(demowrapper0_changes);
    			const demowrapper1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				demowrapper1_changes.$$scope = { dirty, ctx };
    			}

    			demowrapper1.$set(demowrapper1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(demowrapper0.$$.fragment, local);
    			transition_in(demowrapper1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(demowrapper0.$$.fragment, local);
    			transition_out(demowrapper1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(demowrapper0);
    			destroy_component(demowrapper1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function generateCode(classes, extraClasses = "") {
    	let s = "";

    	classes.forEach(cl => {
    		let el = "<div class=\"" + cl + " " + extraClasses + "\">" + cl + "</div>  \n";
    		s += el;
    	});

    	return s;
    }

    function instance$4($$self) {
    	let btn = `<button class="btn">Standard</button>`;
    	let colors = [];

    	let sizes = [
    		"txt-12",
    		"txt-14",
    		"txt-16",
    		"txt-18",
    		"txt-20",
    		"txt-24",
    		"txt-30",
    		"txt-36",
    		"txt-48",
    		"txt-60",
    		"txt-72"
    	];

    	let weight = ["fw-light", "fw-normal", "fw-bold"];

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("btn" in $$props) btn = $$props.btn;
    		if ("colors" in $$props) colors = $$props.colors;
    		if ("sizes" in $$props) $$invalidate(0, sizes = $$props.sizes);
    		if ("weight" in $$props) $$invalidate(1, weight = $$props.weight);
    	};

    	return [sizes, weight];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$5 = "src/App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (30:3) {#each componentList as cmp}
    function create_each_block$1(ctx) {
    	let li;
    	let t_value = /*cmp*/ ctx[4] + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*cmp*/ ctx[4], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-1hbnbw1");
    			toggle_class(li, "active", /*activeElement*/ ctx[0] == /*cmp*/ ctx[4]);
    			add_location(li, file$5, 30, 4, 612);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*activeElement, componentList*/ 3) {
    				toggle_class(li, "active", /*activeElement*/ ctx[0] == /*cmp*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(30:3) {#each componentList as cmp}",
    		ctx
    	});

    	return block;
    }

    // (41:47) 
    function create_if_block_2(ctx) {
    	let current;
    	const displayhelpers = new DisplayHelpers({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(displayhelpers.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(displayhelpers, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(displayhelpers.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(displayhelpers.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(displayhelpers, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(41:47) ",
    		ctx
    	});

    	return block;
    }

    // (39:37) 
    function create_if_block_1(ctx) {
    	let current;
    	const text_1 = new Text({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(text_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(text_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(text_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(39:37) ",
    		ctx
    	});

    	return block;
    }

    // (37:3) {#if activeElement == 'Buttons'}
    function create_if_block(ctx) {
    	let current;
    	const buttons = new Buttons({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(buttons.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buttons, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buttons, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(37:3) {#if activeElement == 'Buttons'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let ul;
    	let t;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let each_value = /*componentList*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*activeElement*/ ctx[0] == "Buttons") return 0;
    		if (/*activeElement*/ ctx[0] == "Text") return 1;
    		if (/*activeElement*/ ctx[0] == "DisplayHelpers") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(ul, "class", "svelte-1hbnbw1");
    			add_location(ul, file$5, 28, 3, 571);
    			attr_dev(div0, "class", "side-menu svelte-1hbnbw1");
    			add_location(div0, file$5, 27, 2, 544);
    			attr_dev(div1, "class", "main-content svelte-1hbnbw1");
    			add_location(div1, file$5, 35, 2, 732);
    			attr_dev(div2, "class", "container svelte-1hbnbw1");
    			add_location(div2, file$5, 26, 1, 518);
    			add_location(main, file$5, 24, 0, 508);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeElement, componentList, setActive*/ 7) {
    				each_value = /*componentList*/ ctx[1];
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

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					if_block = null;
    				}
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
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let componentList = ["Buttons", "Text", "DisplayHelpers", "Helpers", "Layout", "Tables"];
    	let activeElement = componentList[0];

    	function setActive(active) {
    		$$invalidate(0, activeElement = active);
    	}

    	const click_handler = cmp => setActive(cmp);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("componentList" in $$props) $$invalidate(1, componentList = $$props.componentList);
    		if ("activeElement" in $$props) $$invalidate(0, activeElement = $$props.activeElement);
    	};

    	return [activeElement, componentList, setActive, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
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
