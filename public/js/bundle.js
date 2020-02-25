
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

    /* src/components/Simple.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file = "src/components/Simple.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (142:0) {:else}
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
    		source: "(142:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:0) {#if activeElement }
    function create_if_block(ctx) {
    	let h1;
    	let t0_value = /*activeElement*/ ctx[0].displayName + "";
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let if_block3_anchor;
    	let if_block0 = /*blockClasses*/ ctx[4].length > 0 && create_if_block_4(ctx);
    	let if_block1 = /*elementClasses*/ ctx[5].length > 0 && create_if_block_3(ctx);
    	let if_block2 = /*modifierClasses*/ ctx[6].length > 0 && create_if_block_2(ctx);
    	let if_block3 = /*variables*/ ctx[3].length > 0 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*mainDesc*/ ctx[2]);
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			add_location(h1, file, 65, 1, 1029);
    			add_location(p, file, 66, 1, 1070);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, if_block3_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*activeElement*/ 1 && t0_value !== (t0_value = /*activeElement*/ ctx[0].displayName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*mainDesc*/ 4) set_data_dev(t2, /*mainDesc*/ ctx[2]);

    			if (/*blockClasses*/ ctx[4].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(t4.parentNode, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*elementClasses*/ ctx[5].length > 0) if_block1.p(ctx, dirty);
    			if (/*modifierClasses*/ ctx[6].length > 0) if_block2.p(ctx, dirty);

    			if (/*variables*/ ctx[3].length > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(65:0) {#if activeElement }",
    		ctx
    	});

    	return block;
    }

    // (71:1) {#if blockClasses.length > 0 }
    function create_if_block_4(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let each_value_1 = /*blockClasses*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = `${/*translate*/ ctx[7]("block_css")}`;
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file, 72, 3, 1140);
    			add_location(div, file, 71, 2, 1131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*blockClasses, translate, lang*/ 146) {
    				each_value_1 = /*blockClasses*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(71:1) {#if blockClasses.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (79:4) {#if item.example != '' }
    function create_if_block_5(ctx) {
    	let h5;
    	let t1;
    	let div2;
    	let div0;
    	let raw_value = /*item*/ ctx[11].example + "";
    	let t2;
    	let div1;
    	let pre;
    	let code;
    	let t3_value = /*item*/ ctx[11].example + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = `${/*translate*/ ctx[7]("example")}`;
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			pre = element("pre");
    			code = element("code");
    			t3 = text(t3_value);
    			t4 = space();
    			add_location(h5, file, 79, 5, 1339);
    			attr_dev(div0, "class", "demo-area-show svelte-qb9gxa");
    			add_location(div0, file, 81, 6, 1392);
    			attr_dev(code, "class", "language-html");
    			add_location(code, file, 87, 8, 1541);
    			add_location(pre, file, 86, 7, 1527);
    			attr_dev(div1, "class", "demo-area-code svelte-qb9gxa");
    			add_location(div1, file, 85, 6, 1491);
    			add_location(div2, file, 80, 5, 1380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			div0.innerHTML = raw_value;
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, pre);
    			append_dev(pre, code);
    			append_dev(code, t3);
    			append_dev(div2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*blockClasses*/ 16 && raw_value !== (raw_value = /*item*/ ctx[11].example + "")) div0.innerHTML = raw_value;			if (dirty & /*blockClasses*/ 16 && t3_value !== (t3_value = /*item*/ ctx[11].example + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(79:4) {#if item.example != '' }",
    		ctx
    	});

    	return block;
    }

    // (74:3) {#each blockClasses as item }
    function create_each_block_1(ctx) {
    	let div;
    	let h4;
    	let t0;
    	let t1_value = /*item*/ ctx[11].class + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*item*/ ctx[11].description[/*lang*/ ctx[1]] + "";
    	let t3;
    	let t4;
    	let if_block_anchor;
    	let if_block = /*item*/ ctx[11].example != "" && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			t0 = text(".");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h4, file, 75, 5, 1225);
    			add_location(p, file, 76, 5, 1257);
    			add_location(div, file, 74, 4, 1213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(p, t3);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*blockClasses*/ 16 && t1_value !== (t1_value = /*item*/ ctx[11].class + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*blockClasses, lang*/ 18 && t3_value !== (t3_value = /*item*/ ctx[11].description[/*lang*/ ctx[1]] + "")) set_data_dev(t3, t3_value);

    			if (/*item*/ ctx[11].example != "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(74:3) {#each blockClasses as item }",
    		ctx
    	});

    	return block;
    }

    // (101:1) {#if elementClasses.length > 0 }
    function create_if_block_3(ctx) {
    	let div;
    	let h3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = `${/*translate*/ ctx[7]("element_css")}`;
    			add_location(h3, file, 102, 3, 1757);
    			add_location(div, file, 101, 2, 1748);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(101:1) {#if elementClasses.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (108:1) {#if modifierClasses.length > 0 }
    function create_if_block_2(ctx) {
    	let div;
    	let h3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = `${/*translate*/ ctx[7]("modifier_css")}`;
    			add_location(h3, file, 109, 3, 1862);
    			add_location(div, file, 108, 2, 1853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(108:1) {#if modifierClasses.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (115:1) {#if variables.length > 0 }
    function create_if_block_1(ctx) {
    	let div1;
    	let h3;
    	let t1;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t3;
    	let th1;
    	let t5;
    	let th2;
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
    			h3.textContent = `${/*translate*/ ctx[7]("variables")}`;
    			t1 = space();
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = `${/*translate*/ ctx[7]("name")}`;
    			t3 = space();
    			th1 = element("th");
    			th1.textContent = `${/*translate*/ ctx[7]("default")}`;
    			t5 = space();
    			th2 = element("th");
    			th2.textContent = `${/*translate*/ ctx[7]("description")}`;
    			t7 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file, 116, 3, 1979);
    			attr_dev(th0, "class", "svelte-qb9gxa");
    			add_location(th0, file, 121, 6, 2135);
    			attr_dev(th1, "class", "svelte-qb9gxa");
    			add_location(th1, file, 122, 6, 2172);
    			attr_dev(th2, "class", "svelte-qb9gxa");
    			add_location(th2, file, 123, 6, 2212);
    			attr_dev(tr, "class", "bg_neutral_500 text_white svelte-qb9gxa");
    			add_location(tr, file, 120, 5, 2090);
    			add_location(thead, file, 119, 5, 2077);
    			add_location(tbody, file, 126, 5, 2280);
    			attr_dev(table, "class", "svelte-qb9gxa");
    			add_location(table, file, 118, 4, 2063);
    			attr_dev(div0, "class", "bg_neutral_050 text_light");
    			add_location(div0, file, 117, 3, 2018);
    			attr_dev(div1, "class", "p_ver_05");
    			add_location(div1, file, 115, 2, 1953);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t3);
    			append_dev(tr, th1);
    			append_dev(tr, t5);
    			append_dev(tr, th2);
    			append_dev(table, t7);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*variables, lang*/ 10) {
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
    		source: "(115:1) {#if variables.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (128:6) {#each variables as item }
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item*/ ctx[11].variable + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*item*/ ctx[11].default + "";
    	let t2;
    	let t3;
    	let td2;
    	let raw_value = /*item*/ ctx[11].description[/*lang*/ ctx[1]] + "";
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
    			attr_dev(td0, "class", "text_primary_800 svelte-qb9gxa");
    			add_location(td0, file, 129, 8, 2341);
    			attr_dev(td1, "class", "svelte-qb9gxa");
    			add_location(td1, file, 130, 8, 2401);
    			attr_dev(td2, "class", "svelte-qb9gxa");
    			add_location(td2, file, 131, 8, 2434);
    			attr_dev(tr, "class", "svelte-qb9gxa");
    			add_location(tr, file, 128, 7, 2328);
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
    			if (dirty & /*variables*/ 8 && t0_value !== (t0_value = /*item*/ ctx[11].variable + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*variables*/ 8 && t2_value !== (t2_value = /*item*/ ctx[11].default + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*variables, lang*/ 10 && raw_value !== (raw_value = /*item*/ ctx[11].description[/*lang*/ ctx[1]] + "")) td2.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(128:6) {#each variables as item }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*activeElement*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			add_location(main, file, 63, 0, 1000);
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

    function instance($$self, $$props, $$invalidate) {
    	let { activeElement = {} } = $$props;
    	let { doc = {} } = $$props;
    	let { lang = "it" } = $$props;

    	// 
    	let mainDesc = "";

    	let variables = [];
    	let blockClasses = [];
    	let elementClasses = [];
    	let modifierClasses = [];

    	function init(element) {
    		console.log(element);
    		console.log(doc);

    		if (doc) {
    			$$invalidate(2, mainDesc = doc.mainDescription[lang]);
    			$$invalidate(3, variables = doc.cssVariables);
    			$$invalidate(4, blockClasses = doc.blockClasses);
    		}
    	} // da implementare chiamata a server

    	let labels = {
    		"variables": { it: "Variabili", en: "Variables" },
    		"block_css": {
    			it: "Classi per blocco",
    			en: "Block classes"
    		},
    		"element_css": {
    			it: "Classi di elemento",
    			en: "Element classes"
    		},
    		"modifier_css": {
    			it: "Classi modificatori",
    			en: "Modifier classes"
    		}
    	};

    	function translate(lbl) {
    		let lblTranslated = lbl;

    		if (labels.hasOwnProperty(lbl)) {
    			if (labels[lbl][lang]) lblTranslated = labels[lbl][lang];
    		}

    		return lblTranslated;
    	}

    	const writable_props = ["activeElement", "doc", "lang"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Simple> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("activeElement" in $$props) $$invalidate(0, activeElement = $$props.activeElement);
    		if ("doc" in $$props) $$invalidate(8, doc = $$props.doc);
    		if ("lang" in $$props) $$invalidate(1, lang = $$props.lang);
    	};

    	$$self.$capture_state = () => {
    		return {
    			activeElement,
    			doc,
    			lang,
    			mainDesc,
    			variables,
    			blockClasses,
    			elementClasses,
    			modifierClasses,
    			labels
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("activeElement" in $$props) $$invalidate(0, activeElement = $$props.activeElement);
    		if ("doc" in $$props) $$invalidate(8, doc = $$props.doc);
    		if ("lang" in $$props) $$invalidate(1, lang = $$props.lang);
    		if ("mainDesc" in $$props) $$invalidate(2, mainDesc = $$props.mainDesc);
    		if ("variables" in $$props) $$invalidate(3, variables = $$props.variables);
    		if ("blockClasses" in $$props) $$invalidate(4, blockClasses = $$props.blockClasses);
    		if ("elementClasses" in $$props) $$invalidate(5, elementClasses = $$props.elementClasses);
    		if ("modifierClasses" in $$props) $$invalidate(6, modifierClasses = $$props.modifierClasses);
    		if ("labels" in $$props) labels = $$props.labels;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*activeElement*/ 1) {
    			 init(activeElement);
    		}
    	};

    	return [
    		activeElement,
    		lang,
    		mainDesc,
    		variables,
    		blockClasses,
    		elementClasses,
    		modifierClasses,
    		translate,
    		doc
    	];
    }

    class Simple extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { activeElement: 0, doc: 8, lang: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Simple",
    			options,
    			id: create_fragment.name
    		});
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

    	get lang() {
    		throw new Error("<Simple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
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
    				displayName: "Backgrounds",
    				file: "_backgrounds",
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

    var mainDescription = {
    	it: "Per i breack points vengono definite le seguenti variabili. Questo vengono usate dai diversi fogli di stile per la definizione delle regole di media query.",
    	en: ""
    };
    var blockClasses = [
    	{
    		"class": "container",
    		description: {
    			it: "Classe da assegnare ad un elemento che deve contenere delle righe responsive (@testo di prova da modificare) ",
    			en: ""
    		},
    		example: " <div class=\"container\"> ... </div>"
    	}
    ];
    var elementClasses = [
    ];
    var modifierClasses = [
    ];
    var cssVariables = [
    	{
    		variable: "$width",
    		"default": "100%",
    		description: {
    			it: "Questa variabile viene usata per calcolare le larghezze delle colonne per il layout <i> simple_grid </i> ",
    			en: ""
    		}
    	},
    	{
    		variable: "$gutter",
    		"default": "0",
    		description: {
    			it: "Questa variabile viene usata per calcolare il gap tra le colonne per il layout <i> simple_grid </i>. Per il design sistema attuale, di default non è presente uno gap tra le colonne, gli elementi che vengono messi all'interno dovranno gestirsi la spaziatura tramite il margin o il padding.",
    			en: ""
    		}
    	},
    	{
    		variable: "$breakpoint-sm",
    		"default": "30em",
    		description: {
    			it: "Si intende che sotto i 30em <i>(480px)</i> si è su un schermo xm <small>(extra small)</small>, da 30em in su e fino al <i>$breakpoint-md</i> lo schermo ha dimensione sm <small>{small}</small>",
    			en: ""
    		}
    	},
    	{
    		variable: "$breakpoint-md",
    		"default": "48em",
    		description: {
    			it: "Si intende che sotto i 48em <i>(768px)</i> si è su un schermo sm <small>(small)</small>, da 48em in su e fino al <i>$breakpoint-lg</i> lo schermo ha dimensione md <small>{medeum}</small>",
    			en: ""
    		}
    	},
    	{
    		variable: "$breakpoint-lg",
    		"default": "64em",
    		description: {
    			it: "Si intende che sotto i 64em <i>(1024px)</i> si è su un schermo md <small>(medeum)</small>, da 64em in su e fino al <i>$breakpoint-xl</i> lo schermo ha dimensione lg <small>{large}</small>",
    			en: ""
    		}
    	},
    	{
    		variable: "$breakpoint-xl",
    		"default": "85em",
    		description: {
    			it: "Quando sono su schermi che hanno risoluzione maggiore di <i>(1360px)</i>",
    			en: ""
    		}
    	}
    ];
    var tmpTestDoc = {
    	mainDescription: mainDescription,
    	blockClasses: blockClasses,
    	elementClasses: elementClasses,
    	modifierClasses: modifierClasses,
    	cssVariables: cssVariables
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

    // (53:6) {#each catList.items as item }
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
    			attr_dev(li, "class", "svelte-x5k601");
    			toggle_class(li, "active", /*activeElem*/ ctx[1].file == /*item*/ ctx[10].file);
    			add_location(li, file$1, 53, 7, 1076);
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
    		source: "(53:6) {#each catList.items as item }",
    		ctx
    	});

    	return block;
    }

    // (49:3) {#each categories as catList }
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
    			attr_dev(ul, "class", "hoverable svelte-x5k601");
    			add_location(ul, file$1, 51, 5, 1009);
    			attr_dev(li, "class", "heading-li svelte-x5k601");
    			add_location(li, file$1, 49, 4, 958);
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
    		source: "(49:3) {#each categories as catList }",
    		ctx
    	});

    	return block;
    }

    // (65:3) {#if componentType == 'simple' }
    function create_if_block$1(ctx) {
    	let current;

    	const simple = new Simple({
    			props: {
    				activeElement: /*activeElem*/ ctx[1],
    				doc: /*doc*/ ctx[0],
    				lang: "it"
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
    		source: "(65:3) {#if componentType == 'simple' }",
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
    			attr_dev(ul, "class", "svelte-x5k601");
    			add_location(ul, file$1, 47, 3, 914);
    			attr_dev(div0, "class", "side-menu svelte-x5k601");
    			add_location(div0, file$1, 46, 2, 887);
    			attr_dev(div1, "class", "main-content svelte-x5k601");
    			add_location(div1, file$1, 62, 2, 1396);
    			attr_dev(div2, "class", "container svelte-x5k601");
    			add_location(div2, file$1, 45, 1, 861);
    			add_location(main0, file$1, 43, 0, 851);
    			add_location(main1, file$1, 42, 0, 844);
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
    				let el = cats[0]["items"][0];
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

    		if (el.file == "_breackpoints") {
    			$$invalidate(0, doc = tmpTestDoc);
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
