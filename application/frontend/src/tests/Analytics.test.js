import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Analytics from "../pages/Analytics";
import axios from "axios";
import { getAuthenticatedRequest } from "../utils/authService";


jest.mock("axios");
jest.mock("../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

describe("Analytics Component", () => {
  beforeEach(() => {
    localStorage.setItem("access_token", "mockToken");
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem("access_token");
  });

  test("renders statistics correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false,
      },
    });

    render(<Analytics />);

    expect(screen.getByText("Statistics")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });

  test("toggles share statistics checkbox", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false,
      },
    });
    
    getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

    render(<Analytics />);

    const checkbox = await screen.findByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(getAuthenticatedRequest).toHaveBeenCalledWith("/share_analytics/", "PATCH");
      expect(checkbox).toBeChecked();
    });
  });

  test("handles API failure gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });
});
