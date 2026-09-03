import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AddMissingQuestion = ({ isOpen, onClose, onAdd }) => {
  const [question, setQuestion] = useState('');
  const [score, setScore] = useState(10);
  const [remark, setRemark] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!question.trim()) return;
    onAdd({
      parameterKey: `CUSTOM_${Date.now()}`,
      parameterName: question,
      score,
      remark
    });
    setQuestion('');
    setRemark('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Add Missing Question</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Question / Parameter Name</label>
              <input 
                type="text" 
                autoFocus
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Broken guardrail..."
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Score</label>
              <div className="flex gap-2">
                {[10, 5, 1, 0].map(val => (
                  <button 
                    key={val}
                    onClick={() => setScore(val)}
                    className={`flex-1 py-1.5 rounded border text-sm font-semibold ${
                      score === val ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Remark (Optional)</label>
              <input 
                type="text" 
                value={remark}
                onChange={e => setRemark(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              disabled={!question.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
            >
              Add for This Inspection
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddMissingQuestion;
