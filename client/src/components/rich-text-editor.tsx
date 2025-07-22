import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'blockquote', 'code-block', 'link',
    'color', 'background'
  ];

  return (
    <div className={`rich-text-editor ${className || ''}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.375rem',
          fontFamily: "'Quicksand', sans-serif",
        }}
      />

    </div>
  );
}

// Rich Text Renderer for displaying Quill HTML content
interface RichTextRendererProps {
  content: string;
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  // Handle null/undefined content
  if (!content || typeof content !== 'string') {
    return <div className="text-gray-400 italic">No content</div>;
  }

  // If content is HTML (from Quill), render it directly
  if (content.includes('<') && content.includes('>')) {
    return (
      <div 
        className="ql-editor"
        dangerouslySetInnerHTML={{ __html: content }} 
        style={{ 
          border: 'none', 
          padding: 0, 
          fontFamily: "'Quicksand', sans-serif",
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}
      />
    );
  }

  // Fallback for plain text
  return (
    <div style={{ fontFamily: "'Quicksand', sans-serif" }}>
      {content.split('\n').map((line, index) => (
        <p key={index} style={{ margin: 0 }}>{line || '\u00A0'}</p>
      ))}
    </div>
  );
}