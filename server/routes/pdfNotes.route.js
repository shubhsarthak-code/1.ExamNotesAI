import express from "express";
import { generatePdfNotes } from "../controllers/pdfNotes.controller.js";
import upload from "../middleware/upload.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

router.post(
  "/generate-pdf-notes",
  isAuth,
  upload.single("pdf"),
  generatePdfNotes,
);

export default router;
