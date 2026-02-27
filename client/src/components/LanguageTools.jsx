import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLanguage, FaMicrophone, FaSpinner, FaDownload } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LanguageTools = ({ planId }) => {
  const [languages, setLanguages] = useState([]);
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [translating, setTranslating] = useState(false);
  const [audioText, setAudioText] = useState('');
  const [processingAudio, setProcessingAudio] = useState(false);
  const [cleanedText, setCleanedText] = useState('');

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await axios.get(`${API_URL}/language/supported-languages`);
      setLanguages(response.data.languages || []);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  };

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const response = await axios.post(`${API_URL}/language/translate/${planId}`, {
        targetLanguage
      });
      alert('Lesson plan translated successfully!');
      window.location.reload(); // Reload to show translated content
    } catch (error) {
      console.error('Translation failed:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      const details = error.response?.data?.message ? ` (${error.response.data.message})` : '';
      alert(`Failed to translate lesson plan${details}. Please try again.`);
    } finally {
      setTranslating(false);
    }
  };

  const handleSpeechToText = async () => {
    if (!audioText.trim()) {
      alert('Please enter the transcribed audio text');
      return;
    }

    setProcessingAudio(true);
    try {
      const response = await axios.post(`${API_URL}/language/speech-to-text`, {
        audioText
      });
      setCleanedText(response.data.cleanedText);
    } catch (error) {
      console.error('Speech-to-text processing failed:', error);
      alert('Failed to process audio text. Please try again.');
    } finally {
      setProcessingAudio(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Translation */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaLanguage className="text-primary-600" />
          <h3 className="text-xl font-semibold text-gray-800">Translation</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Translate to Language
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="input-field"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTranslate}
            disabled={translating}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {translating ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <FaLanguage />
                <span>Translate Lesson Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Speech to Text */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaMicrophone className="text-primary-600" />
          <h3 className="text-xl font-semibold text-gray-800">Speech to Text</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transcribed Audio Text
            </label>
            <textarea
              value={audioText}
              onChange={(e) => setAudioText(e.target.value)}
              className="input-field"
              rows="4"
              placeholder="Paste your transcribed audio text here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste transcribed audio and we'll clean it up and structure it for you
            </p>
          </div>

          <button
            onClick={handleSpeechToText}
            disabled={processingAudio || !audioText.trim()}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {processingAudio ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaMicrophone />
                <span>Clean & Structure Text</span>
              </>
            )}
          </button>

          {cleanedText && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Cleaned Text</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(cleanedText)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <FaDownload />
                </button>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{cleanedText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageTools;






