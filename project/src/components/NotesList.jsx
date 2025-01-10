import { useState } from 'react';

const NotesList = ({ notes, onNoteSelect, onNoteDelete }) => {
  return (
    <div className="notes-list">
      {notes.map((note) => (
        <div key={note.id} className="note-item">
          <h3 onClick={() => onNoteSelect(note)}>{note.title}</h3>
          <button onClick={() => onNoteDelete(note.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default NotesList;