import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FriendsProfile from '../../friends/FriendsProfile';
import { getAuthenticatedRequest } from "../../../utils/authService";
import { getDownloadURL } from 'firebase/storage';
import defaultAvatar from '../../../assets/avatars/avatar_2.png';

// Mocking external modules
jest.mock("../../../utils/authService", () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock('firebase/storage');
jest.mock('../../../firebase-config.js');
jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
        success: jest.fn(),
    },
}));

const mockFriendsProfile = {
    id: 1,
    name: 'John',
    surname: 'Doe',
    username: '@johndoe',
    email: 'johndoe@example.com',
    hours_studied: 50,
    streaks: 10,
    share_analytics: true,
};

describe("FriendsProfile", () => {
    let setAddUserWindow;

    beforeEach(() => {
        setAddUserWindow = jest.fn();
        getDownloadURL.mockResolvedValue("https://example.com/avatar.jpg");
        getAuthenticatedRequest.mockResolvedValue(mockFriendsProfile);
        getDownloadURL.mockRejectedValue(new Error("Image not found"));
        jest.spyOn(console, "error").mockImplementation(() => { });

    });



    test('renders error message if fetch fails', async () => {
        getAuthenticatedRequest.mockRejectedValue(new Error("Failed to load profile"));

        await act(async () => {
            render(<FriendsProfile FriendsId={1} addUserWindow={true} setAddUserWindow={setAddUserWindow} />);
        });

        await waitFor(() => {
            expect(screen.getByText(/Failed to load profile./i)).toBeInTheDocument();
        });
    });

    test('renders the profile correctly when data is fetched', async () => {
        await act(async () => {
            render(<FriendsProfile FriendsId={1} addUserWindow={true} setAddUserWindow={setAddUserWindow} />);
        });

        await waitFor(() => {
            expect(screen.getByText(`${mockFriendsProfile.name} ${mockFriendsProfile.surname}`)).toBeInTheDocument();
            expect(screen.getByText(mockFriendsProfile.username)).toBeInTheDocument();
            expect(screen.getByText(mockFriendsProfile.email)).toBeInTheDocument();
        });
    });

    test('closes the modal when close button is clicked', async () => {
        await act(async () => {
            render(<FriendsProfile FriendsId={1} addUserWindow={true} setAddUserWindow={setAddUserWindow} />);
        });

        const closeButton = screen.getByText("×");
        await act(async () => {
            fireEvent.click(closeButton);
        });

        expect(setAddUserWindow).toHaveBeenCalledWith(false);
    });

    test('does not render anything when addUserWindow is false', async () => {
        await act(async () => {
            render(<FriendsProfile FriendsId={false} addUserWindow={false} setAddUserWindow={setAddUserWindow} />);
        });

        expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    test('closes the modal when the overlay is clicked', async () => {
        await act(async () => {
            render(<FriendsProfile FriendsId={1} addUserWindow={true} setAddUserWindow={setAddUserWindow} />);
        });

        const overlay = screen.getByTestId('modal-overlay');
        await act(async () => {
            fireEvent.click(overlay);
        });

        expect(setAddUserWindow).toHaveBeenCalledWith(false);
    });

    test('renders loading state when FriendsId is not provided', async () => {
        await act(async () => {
            render(<FriendsProfile FriendsId={null} addUserWindow={true} setAddUserWindow={setAddUserWindow} />);
        });

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('uses default avatar if image fetch fails', async () => {
        await act(async () => {
            render(<FriendsProfile FriendsId={1} addUserWindow={true} setAddUserWindow={setAddUserWindow} />);
        });

        await waitFor(() => {
            expect(screen.getByAltText("Profile")).toHaveAttribute("src", defaultAvatar);
        });
    });
});
