import React from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import GroupStudyPage from "../../pages/GroupStudyPage";
import axios from "axios";
import {
  ref,
  getDownloadURL,
  uploadBytes,
  listAll,
  deleteObject,
} from "firebase/storage";
import { getAuthenticatedRequest } from "../../utils/authService";

console.log(GroupStudyPage);
// Mock modules
jest.mock("axios");
jest.mock("@fontsource/vt323", () => {});
jest.mock("@fontsource/press-start-2p", () => {});
jest.mock("../../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
  getAccessToken: jest.fn(),
  refreshToken: jest.fn(),
  logoutUser: jest.fn(),
}));
jest.mock("firebase/storage");
jest.mock("../../firebase-config.js");

// Mock toast notifications
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

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
