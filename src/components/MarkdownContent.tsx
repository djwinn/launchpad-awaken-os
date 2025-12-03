import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  // Convert markdown to simple HTML-like rendering
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key++} className="font-semibold text-base mt-4 mb-2">
            {processInlineFormatting(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key++} className="font-bold text-lg mt-5 mb-2">
            {processInlineFormatting(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key++} className="font-bold text-xl mt-6 mb-3">
            {processInlineFormatting(line.slice(2))}
          </h1>
        );
        continue;
      }

      // Handle bullet points
      if (line.match(/^[\-\*]\s/)) {
        elements.push(
          <li key={key++} className="ml-4 list-disc">
            {processInlineFormatting(line.slice(2))}
          </li>
        );
        continue;
      }

      // Handle numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s/);
      if (numberedMatch) {
        elements.push(
          <li key={key++} className="ml-4 list-decimal">
            {processInlineFormatting(line.slice(numberedMatch[0].length))}
          </li>
        );
        continue;
      }

      // Handle horizontal rules
      if (line.match(/^[\-=]{3,}$/)) {
        elements.push(<hr key={key++} className="my-4 border-border" />);
        continue;
      }

      // Empty lines become breaks
      if (line.trim() === '') {
        elements.push(<div key={key++} className="h-2" />);
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={key++} className="mb-1">
          {processInlineFormatting(line)}
        </p>
      );
    }

    return elements;
  };

  // Process bold, italic, and other inline formatting
  const processInlineFormatting = (text: string): JSX.Element => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold with ** or __
      const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.+?)\2(.*)$/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(boldMatch[1]);
        parts.push(<strong key={partKey++} className="font-semibold">{boldMatch[3]}</strong>);
        remaining = boldMatch[4];
        continue;
      }

      // Italic with * or _
      const italicMatch = remaining.match(/^(.*?)(\*|_)(.+?)\2(.*)$/s);
      if (italicMatch && !italicMatch[1].endsWith('*') && !italicMatch[4].startsWith('*')) {
        if (italicMatch[1]) parts.push(italicMatch[1]);
        parts.push(<em key={partKey++} className="italic">{italicMatch[3]}</em>);
        remaining = italicMatch[4];
        continue;
      }

      // No more formatting found
      parts.push(remaining);
      break;
    }

    return <>{parts}</>;
  };

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      {renderContent(content)}
    </div>
  );
}
