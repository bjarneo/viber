# BFMJF - Blazing Fast Modern JavaScript Framework 🚀 (Totally Not a Joke)

Look, we all know the modern JavaScript ecosystem is... a lot. Frameworks popping up left and right, promising the world. Well, step aside, giants! BFMJF is here. It's **blazing fast** (because it does almost nothing!), **modern** (it uses JavaScript!), and provides a **developer experience** so great, you'll... probably still reach for React later. But hey, let's have some fun! 🥳

## What is BFMJF? 🤔

BFMJF is the revolutionary framework you never knew you needed (and probably still don't). It's built with pure, artisanal vanilla JavaScript to prove that sometimes, the old ways are... well, they exist. Forget virtual DOMs, complex build tools, and TypeScript (who needs types anyway? 🤷). BFMJF offers:

*   **Component-Based Structure:** Like Lego, but for your UI, and way less painful to step on.
*   **Centralized State Management:** One global object to rule them all. Simple! What could possibly go wrong?
*   **Declarative Event Handling:** Slap some `data-on*` attributes on your HTML. It's basically magic ✨.
*   **"Efficient" DOM Updates:**
    *   *Actually* tracks dependencies! (Okay, this part is kinda neat). It uses regex sorcery 🧙‍♂️ to see what state keys your component *might* be using.
    *   Only re-runs render functions if their precious state keys *actually* change.
    *   Only touches the *real* DOM if the HTML has changed (mostly).
    *   Heroically attempts to prevent your `<input>` fields from having an identity crisis (losing focus) on every keystroke. 🛡️

## How to Run This Masterpiece 🛠️

Prepare for unparalleled web performance:

1.  Get the code. Clone it, download it, carrier pigeon it – whatever works.
2.  Find `index.html`.
3.  Double-click it. Yes, really. Welcome back to 2005. No `npm install`, no `webpack`, no waiting. Just pure, unadulterated web.

## Key Files (The Guts)

*   **`index.html`**: The star of the show. Holds the basic HTML structure, some CSS that tries its best, and the crucial `<script>` tags. `<div id="app"></div>` is where the magic happens.
*   **`framework.js`**: The secret sauce. The BFMJF core. An IIFE that bravely attaches itself to `window.BFMJF`.
*   **`app.js`**: Your playground. This is where you define your components, your event handlers (also bravely attached to `window`), and kick things off.

## Framework Concepts (The Real Docs, Kinda)

Okay, buckle up. Here's how you actually wield the mighty BFMJF:

### 1. State Management 🧠

Everything revolves around a single global state object. Simple, right?

*   **`BFMJF.setInitialState(initialState)`**: Call this first! Give it an object with all your starting data.

    ```javascript
    // Inside app.js, within DOMContentLoaded
    BFMJF.setInitialState({
        count: 0,
        userMessage: 'Hello BFMJF!'
    });
    ```

*   **`BFMJF.setState(changes)`**: The engine of change. Call this to update the state. It triggers the magic re-render cycle.
    *   **Pass an object:** Only include the keys you're changing. BFMJF performs a *deep merge*.
        ```javascript
        // Increment count
        BFMJF.setState({ count: BFMJF.getState().count + 1 });
        // Update message
        BFMJF.setState({ userMessage: 'New message!' });
        ```
    *   **Pass a function:** If your new state depends on the old state, pass a function. It receives the *current* state and should return an object with the changes.
        ```javascript
        // Increment count safely
        BFMJF.setState(prevState => ({
            count: prevState.count + 1
        }));
        ```
*   **`BFMJF.getState()`**: Need the current state? Call this. You get a *copy*, so don't try mutating it directly (use `setState`!).

### 2. Components 🧱

Break your UI into bite-sized pieces.

*   **`BFMJF.registerComponent(name, renderFn)`**: Tell the framework about your component.
    *   `name` (string): A unique identifier (e.g., `'MyButton'`, `'UserProfileCard'`).
    *   `renderFn` (function): Takes the global `state` object as input. **Must return an HTML string.**

    ```javascript
    // In app.js (global scope)
    BFMJF.registerComponent('GreetingWidget', (state) => {
        // Access relevant state keys
        const message = state.userMessage || 'Default Greeting';

        // Return an HTML string
        return `
            <div class="widget" data-component-type="GreetingWidget">
                <h3>Greeting</h3>
                <p>${message}</p>
            </div>
        `;
    });
    ```

*   **`data-component-type` Attribute**: It's highly recommended that the root element in your returned HTML string has `data-component-type="YourComponentName"`. This helps the framework find the component later for updates.
*   **Dependency Tracking**: The framework *tries* to figure out which `state.whatever` keys your `renderFn` uses by looking at its code string (using regex!). It checks for `state.key` and `{ key } = state` patterns. If it guesses right, it won't re-run your render function unless one of *those specific keys* changes via `setState`. Magic! ✨

### 3. Rendering 🎨

Getting stuff on the screen.

*   **`BFMJF.renderApp(rootElementId)`**: Kicks off the rendering process.
    *   **First time:** Finds all registered components, runs their `renderFn`, takes the resulting HTML strings, creates actual DOM elements, and plops them into the container element (default is `#app`). Attaches event listeners.
    *   **Subsequent times (after `setState`):** Figures out which state keys changed, checks which components *depend* on those keys (using the magic dependency tracking), and *only* re-runs the `renderFn` for those components. Compares the *new* HTML string to the component's *current* `innerHTML`. If they're different, it updates the DOM (unless an input inside has focus). Re-attaches listeners *only* within the updated component.

### 4. Event Handling ⚡️

Making things clickable (and typeable, etc.).

*   Use `data-on*` attributes in your component HTML:
    *   `data-onclick`: For clicks.
    *   `data-oninput`: For input/textarea changes.
    *   `data-onchange`: For changes (often on select, checkbox, radio).
    *   `data-onsubmit`: For form submissions.
*   The attribute value *must* be the **string name** of a function defined on the global `window` object in `app.js`.

    ```html
    <!-- Inside a component's returned HTML string -->
    <button data-onclick="handleButtonClick">Click Me</button>
    <input type="text" data-oninput="handleTextInput"> 
    ```

*   Define the corresponding handler function globally in `app.js`:

    ```javascript
    // In app.js (global scope)
    window.handleButtonClick = (event, state) => {
        console.log('Button clicked!', event.target);
        BFMJF.setState({ count: state.count + 1 });
    };

    window.handleTextInput = (event, state) => {
        console.log('Input value:', event.target.value);
        BFMJF.setState({ userMessage: event.target.value });
    };
    ```
*   Your handler function receives the standard `event` object first, and the current `state` object second.

## Included Demo Widgets (The Proof!) 🧪

Check out `app.js` to see these bad boys in action:

*   **Counter:** The "Hello, World!" of frameworks.
*   **Input Mirror:** Type stuff, see it appear elsewhere. Mesmerizing.
*   **Dynamic List:** Add items like it's 2010.
*   **GitHub User Info:** Actually talks to the internet! 😱 (Async/Await demo).
*   **Calculator:** Does math. Probably. Mostly.
*   **Color Picker:** Pretty colors! 🌈
*   **Countdown Timer:** Feel the pressure!
*   **Character Counter:** For the verbose among us.
*   **Persistent Note:** Uses localStorage to remember things. Spooky! 👻
*   **Unit Converter:** Celsius to Fahrenheit, because why not?
*   **Dice Roller:** For all your D&D needs (1d6 only).
*   **Password Generator:** Creates passwords! Use a real password manager though. Seriously.
*   **Accordion:** Hide and seek with content.

## Disclaimer

**This is just a joke.** BFMJF is not a real framework intended for serious use. It was created purely for humour, poking fun at the idea of easily "replacing" a complex library like React. **Do not use this in any real project.** 🙏 