/**
 * Application logic using the BFMJF framework
 */

// --- Global Event Handlers (accessible via window[handlerName]) ---
// Define handlers in the global scope so they exist when scanAndAttachListeners runs initially.

// Original Handlers
window.incrementCounter = (event, state) => {
    console.log("Incrementing counter");
    BFMJF.setState(prevState => ({ counter: prevState.counter + 1 }));
};
window.decrementCounter = (event, state) => {
    console.log("Decrementing counter");
    BFMJF.setState(prevState => ({ counter: prevState.counter - 1 }));
};
window.updateMirrorText = (event, state) => {
    console.log("Updating mirror text:", event.target.value);
    BFMJF.setState({ mirrorText: event.target.value });
};
window.addItemToList = (event, state) => {
    const newItemInput = document.getElementById('newItemInput');
    if (newItemInput && newItemInput.value.trim()) {
        console.log("Adding item:", newItemInput.value);
        BFMJF.setState(prevState => ({
            items: [...prevState.items, newItemInput.value.trim()]
        }));
        newItemInput.value = ''; // Clear input after adding
    } else {
        console.log("No item text entered.");
    }
};
window.handleFetchGitHubUser = (event, state) => {
    console.log("DEBUG: handleFetchGitHubUser triggered.");
    const usernameInput = document.getElementById('githubUsernameInput');
    const username = usernameInput ? usernameInput.value.trim() : '';
    if (username) {
         console.log(`DEBUG: Calling fetchGitHubUser with username: ${username}`);
         fetchGitHubUser(username);
    } else {
        console.warn("GitHub username input is empty.");
        BFMJF.setState({ githubUser: null, githubUserError: "Please enter a GitHub username.", githubUserLoading: false });
    }
};

// New Widget Handlers
window.handleFetchQuote = () => fetchRandomQuote();
window.handleCalculatorInput = (event, state) => {
    const { value } = event.target;
    const { display, firstOperand, operator, waitingForSecondOperand } = state.calculator;
    if (value === '.') {
        if (display.includes('.')) return;
        BFMJF.setState(s => ({ calculator: { ...s.calculator, display: display + '.' } }));
    } else if (value === '+' || value === '-' || value === '*' || value === '/') {
        if (operator && waitingForSecondOperand) {
            BFMJF.setState(s => ({ calculator: { ...s.calculator, operator: value } }));
            return;
        }
        if (firstOperand == null) {
            BFMJF.setState(s => ({ calculator: { ...s.calculator, firstOperand: parseFloat(display) } }));
        } else if (operator) {
            const result = performCalculation(state.calculator);
            BFMJF.setState(s => ({ calculator: { ...s.calculator, display: String(result), firstOperand: result } }));
        }
        BFMJF.setState(s => ({ calculator: { ...s.calculator, waitingForSecondOperand: true, operator: value } }));
    } else if (value === '=') {
        if (operator && firstOperand != null) {
            const result = performCalculation(state.calculator);
            BFMJF.setState(s => ({ calculator: { ...s.calculator, display: String(result), firstOperand: result, operator: null, waitingForSecondOperand: false } }));
        }
    } else if (value === 'C') {
        BFMJF.setState({ calculator: { display: '0', firstOperand: null, operator: null, waitingForSecondOperand: false } });
    } else { // Digit input
        if (waitingForSecondOperand) {
            BFMJF.setState(s => ({ calculator: { ...s.calculator, display: value, waitingForSecondOperand: false } }));
        } else {
            const newDisplay = display === '0' ? value : display + value;
            BFMJF.setState(s => ({ calculator: { ...s.calculator, display: newDisplay } }));
        }
    }
};
window.handleColorChange = (event, state) => {
    BFMJF.setState({ colorPickerValue: event.target.value });
};
let countdownInterval = null; // Keep interval ID outside handler
window.handleTimerInput = (event, state) => {
    const newTotal = parseInt(event.target.value, 10) || 0;
    if (!state.countdown.isActive) {
         BFMJF.setState({ countdown: { ...state.countdown, totalSeconds: newTotal, remaining: newTotal } });
    }
};
window.toggleTimer = (event, state) => {
    if (state.countdown.isActive) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        BFMJF.setState({ countdown: { ...state.countdown, isActive: false } });
    } else {
        if(state.countdown.remaining <= 0) {
             BFMJF.setState({ countdown: { ...state.countdown, remaining: state.countdown.totalSeconds } });
        }
        BFMJF.setState({ countdown: { ...state.countdown, isActive: true } });
        countdownInterval = setInterval(() => {
            BFMJF.setState(s => {
                const newRemaining = s.countdown.remaining - 1;
                if (newRemaining <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    return { countdown: { ...s.countdown, remaining: 0, isActive: false } };
                }
                return { countdown: { ...s.countdown, remaining: newRemaining } };
            });
        }, 1000);
    }
};
window.handleCharCountInput = (event, state) => {
    BFMJF.setState({ charCountText: event.target.value });
};
window.handleNoteInput = (event, state) => {
    const newNote = event.target.value;
    BFMJF.setState({ localStorageNote: newNote });
    localStorage.setItem('bfmjf_note', newNote);
};
window.handleCelsiusInput = (event, state) => {
    const celsius = event.target.value;
    if (celsius === '' || isNaN(parseFloat(celsius))) {
        BFMJF.setState({ unitConverter: { celsius: celsius, fahrenheit: '' } });
    } else {
        const f = (parseFloat(celsius) * 9/5) + 32;
        BFMJF.setState({ unitConverter: { celsius: celsius, fahrenheit: f.toFixed(2) } });
    }
};
window.handleFahrenheitInput = (event, state) => {
    const fahrenheit = event.target.value;
     if (fahrenheit === '' || isNaN(parseFloat(fahrenheit))) {
        BFMJF.setState({ unitConverter: { celsius: '', fahrenheit: fahrenheit } });
    } else {
        const c = (parseFloat(fahrenheit) - 32) * 5/9;
        BFMJF.setState({ unitConverter: { celsius: c.toFixed(2), fahrenheit: fahrenheit } });
    }
};
window.rollDice = () => {
    const result = Math.floor(Math.random() * 6) + 1;
    BFMJF.setState({ diceResult: `You rolled a ${result}` });
};
window.generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 14; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    BFMJF.setState({ generatedPassword: password });
};
window.toggleAccordion = () => {
    BFMJF.setState(s => ({ accordionOpen: !s.accordionOpen }));
};

// --- Helper Functions ---
// Define these globally too, or ensure they are defined before use
function performCalculation({ firstOperand, secondOperand, operator, display }) {
    const input = parseFloat(display);
    if (operator === '+') return firstOperand + input;
    if (operator === '-') return firstOperand - input;
    if (operator === '*') return firstOperand * input;
    if (operator === '/') return firstOperand / input;
    return input;
}
async function fetchGitHubUser(username = 'torvalds') {
    console.log(`DEBUG: fetchGitHubUser function started for ${username}`);
    BFMJF.setState({ githubUser: null, githubUserLoading: true, githubUserError: null });
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("GitHub user data fetched:", data);
        BFMJF.setState({ githubUser: data, githubUserLoading: false });
    } catch (error) {
        console.error("Error fetching GitHub user:", error);
        BFMJF.setState({ githubUserError: error.message, githubUserLoading: false, githubUser: null });
    }
}
function loadNote() {
    const savedNote = localStorage.getItem('bfmjf_note');
    if (savedNote) {
        BFMJF.setState({ localStorageNote: savedNote });
    } else {
        BFMJF.setState({ localStorageNote: 'Type your persistent note here...'});
    }
}


// --- Component Definitions ---
// Define these globally before they are needed by the initial render logic inside DOMContentLoaded

BFMJF.registerComponent('CounterWidget', (state) => {
    return `
        <div class="widget" data-component-type="CounterWidget">
            <h3>Counter</h3>
            <p>Current count: <strong>${state.counter}</strong></p>
            <button data-onclick="incrementCounter">Increment</button>
            <button data-onclick="decrementCounter">Decrement</button>
        </div>
    `;
});
BFMJF.registerComponent('InputMirrorWidget', (state) => {
    return `
        <div class="widget" data-component-type="InputMirrorWidget">
            <h3>Input Mirror</h3>
            <input type="text" placeholder="Type here..." value="${state.mirrorText}" data-oninput="updateMirrorText">
            <p>Mirrored text: <pre>${state.mirrorText}</pre></p>
        </div>
    `;
});
BFMJF.registerComponent('ListWidget', (state) => {
    const listItems = state.items.map(item => `<li>${item}</li>`).join('');
    return `
        <div class="widget" data-component-type="ListWidget">
            <h3>Dynamic List</h3>
            <input type="text" id="newItemInput" placeholder="New item...">
            <button data-onclick="addItemToList">Add Item</button>
            <ul>
                ${listItems || '<li>No items yet.</li>'}
            </ul>
        </div>
    `;
});
BFMJF.registerComponent('GitHubUserWidget', (state) => {
    const { githubUser, githubUserLoading, githubUserError } = state;
    const currentDisplayUser = githubUserLoading 
        ? (document.getElementById('githubUsernameInput')?.value || '...')
        : (githubUser ? githubUser.login : 'N/A'); 

    let content = '';
    if (githubUserLoading) {
        content = '<p>Loading GitHub user data...</p>';
    } else if (githubUserError) {
        content = `<p style="color: red;">Error: ${githubUserError}</p>`;
    } else if (githubUser) {
        content = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${githubUser.avatar_url}" alt="Avatar for ${githubUser.login}" width="60" height="60" style="border-radius: 50%;">
                <div>
                    <strong>${githubUser.name || githubUser.login}</strong> (${githubUser.login})<br>
                    Bio: ${githubUser.bio || 'N/A'}<br>
                    Location: ${githubUser.location || 'N/A'}<br>
                    Company: ${githubUser.company || 'N/A'}<br>
                    Followers: ${githubUser.followers}
                </div>
            </div>
        `;
    } else {
         content = '<p>Click the button to load user data.</p>';
    }

    return `
        <div class="widget" data-component-type="GitHubUserWidget">
            <h3>GitHub User Info</h3>
            <div>
                <input type="text" 
                       id="githubUsernameInput"
                       placeholder="Enter GitHub username..." />
                <button data-onclick="handleFetchGitHubUser" ${githubUserLoading ? 'disabled' : ''}>
                    ${githubUserLoading ? 'Fetching...' : 'Fetch User'}
                </button>
            </div>
            <hr style="margin: 15px 0;">
            <h4>Showing data for: ${currentDisplayUser}</h4>
            ${content}
        </div>
    `;
});

BFMJF.registerComponent('CalculatorWidget', (state) => {
    const { display } = state.calculator;
    const buttons = ['7', '8', '9', '/', '4', '5', '6', '*' ,'1', '2', '3', '-', '0', '.', '=', '+', 'C'];
    const buttonHtml = buttons.map(btn => `<button data-onclick="handleCalculatorInput" value="${btn}" style="min-width: 40px; margin: 2px;">${btn}</button>`).join('');
    return `
        <div class="widget" data-component-type="CalculatorWidget">
            <h3>Calculator</h3>
            <input type="text" value="${display}" style="width: 95%; text-align: right; margin-bottom: 5px;" readonly>
            <div>${buttonHtml}</div>
        </div>
    `;
});
BFMJF.registerComponent('ColorPickerWidget', (state) => {
    const color = state.colorPickerValue;
    return `
        <div class="widget" data-component-type="ColorPickerWidget">
            <h3>Color Picker</h3>
            <input type="color" value="${color}" data-oninput="handleColorChange">
            <span style="margin-left: 10px;">Selected: ${color}</span>
            <div style="width: 100px; height: 50px; background-color: ${color}; margin-top: 10px; border: 1px solid #ccc;"></div>
        </div>
    `;
});
BFMJF.registerComponent('CountdownTimerWidget', (state) => {
    const { totalSeconds, remaining, isActive } = state.countdown;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `
        <div class="widget" data-component-type="CountdownTimerWidget">
            <h3>Countdown Timer</h3>
            <div>
                 <label>Set seconds: </label>
                 <input type="number" value="${totalSeconds}" data-oninput="handleTimerInput" min="1" ${isActive ? 'disabled' : ''} style="width: 60px;">
            </div>
            <div style="font-size: 2em; margin: 10px 0;">${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</div>
            <button data-onclick="toggleTimer">${isActive ? 'Pause' : 'Start'}</button>
        </div>
    `;
});
BFMJF.registerComponent('CharCounterWidget', (state) => {
    const text = state.charCountText;
    const count = text.length;
    return `
        <div class="widget" data-component-type="CharCounterWidget">
            <h3>Character Counter</h3>
            <textarea data-oninput="handleCharCountInput" placeholder="Type something..." style="width: 95%; height: 60px;">${text}</textarea>
            <p>Character Count: ${count}</p>
        </div>
    `;
});
BFMJF.registerComponent('LocalStorageNoteWidget', (state) => {
     const note = state.localStorageNote;
    return `
        <div class="widget" data-component-type="LocalStorageNoteWidget">
            <h3>Persistent Note (Local Storage)</h3>
            <textarea data-oninput="handleNoteInput" style="width: 95%; height: 60px;">${note}</textarea>
            <p><small>This note will persist even if you close the browser tab.</small></p>
        </div>
    `;
});
BFMJF.registerComponent('UnitConverterWidget', (state) => {
    const { celsius, fahrenheit } = state.unitConverter;
    return `
        <div class="widget" data-component-type="UnitConverterWidget">
            <h3>Celsius <-> Fahrenheit</h3>
            <input type="number" value="${celsius}" data-oninput="handleCelsiusInput" placeholder="Celsius" style="width: 80px;">
            <span> = </span>
            <input type="number" value="${fahrenheit}" data-oninput="handleFahrenheitInput" placeholder="Fahrenheit" style="width: 80px;">
        </div>
    `;
});
BFMJF.registerComponent('DiceRollerWidget', (state) => {
    const result = state.diceResult;
    return `
        <div class="widget" data-component-type="DiceRollerWidget">
            <h3>Dice Roller (1d6)</h3>
            <p>Result: <strong>${result}</strong></p>
            <button data-onclick="rollDice">Roll</button>
        </div>
    `;
});
BFMJF.registerComponent('PasswordGeneratorWidget', (state) => {
    const password = state.generatedPassword;
    return `
        <div class="widget" data-component-type="PasswordGeneratorWidget">
            <h3>Password Generator</h3>
            <pre style="margin-bottom: 10px;">${password}</pre>
            <button data-onclick="generatePassword">Generate New</button>
        </div>
    `;
});
BFMJF.registerComponent('AccordionWidget', (state) => {
    const isOpen = state.accordionOpen;
    return `
        <div class="widget" data-component-type="AccordionWidget">
            <h3 style="cursor: pointer; display: flex; justify-content: space-between;" data-onclick="toggleAccordion">
                <span>Collapsible Section</span>
                <span>${isOpen ? '▲' : '▼'}</span>
            </h3>
            <div style="display: ${isOpen ? 'block' : 'none'}; margin-top: 10px;">
                This is the content of the accordion. It can be shown or hidden by clicking the title.
                You could put more complex components or information in here.
            </div>
        </div>
    `;
});

// Keep initialization logic inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing app state and rendering.");

    // --- Initialize Application State ---
    BFMJF.setInitialState({
        counter: 0,
        mirrorText: 'Hello BFMJF!',
        items: ['Initial Item 1', 'Initial Item 2'],
        githubUser: null,
        githubUserLoading: false,
        githubUserError: null,
        quoteData: { text: 'Click to fetch a quote', author: '...', loading: false, error: null },
        calculator: { display: '0', firstOperand: null, operator: null, waitingForSecondOperand: false },
        colorPickerValue: '#aabbcc',
        countdown: { totalSeconds: 60, remaining: 60, isActive: false },
        charCountText: '',
        localStorageNote: '',
        unitConverter: { celsius: '', fahrenheit: '' },
        diceResult: 'Roll the dice!',
        generatedPassword: '***',
        accordionOpen: false
    });

    // --- Initial Actions ---
    fetchGitHubUser('torvalds'); // Trigger initial fetch
    loadNote();                 // Load note from local storage

    // --- Initial Render ---
    BFMJF.renderApp('app'); // Render components into the DOM

    // --- Post-Render Setup ---
    const initialUsernameInput = document.getElementById('githubUsernameInput');
    if (initialUsernameInput) {
        initialUsernameInput.value = 'torvalds';
    }

    console.log("BFMJF Application Initialized!");
}); 