import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  Link2, 
  Quote,
  Eye,
  EyeOff
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const codeBlock = selectedText ? 
      `\`\`\`\n${selectedText}\n\`\`\`` : 
      `\`\`\`javascript\n// Your code here\n\`\`\``;
    
    const newText = value.substring(0, start) + codeBlock + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + 4, start + 4 + selectedText.length);
      } else {
        textarea.setSelectionRange(start + 14, start + 30);
      }
    }, 0);
  };

  return (
    <div className={`border border-gray-200 rounded-md focus-within:ring-2 focus-within:ring-blue-500 ${className}`}>
      {/* Toolbar */}
      <div className="border-b px-3 py-2 flex items-center gap-1 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('**', '**')}
          title="Bold"
          className="h-8 px-2"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('*', '*')}
          title="Italic"
          className="h-8 px-2"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('`', '`')}
          title="Inline Code"
          className="h-8 px-2"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertCodeBlock}
          title="Code Block"
          className="h-8 px-2 text-xs font-mono"
        >
          {'{}'}
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('- ')}
          title="Bullet List"
          className="h-8 px-2"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('> ')}
          title="Quote"
          className="h-8 px-2"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertText('[', '](url)')}
          title="Link"
          className="h-8 px-2"
        >
          <Link2 className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          title={isPreview ? "Edit" : "Preview"}
          className="h-8 px-2"
        >
          {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Editor/Preview Area */}
      <div className="min-h-[120px]">
        {isPreview ? (
          <div className="p-3">
            <RichTextRenderer content={value || 'Nothing to preview...'} />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Write your comment here..."}
            className="min-h-[120px] resize-none border-none focus:ring-0 rounded-none"
          />
        )}
      </div>

      {/* Help Text */}
      {!isPreview && (
        <div className="border-t px-3 py-2 bg-gray-50 text-xs text-gray-500 flex items-center gap-4">
          <span>**bold**</span>
          <span>*italic*</span>
          <span>`code`</span>
          <span>```code block```</span>
          <span>- lists</span>
          <span>&gt; quotes</span>
        </div>
      )}
    </div>
  );
}

// Enhanced Rich Text Renderer with better code block support
export function RichTextRenderer({ content }: { content: string }) {
  // Handle null/undefined content
  if (!content || typeof content !== 'string') {
    return <div className="text-gray-400 italic">No content</div>;
  }

  const renderText = (text: string) => {
    // Handle code blocks first (multiline)
    text = text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, 
      '<pre class="bg-gray-900 text-gray-100 p-4 rounded-md my-2 overflow-x-auto"><code class="language-$1">$2</code></pre>'
    );

    // Handle simple code blocks without language
    text = text.replace(/```\n([\s\S]*?)\n```/g, 
      '<pre class="bg-gray-900 text-gray-100 p-4 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>'
    );

    // Handle inline code
    text = text.replace(/`([^`]+)`/g, 
      '<code class="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono text-red-600">$1</code>'
    );

    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    
    // Handle quotes
    text = text.replace(/^> (.+)/gm, 
      '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-blue-50 text-gray-700">$1</blockquote>'
    );
    
    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Handle bullet lists
    const lines = text.split('\n');
    let inList = false;
    const processedLines = lines.map(line => {
      if (line.match(/^- (.+)/)) {
        const content = line.replace(/^- (.+)/, '$1');
        if (!inList) {
          inList = true;
          return `<ul class="list-disc list-inside ml-4 my-2"><li>${content}</li>`;
        }
        return `<li>${content}</li>`;
      } else {
        if (inList) {
          inList = false;
          return `</ul>${line}`;
        }
        return line;
      }
    });
    
    if (inList) {
      processedLines.push('</ul>');
    }
    
    text = processedLines.join('\n');
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br />');
    
    return text;
  };

  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: renderText(content) }} 
    />
  );
}