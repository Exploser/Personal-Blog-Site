import React from 'react';
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';

export default function Editor({ value, onChange }) {

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  const sanitizedValue = DOMPurify.sanitize(value);

  return (
    <ReactQuill
      value={sanitizedValue}
      onChange={onChange}
      modules={modules}
      formats={formats}
    />
  );
}
