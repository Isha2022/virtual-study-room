import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import GroupStudyPage from "../../pages/GroupStudyPage";
import { getAuthenticatedRequest } from "../../utils/authService";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

jest.mock("../../assets/blueberry.jpeg", () => "blueberry.jpeg");
jest.mock("../../assets/generate.PNG", () => "generate.PNG");
jest.mock("../../firebase-config.js");

jest.mock("@mui/material", () => ({
  Dialog: ({ children, open }) => (open ? <div>{children}</div> : null),
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogContent: ({ children }) => <div>{children}</div>,
  Button: ({ children }) => <button>{children}</button>,
}));

jest.mock("@mui/icons-material/PlayArrow", () => () => (
  <div>PlayArrowIcon</div>
));
jest.mock("@mui/icons-material/Pause", () => () => <div>PauseIcon</div>);
jest.mock("@mui/icons-material/SkipNext", () => () => <div>SkipNextIcon</div>);

jest.mock(
  "../assets/music/Cartoon, Jéja - C U Again ft. Mikk Mäe (Cartoon, Jéja, Futuristik VIP).mp3",
  () => "mock-audio-file-1"
);
jest.mock(
  "../assets/music/Cartoon, Jéja - On & On (feat. Daniel Levi).mp3",
  () => "mock-audio-file-2"
);
jest.mock(
  "../assets/music/Cartoon, Jéja - Why We Lose (feat. Coleman Trapp).mp3",
  () => "mock-audio-file-3"
);
jest.mock(
  "../../assets/music/Defqwop - Heart Afire (feat. Strix).mp3",
  () => "mock-audio-file-4"
);
jest.mock(
  "../../assets/music/[Rhythm Root] Wii Shop Channel Main Theme (HQ).mp3",
  () => "mock-audio-file-5"
);
jest.mock(
  "../../assets/music/[K.K. Slider] Bubblegum K.K. - K.K. Slider.mp3",
  () => "mock-audio-file-6"
);
jest.mock(
  "../../assets/music/[Gyro Zeppeli] Pokemon X & Y-Bicycle theme [OST].mp3",
  () => "mock-audio-file-7"
);

jest.mock("../../pages/SharedMaterials", () => () => (
  <div data-testid="shared-materials-mock" />
));

jest.mock("../../components/ToDoListComponents/newToDoList", () => {
  return function MockToDoList({ lists }) {
    const safeLists = Array.isArray(lists) ? lists : [];
    return (
      <div data-testid="todo-list">
        {safeLists.map((list) => (
          <div key={list.id || Math.random()} data-testid="todo-card">
            {list.name || "Unnamed List"}
          </div>
        ))}
      </div>
    );
  };
});

// Mock MotivationalMessage component
jest.mock(
  "../../pages/Motivation",
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

describe("GroupStudyPage - leaveRoom Functionality", () => {
  const mockSocket = {
    close: jest.fn(),
  };
  const mockNavigate = jest.fn();
  const mockSetSocket = jest.fn();
  const mockFinalRoomCode = "TEST123";

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock axios for motivational message
    axios.get.mockResolvedValue({
      data: { message: "Believe in yourself and all that you are." },
    });

    // Mock useNavigate
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => mockNavigate,
    }));
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <GroupStudyPage socket={mockSocket} />
      </BrowserRouter>
    );
  };

  test("renders ProfileBox component", async () => {
    render(<GroupStudyPage />);
  });

  test("should close WebSocket and navigate when leaving room successfully", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }, { id: 2 }] }) // Not last participant
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(mockSetSocket).toHaveBeenCalledWith(null);
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        `/get-participants/?roomCode=${mockFinalRoomCode}`,
        "GET"
      );
      expect(getAuthenticatedRequest).toHaveBeenCalledWith(
        "/leave-room/",
        "POST",
        { roomCode: mockFinalRoomCode }
      );
      expect(mockNavigate).toHaveBeenCalledWith(`/dashboard/testuser`, {
        state: { userName: "testuser" },
      });
      expect(toast.success).toHaveBeenCalledWith("Left room successfully!", {
        autoClose: 2000,
      });
    });
  });

  test("should delete Firebase files when last participant leaves", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }] }) // Last participant
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    // Mock Firebase storage
    const mockFiles = [{ ref: "file1" }, { ref: "file2" }];
    listAll.mockResolvedValueOnce({ items: mockFiles });
    deleteObject.mockResolvedValueOnce();

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    await waitFor(() => {
      expect(listAll).toHaveBeenCalled();
      expect(deleteObject).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith(
        "Room files cleaned up successfully",
        { autoClose: 2000 }
      );
    });
  });

  test("should handle Firebase file deletion errors gracefully", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }] }) // Last participant
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    // Mock Firebase error
    listAll.mockResolvedValueOnce({ items: [{ ref: "file1" }] });
    deleteObject.mockRejectedValueOnce(new Error("Deletion failed"));

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    await waitFor(() => {
      expect(deleteObject).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Error deleting Firebase files: Deletion failed",
        { autoClose: 2000 }
      );
    });
  });

  test("should handle API errors when leaving room", async () => {
    // Mock API error
    getAuthenticatedRequest.mockRejectedValueOnce(new Error("Network error"));

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("leave-room-button"));
    });

    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Error leaving room: Network error",
        { autoClose: 2000 }
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test("should handle pagehide event by calling leaveRoom", async () => {
    // Mock API responses
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ id: 1 }] })
      .mockResolvedValueOnce({ status: 200, username: "testuser" });

    renderComponent();

    // Trigger pagehide event
    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
    });

    await waitFor(() => {
      expect(mockSocket.close).toHaveBeenCalled();
      expect(getAuthenticatedRequest).toHaveBeenCalled();
    });
  });
});
