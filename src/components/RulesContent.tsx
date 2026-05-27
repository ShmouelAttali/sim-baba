import ReactMarkdown from 'react-markdown';
import rulesContent from '../content/rules.md?raw';

export function RulesContent() {
  return (
    <div className="rules-content" dir="rtl">
      <ReactMarkdown>{rulesContent}</ReactMarkdown>
    </div>
  );
}
