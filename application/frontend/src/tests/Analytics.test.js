import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Analytics from "../pages/Analytics";
import axios from "axios";
import { getAuthenticatedRequest } from "../utils/authService";

// Mock the axios module to prevent actual HTTP requests
jest.mock("axios");
// Mock getAuthenticatedRequest function from authService
jest.mock("../utils/authService", () => ({
  getAuthenticatedRequest: jest.fn(),
}));

describe("Analytics Component", () => {
  // Before each test, set a mock token in localStorage to simulate authentication
  beforeEach(() => {
    localStorage.setItem("access_token", "mockToken");
  });

  // After each test clear all mocks and remove the mock token
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.removeItem("access_token");
  });

  // Test case 1 - makes sure stats are displayed correctly
  test("renders statistics correctly", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false,
      },
    });

    // Render Analytics Component
    render(<Analytics />);

    expect(screen.getByText("Statistics")).toBeInTheDocument(); // Check if Statistics header is present

    // Wait for API data to load and check that values are displayed correctly
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();  // Streaks
      expect(screen.getByText("4")).toBeInTheDocument();  // Avg. Study Hours
    });
  });

  // Test case 2 - makes sure that share statistics checkbox toggles
  test("toggles share statistics checkbox", async () => {
    // Mock API response data for analytics
    axios.get.mockResolvedValueOnce({
      data: {
        streaks: 5,
        total_hours_studied: 20,
        average_study_hours: 4,
        is_sharable: false, // Inititally not shareable
      },
    });
    
    // Mock API call for toggling share
    getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

    render(<Analytics />);

    const checkbox = await screen.findByRole("checkbox"); // Find checkbox element
    expect(checkbox).not.toBeChecked(); // Initially should be unchecked

    fireEvent.click(checkbox);  // Simulate clicking the checkbox

    await waitFor(() => {
      expect(getAuthenticatedRequest).toHaveBeenCalledWith("/share_analytics/", "PATCH");
      expect(checkbox).toBeChecked(); // Now checkbox should be checked
    });
  });

  // Test case 3 -  checks that the component can handle api failures
  test("handles API failure gracefully", async () => {
    // Mock APU call to fail with a network error
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(<Analytics />);

    // Wait and check if Statistics is still displayed
    await waitFor(() => {
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });
  });
});
