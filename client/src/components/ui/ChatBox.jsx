// ============================================================
// Mythral Client - Chat Box (island-local chat)
// ============================================================

import React, { useState, useRef, useEffect } from 'react'

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const msg = input.trim()
    if (msg) {
      onSend(msg)
      setInput('')
    }
  }

  return (
    <div className={`chat-box ${expanded ? 'expanded' : ''}`}>
      <div className="chat-header" onClick={() => setExpanded(!expanded)}>
        <span>💬 Island Chat</span>
        <span className="text-xs text-dim">{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded && (
        <>
          <div className="chat-messages" ref={listRef}>
            {messages.length === 0 && <div className="chat-empty text-dim text-xs">No messages yet.</div>}
            {messages.map(m => (
              <div key={m.id} className="chat-message">
                <span className="chat-sender" style={{ color: m.classColor || '#fde047' }}>{m.playerName}:</span>
                <span className="chat-text">{m.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 200))}
              placeholder="Press Enter to send..."
              maxLength={200}
            />
          </form>
        </>
      )}
    </div>
  )
}
