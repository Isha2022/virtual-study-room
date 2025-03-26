
  const [customInput, setCustomInput] = useState(""); // For the customisation box
  const [chatInput, setChatInput] = useState(""); //Fot chat box

  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");



  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).slice(-2);
    }
    return color;
  };


function Chat() {

    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState("");



    // put this somewhere


    //Handles incoming messages.
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket Message:", data);
      if (data.type === "chat_message") {
        //if message type is 'chat_message' then add to messages state
        // Ensure the message is structured as an object with `sender` and `text`
        console.log("Received message:", data); // Debugging
        setMessages((prev) => [
          ...prev,
          { sender: data.sender, text: data.message },
        ]);
      }
      } else if (data.type === "typing") {
        setTypingUser(data.sender);

        // Remove "typing" message after 3 seconds
        setTimeout(() => {
          setTypingUser("");
        }, 3000);
      }
    };


  let typingTimeout;
  const handleTyping = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    // Send "typing" event to WebSocket
    socket.send(JSON.stringify({ type: "typing", sender: username }));

    // Prevent multiple events from being sent too frequently
    if (isTyping) {
      setIsTyping(true);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

    // Function to scroll to the bottom of the chat messages container
    const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
    };


    //Sends chat message through websocket connection
    const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error("WebSocket not connected.");
        return;
    }

    if (!chatInput.trim()) {
        // Prevent empty messages
        console.error("Cannot send an empty message.");
        return;
    }

    //construct a message with type, message and sender
    const messageData = {
        type: "chat_message",
        message: chatInput,
        sender: username,
    };

    console.log("Sending message to WebSocket:", messageData); // Debugging log

    socket.send(JSON.stringify(messageData));
    setChatInput(""); //resets chatinput field after sending message
    };

    return (

    {/* Chat Box */}
          <div className="chatBox-container">
            {/* Chat Messages */}
            <div className="chat-messages" ref={chatMessagesRef}>
              {messages.map((msg, index) => {
                const userColor = stringToColor(msg.sender); // Generate color for the sender
                const isSameUserAsPrevious =
                  index > 0 && messages[index - 1].sender === msg.sender;

                return  (
                  <div
                    key={index}
                    className={`chat-message ${
                      msg.sender === username ? "current-user" : "other-user"
                    }`}
                    style={{
                      color: userColor,
                      borderBottom: isSameUserAsPrevious ? "none" : "1px dotted #eee", // Conditionally apply border
                    }}
                  >
                    <strong>{msg.sender}:</strong> {msg.text}
                  </div>
                );
              })}
              {typingUser && (
                <p className="typing-indicator">
                  {" "}
                  <strong>{typingUser}</strong> is typing...
                </p>
              )}
            </div>

            {/* Chat Input */}
            <div className="input-container">
              <input
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(e)}
                  placeholder="Type a message..."
                />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
    );

}