import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { generatePdfNotes } from "../services/api";
import { useDispatch } from "react-redux";
import { updateCredits } from "../redux/userSlice";

function PdfForm({ setResult, setLoading, loading, setError }) {
  const [pdfFile, setPdfFile] = useState(null);

  const [revisionMode, setRevisionMode] = useState(false);
  const [includeDiagram, setIncludeDiagram] = useState(false);
  const [includeChart, setIncludeChart] = useState(false);

  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const dispatch = useDispatch();

  const handleSubmit = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("pdf", pdfFile);
      formData.append("revisionMode", revisionMode);
      formData.append("includeDiagram", includeDiagram);
      formData.append("includeChart", includeChart);

      // API returns:
      // {
      //   data: { subTopics, notes, revisionPoints, questions, diagram, charts },
      //   noteId,
      //   creditsLeft
      // }

      const response = await generatePdfNotes(formData);

      console.log("PDF API RESPONSE:", response);

      let pdfNotes = response.data;

      // If AI response is a string, convert it to an object
      if (typeof pdfNotes === "string") {
        pdfNotes = JSON.parse(pdfNotes);
      }

      console.log("PDF NOTES:", pdfNotes);

      setResult(pdfNotes);

      if (typeof response.creditsLeft === "number") {
        dispatch(updateCredits(response.creditsLeft));
      }

      setPdfFile(null);
      setRevisionMode(false);
      setIncludeDiagram(false);
      setIncludeChart(false);
    } catch (error) {
      console.log(error);
      setError("Failed to generate notes from PDF");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      setProgressText("");
      return;
    }

    let value = 0;

    const interval = setInterval(() => {
      value += Math.random() * 8;

      if (value >= 95) {
        value = 95;
        setProgressText("Almost done...");
        clearInterval(interval);
      } else if (value > 70) {
        setProgressText("Finalizing notes...");
      } else if (value > 40) {
        setProgressText("Processing PDF...");
      } else {
        setProgressText("Reading PDF...");
      }

      setProgress(Math.floor(value));
    }, 700);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-2xl
        bg-white
        border border-gray-200
        shadow-[0_15px_40px_rgba(0,0,0,0.08)]
        p-8
        space-y-6
      "
    >
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Upload PDF
        </label>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          className="
            w-full
            p-3
            rounded-xl
            bg-gray-50
            border border-gray-300
            text-gray-800
            file:bg-black
            file:text-white
            file:px-4
            file:py-2
            file:rounded-lg
            file:border-0
            file:cursor-pointer
            file:mr-4
            focus:outline-none
            focus:ring-2
            focus:ring-black/20
          "
        />

        {pdfFile && (
          <p className="mt-3 text-sm text-green-600 font-medium">
            Selected: {pdfFile.name}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Toggle
          label="Revision Mode"
          checked={revisionMode}
          onChange={() => setRevisionMode(!revisionMode)}
        />

        <Toggle
          label="Include Diagrams"
          checked={includeDiagram}
          onChange={() => setIncludeDiagram(!includeDiagram)}
        />

        <Toggle
          label="Include Charts"
          checked={includeChart}
          onChange={() => setIncludeChart(!includeChart)}
        />
      </div>

      <motion.button
        onClick={handleSubmit}
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.97 } : {}}
        disabled={loading}
        className={`
          w-full
          py-3
          rounded-xl
          font-semibold
          transition

          ${
            loading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-900"
          }
        `}
      >
        {loading ? "Generating Notes..." : "Generate PDF Notes"}
      </motion.button>

      {loading && (
        <div className="space-y-3">
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-green-500"
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>{progressText}</span>
            <span>{progress}%</span>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Reading your PDF and generating notes. This may take 2-5 minutes.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div
      className="flex items-center gap-4 cursor-pointer select-none"
      onClick={onChange}
    >
      <motion.div
        animate={{
          backgroundColor: checked ? "#22c55e" : "#d1d5db",
        }}
        transition={{ duration: 0.25 }}
        className="relative w-12 h-6 rounded-full"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{
            left: checked ? "1.6rem" : "0.25rem",
          }}
        />
      </motion.div>

      <span
        className={`font-medium ${
          checked ? "text-green-600" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default PdfForm;
