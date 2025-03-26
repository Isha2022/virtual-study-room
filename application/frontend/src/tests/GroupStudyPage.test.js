import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import GroupStudyPage from "../pages/GroupStudyPage";
import { getAuthenticatedRequest } from "../utils/authService";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

jest.mock("../assets/blueberry.jpeg", () => "blueberry.jpeg");
jest.mock("../assets/generate.PNG", () => "generate.PNG");
jest.mock("../firebase-config.js");

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
  "../assets/music/Defqwop - Heart Afire (feat. Strix).mp3",
  () => "mock-audio-file-4"
);
jest.mock(
  "../assets/music/[Rhythm Root] Wii Shop Channel Main Theme (HQ).mp3",
  () => "mock-audio-file-5"
);
jest.mock(
  "../assets/music/[K.K. Slider] Bubblegum K.K. - K.K. Slider.mp3",
  () => "mock-audio-file-6"
);
jest.mock(
  "../assets/music/[Gyro Zeppeli] Pokemon X & Y-Bicycle theme [OST].mp3",
  () => "mock-audio-file-7"
);

jest.mock("../pages/SharedMaterials", () => () => (
  <div data-testid="shared-materials-mock" />
));

jest.mock("../components/ToDoListComponents/newToDoList", () => {
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

describe("GroupStudyPage", () => {
  const mockNavigate = jest.fn();
  const mockLocation = {
    state: {
      roomCode: "TEST123",
      roomName: "Test Room",
      roomList: ["user1", "user2"],
      todoLists: [
        { id: 1, name: "Study Tasks" },
        { id: 2, name: "Assignment List" },
      ],
    },
    pathname: "/group-study/TEST123",
  };

  beforeEach(() => {
    useLocation.mockReturnValue(mockLocation);
    useNavigate.mockReturnValue(mockNavigate);
    getAuthenticatedRequest.mockClear();
    mockNavigate.mockClear();

    getAuthenticatedRequest.mockResolvedValue({
      username: "testuser",
      profilePicture: "test.jpg",
    });
  });

  test("renders main container with room information", async () => {
    render(
      <MemoryRouter initialEntries={["/group-study/TEST123"]}>
        <GroupStudyPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId("groupStudyRoom-container")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Study Room: Test Room")).toBeInTheDocument();
    });

    expect(screen.getByTestId("shared-materials-mock")).toBeInTheDocument();
  });
});
