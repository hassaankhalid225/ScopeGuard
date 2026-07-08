'use client';

/**
 * Minimal, dependency-free Markdown renderer — enough for AI-generated
 * contracts (headings, bold, lists, blockquotes, hr, paragraphs).
 */
export function Markdown({ source }: { source: string }) {
  return <div className="prose-contract">{render(source)}</div>;
}

function inline(text: string, key: string) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong>;
    }
    return <span key={`${key}-${i}`}>{p}</span>;
  });
}

function render(src: string) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] | null = null;
  let listOrdered = false;

  const flushList = () => {
    if (!list) return;
    const items = list.map((li, i) => <li key={`li-${out.length}-${i}`}>{inline(li, `li-${out.length}-${i}`)}</li>);
    out.push(listOrdered ? <ol key={`ol-${out.length}`}>{items}</ol> : <ul key={`ul-${out.length}`}>{items}</ul>);
    list = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.trim() === '') {
      flushList();
      return;
    }
    if (line.startsWith('### ')) {
      flushList();
      out.push(<h3 key={idx}>{inline(line.slice(4), `h3-${idx}`)}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      out.push(<h2 key={idx}>{inline(line.slice(3), `h2-${idx}`)}</h2>);
    } else if (line.startsWith('# ')) {
      flushList();
      out.push(<h1 key={idx}>{inline(line.slice(2), `h1-${idx}`)}</h1>);
    } else if (line.startsWith('> ')) {
      flushList();
      out.push(<blockquote key={idx}>{inline(line.slice(2), `bq-${idx}`)}</blockquote>);
    } else if (/^[-*] /.test(line)) {
      if (!list || listOrdered) {
        flushList();
        list = [];
        listOrdered = false;
      }
      list.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      if (!list || !listOrdered) {
        flushList();
        list = [];
        listOrdered = true;
      }
      list.push(line.replace(/^\d+\.\s/, ''));
    } else if (line.startsWith('---')) {
      flushList();
      out.push(<hr key={idx} />);
    } else {
      flushList();
      out.push(<p key={idx}>{inline(line, `p-${idx}`)}</p>);
    }
  });
  flushList();
  return out;
}
