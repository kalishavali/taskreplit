import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [selectedText, setSelectedText] = useState("");

  const formatText = (format: string) => {
    // This is a simplified rich text editor
    // In a production app, you'd use a library like TipTap, Quill, or Draft.js
    const textarea = document.getElementById("rich-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let replacement = "";
    
    switch (format) {
      case "bold":
        replacement = `**${selectedText}**`;
        break;
      case "italic":
        replacement = `*${selectedText}*`;
        break;
      case "underline":
        replacement = `<u>${selectedText}</u>`;
        break;
      case "bulletList":
        replacement = selectedText.split('\n').map(line => line.trim() ? `• ${line}` : line).join('\n');
        break;
      case "numberList":
        replacement = selectedText.split('\n').map((line, i) => line.trim() ? `${i + 1}. ${line}` : line).join('\n');
        break;
      case "link":
        replacement = `[${selectedText || "Link text"}](${selectedText ? "URL" : "https://"})`;
        break;
      default:
        replacement = selectedText;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-3 flex items-center space-x-2 bg-gray-50">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => formatText("bold")}
          className="h-8 w-8 p-0"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => formatText("italic")}
          className="h-8 w-8 p-0"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => formatText("underline")}
          className="h-8 w-8 p-0"
        >
          <Underline className="w-4 h-4" />
        </Button>
        
        <div className="border-l border-gray-300 h-6 mx-2"></div>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => formatText("bulletList")}
          className="h-8 w-8 p-0"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => formatText("numberList")}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => formatText("link")}
          className="h-8 w-8 p-0"
        >
          <Link className="w-4 h-4" />
        </Button>
      </div>
      
      <Textarea
        id="rich-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 resize-none focus-visible:ring-0 min-h-[120px]"
        rows={6}
      />
    </div>
  );
}
