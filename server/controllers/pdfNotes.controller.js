import pdfParse from "pdf-parse-new";
import Notes from "../models/notes.model.js";
import UserModel from "../models/user.model.js";
import { generateGeminiResponse } from "../services/gemini.services.js";

export const generatePdfNotes = async (req, res) => {
  try {
    const {
      revisionMode = false,
      includeDiagram = false,
      includeChart = false,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a PDF",
      });
    }

    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.credits < 10) {
      user.isCreditAvailable = false;
      await user.save();

      return res.status(403).json({
        message: "Insufficient credits",
      });
    }

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);

    const pdfText = pdfData.text;

    // Build Gemini Prompt
    const prompt =` Read the uploaded PDF carefully.

Generate concise exam-oriented notes.

Return ONLY valid JSON.

Do not wrap the JSON in markdown.

Return exactly this structure:

{
  "subTopics":{
    "⭐":[],
    "⭐⭐":[],
    "⭐⭐⭐":[]
  },

  "notes":"",

  "revisionPoints":[],

  "questions":{
    "short":[],
    "long":[],
    "diagram":""
  },

  "diagram":{
    "data":""
  },

  "charts":[]
}

Rules:

- Write simple notes.
- Keep them short.
- Extract only important concepts.
- Ignore unnecessary paragraphs.
- Create Mermaid diagram only if needed.
- Create charts only if numerical data exists.

PDF:

${pdfText}`


    // Gemini Response
    const aiResponse = await generateGeminiResponse(prompt, false);
    console.log(aiResponse);
    // Save Notes
    const notes = await Notes.create({
      user: user._id,
      topic: req.file.originalname,
      classLevel: "",
      examType: "",
      revisionMode,
      includeDiagram,
      includeChart,
      content: aiResponse,
    });

    user.credits -= 10;

    if (user.credits <= 0) {
      user.isCreditAvailable = false;
    }

    if (!Array.isArray(user.notes)) {
      user.notes = [];
    }

    user.notes.push(notes._id);

    await user.save();

    return res.status(200).json({
      data: aiResponse,
      noteId: notes._id,
      creditsLeft: user.credits,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
