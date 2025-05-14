/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { google } from "@ai-sdk/google";
import { generateText, type LanguageModelV1 } from "ai";
import type { Resume } from "./resumeTools";
import { DOMParser } from "xmldom";

const systemPrompt_Technical = `
You are an AI-powered interview question generation agent. You will receive a candidate's profile in JSON format, which includes their skills, work experience, education, and relevant technologies.

Your task is to generate a list of 20 technical interview questions tailored specifically to the candidate's profile. Focus on producing questions that align with the candidate's stated skills, technologies, and past roles. Include a mix of conceptual, practical, and scenario-based questions that assess both depth and applicability of knowledge.

Output the questions in the following XML format, where each \`<question>\` follows this structure:

<questions>
  <question>
    <text>...</text>
    <type>MULTIPLE_CHOICE | TRUE_FALSE</type>
    <maxScore>1 to 5</maxScore>
    <timeLimit>Optional, in seconds</timeLimit>
    <answer>TRUE | FALSE</answer>
    <options>
      <option>
        <label>Option text</label>
        <isCorrect>true or false</isCorrect>
      </option>
      ...
    </options>
  </question>
  ...
</questions>

Only include the \`<options>\` block if the question type is MULTIPLE_CHOICE.
The \`<answer>\` block is only required for TRUE_FALSE questions. 
The \`<timeLimit>\` block is optional and should be included if the question has a specific time limit.

Do not include any explanation, comments, or metadata. Output only a clean XML list of questions inside a root \`<questions>\` tag.

Begin generating the questions after this line.

Candidate Profile (JSON):

`;

const systemPrompt_HR = `
You are an AI-powered interview question generation agent. You will receive a candidate's profile in JSON format, which includes their skills, work experience, education, and relevant technologies.

Your task is to generate a list of 20 HR interview questions tailored specifically to the candidate's profile. Focus on producing questions that align with the candidate's stated skills, technologies, and past roles. Include a mix of conceptual, practical, and scenario-based questions that assess both depth and applicability of knowledge.

Output the questions in the following XML format, where each \`<question>\` follows this structure:

<questions>
  <question>
    <text>...</text>
    <type>MULTIPLE_CHOICE | TRUE_FALSE</type>
    <maxScore>1 to 5</maxScore>
    <timeLimit>Optional, in seconds</timeLimit>
    <answer>TRUE | FALSE</answer>
    <options>
      <option>
        <label>Option text</label>
        <isCorrect>true or false</isCorrect>
      </option>
      ...
    </options>
  </question>
  ...
</questions>

Only include the \`<options>\` block if the question type is MULTIPLE_CHOICE.
The \`<answer>\` block is only required for TRUE_FALSE questions. 
The \`<timeLimit>\` block is optional and should be included if the question has a specific time limit.

Do not include any explanation, comments, or metadata. Output only a clean XML list of questions inside a root \`<questions>\` tag.

Begin generating the questions after this line.

Candidate Profile (JSON):
`;

export async function generateQuestions(
  type: "HR" | "Technical",
  profile: Resume,
) {
  const systemPrompt = type === "HR" ? systemPrompt_HR : systemPrompt_Technical;

  const model = google("gemini-2.5-pro-exp-03-25") as LanguageModelV1;

  console.log("Generating questions for profile:", profile);

  // const response = await generateText({
  //   model,
  //   messages: [
  //     {
  //       role: "system",
  //       content: systemPrompt,
  //     },
  //     {
  //       role: "user",
  //       content: JSON.stringify(profile),
  //     },
  //   ],
  // });

  const response = {
    text: `<questions>
  <question>
    <text>In your Next.js project implementing WebAuthn passkeys, what are the key considerations for server-side validation of the authentication assertion?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>4</maxScore>
    <options>
      <option>
        <label>Relying solely on client-side validation for speed.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Verifying the signature, challenge, origin, and relying party ID.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>Storing private keys on the client-side for easier access.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Skipping counter checks to improve performance.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>When migrating your internal tool from ASP.NET and Razor to Vue.js 3, what was a significant advantage of using Vue.js 3's Composition API compared to the Options API for managing component logic?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <options>
      <option>
        <label>Better organization of code by logical concern and improved reusability with composables.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>Stricter type checking, as Composition API is exclusive to TypeScript.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Simpler integration with legacy ASP.NET backend services.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Automatic state management without needing Pinia or Vuex.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>The \`async/await\` syntax in JavaScript fundamentally changes how asynchronous code is executed, making it synchronous.</text>
    <type>TRUE_FALSE</type>
    <maxScore>2</maxScore>
    <answer>FALSE</answer>
  </question>
  <question>
    <text>Which of the following React hooks is primarily used for managing state within a functional component?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>2</maxScore>
    <options>
      <option>
        <label>useEffect</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>useState</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>useContext</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>useRef</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>In Python, a \`tuple\` is mutable, meaning its elements can be changed after creation.</text>
    <type>TRUE_FALSE</type>
    <maxScore>1</maxScore>
    <answer>FALSE</answer>
  </question>
  <question>
    <text>Which statement best describes a key difference between MongoDB and MySQL?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <options>
      <option>
        <label>MongoDB is a relational database, while MySQL is a NoSQL database.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>MySQL uses a flexible schema-less document model, while MongoDB enforces a strict schema.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>MongoDB is typically better suited for unstructured or semi-structured data, while MySQL excels with structured data and complex joins.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>Both MongoDB and MySQL primarily store data in tables with rows and columns.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>What is the primary purpose of the \`git rebase\` command?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <options>
      <option>
        <label>To merge two branches together, creating a merge commit.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>To temporarily store uncommitted changes.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>To reapply commits from one branch onto another, often to maintain a linear history.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>To delete a branch.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>Docker containers share the host operating system's kernel.</text>
    <type>TRUE_FALSE</type>
    <maxScore>2</maxScore>
    <answer>TRUE</answer>
  </question>
  <question>
    <text>In an Express.js application, middleware functions have access to which of the following objects?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <timeLimit>60</timeLimit>
    <options>
      <option>
        <label>Only the request object.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Only the response object.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>The request object, the response object, and the next middleware function in the application’s request-response cycle.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>The application instance and the router object.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>TypeScript's primary benefit over JavaScript is its ability to run directly in web browsers without any compilation step.</text>
    <type>TRUE_FALSE</type>
    <maxScore>2</maxScore>
    <answer>FALSE</answer>
  </question>
  <question>
    <text>Which CSS property is most commonly used to control the stacking order of positioned elements?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>2</maxScore>
    <options>
      <option>
        <label>display</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>position</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>z-index</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>float</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>Amazon S3 (Simple Storage Service) is primarily used for running application code and managing virtual servers.</text>
    <type>TRUE_FALSE</type>
    <maxScore>2</maxScore>
    <answer>FALSE</answer>
  </question>
  <question>
    <text>Which statement accurately describes a difference between Django and Flask?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <options>
      <option>
        <label>Flask is a full-stack framework with a built-in ORM and admin panel, while Django is a micro-framework.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Django follows the "batteries-included" philosophy, providing many built-in features, whereas Flask is more minimalist and extensible.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>Django is primarily used for building APIs, while Flask is better for traditional web applications.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Flask requires Python 2, while Django supports Python 3 only.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>During your internship, when migrating a data visualization application to Vue.js using the Syncfusion library, what was a key challenge or benefit you encountered specifically related to using Syncfusion components?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>4</maxScore>
    <options>
      <option>
        <label>Syncfusion components were difficult to customize and did not integrate well with Vue.js 3's reactivity system.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>The extensive documentation and wide range of components in Syncfusion simplified the migration and enhanced visualization capabilities.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>Syncfusion significantly increased the bundle size, negatively impacting performance despite other improvements.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>The licensing costs for Syncfusion were a major blocker for the project.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>The &lt;article&gt; HTML element is semantically appropriate for self-contained compositions like a blog post, forum post, or newspaper article.</text>
    <type>TRUE_FALSE</type>
    <maxScore>1</maxScore>
    <answer>TRUE</answer>
  </question>
  <question>
    <text>You are building a Next.js application that requires some pages to be server-side rendered (SSR) for SEO and initial load performance, while others can be client-side rendered (CSR). How would you typically achieve this distinction in Next.js?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>4</maxScore>
    <timeLimit>90</timeLimit>
    <options>
      <option>
        <label>By using \`useEffect\` for SSR pages and \`useState\` for CSR pages.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>By implementing \`getServerSideProps\` for pages requiring SSR and relying on default behavior (or \`getStaticProps\` with client-side fetching) for CSR.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>By configuring different Webpack loaders for SSR and CSR routes.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>All pages in Next.js are SSR by default; CSR is not an option.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>In Java, the \`final\` keyword can be used with variables, methods, and classes. What is the effect of using \`final\` with a class?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <options>
      <option>
        <label>It ensures that all methods in the class are automatically \`final\`.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>It prevents the class from being instantiated.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>It prevents the class from being subclassed (inherited).</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>It makes all variables within the class immutable by default.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>In C programming, \`malloc()\` and \`calloc()\` are used for dynamic memory allocation. A key difference is that \`calloc()\` initializes the allocated memory to zero, while \`malloc()\` does not.</text>
    <type>TRUE_FALSE</type>
    <maxScore>2</maxScore>
    <answer>TRUE</answer>
  </question>
  <question>
    <text>During the migration of the data visualization application from ASP.NET Razor to Vue.js, if you encountered a complex UI component that was tightly coupled with Razor's server-side logic, what would be a primary strategy in Vue.js to rebuild it effectively?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>4</maxScore>
    <options>
      <option>
        <label>Attempt to directly embed Razor partial views within Vue components.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Replicate the exact DOM structure and event handling using vanilla JavaScript within Vue.</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>Break down the component into smaller, reusable Vue components, manage state with Vue's reactivity system, and fetch necessary data via APIs.</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>Use an iframe to load the old Razor component within the Vue application.</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
  <question>
    <text>To incorporate the latest changes from the \`main\` branch into your current feature branch (\`my-feature\`) while aiming for a linear history, which Git command is most appropriate after fetching the latest updates?</text>
    <type>MULTIPLE_CHOICE</type>
    <maxScore>3</maxScore>
    <timeLimit>75</timeLimit>
    <options>
      <option>
        <label>git merge main (on \`my-feature\` branch)</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>git rebase main (on \`my-feature\` branch)</label>
        <isCorrect>true</isCorrect>
      </option>
      <option>
        <label>git checkout main then git merge my-feature</label>
        <isCorrect>false</isCorrect>
      </option>
      <option>
        <label>git revert &lt;last-commit-on-main&gt;</label>
        <isCorrect>false</isCorrect>
      </option>
    </options>
  </question>
</questions>`,
  };

  if (!response) {
    throw new Error("Failed to generate questions");
  }

  console.log("Response received:", response.text);

  const xml = response.text;

  const xmlMatch = /<questions[\s\S]*<\/questions>/.exec(xml);
  if (!xmlMatch) {
    throw new Error("No valid XML found in the response.");
  }

  const xmlString = xmlMatch[0];

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parseError) {
    throw new Error("Error parsing XML: " + parseError.textContent);
  }

  // Helper function to get text content of an element
  const getTextContent = (parent: Element, tag: string): string | undefined => {
    const element = parent.getElementsByTagName(tag)[0];
    return element ? (element.textContent ?? undefined) : undefined;
  };

  const root = xmlDoc.getElementsByTagName("questions")[0];
  if (!root) {
    throw new Error("No <resume> element found in the XML.");
  }

  const questions: {
    text: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    answer?: boolean;
    maxScore: number;
    timeLimit?: number;
    options?: { label: string; isCorrect: boolean }[];
  }[] = [];

  const questionElements = root.getElementsByTagName("question");
  for (let i = 0; i < questionElements.length; i++) {
    const questionElement = questionElements[i]!;
    const text = getTextContent(questionElement, "text");
    const type = getTextContent(questionElement, "type");
    const maxScore = parseInt(
      getTextContent(questionElement, "maxScore") ?? "0",
      10,
    );
    const timeLimit =
      parseInt(getTextContent(questionElement, "timeLimit") ?? "0", 10) ||
      undefined;

    if (!text || !type) {
      throw new Error("Invalid question format");
    }

    const options: { label: string; isCorrect: boolean }[] | undefined =
      type === "MULTIPLE_CHOICE"
        ? Array.from(questionElement.getElementsByTagName("option")).map(
            (option) => ({
              label: getTextContent(option, "label") ?? "",
              isCorrect:
                option.getElementsByTagName("isCorrect")[0]!.textContent ===
                "true",
            }),
          )
        : undefined;

    const answer =
      type === "TRUE_FALSE"
        ? questionElement
            .getElementsByTagName("answer")[0]
            ?.textContent?.toLowerCase() === "true"
        : undefined;

    questions.push({
      text,
      type: type as "MULTIPLE_CHOICE" | "TRUE_FALSE",
      answer,
      maxScore,
      timeLimit,
      options,
    });
  }

  return questions;
}
