"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  Send, 
  Eye, 
  X, 
  FileText, 
  Sparkles,
  Copy,
  Check
} from "lucide-react";

// Dynamically import EmailEditor to avoid SSR issues
const EmailEditor = dynamic(() => import("react-email-editor"), { 
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-stone-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-stone-600">Loading Email Builder...</p>
      </div>
    </div>
  )
});

interface EmailBuilderProps {
  onSave: (design: object, html: string) => void;
  onClose: () => void;
  initialDesign?: object;
  campaignName: string;
  onCampaignNameChange: (name: string) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
}

const CUSTOMER_VARIABLES = [
  { name: "first_name", label: "First Name", example: "John" },
  { name: "full_name", label: "Full Name", example: "John Smith" },
  { name: "email", label: "Email", example: "john@example.com" },
  { name: "total_spend", label: "Total Spend", example: "AED 2,500" },
  { name: "total_classes", label: "Classes Attended", example: "12" },
  { name: "referral_code", label: "Referral Code", example: "JOHN1234" },
];

const EMAIL_TEMPLATES = {
  blank: {
    name: "Blank",
    design: null,
  },
  welcome: {
    name: "Welcome Email",
    design: {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "Welcome to Mamalu Kitchen!",
                      headingType: "h1",
                      textAlign: "center",
                      color: "#d97706",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<p>Hi {{first_name}},</p><p>Thank you for joining the Mamalu Kitchen family! We're thrilled to have you with us.</p><p>Explore our cooking classes, artisan products, and culinary experiences that await you.</p>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "button",
                    values: {
                      text: "Explore Classes",
                      href: { url: "https://mamalu.ae" },
                      backgroundColor: "#d97706",
                      textAlign: "center",
                    },
                  },
                ],
              },
            ],
          },
        ],
        values: {
          backgroundColor: "#ffffff",
          contentWidth: "600px",
        },
      },
    },
  },
  birthday: {
    name: "Birthday Wishes",
    design: {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "🎂 Happy Birthday!",
                      headingType: "h1",
                      textAlign: "center",
                      color: "#d97706",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<p style='text-align: center;'>Dear {{first_name}},</p><p style='text-align: center;'>Wishing you a wonderful birthday filled with joy and delicious food!</p>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<div style='background: #fef3c7; padding: 20px; border-radius: 12px; text-align: center;'><p style='color: #92400e; margin: 0;'>YOUR BIRTHDAY GIFT</p><p style='color: #d97706; font-size: 36px; font-weight: bold; margin: 10px 0;'>20% OFF</p><p style='color: #78716c; margin: 0;'>Use code: <strong>BIRTHDAY20</strong></p></div>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "button",
                    values: {
                      text: "Shop Now",
                      href: { url: "https://mamalu.ae" },
                      backgroundColor: "#d97706",
                      textAlign: "center",
                    },
                  },
                ],
              },
            ],
          },
        ],
        values: {
          backgroundColor: "#fef3c7",
          contentWidth: "600px",
        },
      },
    },
  },
  winback: {
    name: "We Miss You",
    design: {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "We Miss You! 💛",
                      headingType: "h1",
                      textAlign: "center",
                      color: "#44403c",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<p>Hi {{first_name}},</p><p>It's been a while since we've seen you at Mamalu Kitchen. We've been cooking up some exciting new classes and products that we think you'll love!</p>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<div style='background: #f5f5f4; padding: 20px; border-radius: 12px; text-align: center;'><p style='color: #78716c; margin: 0;'>WELCOME BACK OFFER</p><p style='color: #d97706; font-size: 32px; font-weight: bold; margin: 10px 0;'>15% OFF</p><p style='color: #78716c; margin: 0;'>Use code: <strong>COMEBACK15</strong></p></div>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "button",
                    values: {
                      text: "See What's New",
                      href: { url: "https://mamalu.ae" },
                      backgroundColor: "#d97706",
                      textAlign: "center",
                    },
                  },
                ],
              },
            ],
          },
        ],
        values: {
          backgroundColor: "#ffffff",
          contentWidth: "600px",
        },
      },
    },
  },
  vip: {
    name: "VIP Exclusive",
    design: {
      body: {
        rows: [
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<p style='text-align: center; color: #d97706; letter-spacing: 2px;'>✨ VIP EXCLUSIVE ✨</p>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "heading",
                    values: {
                      text: "You're One of Our Best",
                      headingType: "h1",
                      textAlign: "center",
                      color: "#ffffff",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<p style='color: #e7e5e4;'>Dear {{first_name}},</p><p style='color: #e7e5e4;'>As a valued VIP customer with <strong style='color: #d97706;'>{{total_spend}}</strong> in purchases, you've earned exclusive early access to our newest offerings.</p>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "text",
                    values: {
                      text: "<div style='border: 1px solid #d97706; padding: 20px; border-radius: 12px; text-align: center;'><p style='color: #d97706; font-size: 24px; font-weight: bold; margin: 0;'>25% OFF</p><p style='color: #a8a29e; margin: 5px 0 0 0;'>VIP Members Only</p></div>",
                    },
                  },
                ],
              },
            ],
          },
          {
            cells: [1],
            columns: [
              {
                contents: [
                  {
                    type: "button",
                    values: {
                      text: "Shop VIP Collection",
                      href: { url: "https://mamalu.ae" },
                      backgroundColor: "#d97706",
                      textAlign: "center",
                    },
                  },
                ],
              },
            ],
          },
        ],
        values: {
          backgroundColor: "#1c1917",
          contentWidth: "600px",
        },
      },
    },
  },
};

export default function EmailBuilder({
  onSave,
  onClose,
  initialDesign,
  campaignName,
  onCampaignNameChange,
  subject,
  onSubjectChange,
}: EmailBuilderProps) {
  const emailEditorRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");

  const onReady = useCallback(() => {
    setEditorReady(true);
    if (initialDesign && emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign(initialDesign);
    }
  }, [initialDesign]);

  const handleSave = useCallback(() => {
    if (!emailEditorRef.current?.editor) return;
    
    emailEditorRef.current.editor.exportHtml((data: { design: object; html: string }) => {
      onSave(data.design, data.html);
    });
  }, [onSave]);

  const handlePreview = useCallback(() => {
    if (!emailEditorRef.current?.editor) return;
    
    emailEditorRef.current.editor.exportHtml((data: { html: string }) => {
      setPreviewHtml(data.html);
      setShowPreview(true);
    });
  }, []);

  const loadTemplate = useCallback((templateId: string) => {
    if (!emailEditorRef.current?.editor) return;
    
    const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
    if (template?.design) {
      emailEditorRef.current.editor.loadDesign(template.design);
    } else {
      emailEditorRef.current.editor.loadDesign({
        body: {
          rows: [],
          values: {
            backgroundColor: "#ffffff",
            contentWidth: "600px",
          },
        },
      });
    }
    setSelectedTemplate(templateId);
  }, []);

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => onCampaignNameChange(e.target.value)}
                placeholder="Campaign Name"
                className="text-lg font-semibold text-stone-900 border-none focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePreview} disabled={!editorReady}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={!editorReady}>
              <Save className="h-4 w-4 mr-2" />
              Save Campaign
            </Button>
          </div>
        </div>

        {/* Subject Line */}
        <div className="border-b border-stone-200 px-6 py-3 bg-stone-50">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-stone-600 whitespace-nowrap">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Enter email subject line..."
              className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-stone-200 px-6 py-3 bg-white flex items-center gap-6">
          {/* Templates */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-600">Template:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => loadTemplate(e.target.value)}
              className="text-sm border border-stone-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
              disabled={!editorReady}
            >
              {Object.entries(EMAIL_TEMPLATES).map(([id, template]) => (
                <option key={id} value={id}>{template.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Variables */}
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="h-4 w-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-600">Variables:</span>
            <div className="flex flex-wrap gap-1.5">
              {CUSTOMER_VARIABLES.map((variable) => (
                <button
                  key={variable.name}
                  onClick={() => copyVariable(variable.name)}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 rounded text-xs flex items-center gap-1 transition-colors"
                  title={`Example: ${variable.example}`}
                >
                  <code className="text-amber-700">{`{{${variable.name}}}`}</code>
                  {copiedVar === variable.name ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-amber-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email Editor */}
        <div className="flex-1">
          <EmailEditor
            ref={emailEditorRef}
            onReady={onReady}
            minHeight="100%"
            options={{
              appearance: {
                theme: "light",
                panels: {
                  tools: {
                    dock: "left",
                  },
                },
              },
              features: {
                textEditor: {
                  spellChecker: true,
                },
              },
              tools: {
                image: {
                  enabled: true,
                },
              },
              mergeTags: CUSTOMER_VARIABLES.reduce((acc, v) => ({
                ...acc,
                [v.name]: {
                  name: v.label,
                  value: `{{${v.name}}}`,
                  sample: v.example,
                },
              }), {} as Record<string, { name: string; value: string; sample: string }>),
            }}
          />
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-8">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-stone-900">Email Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-stone-100">
                <div 
                  className="bg-white rounded-lg shadow-lg mx-auto max-w-[600px]"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
