import React, { useState } from "react"
import { gql, useMutation } from "@apollo/client"
import "./style.css";

const SEND_MAIL = gql`
  mutation sendMail($message: MessageInput!) {
    sendMail(message: $message) {
      result
    }
  }
`

const Index = () => {
  const [to, setTo] = useState("")
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [sendMail] = useMutation(SEND_MAIL)

  const handleSubmit = async () => {
    const message = {
      to,
      from,
      subject,
      text
    }
    console.log("Creating Todo:", message)
setText('')
setTo('')
setSubject('')
setFrom('')
    await sendMail({
      variables: {
        message,
      },

    })
  }

  return (
    <div className="container">
      <h1>Pet Theory System</h1>
        <div className="add_todo">
          <label htmlFor="email">
            From:
            <input type="email" id="email" name="email"
              value={from} placeholder='From:'
              onChange={({ target }) => setFrom(target.value)}
            />
          </label>
          <hr/>
          <label htmlFor="email">
            To:
            <input type="email" id="email" name="email"
              value={to} placeholder={'To:'}
              onChange={({ target }) => setTo(target.value)}
            />
          </label>
          <hr/>
          <label htmlFor="text">
            Subject:
            <input type="text"
              value={subject} placeholder={'Subject:'}
              onChange={({ target }) => setSubject(target.value)}
            />
          </label>
          <hr/>
          <label  htmlFor="text">
            Text:
            <textarea className="message"
              value={text} placeholder={'text:'}
              onChange={({ target }) => setText(target.value)}
            />
          </label>
          <hr/>
          <button onClick={() => handleSubmit()}>Send</button>
        </div>
     
    </div>
  )
}

export default Index