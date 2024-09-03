import React, { useState } from 'react'
import { IoBookmark as FilledBookmark, IoBookmarkOutline as EmptyBookmark } from 'react-icons/io5'

export default function BookmarkIcon ({ isBookmarked, bookmarkName, onBookmarkChange, includeIcon = true }) {
  const [editing, setEditing] = useState(false)
  const [newBookmarkName, setNewBookmarkName] = useState(bookmarkName || '')

  const handleDoubleClick = () => setEditing(true)
  const handleChange = (e) => setNewBookmarkName(e.target.value)
  const handleBlur = () => {
    setEditing(false)
    if (newBookmarkName) {
      onBookmarkChange(newBookmarkName.trim())
    } else {
      setNewBookmarkName('')
    }
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setEditing(false)
      onBookmarkChange(newBookmarkName.trim())
    }
  }

  return (
    <span className='bookmark-container'>
      {includeIcon && (isBookmarked ? <FilledBookmark className='bookmark-icon' /> : <EmptyBookmark className='bookmark-icon greyed-out' />)}
      {editing
        ? (
          <input
            type='text'
            value={newBookmarkName}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          )
        : (
          <h3 className={isBookmarked ? '' : 'greyed-out'} onDoubleClick={handleDoubleClick}>
            {isBookmarked ? bookmarkName : 'No Bookmark'}
          </h3>
          )}
    </span>
  )
}
