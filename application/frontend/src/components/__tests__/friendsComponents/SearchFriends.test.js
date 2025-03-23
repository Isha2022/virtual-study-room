import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FriendsContext } from "../../friends/FriendsContext";
import SearchFriends from '../../friends/SearchFriends';
import * as authService from "../../../utils/authService";
import { getDownloadURL } from 'firebase/storage';

jest.mock('../../../utils/authService', () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock('firebase/storage');
jest.mock('../../../firebase-config.js');

jest.mock('react-toastify', () => {
    const actual = jest.requireActual('react-toastify');
    return { 
        ...actual,
        toast: {
            error: jest.fn(),
            success: jest.fn(),
        },
    };
});

const mockRequestData = [
    { id: 3, username: "sam_smith", name: "Sam", surname: "Smith", image: "" },
];

describe("SearchFriends Component", () => {
    let mockOnReject, mockOnAccept, mockContext;

    const renderWithContext = (contextOverrides = {}) => {
        return render(
            <FriendsContext.Provider value={{ ...mockContext, ...contextOverrides }}>
                <SearchFriends />
            </FriendsContext.Provider>
        );
    };

    beforeEach(() => {
        mockOnReject = jest.fn();
        mockOnAccept = jest.fn();

        mockContext = {
            loading: false,
            onAccept: mockOnAccept,
            onReject: mockOnReject,
            friendRequests: [],
            invitationsRequests: [],
            friends: [],
        };

        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(window, 'alert').mockImplementation(() => { });

        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
        authService.getAuthenticatedRequest.mockResolvedValue(mockRequestData);
    });
    afterEach(() => {
        jest.restoreAllMocks(); // ✅ Restores all spies/mocks to their original behavior
    });

    test("displays loading state when loading is true", () => {
        renderWithContext({ loading: true });

        expect(screen.getByText(/Loading Friends.../i)).toBeInTheDocument();
    });

    test("fetches and displays friends when search query is longer than 2 characters", async () => {
        renderWithContext();

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" },
        });

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith("/find_friend/?q=Sam");
            expect(screen.getByText("Sam Smith (sam_smith)")).toBeInTheDocument();
            expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/avatar.png");
        });
    });

    test("renders 'you are already friends' message with remove button", async () => {
        renderWithContext({ friends: [{ id: 3, username: "sam_smith" }] });

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" },
        });

        await waitFor(() => {
            expect(screen.getByText("(you are already a friends)")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Add Friend"));
        expect(mockOnReject).toHaveBeenCalledWith(3);
    });

    test("renders 'user sent you request' message with accept/reject buttons", async () => {
        renderWithContext({ friendRequests: [{ id: 3, username: "sam_smith" }] });

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" },
        });

        await waitFor(() => {
            expect(screen.getByText("(user sent you request)")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Add Friend"));
        expect(mockOnAccept).toHaveBeenCalledWith(3, 'accept_friend', 'PATCH');
    });

    test("renders 'user sent you request' message with reject buttons", async () => {
        renderWithContext({ friendRequests: [{ id: 3, username: "sam_smith" }] });

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" },
        });

        await waitFor(() => {
            expect(screen.getByText("(user sent you request)")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Remove Friend"));
        expect(mockOnReject).toHaveBeenCalledWith(3);
    });

    test("renders 'you sent request' message with cancel button", async () => {
        renderWithContext({ invitationsRequests: [{ id: 3, username: "sam_smith" }] });

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" },
        });

        await waitFor(() => {
            expect(screen.getByText("(you sent request to that user)")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Add Friend"));
        expect(mockOnReject).toHaveBeenCalledWith(3);
    });

    test("renders 'add friend' button when user is not in any request list", async () => {
        renderWithContext();

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Alex" },
        });

        await waitFor(() => {
            expect(screen.getByLabelText("Add Friend")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText("Add Friend"));
        expect(mockOnAccept).toHaveBeenCalledWith(3, 'create_friend_request', 'POST');
    });

    test("should handle API error and show an alert when fetching friends fails", async () => {
        jest.spyOn(console, "error").mockImplementation(() => { }); // Mock console.error

        authService.getAuthenticatedRequest.mockRejectedValueOnce(
            new Error("Error fetching friends")
        );

        renderWithContext({
            loading: false,
            onAccept: jest.fn(),
            onReject: jest.fn(),
            friendRequests: [],
            invitationsRequests: [],
            friends: [],
        });
        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" }, // Needs to be >2 characters
        });

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledTimes(1);
        });

        expect(console.error).toHaveBeenCalled();
        expect(console.error.mock.calls[0][0]).toContain("Error fetching friends");

        console.error.mockRestore(); // Restore console.error
    });

    test("uses default avatar when getDownloadURL fails", async () => {
        const defaultAvatar = "http://localhost/"; // This should be the path to your default avatar

        getDownloadURL.mockRejectedValue(new Error("Failed to fetch image")); // Simulate failure

        render(
            <FriendsContext.Provider value={{ loading: false, onAccept: jest.fn(), onReject: jest.fn(), friendRequests: [], invitationsRequests: [], friends: [] }}>
                <SearchFriends />
            </FriendsContext.Provider>
        );

        fireEvent.change(screen.getByPlaceholderText("Add new friends..."), {
            target: { value: "Sam" },
        });
        const imgElement = await waitFor(() => screen.getByRole("img"));

        console.log("Image src after update:", imgElement.src); // Debugging output
        expect(imgElement.src).toBe(defaultAvatar); // Check if default avatar is used
    });








});
