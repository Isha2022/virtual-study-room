import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import GroupStudyPage from "../../pages/GroupStudyPage";
import { getAuthenticatedRequest } from "../../utils/authService";
import { listAll, deleteObject, ref, getStorage } from "firebase/storage";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

// Replace your current firebase/storage mock with this:
jest.mock("firebase/storage", () => {
  const actual = jest.requireActual("firebase/storage");
  return {
    ...actual,
    getStorage: jest.fn(() => ({
      // Mock storage instance
    })),
    ref: jest.fn((storage, path) => ({
      toString: () => path,
      fullPath: path,
    })),
    listAll: jest.fn(() =>
      Promise.resolve({
        items: [],
        prefixes: [],
        nextPageToken: null,
      })
    ),
    deleteObject: jest.fn(() => Promise.resolve()),
  };
});

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
  "../../assets/music/Cartoon, Jéja - C U Again ft. Mikk Mäe (Cartoon, Jéja, Futuristik VIP).mp3",
  () => "mock-audio-file-1"
);
jest.mock(
  "../../assets/music/Cartoon, Jéja - On & On (feat. Daniel Levi).mp3",
  () => "mock-audio-file-2"
);
jest.mock(
  "../../assets/music/Cartoon, Jéja - Why We Lose (feat. Coleman Trapp).mp3",
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

// Mock getAuthenticatedRequest for motivational message
jest.mock("../../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(() =>
    Promise.resolve({ message: "Believe in yourself and all that you are." })
  ),
}));

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
  // Mock the required props
  const mockSocket = {
    close: jest.fn(),
    send: jest.fn(),
    readyState: WebSocket.OPEN,
  };
  const mockNavigate = jest.fn();
  const mockSetSocket = jest.fn();
  const mockFinalRoomCode = "TEST123";

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock useNavigate
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => mockNavigate,
    }));
  });

  const renderComponent = () => {
    const mockLocationState = {
      state: {
        roomCode: "TEST123",
        roomName: "Test Room",
        roomList: "todo-list-1",
      },
    };

    // Mock useLocation to return our state
    jest
      .spyOn(require("react-router-dom"), "useLocation")
      .mockReturnValue(mockLocationState);

    render(
      <BrowserRouter initialEntries={["/group-study/TEST123"]}>
        <GroupStudyPage socket={mockSocket} />
      </BrowserRouter>
    );
  };

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
