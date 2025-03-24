import React from "react";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import GroupStudyPage from "../pages/GroupStudyPage";
import axios from "axios";
import exitLogo from "../assets/exit_logo.png";
import musicLogo from "../assets/music_logo.png";
import customLogo from "../assets/customisation_logo.png";
import copyLogo from "../assets/copy_logo.png";
import MotivationalMessage from "../pages/Motivation";

//mock the necessary modules
jest.mock("axios");
jest.mock("@fontsource/vt323", () => {});
jest.mock("@fontsource/press-start-2p", () => {});
jest.mock(
  "../pages/Motivation",
  () =>
    ({ "data-testid": dataTestId, isError }) =>
      (
        <div data-testid={dataTestId}>
          {isError
            ? "Failed to load message"
            : "Believe in yourself and all that you are."}
        </div>
      )
);
describe("GroupStudyPage", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: { message: "Believe in yourself and all that you are." },
    });
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  test("renders the main container", async () => {
    render(<GroupStudyPage />);
    const mainContainer = screen.getByTestId("groupStudyRoom-container");
    expect(mainContainer).toBeInTheDocument();
  });

  test("renders all three columns", () => {
    render(<GroupStudyPage />);
    const columns = screen.getAllByRole("column");
    expect(columns.length).toBe(3);
  });

  test("renders motivational message", async () => {
    render(<GroupStudyPage />);

    // Wait for the motivational message to appear
    const messageElement = await screen.findByText(
      "Believe in yourself and all that you are."
    );
    expect(messageElement).toBeInTheDocument();
  });

  test("displays error message when API call fails", async () => {
    // Mock the API call to fail
    axios.get.mockRejectedValue(new Error("API Error"));

    // Render the GroupStudyPage with the error state
    render(<MotivationalMessage isError={true} />);

    // Wait for the error message to appear
    const errorMessage = await screen.findByText("Failed to load message");
    expect(errorMessage).toBeInTheDocument();
  });

  test("first column contains: todo-list, shared materials", () => {
    render(<GroupStudyPage />);

    const firstColumn = screen.getByTestId("column-1");

    // Verify the to-do list container is present
    const toDoListContainer = within(firstColumn).getByTestId(
      "todo-list-container"
    );
    expect(toDoListContainer).toBeInTheDocument();

    // Verify the shared materials container is present
    const sharedContainer = within(firstColumn).getByTestId(
      "sharedMaterials-container"
    );
    expect(sharedContainer).toBeInTheDocument();
  });

  test("second column contains: user-list, motivational messages", () => {
    render(<GroupStudyPage />);

    const secondColumn = screen.getByTestId("column-2");

    // Verify the to-do list container is present
    const userListContainer = within(secondColumn).getByTestId(
      "user-list-container"
    );
    expect(userListContainer).toBeInTheDocument();

    // Verify the shared materials container is present
    const motivMesgContainer = within(secondColumn).getByTestId(
      "motivationalMessage-container"
    );
    expect(motivMesgContainer).toBeInTheDocument();
  });

  test("third column contains: chatbox, timer", () => {
    render(<GroupStudyPage />);

    const thirdColumn = screen.getByTestId("column-3");

    // Verify the to-do list container is present
    const studyTimerContainer = within(thirdColumn).getByTestId(
      "studyTimer-container"
    );
    expect(studyTimerContainer).toBeInTheDocument();

    // Verify the shared materials container is present
    const chatBoxContainer =
      within(thirdColumn).getByTestId("chatBox-container");
    expect(chatBoxContainer).toBeInTheDocument();
  });

  test("renders the Add More button and handles mouse events", () => {
    render(<GroupStudyPage />);
    const todoListContainer = screen.getByTestId("todo-list-container");
    const addMoreButton = within(todoListContainer).getByText("Add More");

    // Verify the button is present
    expect(addMoreButton).toBeInTheDocument();

    // Simulate mouse down and verify the button is active
    fireEvent.mouseDown(addMoreButton);
    expect(addMoreButton).toHaveClass("active");

    // Simulate mouse up and verify the button is inactive
    fireEvent.mouseUp(addMoreButton);
    expect(addMoreButton).not.toHaveClass("active");
  });

  test("renders the Music button and handles mouse events", () => {
    render(<GroupStudyPage />);
    const userListContainer = screen.getByTestId("user-list-container");
    const utilityBar = within(userListContainer).getByTestId("utility-bar");
    const musicButton = within(utilityBar).getByRole("button", {
      name: /music/i,
    });

    // Verify the button is present
    expect(musicButton).toBeInTheDocument();
    const musicImage = within(musicButton).getByRole("img", { name: /music/i });
    expect(musicImage).toHaveAttribute("src", musicLogo);

    // Simulate mouse down and verify the button is active
    fireEvent.mouseDown(musicButton);
    expect(musicButton).toHaveClass("active");

    // Simulate mouse up and verify the button is inactive
    fireEvent.mouseUp(musicButton);
    expect(musicButton).not.toHaveClass("active");
  });

  test("renders the Customisation button and handles mouse events", () => {
    render(<GroupStudyPage />);
    const userListContainer = screen.getByTestId("user-list-container");
    const utilityBar = within(userListContainer).getByTestId("utility-bar");
    const customButton = within(utilityBar).getByRole("button", {
      name: /customisation/i,
    });

    // Verify the button is present
    expect(customButton).toBeInTheDocument();
    const customImage = within(customButton).getByRole("img", {
      name: /customisation/i,
    });
    expect(customImage).toHaveAttribute("src", customLogo);

    // Simulate mouse down and verify the button is active
    fireEvent.mouseDown(customButton);
    expect(customButton).toHaveClass("active");

    // Simulate mouse up and verify the button is inactive
    fireEvent.mouseUp(customButton);
    expect(customButton).not.toHaveClass("active");
  });

  test("renders the Copy button and handles mouse events", () => {
    render(<GroupStudyPage />);
    const userListContainer = screen.getByTestId("user-list-container");
    const utilityBar = within(userListContainer).getByTestId("utility-bar-2");
    const copyButton = within(utilityBar).getByRole("button", {
      name: /copy/i,
    });

    // Verify the button is present
    expect(copyButton).toBeInTheDocument();

    const copyImage = within(copyButton).getByRole("img", { name: /copy/i });
    expect(copyImage).toHaveAttribute("src", copyLogo);

    // Simulate mouse down and verify the button is active
    fireEvent.mouseDown(copyButton);
    expect(copyButton).toHaveClass("active");

    // Simulate mouse up and verify the button is inactive
    fireEvent.mouseUp(copyButton);
    expect(copyButton).not.toHaveClass("active");
  });

  test("renders the Exit button and handles mouse events", () => {
    render(<GroupStudyPage />);
    const userListContainer = screen.getByTestId("user-list-container");
    const utilityBar = within(userListContainer).getByTestId("utility-bar-2");
    const exitButton = within(utilityBar).getByRole("button", {
      name: /exit/i,
    });

    // Verify the button is present
    expect(exitButton).toBeInTheDocument();

    const exitImage = within(exitButton).getByRole("img", { name: /exit/i });
    expect(exitImage).toHaveAttribute("src", exitLogo);

    // Simulate mouse down and verify the button is active
    fireEvent.mouseDown(exitButton);
    expect(exitButton).toHaveClass("active");

    // Simulate mouse up and verify the button is inactive
    fireEvent.mouseUp(exitButton);
    expect(exitButton).not.toHaveClass("active");
  });

  test("renders the correct heading labels in column 2", () => {
    render(<GroupStudyPage />);

    // Find the second column by its test ID
    const column2 = screen.getByTestId("column-2");

    // Check for the <h2> heading "Study Room:"
    const studyRoomHeading = within(column2).getByRole("heading", {
      name: /study room:/i,
    });
    expect(studyRoomHeading).toBeInTheDocument();
    expect(studyRoomHeading).toHaveClass("heading");

    // Check for the <h3> heading "Code: a2654h"
    const codeHeading = within(column2).getByRole("heading", {
      name: /code: /i,
    });
    expect(codeHeading).toBeInTheDocument();
    expect(codeHeading).toHaveClass("gs-heading2");
  });
});

describe("leaveRoom Function", () => {
  let mockSocket;
  let mockNavigate;

  beforeEach(() => {
    mockSocket = {
      close: jest.fn(),
    };
    mockNavigate = jest.fn();
    getAuthenticatedRequest.mockClear();
    deleteObject.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  test("successfully leaves the room and deletes Firebase files if the user is the last participant", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }] }) // Mock get-participants response
      .mockResolvedValueOnce({ status: 200, username: "testuser" }); // Mock leave-room response

    // Mock Firebase file deletion
    listAll.mockResolvedValueOnce({ items: [{ name: "file1" }] });
    deleteObject.mockResolvedValueOnce();

    // Render the component
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );

    // Call leaveRoom
    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    // Assertions
    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled(); // WebSocket connection closed
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/get-participants/?roomCode=testRoomCode",
        "GET"
      );
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/leave-room/",
        "POST",
        { roomCode: "testRoomCode" }
      );
      expect(deleteObject).toHaveBeenCalled(); // Firebase files deleted
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/testuser", {
        state: { userName: "testuser" },
      });
      expect(toast.success).toHaveBeenCalledWith("Left room successfully!", {
        autoClose: 2000,
      });
    });
  });

  test("leaves the room without deleting Firebase files if there are other participants", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }, { id: 2 }] }) // Multiple participants
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    // Render the component
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );

    // Call leaveRoom
    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    // Assertions
    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/get-participants/?roomCode=testRoomCode",
        "GET"
      );
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/leave-room/",
        "POST",
        { roomCode: "testRoomCode" }
      );
      expect(deleteObject).not.toHaveBeenCalled(); // Firebase files not deleted
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/testuser", {
        state: { userName: "testuser" },
      });
      expect(toast.success).toHaveBeenCalledWith("Left room successfully!", {
        autoClose: 2000,
      });
    });
  });

  test("handles errors when leaving the room", async () => {
    // Mock API error
    getAuthenticatedRequest.mockRejectedValueOnce(new Error("API error"));

    // Render the component
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );

    // Call leaveRoom
    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    // Assertions
    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Error leaving room: API error",
        { autoClose: 2000 }
      );
    });
  });

  test("handles errors when deleting Firebase files", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }] }) // Only one participant
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    // Mock Firebase error
    listAll.mockResolvedValueOnce({ items: [{ name: "file1" }] });
    deleteObject.mockRejectedValueOnce(new Error("Firebase error"));

    // Render the component
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );

    // Call leaveRoom
    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    // Assertions
    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Error deleting Firebase files: Firebase error",
        { autoClose: 2000 }
      );
    });
  });

  test("ensures the WebSocket connection is closed properly", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }] })
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    // Render the component
    render(
      <Router>
        <SharedMaterials socket={mockSocket} />
      </Router>
    );

    // Call leaveRoom
    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    // Assertions
    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(mockSocket).toBeNull(); // Ensure socket is set to null
    });
  });
});
