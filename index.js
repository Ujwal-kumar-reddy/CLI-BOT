import "dotenv/config";
import { OpenAI } from "openai";
import fs from "fs";
import readline from "readline";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

/**
 * TOOL: Writes the generated HTML content to a file.
 * This is the core 'Action' for the Website Cloner project.
 */
async function createFile(filename, content) {
    try {
        fs.writeFileSync(filename, content);
        return `SUCCESS: High-fidelity file ${filename} generated.`;
    } catch (err) {
        return `ERROR: ${err.message}`;
    }
}


const system_prompt = `
You are a Senior UI/UX Engineer Agent. Your mission is to clone the Scaler Academy Dashboard into a SINGLE 'working.html' file with pixel-perfect accuracy.

STRICT UI REQUIREMENTS:
1. Framework: Utilize Tailwind CSS via CDN. Integrate 'Inter' Google Font for a premium feel.
2. Layout Engine: You MUST use a Grid-based architecture (grid-cols-12) to separate the Sidebar from the Main Content. Never use absolute positioning for layout.
3. Spacing: Apply generous, consistent padding (p-6 to p-10) and gaps (gap-8) to prevent elements from touching or overlapping.
4. Component Design: 
   - Cards: White background, rounded-2xl corners, subtle shadow-xl, and hover:scale-[1.02] transitions.
   - Header: Sticky top-0, z-50, glassmorphism effect (bg-white/80 backdrop-blur-md).
5. Data Injection: Use actual names provided (e.g., 'Ujwal', 'Perceptron to MLP')—do NOT use placeholders like [Name].

EXECUTION RULES:
- Provide the ENTIRE source code in ONE 'createFile' call. 
- If the layout is complex, prioritize clean Grid columns over deep nesting.
- Respond ONLY in this JSON format:
{"step": "THINK", "content": "Visualizing the 12-column grid and card components..."}
{"step": "TOOL", "tool_name": "createFile", "tool_args": ["working.html", "FULL_MINIFIED_HTML_HERE"]}
{"step": "OUTPUT", "content": "Deployment successful."}
`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function runAgent() {
    console.log("\n--- AGENT ONLINE: READY TO CLONE SCALER DASHBOARD ---");
    rl.question("\nEnter Dashboard Requirements: ", async (input) => {
        let messages = [
            { role: "system", content: system_prompt },
            { role: "user", content: input }
        ];

        while (true) {
            try {
                const response = await client.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.1, // High precision
                    max_tokens: 4000  // Ensures the full HTML code fits
                });

                const content = response.choices[0].message.content;
                const aiRes = JSON.parse(content);
                messages.push({ role: "assistant", content: content });

                if (aiRes.step === "THINK") {
                    console.log(`\n[PLANNING]: ${aiRes.content}`);
                } 
                else if (aiRes.step === "TOOL") {
                    console.log(`[ACTION]: Writing High-Fidelity UI to working.html...`);
                    const result = await createFile(aiRes.tool_args[0], aiRes.tool_args[1]);
                    console.log(`[OBSERVE]: ${result}`);
                    messages.push({ role: "user", content: JSON.stringify({ step: "OBSERVE", content: result }) });
                } 
                else if (aiRes.step === "OUTPUT") {
                    console.log(`\n[SUCCESS]: ${aiRes.content}`);
                    console.log("\n--- Task Finished! Open working.html to see the result ---");
                    process.exit();
                }
            } catch (error) {
                console.error("\n[CRITICAL ERROR]:", error.message);
                process.exit(1);
            }
        }
    });
}

runAgent();