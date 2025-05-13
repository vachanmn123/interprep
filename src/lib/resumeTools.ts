/* eslint-disable @typescript-eslint/prefer-for-of */
import { generateText, type LanguageModelV1 } from "ai";
import { google } from "@ai-sdk/google";
import { DOMParser } from "xmldom";
import { s3Client } from "./s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import mammoth from "mammoth";
// @ts-expect-error - We have no types
import pdf from "pdf-parse/lib/pdf-parse";

const SUPPORTTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const systemPrompt = `
You are a resume parser, your job is to parse the given text content from a resume and provide the information in a well structured XML format. The following are the elements your XML can contain:

1. <firstname> and <lastname> as separate elements
2. <emails> which contains many <email> elements, as many as present
3. <contacts> which contains <phone> and <address> elements, as many as present
4. <links> which contains many <link> elements, as many as present (e.g. LinkedIn, GitHub, etc.)
5. <experiences> which contains many <experience> elements
6. <experience> which contains the following sub-elements:
    1. <title>
    2. <company>
    3. <startdate>
    4. <enddate>
    5. <location>
    6. <description> as a string with no sub-elements
7. <education> which contains many <degree> elements
8. <degree> which contains the following sub-elements:
    1. <title>
    2. <institution>
    3. <graduation>
    4. <specialization>
    5. <grade> (GPA or percentage)
9. <skills> which contains many <skill> elements
10. <skill> which contains the following sub-elements:
    1. <name>
    2. <type> which can be either technical or soft
11. <certifications> which contains many <certification> elements
12. <certification> which contains the following sub-elements:
    1. <title>
    2. <date>
    3. <issuer>
13. <languages> which contains many <language> elements
14. <language> which contains the following sub-elements:
    1. <name>
    2. <level>  one of native, fluent, intermediate or basic
15. <country> as a string of the 2 letter code with no sub-elements (e.g. US, CA, etc.)

Your output can leave out any of the elements that are not present in the input. For example, if there are no certifications in the resume, you can leave out the <certifications> element. If there are no skills, you can leave out the <skills> element.
The output must be valid XML with no other text. The root element must be a <resume> element.
`;
export type Resume = {
  firstname?: string;
  lastname?: string;
  country?: string;
  email?: string[];
  phone?: string[];
  address?: string[];
  links?: string[];
  experiences?: Experience[];
  education?: Degree[];
  skills?: Skill[];
  certifications?: Certification[];
  languages?: Language[];
};

type Experience = {
  title?: string;
  company?: string;
  startdate?: string;
  enddate?: string;
  location?: string;
  description?: string;
};

type Degree = {
  title?: string;
  institution?: string;
  graduation?: string;
  specialization?: string;
  // grade?: string;
};

type Skill = {
  name: string;
  type: "technical" | "soft";
};

type Certification = {
  title?: string;
  date?: string;
  issuer?: string;
};

type Language = {
  name: string;
  level: "native" | "fluent" | "intermediate" | "basic";
};

async function parseResume(resumeText: string): Promise<Resume> {
  const resp = await generateText({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    model: google("gemini-2.0-flash") as LanguageModelV1,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: resumeText.trim() },
    ],
  });
  const xml = resp.text;

  const xmlMatch = /<resume[\s\S]*<\/resume>/.exec(xml);
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

  const root = xmlDoc.getElementsByTagName("resume")[0];
  if (!root) {
    throw new Error("No <resume> element found in the XML.");
  }

  const newRes: Resume = {};

  // Parse simple fields
  newRes.firstname = getTextContent(root, "firstname");
  newRes.lastname = getTextContent(root, "lastname");

  // Parse emails, phones, addresses, and links
  newRes.email = [];
  newRes.phone = [];
  newRes.address = [];
  newRes.links = [];
  const contacts = root.getElementsByTagName("contacts");
  if (contacts.length > 0) {
    const contact = contacts[0];
    const phones = contact!.getElementsByTagName("phone");
    if (phones?.length > 0) {
      for (let i = 0; i < phones.length; i++) {
        const phoneNumber = phones[i]!.textContent;
        if (phoneNumber) {
          newRes.phone.push(phoneNumber);
        }
      }
    }
    const addresses = contact!.getElementsByTagName("address");
    if (addresses?.length > 0) {
      for (let i = 0; i < addresses.length; i++) {
        const addressText = addresses[i]!.textContent;
        if (addressText) {
          newRes.address.push(addressText);
        }
      }
    }
  }
  const emails = root.getElementsByTagName("emails");
  if (emails.length > 0) {
    const emailElements = emails[0]!.getElementsByTagName("email");
    for (let i = 0; i < emailElements.length; i++) {
      const emailText = emailElements[i]!.textContent;
      if (emailText) {
        newRes.email.push(emailText);
      }
    }
  }
  const links = root.getElementsByTagName("links");
  if (links.length > 0) {
    const linkElements = links[0]!.getElementsByTagName("link");
    for (let i = 0; i < linkElements.length; i++) {
      const linkText = linkElements[i]!.textContent;
      if (linkText) {
        newRes.links.push(linkText);
      }
    }
  }

  // Parse experiences
  newRes.experiences = [];
  const experiences = root.getElementsByTagName("experience");
  if (experiences?.length > 0) {
    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i]!;
      const newExp: Experience = {
        title: getTextContent(exp, "title"),
        company: getTextContent(exp, "company"),
        startdate: getTextContent(exp, "startdate"),
        enddate: getTextContent(exp, "enddate"),
        location: getTextContent(exp, "location"),
        description: getTextContent(exp, "description"),
      };
      newRes.experiences.push(newExp);
    }
  }

  // Parse education
  newRes.education = [];
  const degrees = root.getElementsByTagName("degree");
  if (degrees?.length > 0) {
    for (let i = 0; i < degrees.length; i++) {
      const deg = degrees[i]!;
      const newDeg: Degree = {
        title: getTextContent(deg, "title"),
        institution: getTextContent(deg, "institution"),
        graduation: getTextContent(deg, "graduation"),
        specialization: getTextContent(deg, "specialization"),
      };
      newRes.education.push(newDeg);
    }
  }

  // Parse skills
  newRes.skills = [];
  const skills = root.getElementsByTagName("skill");
  if (skills?.length > 0) {
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i]!;
      const newSkill: Skill = {
        name: getTextContent(skill, "name") ?? "",
        type: getTextContent(skill, "type") as "technical" | "soft",
      };
      newRes.skills.push(newSkill);
    }
  }

  // Parse certifications
  newRes.certifications = [];
  const certifications = root.getElementsByTagName("certification");
  if (certifications?.length > 0) {
    for (let i = 0; i < certifications.length; i++) {
      const cert = certifications[i]!;
      const newCert: Certification = {
        title: getTextContent(cert, "title"),
        date: getTextContent(cert, "date"),
        issuer: getTextContent(cert, "issuer"),
      };
      newRes.certifications.push(newCert);
    }
  }

  // Parse languages
  newRes.languages = [];
  const languages = root.getElementsByTagName("language");
  if (languages?.length > 0) {
    for (let i = 0; i < languages.length; i++) {
      const lang = languages[i]!;
      const newLang: Language = {
        name: getTextContent(lang, "name") ?? "",
        level: getTextContent(lang, "level") as
          | "native"
          | "fluent"
          | "intermediate"
          | "basic",
      };
      newRes.languages.push(newLang);
    }
  }

  // Parse country
  newRes.country = getTextContent(root, "country");

  return newRes;
}

async function parseResumeFromFile(resumeKey: string): Promise<Resume> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: resumeKey,
  });
  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error("No file found");
  }
  const fileType = response.ContentType;
  if (!fileType || !SUPPORTTED_FILE_TYPES.includes(fileType)) {
    throw new Error("Unsupported file type");
  }
  const reader = await response.Body.transformToByteArray();
  let resumeText = "";

  if (fileType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const pdfFile = await pdf(Buffer.from(reader));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const pdfText = pdfFile.text;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resumeText = pdfText;
  } else if (
    fileType === "application/msword" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    // You need to install mammoth: npm install mammoth
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(reader),
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    resumeText = result.value;
  } else if (fileType === "text/plain") {
    resumeText = Buffer.from(reader).toString("utf-8");
  } else {
    throw new Error("Unsupported file type");
  }

  return await parseResume(resumeText);
}

export { parseResumeFromFile };
