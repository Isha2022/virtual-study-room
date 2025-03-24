import { render, screen, waitFor } from "@testing-library/react";
import UserBadges from "../UserBadges";
import axios from "axios";
import React from "react";
import { act } from "react-dom/test-utils";

jest.mock("axios");

describe("UserBadges Component", () => {
  const mockEarnedBadges = [
    { reward_number: 1, date_earned: "2024-03-15T00:00:00Z" }, // 1 Hour
    { reward_number: 3, date_earned: "2024-03-18T00:00:00Z" }, // 15 Hours
    { reward_number: 5, date_earned: "2024-03-20T00:00:00Z" }  // 50 Hours
  ];

  beforeEach(() => {
    localStorage.setItem("access_token", "test-token");
    axios.get.mockResolvedValue({ data: { earned_badges: mockEarnedBadges } });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("renders the component container", async () => {
    await act(async () => {
      render(<UserBadges />);
    });
    expect(screen.getByTestId("user-badges-container")).toBeInTheDocument();
  });

  test("displays all 8 badge images", async () => {
    await act(async () => {
      render(<UserBadges />);
    });
    expect(screen.getAllByRole('img')).toHaveLength(8);
  });

  test("shows correct number of earned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });
    
    await waitFor(() => {
      const earnedBadges = screen.getAllByText(/Earned:/);
      expect(earnedBadges).toHaveLength(mockEarnedBadges.length);
    });
  });

  test("formats earned badge dates correctly", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    await waitFor(() => {
      const earnedBadges = screen.getAllByText(/Earned:/);
      earnedBadges.forEach(badge => {
        const textContent = badge.textContent.replace(/\s+/g, ' ').trim();
        expect(textContent).toMatch(/Earned: \d{1,2}\/\d{1,2}\/\d{4}/);
      });
    });
  });

  test("shows correct number of unearned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    await waitFor(() => {
      const unearnedBadges = screen.getAllByText("Not yet earned");
      expect(unearnedBadges).toHaveLength(8 - mockEarnedBadges.length);
    });
  });

  test("applies correct styling to earned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    const earnedBadge = await screen.findByAltText("Badge 1 Hour");
    expect(earnedBadge).toHaveStyle("opacity: 1");
    expect(earnedBadge).toHaveStyle("filter: drop-shadow(0 0 4px #f2e2ba)");
  });

  test("applies correct styling to unearned badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    const unearnedBadge = await screen.findByAltText("Badge 30 Hours");
    expect(unearnedBadge).toHaveStyle("opacity: 0.4");
    expect(unearnedBadge).toHaveStyle("filter: grayscale(100%)");
  });

  test("handles missing access token", async () => {
    localStorage.removeItem("access_token");

    await act(async () => {
      render(<UserBadges />);
    });

    expect(axios.get).not.toHaveBeenCalled();
  });

  test("handles API errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("API error"));

    await act(async () => {
      render(<UserBadges />);
    });

    expect(axios.get).toHaveBeenCalled();
  });

  test("displays correct hour labels for all badges", async () => {
    await act(async () => {
      render(<UserBadges />);
    });

    const hourLabels = [
      "1 Hour", "5 Hours", "15 Hours", "30 Hours",
      "50 Hours", "75 Hours", "100 Hours", "150 Hours"
    ];

    hourLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});