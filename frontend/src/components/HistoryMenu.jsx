import React, { useState } from 'react';
import { Download, Trash2, FileText, Database, AlertCircle } from 'lucide-react';

export default function HistoryMenu({
  onExportJSON,
  onExportText,
  onClearHistory,
  messageCount = 0
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const handleClearConfirm = () => {
    onClearHistory();
    setShowConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Cronologia Locale
      </h3>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💾 Privacy-First:</strong>
          <br />
          {messageCount} messaggi salvati <strong>solo</strong> sul tuo dispositivo.
          <br />
          Il server non memorizza nulla!
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={onExportJSON}
          className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Esporta JSON
        </button>

        <button
          onClick={onExportText}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Esporta TXT
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Cancella Cronologia
        </button>
      </div>

      {showConfirm && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Conferma cancellazione
              </p>
              <p className="text-xs text-red-700 mt-1">
                Verranno eliminati {messageCount} messaggi dal tuo dispositivo.
                Questa azione è irreversibile!
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearConfirm}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Conferma
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          🔒 I tuoi dati restano privati sul tuo browser
        </p>
      </div>
    </div>
  );
}
