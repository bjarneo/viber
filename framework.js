/**
 * A Blazing Fast Modern JavaScript Framework (BFMJF)
 * Focus: Simplicity, Speed, Developer Experience
 */
const BFMJF = (() => {
    // Store registered components and their render functions
    const components = {};
    // Map component name to a Set of top-level state keys it depends on
    const componentDependencies = new Map();
    // Store application state (simple global state for now)
    let state = {};
    let isInitialRender = true; // Track initial render
    let rootElementInstance = null; // Store root element instance

    /**
     * Registers a component.
     * @param {string} name - The name of the component (used as HTML tag or attribute).
     * @param {function} renderFn - A function that takes state and returns an HTML string or DOM element.
     */
    function registerComponent(name, renderFn) {
        if (typeof renderFn !== 'function') {
            throw new Error(`Component '${name}' must provide a render function.`);
        }
        console.log(`Registering component: ${name}`);
        components[name] = renderFn;

        // --- Automatic Dependency Tracking ---
        const dependencies = new Set();
        const renderFnString = renderFn.toString();
        // Regex for direct access: state.key or state['key']
        const stateAccessRegex = /state\.(\w+)|state\[['"`](.+?)['"`]]/g;
        let match;
        while ((match = stateAccessRegex.exec(renderFnString)) !== null) {
            const key = match[1] || match[2];
            if (key) dependencies.add(key);
        }

        // Regex for destructuring: const { key1, key2 } = state
        const destructureRegex = /{\s*([^}]+)\s*}\s*=\s*state/g;
        while ((match = destructureRegex.exec(renderFnString)) !== null) {
            const keysString = match[1];
            // Split keys, trim whitespace, handle potential aliases (key: alias)
            keysString.split(',').forEach(k => {
                const keyName = k.split(':')[0].trim(); // Get the part before ':' if it exists
                if (keyName) dependencies.add(keyName);
            });
        }

        componentDependencies.set(name, dependencies);
    }

    /**
     * Sets the initial state of the application.
     * @param {object} initialState - The initial state object.
     */
    function setInitialState(initialState) {
        state = { ...initialState };
    }

		/**
		 * Updates the application state and triggers a re-render.
		 * Deep merge is used for nested objects.
		 * @param {object | function} newStateOrFn - An object with new state values or a function that receives the current state and returns the new state.
		 */
		function setState(newStateOrFn) {
				// Store snapshot for comparison
				const oldStateSnapshot = JSON.stringify(state);
				const stateBeforeUpdate = JSON.parse(oldStateSnapshot); // Deep copy for key comparison

				let newStateFragment;
				if (typeof newStateOrFn === 'function') {
						newStateFragment = newStateOrFn(state); // Pass current state to the function
				} else {
						newStateFragment = newStateOrFn;
				}

				// Find changed keys before merging
				const changedKeys = new Set();
				for (const key in newStateFragment) {
					 if (Object.prototype.hasOwnProperty.call(newStateFragment, key)) {
							// Use stringify for simple deep comparison check
							if (!(key in stateBeforeUpdate) || JSON.stringify(stateBeforeUpdate[key]) !== JSON.stringify(newStateFragment[key])) {
								 changedKeys.add(key);
							}
					 }
				}

				// If no keys changed based on the input, potentially bail early
				if (changedKeys.size === 0) {
					console.log('State update skipped (no effective changes in input detected).');
					return; 
				}

				// Deep merge implementation
				const mergeDeep = (target, source) => {
						for (const key in source) {
								if (Object.prototype.hasOwnProperty.call(source, key)) {
										const targetValue = target[key];
										const sourceValue = source[key];

										if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
												targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
												mergeDeep(targetValue, sourceValue); // Recurse for nested objects
										} else {
												target[key] = sourceValue; // Assign primitive values or overwrite arrays/objects
										}
								}
						}
						return target;
				}

				state = mergeDeep(state, newStateFragment);

				// Final check: Only render if the *entire* state object actually changed after merge
				// This handles cases where mergeDeep might not result in a different object stringify
				if (oldStateSnapshot !== JSON.stringify(state)) {
						console.log('State updated. Changed keys:', Array.from(changedKeys));
						renderApp(undefined, changedKeys); // Pass changed keys to renderApp
				} else {
						console.log('State update skipped (state unchanged after merge).');
				}
		}

    /**
     * Gets the current state.
     * @returns {object} The current state object.
     */
    function getState() {
        // Return a copy to prevent direct mutation
        return { ...state };
    }

		/**
		 * Renders the entire application or selectively updates components based on changed state keys.
		 * @param {string} [rootElementId='app'] - The ID of the DOM element to render into.
		 * @param {Set<string>} [changedKeys] - Optional set of state keys that have changed.
		 */
		function renderApp(rootElementId = 'app', changedKeys) {
				if (!rootElementInstance) {
					rootElementInstance = document.getElementById(rootElementId);
					if (!rootElementInstance) {
							console.error(`Root element with ID '${rootElementId}' not found.`);
							return;
					}
				}
				const rootElement = rootElementInstance;

				console.log(`Rendering app into #${rootElementId}`, isInitialRender ? '(Initial)' : '(Update)');

				if (isInitialRender) {
						// --- Initial Render ---
						rootElement.innerHTML = ''; // Clear root
						Object.entries(components).forEach(([name, renderFn]) => {
								// Skip any potential 'App' component if it wasn't removed
								if (name === 'App') return;

								console.log(`Initial render for: ${name}`);
								const componentHtml = renderFn(state);
								// Create a temporary container to parse the HTML string
								// This ensures we append the actual element defined in the component's return string
								const tempContainer = document.createElement('div');
								tempContainer.innerHTML = componentHtml.trim();
								if (tempContainer.firstElementChild) {
									 // Add component type attribute if not already present (belt-and-suspenders)
									 if (!tempContainer.firstElementChild.hasAttribute('data-component-type')) {
										tempContainer.firstElementChild.setAttribute('data-component-type', name);
									 }
									 rootElement.appendChild(tempContainer.firstElementChild);
								} else {
										console.warn(`Component ${name} did not render a valid element.`);
								}
						});
						scanAndAttachListeners(rootElement); // Scan all initially attached listeners
						isInitialRender = false;
				} else {
						// --- Update Render ---
						Object.entries(components).forEach(([name, renderFn]) => {
								if (name === 'App') return; // Skip 'App'

								// --- Dependency Check ---
								let componentMightBeAffected = false; // Start assuming false for updates
								if (changedKeys) { // Only check dependencies if specific keys changed
										const dependencies = componentDependencies.get(name);
										if (dependencies && dependencies.size > 0) {
												for (const key of changedKeys) {
														if (dependencies.has(key)) {
																componentMightBeAffected = true;
																break;
														}
												}
										} else {
											 // No dependencies tracked? Assume affected to be safe (or could refine this)
											 // componentMightBeAffected = true; // Let's default to false if no keys changed
										}
								} else {
									 componentMightBeAffected = true; // If no changedKeys provided, assume full update needed
								}

								if (!componentMightBeAffected) {
										return; // Don't call renderFn if component is unaffected
								}
								 // --- End Dependency Check ---

								// Find element(s) for this component type in the DOM
								const elements = rootElement.querySelectorAll(`[data-component-type="${name}"]`);

								if (elements.length === 0) {
									 // console.log(`Component ${name} not found in DOM for update.`);
									 return; // Component not rendered or already removed
								}

								 // Component function *is* potentially affected, call renderFn
								 // console.log(`Calling render function for potentially affected component: ${name}`);
								 const newFullHtml = renderFn(state);

								elements.forEach(element => {
										const currentInnerHtml = element.innerHTML;
										const tempContainer = document.createElement('div');
										tempContainer.innerHTML = newFullHtml.trim();
										const newInnerHtml = tempContainer.firstElementChild ? tempContainer.firstElementChild.innerHTML : '';

										let skipInnerHtmlUpdate = false;
										let focusedInputElement = null;

										// --- Generalized Focused Element Handling ---
										if (document.activeElement &&
											(document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') &&
											element.contains(document.activeElement))
										{
											// console.log(`Skipping full innerHTML update for ${name} due to focused input/textarea.`);
											skipInnerHtmlUpdate = true;
											focusedInputElement = document.activeElement;

											// Manually update the input value if it's the active element and differs from state
											const inputElement = focusedInputElement;
											const handlerName = inputElement.dataset.oninput;
											let stateValue = undefined;
											if (handlerName === 'updateMirrorText') {
												stateValue = state.mirrorText;
											}
											// No mapping needed for githubUsernameInput anymore

											if (stateValue !== undefined && inputElement.value !== stateValue) {
												const start = inputElement.selectionStart;
												const end = inputElement.selectionEnd;
												inputElement.value = stateValue;
												try { inputElement.setSelectionRange(start, end); } catch (e) {}
											}
										}
										// --- End Generalized Focused Element Handling ---

										// --- Perform Update ---
										if (skipInnerHtmlUpdate) {
											// --- Targeted Update (when focus is protected) ---
											// console.log(`Performing targeted update for ${name} while protecting focus.`);
											
											// Re-render to get the new structure/content
											const tempContainer = document.createElement('div');
											tempContainer.innerHTML = newFullHtml.trim(); // Use the already rendered newFullHtml
											const newElement = tempContainer.firstElementChild;

											if (newElement) {
												const currentChildren = Array.from(element.childNodes);
												const newChildren = Array.from(newElement.childNodes);
												const maxLength = Math.max(currentChildren.length, newChildren.length);

												for (let i = 0; i < maxLength; i++) {
													const oldChild = currentChildren[i];
													const newChild = newChildren[i];

													if (oldChild && !newChild) { // Node removed
														if (oldChild !== focusedInputElement) {
															element.removeChild(oldChild);
														}
													} else if (!oldChild && newChild) { // Node added
														 element.appendChild(newChild.cloneNode(true)); // Append clone
													} else if (oldChild && newChild) { // Node potentially modified
														// Skip if this child is the focused input itself
														if (oldChild === focusedInputElement) {
															continue;
														}
														
														// Basic check: If node types differ or text content differs (for text nodes)
														// More sophisticated diffing could be added here
														if (oldChild.nodeType !== newChild.nodeType || 
															(oldChild.nodeType === Node.TEXT_NODE && oldChild.textContent !== newChild.textContent) || 
															(oldChild.nodeType === Node.ELEMENT_NODE && oldChild.outerHTML !== newChild.outerHTML)) 
														{
															// Replace the old child with a clone of the new child
															element.replaceChild(newChild.cloneNode(true), oldChild);
														}
													}
												}
												// Re-scan listeners for potentially modified/added children (excluding focused input's subtree)
												scanAndAttachListeners(element, focusedInputElement); 
											}
										} else {
											// --- Full innerHTML Update (when focus is not protected) ---
											if (newInnerHtml.trim() !== currentInnerHtml.trim()) {
												console.log(`Updating component DOM (full): ${name}`);
												element.innerHTML = newInnerHtml;
												scanAndAttachListeners(element);
											} else {
												// console.log(`Skipping DOM update for ${name} (HTML identical)`);
											}
										}
								});
						});
				}
		}

    /**
     * Renders content (HTML string or DOM node) into a target element.
     * @param {HTMLElement} targetElement - The element to render into.
     * @param {string | Node | Node[]} content - The content to render.
     */
    function renderContent(targetElement, content) {
        if (typeof content === 'string') {
            targetElement.innerHTML = content; // WARNING: Potential XSS risk if content is user-generated. Sanitize if necessary.
        } else if (content instanceof Node) {
            targetElement.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(node => {
                if (node instanceof Node) {
                    targetElement.appendChild(node);
                }
            });
        }
    }

		/**
		 * Scans the DOM subtree for elements with specific data attributes
		 * and attaches event listeners *directly* to those elements.
		 * Example: <button data-onclick="handleButtonClick">Click Me</button>
		 * Assumes handler functions are globally accessible (window[handlerName]).
		 *
		 * @param {HTMLElement} elementToScan - The element to start scanning from.
		 */
		function scanAndAttachListeners(elementToScan, elementToExclude = null) {
			// console.log('Scanning and attaching listeners within:', elementToScan);
			const eventTypes = ['onclick', 'oninput', 'onchange', 'onsubmit']; // Add more as needed

			eventTypes.forEach(eventType => {
					const attributeName = `data-${eventType}`; // e.g., data-onclick
					const eventName = eventType.substring(2); // e.g., click

					// Query within the specified element
					const elementsWithAttribute = elementToScan.querySelectorAll(`[${attributeName}]`);

					elementsWithAttribute.forEach(element => {
							// Skip if the element is the excluded one or is inside it
							if (elementToExclude && (element === elementToExclude || elementToExclude.contains(element))) {
									return;
							}

							const handlerName = element.getAttribute(attributeName);
							if (handlerName) {
									// Find the handler function (still basic global lookup)
									const handlerFn = window[handlerName];

									if (typeof handlerFn === 'function') {
											// Check if listener already exists
											const listenerKey = `__bfmjf_${eventName}_${handlerName}`;
											if (!element[listenerKey]) {
													const eventHandler = (event) => {
															// Check if the element still exists in the DOM before calling handler
															if (document.body.contains(element)) { 
																	handlerFn(event, getState());
															} else {
																	// Optionally remove the listener reference if element is gone
																	// delete element[listenerKey]; 
															}
													};
													element.addEventListener(eventName, eventHandler);
													element[listenerKey] = eventHandler; // Mark as attached
													// console.log(`Attached direct listener ${eventName} to`, element);
											} else {
													// console.log(`Skipping duplicate listener ${eventName} on`, element);
											}
									} else {
											console.warn(`Handler function '${handlerName}' not found for ${attributeName} on element:`, element);
									}
							}
					});
					
					// Also check the root elementToScan itself, unless it's the excluded element
					if (elementToScan.matches(`[${attributeName}]`) && elementToScan !== elementToExclude) {
							const handlerName = elementToScan.getAttribute(attributeName);
							if (handlerName) {
									const handlerFn = window[handlerName];
									if (typeof handlerFn === 'function') {
											const listenerKey = `__bfmjf_${eventName}_${handlerName}`;
											if (!elementToScan[listenerKey]) {
													const eventHandler = (event) => {
															if (document.body.contains(elementToScan)) { 
																	handlerFn(event, getState());
															} 
													};
													elementToScan.addEventListener(eventName, eventHandler);
													elementToScan[listenerKey] = eventHandler;
											}
									} else {
											console.warn(`Handler function '${handlerName}' not found for ${attributeName} on element:`, elementToScan);
									}
							}
					}
			});
		}


    // Public API
    return {
        registerComponent,
        setInitialState,
        setState,
        getState,
        renderApp,
				renderContent,
        components,
        componentDependencies // Expose for potential debugging/extension
    };
})();

// Make it globally accessible (or use modules in a real build setup)
window.BFMJF = BFMJF;

console.log('BFMJF (Blazing Fast Modern JavaScript Framework) Loaded.'); 