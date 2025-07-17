"use client";

import { useState } from "react";
import { X, Download, FileText, Code, Share } from "lucide-react";
import { Conversation, ChatMessage } from "@/types/chat";
import { Persona } from "@/types/personas";

interface ExportConversationModalProps {
  conversation: Conversation;
  messages: ChatMessage[];
  persona?: Persona;
  onClose: () => void;
}

type ExportFormat = "txt" | "json" | "csv" | "md";

export default function ExportConversationModal({
  conversation,
  messages,
  persona,
  onClose,
}: ExportConversationModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("txt");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);

  const formatOptions = [
    {
      value: "txt" as ExportFormat,
      label: "Text File",
      description: "Plain text format, easy to read",
      icon: FileText,
    },
    {
      value: "json" as ExportFormat,
      label: "JSON",
      description: "Structured data with full metadata",
      icon: Code,
    },
    {
      value: "csv" as ExportFormat,
      label: "CSV",
      description: "Spreadsheet format for analysis",
      icon: Share,
    },
    {
      value: "md" as ExportFormat,
      label: "Markdown",
      description: "Formatted text with styling",
      icon: FileText,
    },
  ];

  const generateContent = (format: ExportFormat) => {
    const timestamp = new Date().toISOString();
    const personaName = persona?.name || "Unknown Persona";

    switch (format) {
      case "txt":
        return generateTxtContent(timestamp, personaName);
      case "json":
        return generateJsonContent(timestamp, personaName);
      case "csv":
        return generateCsvContent(timestamp, personaName);
      case "md":
        return generateMdContent(timestamp, personaName);
      default:
        return "";
    }
  };

  const generateTxtContent = (timestamp: string, personaName: string) => {
    let content = `Conversation Export: ${conversation.title}\n`;
    content += `Persona: ${personaName}\n`;
    content += `Exported: ${new Date(timestamp).toLocaleString()}\n`;
    content += `Total Messages: ${messages.length}\n`;
    content += `${"=".repeat(50)}\n\n`;

    messages.forEach((message) => {
      const role = message.role === "user" ? "You" : personaName;
      const time = new Date(message.created_at).toLocaleString();
      content += `[${time}] ${role}:\n${message.content}\n\n`;

      if (
        includeMetadata &&
        (message.tokens_used || message.response_time_ms)
      ) {
        content += `(${message.tokens_used || 0} tokens, ${
          message.response_time_ms || 0
        }ms)\n\n`;
      }
    });

    return content;
  };

  const generateJsonContent = (timestamp: string, personaName: string) => {
    const exportData = {
      export_info: {
        conversation_title: conversation.title,
        persona_name: personaName,
        export_timestamp: timestamp,
        total_messages: messages.length,
      },
      conversation: {
        id: conversation.id,
        title: conversation.title,
        persona_id: conversation.persona_id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      },
      persona: persona
        ? {
            id: persona.id,
            name: persona.name,
            relation_type: persona.relation_type,
            description: persona.description,
          }
        : null,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.created_at,
        ...(includeMetadata && {
          tokens_used: message.tokens_used,
          model_used: message.model_used,
          response_time_ms: message.response_time_ms,
        }),
      })),
    };

    return JSON.stringify(exportData, null, 2);
  };

  const generateCsvContent = (timestamp: string, personaName: string) => {
    let content = "Timestamp,Role,Speaker,Content";
    if (includeMetadata) {
      content += ",Tokens,Model,ResponseTime";
    }
    content += "\n";

    messages.forEach((message) => {
      const speaker = message.role === "user" ? "You" : personaName;
      const row = [
        `"${message.created_at}"`,
        `"${message.role}"`,
        `"${speaker}"`,
        `"${message.content.replace(/"/g, '""')}"`,
      ];

      if (includeMetadata) {
        row.push(
          `"${message.tokens_used || ""}"`,
          `"${message.model_used || ""}"`,
          `"${message.response_time_ms || ""}"`
        );
      }

      content += row.join(",") + "\n";
    });

    return content;
  };

  const generateMdContent = (timestamp: string, personaName: string) => {
    let content = `# ${conversation.title}\n\n`;
    content += `**Persona:** ${personaName}  \n`;
    content += `**Exported:** ${new Date(timestamp).toLocaleString()}  \n`;
    content += `**Total Messages:** ${messages.length}\n\n`;
    content += `---\n\n`;

    messages.forEach((message) => {
      const speaker =
        message.role === "user" ? "**You**" : `**${personaName}**`;
      const time = new Date(message.created_at).toLocaleString();

      content += `### ${speaker} - ${time}\n\n`;
      content += `${message.content}\n\n`;

      if (
        includeMetadata &&
        (message.tokens_used || message.response_time_ms)
      ) {
        content += `*${message.tokens_used || 0} tokens, ${
          message.response_time_ms || 0
        }ms*\n\n`;
      }
    });

    return content;
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const content = generateContent(selectedFormat);
      const filename = `${conversation.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_${Date.now()}.${selectedFormat}`;

      const blob = new Blob([content], {
        type: selectedFormat === "json" ? "application/json" : "text/plain",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-green-400" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Export Conversation
              </h2>
              <p className="text-white/70 text-sm">{conversation.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-white font-medium mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedFormat === option.value
                        ? "border-green-500 bg-green-500/10"
                        : "border-white/20 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={selectedFormat === option.value}
                      onChange={() => setSelectedFormat(option.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 w-full">
                      <Icon className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="text-white font-medium">
                          {option.label}
                        </div>
                        <div className="text-white/60 text-sm">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-white font-medium mb-3">
              Export Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={() => setIncludeMetadata(!includeMetadata)}
                  className="w-4 h-4 text-green-600 bg-transparent border-white/30 rounded focus:ring-green-500"
                />
                <div>
                  <div className="text-white font-medium">Include Metadata</div>
                  <div className="text-white/60 text-sm">
                    Include token usage, response times, and technical details
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-white font-medium mb-3">
              Preview ({messages.length} messages)
            </label>
            <div className="bg-black/20 rounded-lg p-4 border border-white/10 max-h-32 overflow-y-auto">
              <pre className="text-white/70 text-xs whitespace-pre-wrap font-mono">
                {generateContent(selectedFormat).substring(0, 300)}
                {generateContent(selectedFormat).length > 300 && "..."}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || messages.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting
                ? "Exporting..."
                : `Export as ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
