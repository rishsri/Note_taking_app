import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import RichTextEditor from './components/Editor';
import NotesList from './components/NotesList';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const createNewNote = () => {
    // Handle unsaved changes in current note
    if (unsavedChanges && selectedNote) {
      const confirmChange = window.confirm(
        'You have unsaved changes. Do you want to save them before creating a new note?'
      );
      if (confirmChange) {
        saveNote();
      }
    }

    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    setNotes(prev => [...prev, newNote]);
    setSelectedNote(newNote);
    setTitle('New Note');
    setIsEditing(true);
    setUnsavedChanges(false);
    toast.success('New note created!');
  };

  const deleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter((note) => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setTitle('');
        setIsEditing(false);
        setUnsavedChanges(false);
      }
      toast.success('Note deleted successfully');
    }
  };

  const updateNote = (content) => {
    if (!selectedNote) return;
    setSelectedNote(prev => ({
      ...prev,
      content: content
    }));
    setUnsavedChanges(true);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setUnsavedChanges(true);
  };

  const saveNote = () => {
    if (!selectedNote || !unsavedChanges) return;

    const updatedNotes = notes.map((note) =>
      note.id === selectedNote.id
        ? {
            ...note,
            title,
            content: selectedNote.content,
            lastModified: new Date().toISOString(),
          }
        : note
    );
    setNotes(updatedNotes);
    setUnsavedChanges(false);
    toast.success('Note saved successfully!');
  };

  const handleNoteSelect = (note) => {
    // Handle unsaved changes
    if (unsavedChanges && selectedNote) {
      const confirmChange = window.confirm(
        'You have unsaved changes. Do you want to save them before switching?'
      );
      if (confirmChange) {
        saveNote();
      }
    }

    setSelectedNote(note);
    setTitle(note.title);
    setIsEditing(false);
    setUnsavedChanges(false);
  };

  const startEditing = () => {
    setIsEditing(true);
    toast.info('Editing mode activated');
  };

  return (
    <div className="app">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="sidebar">
        <button onClick={createNewNote}>New Note</button>
        <NotesList
          notes={notes}
          onNoteSelect={handleNoteSelect}
          onNoteDelete={deleteNote}
          selectedNoteId={selectedNote?.id}
        />
      </div>
      <div className="main-content">
        {selectedNote ? (
          <>
            <div className="note-header">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Note Title"
                className="title-input"
                disabled={!isEditing}
              />
              <div className="note-actions">
                {!isEditing ? (
                  <button onClick={startEditing}>Edit</button>
                ) : (
                  <button 
                    onClick={saveNote}
                    disabled={!unsavedChanges}
                    className={unsavedChanges ? 'save-active' : ''}
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
            <RichTextEditor
              key={selectedNote.id}
              content={selectedNote.content}
              onChange={updateNote}
              readOnly={!isEditing}
            />
          </>
        ) : (
          <div className="no-note-selected">
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  );
}

export default App;