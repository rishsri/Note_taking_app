import { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, Modifier, convertToRaw, convertFromRaw } from 'draft-js';
import { FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'draft-js/dist/Draft.css';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const COLORS = ['black', 'red', 'blue', 'green', 'purple'];
const HIGHLIGHTS = ['transparent', 'yellow', 'cyan', 'lime', 'pink'];

const LANGUAGETOOL_API_URL = 'https://api.languagetool.org/v2/check';

const RichTextEditor = ({ content, onChange, readOnly }) => {
  const [editorState, setEditorState] = useState(() => {
    if (content) {
      try {
        const contentState = convertFromRaw(JSON.parse(content));
        return EditorState.createWithContent(contentState);
      } catch {
        return EditorState.createEmpty();
      }
    }
    return EditorState.createEmpty();
  });
  
  const [fontSize, setFontSize] = useState('16px');
  const [color, setColor] = useState('black');
  const [highlight, setHighlight] = useState('transparent');
  const [grammarErrors, setGrammarErrors] = useState([]);
  const [checkTimeout, setCheckTimeout] = useState(null);

  useEffect(() => {
    if (content && content !== JSON.stringify(convertToRaw(editorState.getCurrentContent()))) {
      try {
        const contentState = convertFromRaw(JSON.parse(content));
        const newEditorState = EditorState.createWithContent(contentState);
        setEditorState(newEditorState);
      } catch {
        // If parsing fails, keep current state
      }
    }
  }, [content]);

  const checkGrammar = async (text) => {
    if (!text.trim()) {
      setGrammarErrors([]);
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('text', text);
      formData.append('language', 'en-US');

      const response = await fetch(LANGUAGETOOL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Grammar check failed');
      }

      const data = await response.json();
      if (data.matches && data.matches.length > 0) {
        setGrammarErrors(data.matches);
      } else {
        setGrammarErrors([]);
      }
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast.error('Grammar check failed. Please try again later.');
    }
  };

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleEditorChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = (style) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const currentContent = editorState.getCurrentContent();
      const nextState = RichUtils.toggleInlineStyle(editorState, style);
      const newContent = nextState.getCurrentContent();
      
      if (currentContent !== newContent) {
        handleEditorChange(nextState);
      }
    } else {
      const nextState = RichUtils.toggleInlineStyle(editorState, style);
      handleEditorChange(nextState);
    }
  };

  const handleEditorChange = (newState) => {
    setEditorState(newState);
    
    if (onChange) {
      const contentState = newState.getCurrentContent();
      const raw = convertToRaw(contentState);
      onChange(JSON.stringify(raw));
    }

    // Grammar check with debounce
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      const plainText = newState.getCurrentContent().getPlainText();
      checkGrammar(plainText);
    }, 1000);
    
    setCheckTimeout(newTimeout);
  };

  const applyStyle = (style, value) => {
    const selection = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    let nextEditorState = editorState;

    // Remove existing styles of the same type
    Object.keys(customStyleMap)
      .filter(key => key.startsWith(`${style}_`))
      .forEach(key => {
        nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, key);
      });

    // Apply new style
    const newStyle = `${style}_${value}`;
    nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, newStyle);
    
    // Preserve selection
    const preservedSelection = nextEditorState.getSelection();
    const finalState = EditorState.forceSelection(nextEditorState, preservedSelection);
    
    handleEditorChange(finalState);
  };

  const toggleTextAlign = (alignment) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const newContentState = Modifier.setBlockData(
      contentState,
      selection,
      { textAlign: alignment }
    );
    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
    handleEditorChange(EditorState.forceSelection(newEditorState, selection));
  };

  const customStyleMap = {
    ...FONT_SIZES.reduce((map, size) => {
      map[`FONTSIZE_${size}`] = { fontSize: size };
      return map;
    }, {}),
    ...COLORS.reduce((map, color) => {
      map[`COLOR_${color}`] = { color };
      return map;
    }, {}),
    ...HIGHLIGHTS.reduce((map, color) => {
      map[`HIGHLIGHT_${color}`] = { backgroundColor: color };
      return map;
    }, {})
  };

  const getBlockStyle = (block) => {
    const blockData = block.getData();
    const alignment = blockData.get('textAlign');
    return alignment ? `text-align-${alignment}` : '';
  };

  return (
    <>
      <div className="editor-container">
        {!readOnly && (
          <div className="toolbar">
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                toggleInlineStyle('BOLD');
              }}
              className={editorState.getCurrentInlineStyle().has('BOLD') ? 'active' : ''}
            >
              <FaBold />
            </button>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                toggleInlineStyle('ITALIC');
              }}
              className={editorState.getCurrentInlineStyle().has('ITALIC') ? 'active' : ''}
            >
              <FaItalic />
            </button>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                toggleInlineStyle('UNDERLINE');
              }}
              className={editorState.getCurrentInlineStyle().has('UNDERLINE') ? 'active' : ''}
            >
              <FaUnderline />
            </button>
            <div className="separator" />
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                toggleTextAlign('left');
              }}
            >
              <FaAlignLeft />
            </button>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                toggleTextAlign('center');
              }}
            >
              <FaAlignCenter />
            </button>
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                toggleTextAlign('right');
              }}
            >
              <FaAlignRight />
            </button>
            <div className="separator" />
            <select 
              value={fontSize} 
              onChange={(e) => {
                setFontSize(e.target.value);
                applyStyle('FONTSIZE', e.target.value);
              }}
              className="font-size-select"
            >
              {FONT_SIZES.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <div className="separator" />
            <select 
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                applyStyle('COLOR', e.target.value);
              }}
              className="color-select"
            >
              {COLORS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="separator" />
            <select 
              value={highlight}
              onChange={(e) => {
                setHighlight(e.target.value);
                applyStyle('HIGHLIGHT', e.target.value);
              }}
              className="highlight-select"
            >
              {HIGHLIGHTS.map(h => (
                <option key={h} value={h}>{h === 'transparent' ? 'No Highlight' : h}</option>
              ))}
            </select>
          </div>
        )}
        <div className={`editor ${readOnly ? 'read-only' : ''}`}>
          <Editor
            editorState={editorState}
            onChange={handleEditorChange}
            handleKeyCommand={handleKeyCommand}
            customStyleMap={customStyleMap}
            blockStyleFn={getBlockStyle}
            placeholder="Start typing..."
            readOnly={readOnly}
          />
        </div>
      </div>
      {!readOnly && grammarErrors.length > 0 && (
        <div className="grammar-errors">
          <h3>Suggestions:</h3>
          {grammarErrors.map((error, index) => (
            <div key={index} className="grammar-error">
              <span className="error-message">{error.message}</span>
              {error.replacements && error.replacements.length > 0 && (
                <span className="suggestion">
                  Suggestion: {error.replacements[0].value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default RichTextEditor;