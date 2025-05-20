# Text-Engine-2
A text-based RPG engine that runs entirely in the browser.
Due to browser security rules around JavaScript modules, you need to serve the
`public` folder over HTTP. From inside `public` run `python3 -m http.server`
and then open the printed `http://localhost:8000/` URL in your browser.


Recommended Language and Stack for Browser Deployment
For a web-deployable game engine on itch.io, TypeScript (transpiling to JavaScript) is the top recommendation. Itch.io requires HTML5 web technologies for in-browser games – essentially HTML, JavaScript, and CSS
itch.io
. This means the game engine must run client-side in the browser. While OpenAI Codex is strongest in Python and supports many languages (including JavaScript and TypeScript)
emelia.io
, using Python for a browser game would require extra frameworks (e.g. PyScript or compiling to WebAssembly), adding complexity. In contrast, TypeScript/JavaScript runs natively in browsers and is directly supported on itch.io as an HTML5 game
itch.io
. TypeScript offers static typing which is valuable when coding with an AI assistant. Codex can leverage TypeScript’s compiler to catch errors and enforce interfaces during generation (the Codex agent can run linters and type-checkers in its sandbox
openai.com
). This means Codex can automatically correct many mistakes before runtime. The static types improve reliability and maintainability for a large project, which is why even OpenAI’s own Codex CLI tool was written in TypeScript (for its familiarity and reliability with complex projects) – static typing helps ensure correctness during AI-driven development. In practice, Codex is proficient at generating TypeScript code and adhering to type definitions, given clear instructions
emelia.io
. JavaScript (ES6+) is an alternative if you prefer no compile step, but you would lose the safety net of the TypeScript compiler. Stack recommendation: Use TypeScript for the engine logic, organize the code into modules (as outlined by the engine’s design), and use Node.js tooling for development (to bundle or transpile TS to JS). You can set up a simple build process (e.g. using tsc or a bundler like Webpack/Rollup) to produce a single JavaScript bundle and an index.html file that loads the game. This aligns with itch.io’s upload format – a ZIP containing index.html and all compiled JS/CSS assets
itch.io
. The engine itself should be framework-agnostic (headless), exposing an API that a web UI (HTML/JS frontend) can call. For the UI, you can use plain HTML/JavaScript or a framework if desired, but the key is that the engine runs entirely in the browser. Why not Python? Codex’s strength in Python is noted
emelia.io
, but running Python in-browser is non-trivial (it would require tools like Pyodide or converting Python to JS). There are projects to get Python games running via WebAssembly or PyScript, but they are not as mature and straightforward
gamedev.stackexchange.com
. Given the project’s scope and Codex’s ability to handle TypeScript well, sticking to a JavaScript-based stack is the most pragmatic choice for itch.io deployment. This ensures the engine can be played by users on the web with no extra installations, and leverages Codex’s coding proficiency under conditions (web context + static typing) that play to its strengths.

## Running Locally

To run this project locally:
1. Ensure you have Python installed and available in your system's PATH.
2. Double-click the `run.bat` file in the root directory of the project.
3. This will start a local web server and should automatically open the game in your default web browser at `http://localhost:8000`.
4. If the game doesn't open automatically, navigate to `http://localhost:8000` in your browser.
5. To stop the server, close the command prompt window that was opened by `run.bat`.
