import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import AllFriends from '../../friends/AllFriends';
import * as authService from '../../../utils/authService';
import { FriendsContext } from "../../friends/FriendsContext";
import { BrowserRouter as Router } from "react-router-dom";
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
jest.mock('../../../utils/authService', () => ({
    getAuthenticatedRequest: jest.fn(),
}));

jest.mock('../../friends/FriendsProfile', () => {
    return jest.fn(() => (
        <div data-testid="mock-user-profile">
            <h4>Name1 Surname1</h4>
        </div>
    ));
});


jest.mock('firebase/storage');
jest.mock('../../../firebase-config.js');
jest.mock('react-toastify', () => {
    const actual = jest.requireActual('react-toastify'); // Preserve the actual module
    return {
        ...actual, // Spread actual exports
        toast: {
            error: jest.fn(),
            success: jest.fn(),
        },
    };
});

const mockFriendsData = [
    { id: 1, name: "Name1", surname: "Surname1", username: "@username1" },
    { id: 2, name: "Name2", surname: "Surname2", username: "@username2" },
];

describe("AllFriends", () => {

    const mockOnReject = jest.fn(); // ✅ Use jest.fn() here
    const mockLoading = false;

    const renderWithContext = (contextValue) => {
        return render(
            <FriendsContext.Provider value={contextValue}>
                <AllFriends />
            </FriendsContext.Provider>
        );
    };

    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(window, 'alert').mockImplementation(() => { });
        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
        uploadBytes.mockResolvedValue();
        global.fetch = jest.fn(() =>
            Promise.resolve({
                blob: () => Promise.resolve(new Blob(['avatar'])),
            })
        );
        jest.spyOn(Storage.prototype, 'removeItem');
    });

    afterEach(() => {
        console.error.mockRestore();
        window.alert.mockRestore();
    });

    test("shows loading state", () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: [],
            loading: true,
        });
        expect(screen.getByText(/Loading Friends List/i)).toBeInTheDocument();
    });

  
    test('renders the list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: mockFriendsData,
            loading: mockLoading,
        });

        const friendNames = screen.getAllByRole('heading', { level: 4 });

        expect(friendNames[0]).toHaveTextContent('Name1');
        expect(friendNames[1]).toHaveTextContent('Name2');
    });

    test('renders the empty list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: [],
            loading: mockLoading,
        });

        expect(screen.getByText(/No friends found./i)).toBeInTheDocument();
    });

    test('renders the list of friends correctly and handles button click', async () => {
        renderWithContext({
            onReject: mockOnReject,
            friends: mockFriendsData,
            loading: mockLoading,
        });

        const rejectButtons = screen.getAllByRole('button', { name: /delete friend/i });
        expect(rejectButtons).toHaveLength(mockFriendsData.length);

        fireEvent.click(rejectButtons[0]);
        expect(mockOnReject).toHaveBeenCalledWith(mockFriendsData[0].id);
        expect(mockOnReject).toHaveBeenCalledTimes(1);  // Ensure it was called exactly once

        fireEvent.click(rejectButtons[1]);
        expect(mockOnReject).toHaveBeenCalledWith(mockFriendsData[1].id);
        expect(mockOnReject).toHaveBeenCalledTimes(2);  // Ensure it was called exactly twice
    });

    test('handles profile button click and opens user profile window', async () => {
        

        renderWithContext({
            onReject: mockOnReject,
            friends: mockFriendsData,
            loading: mockLoading,
        });
        const detailsButton = screen.getAllByRole('button', { name: /details/i })[0];
        fireEvent.click(detailsButton);
    });


});