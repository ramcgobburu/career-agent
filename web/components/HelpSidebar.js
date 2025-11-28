import { useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'How do I get started?',
    answer: 'Sign up for an account, then upload your career context (resume, cover letters, or career documents) on the dashboard. Once uploaded, you can use the Generator to create personalized cover letters, STAR stories, and interview answers.',
  },
  {
    question: 'What file types can I upload?',
    answer: 'You can upload text files (.txt, .md), PDF documents (.pdf), and Word documents (.doc, .docx). Your career context helps the AI personalize all generated materials.',
  },
  {
    question: 'How does the job URL auto-fill work?',
    answer: 'When generating a cover letter or job application answer, paste the job posting URL and click "Auto-fill". The system will intelligently extract the company name, role title, and job description using AI.',
  },
  {
    question: 'What types of documents can I generate?',
    answer: 'You can generate cover letters, LinkedIn/email blurbs, STAR stories, role-specific summaries, and interview answers. Each is tailored to your career context and the specific role you\'re applying for.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, your career context is stored securely and is only used to personalize your generated materials. Each user has isolated data storage, and we follow industry-standard security practices.',
  },
  {
    question: 'Can I edit generated content?',
    answer: 'Yes, all generated content is displayed in an editable text area. You can review, edit, and refine the AI-generated content before using it.',
  },
  {
    question: 'What if I need to update my career context?',
    answer: 'You can upload new context files at any time from the dashboard. The system will use your most recent context for all future generations.',
  },
  {
    question: 'How do I delete my career context?',
    answer: 'On the dashboard, you can see all your uploaded contexts. Click the delete button next to any context you want to remove.',
  },
];

export default function HelpSidebar({ isOpen, onClose }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleQuestion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="help-sidebar__backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="help-sidebar">
        <div className="help-sidebar__header">
          <h2>Help & FAQ</h2>
          <button
            type="button"
            className="help-sidebar__close"
            onClick={onClose}
            aria-label="Close help"
          >
            ×
          </button>
        </div>
        <div className="help-sidebar__content">
          <ul className="help-sidebar__faq">
            {FAQ_ITEMS.map((item, index) => (
              <li key={index} className="help-sidebar__faq-item">
                <button
                  type="button"
                  className={`help-sidebar__question ${expandedIndex === index ? 'expanded' : ''}`}
                  onClick={() => toggleQuestion(index)}
                >
                  <span>{item.question}</span>
                  <span className="help-sidebar__toggle">{expandedIndex === index ? '−' : '+'}</span>
                </button>
                {expandedIndex === index && (
                  <div className="help-sidebar__answer">{item.answer}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

