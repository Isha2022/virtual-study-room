
  const handleCopy = () => {
    if (finalRoomCode) {
      navigator.clipboard
        .writeText(finalRoomCode)
        .then(() => {
          toast.success("Code copied to clipboard!", {
            position: "top-center",
            autoClose: 1000,
            closeOnClick: true,
            pauseOnHover: true,
          });
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast.error("Failed to copy code!");
        });
    }
  };

  const handleExit = () => {
    navigate("/dashboard");
  };


  //handle open for spotify button
  const handleClickOpen = () => {
    setOpen(prevState => !prevState);
  };

  //handle close for spotify button
  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenMusicButton = () => {
    // Assuming this should toggle the floating music player visibility
    setOpenMusicPlayer(prevState => !prevState);
  };

  const [openMusicPlayer, setOpenMusicPlayer] = useState(false); //handle open and close for free tracks



  const [isActiveAddMore, setIsActiveAddMore] = useState(false); //initialise both variables: isActive and setIsActive to false
  const [isActiveMusic, setIsActiveMusic] = useState(false);
  const [isActiveCustom, setIsActiveCustom] = useState(false);
  const [isActiveCopy, setIsActiveCopy] = useState(false);
  const [isActiveExit, setIsActiveExit] = useState(false);


  // Method to leave room
  const leaveRoom = useCallback(async () => {

    try {
      // Close the WebSocket connection if it exists
      if (socket) {
        console.log("Closing WebSocket connection...");
        socket.close(); // Close the WebSocket connection
        setSocket(null);
      } else {
        console.log("Connection to websocket already terminated.");
      }

      const roomCode = finalRoomCode;
      const response1 = await getAuthenticatedRequest(
        `/get-participants/?roomCode=${roomCode}`,
        "GET"
      );
      console.log("Participants", response1.participantsList.length);
      console.log("num participants: ", participants.length);
      if (response1.participantsList.length == 1) {
        await deleteFirebaseFiles(finalRoomCode);
        console.log("all firebase files deleted successfully");
      }
      // delete all files associated with this room from firebase

      // This stuff gets sent to the backend!
      const response = await getAuthenticatedRequest("/leave-room/", "POST", {
        roomCode: finalRoomCode, // Sends the room name to the backend
      });

      console.log("leaving .. . .");

      console.log("ROOM CODE", finalRoomCode);

      if (response.status === 200) setIsActiveExit(true);
      // Redirect to the Dashboard
      navigate(`/dashboard/${response.username}`, {
        state: { userName: response.username },
      });
      console.log("User has left the room", response.username);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }, [finalRoomCode, navigate]);

  useEffect(() => {
    const handlePageHide = (event) => {
      leaveRoom();
    };

    // Add event listeners
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [leaveRoom]);

  const deleteFirebaseFiles = async (roomCode) => {
    try {
      const listRef = ref(storage, `shared-materials/${roomCode}/`);
      const res = await listAll(listRef);

      if (res.items.length != 0) {
        // Delete each file in the storage location
        const deletePromises = res.items.map((itemRef) =>
          deleteObject(itemRef)
        );
        await Promise.all(deletePromises);
        console.log("files deleted successfully!");
      } else {
        console.log("no firebase files to delete");
      }
    } catch (error) {
      console.log("error deleting files");
    }
  };


  const handleMouseDown = (btnType) => {
    //when the button is pressed then the variable setIsActive is set to True
    if (btnType === "addMore") {
      setIsActiveAddMore(true);
    } else if (btnType === "music") {
      setIsActiveMusic(true);
    } else if (btnType === "custom") {
      setIsActiveCustom(true);
    } else if (btnType === "copy") {
      setIsActiveCopy(true);
    } else if (btnType === "exit") {
      setIsActiveExit(true);
    }
  };

  const handleMouseUp = (btnType) => {
    //when the button is released then setIsActive is set to False
    if (btnType === "addMore") {
      setIsActiveAddMore(false);
    } else if (btnType === "music") {
      setIsActiveMusic(false);
    } else if (btnType === "custom") {
      setIsActiveCustom(false);
    } else if (btnType === "copy") {
      setIsActiveCopy(false);
    } else if (btnType === "exit") {
      setIsActiveExit(false);
    }
  };


return (
{/* Restructured header */}
      <div className="study-room-header">
        <h2 className="heading">Study Room: {roomName}</h2>
        <div className="header-right-section">
          <div className="utility-bar">
            <button
              type="button"
              className={`music-button ${isActiveMusic ? "active" : ""}`}
              onMouseDown={() => handleMouseDown("music")}
              onMouseUp={() => handleMouseUp("music")}
              onMouseLeave={() => handleMouseUp("music")}
              onClick={handleClickOpen}
            >
              <img src={musicLogo} alt="Music" />
            </button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>
                  <div style={{ textAlign: 'center' }}>Spotify Player</div>
                  <h2 style={{ textAlign: 'center', fontSize: '14px' }} >(playback for premium users only)</h2>
                </DialogTitle>
                <DialogContent>
                    <SpotifyButton />
                    <Button onClick={handleOpenMusicButton}>Switch to Free Tracks</Button>
                </DialogContent>
            </Dialog>
            <FloatingMusicPlayer isOpen={openMusicPlayer} onClose={() => setOpenMusicPlayer(false)} />
            <button
              type="button"
              className={`customisation-button ${
                isActiveCustom ? "active" : ""
              }`}
              onMouseDown={() => handleMouseDown("custom")}
              onMouseUp={() => handleMouseUp("custom")}
              onMouseLeave={() => handleMouseUp("custom")}
            >
              <img src={customLogo} alt="Customisation" />
            </button>
            <button
              type="button"
              className={`copy-button ${isActiveCopy ? "active" : ""}`}
              onClick={handleCopy}
              onMouseDown={() => handleMouseDown("copy")}
              onMouseUp={() => handleMouseUp("copy")}
              onMouseLeave={() => handleMouseUp("copy")}
            >
              <img src={copyLogo} alt="Copy" />
            </button>
            <button
              type="button"
              className={`exit-button ${isActiveExit ? "active" : ""}`}
              onMouseDown={() => handleMouseDown("exit")}
              onMouseUp={() => handleMouseUp("exit")}
              onMouseLeave={() => handleMouseUp("exit")}
              onClick={() => leaveRoom()}
            >
              <img src={exitLogo} alt="Exit" />
            </button>
          </div>
          <h3 className="gs-heading2">Code: {finalRoomCode}</h3>
        </div>
      </div>

      {/*End of header */}

)