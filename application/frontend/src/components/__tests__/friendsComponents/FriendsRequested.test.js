import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as authService from '../../../utils/authService';
import { FriendsContext } from "../../friends/FriendsContext";
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import FriendsRequested from '../../friends/FriendsRequested';

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
    { id: 1, name: "Name1", surname: "Surname1", username: "@username1" },
    { id: 2, name: "Name2", surname: "Surname2", username: "@username2" },
];

describe("PendingRequests", () => {

    const mockOnReject = jest.fn();
    const mockLoading = false;

    const renderWithContext = (contextValue) => {
        return render(
            <FriendsContext.Provider value={contextValue}>
                <FriendsRequested />
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
            invitationsRequests: [],
            loading: true,
        });
        expect(screen.getByText(/Loading Friend Requests.../i)).toBeInTheDocument();
    });


    test('renders the list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: mockRequestData,
            loading: mockLoading,
        });

        const friendNames = screen.getAllByText(/Name/i);
        expect(friendNames[0]).toHaveTextContent('Name1');
        expect(friendNames[1]).toHaveTextContent('Name2');
    });


    test('renders the empty list of friends correctly', async () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: [],
            loading: mockLoading,
        });

        expect(screen.getByText(/No pending invitations./i)).toBeInTheDocument();
    });

    test('renders the invitation actions and handles accept/reject button clicks', async () => {
        renderWithContext({
            onReject: mockOnReject,
            invitationsRequests: mockRequestData,
            loading: mockLoading,
        });

        const rejectButtons = screen.getAllByRole('button', { name: /remove friend/i });

        expect(rejectButtons).toHaveLength(mockRequestData.length);

        fireEvent.click(rejectButtons[0]);

        expect(mockOnReject).toHaveBeenCalledWith(mockRequestData[0].id);
        expect(mockOnReject).toHaveBeenCalledTimes(1);

    });



});