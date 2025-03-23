import React, { useContext } from "react";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { FriendsProvider, FriendsContext } from '../../friends/FriendsContext';
import * as authService from "../../../utils/authService";
import { getDownloadURL } from 'firebase/storage';
import { async } from "@firebase/util";
import defaultAvatar from '../../../assets/avatars/avatar_2.png';


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

const TestComponent = () => {
    const { friends, invitationsRequests, loading, onAccept, onReject } = useContext(FriendsContext);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <ul className="friends-list">
                {friends.length === 0 ?
                    (
                        <p className="no-friends">No friends found.</p>
                    )
                    :
                    (
                        friends.map((friend) => (
                            <li key={friend.id} className="friend-card">
                                <img src={friend.image} alt="logo" className="pic" />
                                <h4>{friend.name} {friend.surname}</h4>
                                <p className="username">{friend.username}</p>
                                <button className="reject-btn" onClick={() => onReject(friend.id)} aria-label="delete friend"><i class="bi bi-trash"></i></button>
                                <button className="details-btn" onClick={() => handleOpenProfile(friend.id)} aria-label="details" > <i class="bi bi-eye"></i> </button>
                            </li>
                        ))
                    )
                }
            </ul>
            <div>
                {invitationsRequests.map(invitation => (
                    <div key={invitation.id}>
                        <img src={invitation.image} alt="logo" className="pic" />
                        <span>{invitation.name}</span>
                        <button onClick={() => onAccept(invitation.id, 'accept_friend', 'POST')}>Accept</button>
                        <button onClick={() => onReject(invitation.id)}>Reject</button>
                    </div>
                ))}
            </div>
            <button onClick={() => onAccept(3, 'create_friend_request', 'POST')}>Create Friend Request</button>
        </div>
    );
};

describe('FriendsContext', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(window, 'alert').mockImplementation(() => { });

        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should correctly fetch and render friends data', async () => {
        
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce()
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ]);

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

        const johnDoe = await screen.findByText('John Doe');
        const janeDoe = await screen.findByText('Jane Doe');

        expect(johnDoe).toBeInTheDocument();
        expect(janeDoe).toBeInTheDocument();
    });

    test('should use default avatar if image fetch fails', async () => {
        
        getDownloadURL.mockRejectedValueOnce(new Error('Image not found'));

        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ])
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ])
            .mockResolvedValueOnce([
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ]);

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );
        
        await waitFor(() => {
            const images = screen.getAllByRole('img'); // Find all images
            expect(images[0]).toHaveAttribute('src', ''); // Default avatar
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar.png'); // Second friend's avatar
        });
    });

    test('should call onAccept and update the friends list', async () => {
        
        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
        ];
        const initialInvitations = [
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        const acceptResponse = { status: 1 };

        authService.getAuthenticatedRequest.mockResolvedValueOnce(acceptResponse);
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([ 
                { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
                { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
            ]) 
            .mockResolvedValueOnce(initialFriends)
            .mockResolvedValueOnce(initialInvitations)
        
        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument(); // Invitation
        });

        const acceptButtons = screen.getAllByText('Accept');
        fireEvent.click(acceptButtons[0]); // Click the first "Accept" button

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument(); // Jane Doe should now be in the friends list
        });
    });

    test('should call onReject and remove friend from the list', async () => {
        
        const rejectResponse = { status: 1 };
        authService.getAuthenticatedRequest.mockResolvedValueOnce(rejectResponse);

        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
        ];
        const initialInvitations = [
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        const acceptResponse = { status: 1 }; 
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialFriends)
            .mockResolvedValueOnce(initialInvitations)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(acceptResponse);

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(async () => {
            const rejectButton = screen.getByText('Reject');
            expect(rejectButton).toBeInTheDocument();

            fireEvent.click(rejectButton);

            await waitFor(() => {
                expect(authService.getAuthenticatedRequest).toHaveBeenCalled();
            });
        });
    }); 

    test('should create a friend request and update the invitations list', async () => {
            
        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
        ];
        const initialInvitations = [
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        const createResponse = { id: 3, username: 'alice_doe', name: 'Alice Doe', image: 'https://example.com/avatar3.png' };
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialFriends)
            .mockResolvedValueOnce(initialInvitations) 
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(createResponse); 

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        });

        const createButton = screen.getByText('Create Friend Request');
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(authService.getAuthenticatedRequest).toHaveBeenCalledWith(
                '/create_friend_request/3/',
                'POST'
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Alice Doe')).toBeInTheDocument();
        });
    });

    test("should accept a friend request and update friends list", async () => {
        const mockRequests = [
            { id: 2, username: "jane_doe", name: "Jane", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        const mockFriends = [
            { id: 1, username: "john_doe", name: "John", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
                if (url === "/get_pending_friends/") return Promise.resolve(mockRequests);
                if (url === "/get_friends/") return Promise.resolve(mockFriends);
                if (url === "/get_made_requests/") return Promise.resolve([]);
                return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );

        await waitFor(() => expect(contextValue.friends).toEqual(mockFriends));
        await waitFor(() => expect(contextValue.friendRequests).toEqual(mockRequests));

        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

        act(() => {
            contextValue.onAccept(2, "accept_friend", "POST");
        });

        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve([...mockFriends, mockRequests[0]]);
            return Promise.resolve([]);
        });

        await waitFor(() => {
            expect(contextValue.friends).toContainEqual(mockRequests[0]);
            expect(contextValue.friendRequests).not.toContainEqual(mockRequests[0]);
        });
    });

    test("should remove a friend and add them to the requests list", async () => {
        const initialFriends = [
            { id: 1, username: "john_doe", name: "John Doe", image: "https://example.com/avatar.png" },
            { id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar.png" },
        ];

        const initialRequests = [];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends);
            if (url === "/get_pending_friends/") return Promise.resolve(initialRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );
        await waitFor(() => expect(contextValue.friends).toEqual(initialFriends));
        await waitFor(() => expect(contextValue.friendRequests).toEqual(initialRequests));
        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });
        act(() => {
            contextValue.onReject(2);
        });
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends.filter(f => f.id !== 2));
            if (url === "/get_pending_friends/") return Promise.resolve([{ id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar.png" }]);
            return Promise.resolve([]);
        });
        await waitFor(() => {
            expect(contextValue.friends).not.toContainEqual(expect.objectContaining({ id: 2 }));
            expect(contextValue.friendRequests).toContainEqual(expect.objectContaining({ id: 2 }));
        });
    });

    test("should log error when accepting friend request fails", async () => {
        const initialFriends = [
            { id: 1, username: "john_doe", name: "John Doe", image: "https://example.com/avatar.png" },
        ];

        const initialInvitations = [
            { id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar2.png" },
        ];
        const errorResponse = { status: 0 };  // Simulate failure (status: 0)
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialFriends) // Mock for /get_friends/
            .mockResolvedValueOnce(initialInvitations) // Mock for /get_pending_friends/
            .mockResolvedValueOnce([]) // Mock for /get_made_requests/
            .mockResolvedValueOnce(errorResponse); // Mock for /accept_friend/2/
        getDownloadURL.mockResolvedValue('https://example.com/avatar.png');
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );
        await waitFor(() => {
            expect(screen.getByText('Jane Doe')).toBeInTheDocument(); // Invitation should be there
        });
        const acceptButtons = screen.getAllByText('Accept');
        fireEvent.click(acceptButtons[0]);  // Click on the first accept button
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error accepting friend request");
        });
        consoleErrorSpy.mockRestore();
    });

    test('should use default avatar if image fetch fails for friends', async () => {
        
        getDownloadURL
            .mockRejectedValueOnce(new Error('Image not found')) // Simulate failure for the first invitation
            .mockResolvedValueOnce('https://example.com/avatar2.png'); // Simulate success for the second invitation

        const initialInvitations = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar2.png' },
        ];

        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([]) // Mock for /get_friends/
            .mockResolvedValueOnce([]) // Mock for /get_pending_friends/
            .mockResolvedValueOnce(initialInvitations); // Mock for /get_made_requests/

        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });

        await waitFor(() => {
            const images = screen.getAllByRole('img'); // Query by role='img'
            expect(images[0]).toHaveAttribute('src', defaultAvatar); // Default avatar for the first invitation
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar2.png'); // Second invitation's avatar
        });
    });

    test('should use default avatar if image fetch fails for invitations', async () => {
        
        getDownloadURL
            .mockRejectedValueOnce(new Error('Image not found')) // Simulate failure for the first invitation
            .mockResolvedValueOnce('https://example.com/avatar2.png'); // Simulate success for the second invitation
        const initialInvitations = [
            { id: 1, username: 'john_doe', name: 'John Doe' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe' },
        ];
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce([]) // Mock for /get_friends/
            .mockResolvedValueOnce(initialInvitations) // Mock for /get_pending_friends/
            .mockResolvedValueOnce([]); // Mock for /get_made_requests/
        render(
            <FriendsProvider>
                <TestComponent />
            </FriendsProvider>
        );
        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });
        await waitFor(() => {
            const images = screen.getAllByRole('img'); // Query by role='img'
            expect(images[0]).toHaveAttribute('src', defaultAvatar); // Default avatar for the first invitation
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar2.png'); // Second invitation's avatar
        });
    });

    test('should remove a friend and add them to the requests list', async () => {
        const initialFriends = [
            { id: 1, username: 'john_doe', name: 'John Doe', image: 'https://example.com/avatar.png' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe', image: 'https://example.com/avatar.png' },
        ];

        const initialRequests = [];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends);
            if (url === "/get_pending_friends/") return Promise.resolve(initialRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );
        await waitFor(() => expect(contextValue.friends).toEqual(initialFriends));
        await waitFor(() => expect(contextValue.friendRequests).toEqual(initialRequests));
        act(() => {
            contextValue.onReject(2);
        });
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve(initialFriends.filter(f => f.id !== 2)); // Ensure Jane is removed
            if (url === "/get_pending_friends/") return Promise.resolve([{ id: 2, username: "jane_doe", name: "Jane Doe", image: "https://example.com/avatar.png" }]);
            return Promise.resolve([]);
        });
        await waitFor(() => {
            expect(contextValue.friends).not.toContainEqual(expect.objectContaining({ id: 2 }));
            expect(contextValue.friendRequests).toContainEqual(expect.objectContaining({ id: 2 }));
        });
    });

    test('should use default avatar if image fetch fails for requests', async () => {
        const TestComponent1 = () => {
            const { friendRequests, friends, invitationsRequests, loading, onAccept, onReject } = useContext(FriendsContext);

            if (loading) return <div>Loading...</div>;

            return (
                <div>
                    <ul className="friends-list">
                        {friends.length === 0 ?
                            (
                                <p className="no-friends">No friends found.</p>
                            )
                            :
                            (
                                friends.map((friend) => (
                                    <li key={friend.id} className="friend-card">
                                        <img src={friend.image} alt="logo" className="pic" />
                                        <h4>{friend.name} {friend.surname}</h4>
                                        <p className="username">{friend.username}</p>
                                        <button className="reject-btn" onClick={() => onReject(friend.id)} aria-label="delete friend"><i class="bi bi-trash"></i></button>
                                        <button className="details-btn" onClick={() => handleOpenProfile(friend.id)} aria-label="details" > <i class="bi bi-eye"></i> </button>
                                    </li>
                                ))
                            )
                        }
                    </ul>
                    <div>
                        {invitationsRequests.map(invitation => (
                            <div key={invitation.id}>
                                <img src={invitation.image} alt="logo" className="pic" />
                                <span>{invitation.name}</span>
                                <button onClick={() => onAccept(invitation.id, 'accept_friend', 'POST')}>Accept</button>
                                <button onClick={() => onReject(invitation.id)}>Reject</button>
                            </div>
                        ))}
                    </div>
                    <div>
                        {friendRequests.map(requests => (
                            <div key={requests.id}>
                                <img src={requests.image} alt="logo" className="pic" />
                                <span>{requests.name}</span>
                                <button onClick={() => onAccept(requests.id, 'accept_friend', 'POST')}>Accept</button>
                                <button onClick={() => onReject(requests.id)}>Reject</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => onAccept(3, 'create_friend_request', 'POST')}>Create Friend Request</button>
                </div>
            );
        };
        
        getDownloadURL
            .mockRejectedValueOnce(new Error('Image not found')) // Simulate failure for the first request
            .mockResolvedValueOnce('https://example.com/avatar2.png'); // Simulate success for the second request
        const initialRequests = [
            { id: 1, username: 'john_doe', name: 'John Doe' },
            { id: 2, username: 'jane_doe', name: 'Jane Doe' },
        ];
        authService.getAuthenticatedRequest
            .mockResolvedValueOnce(initialRequests) // Mock for /get_friends/
            .mockResolvedValueOnce([]) // Mock for /get_pending_friends/
            .mockResolvedValueOnce([]); // Mock for /get_made_requests/
        render(
            <FriendsProvider>
                <TestComponent1 />
            </FriendsProvider>
        );
        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });
        await waitFor(() => {
            const images = screen.getAllByRole('img'); // Query by role='img'
            expect(images[0]).toHaveAttribute('src', defaultAvatar); // Default avatar for the first request
            expect(images[1]).toHaveAttribute('src', 'https://example.com/avatar2.png'); // Second request's avatar
        });
    });

    test("accept a friend request and update friends list", async () => {
        const mockRequests = [
            { id: 2, username: "jane_doe", name: "Jane", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        const mockFriends = [
            { id: 1, username: "john_doe", name: "John", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_pending_friends/") return Promise.resolve([]);
            if (url === "/get_friends/") return Promise.resolve(mockFriends);
            if (url === "/get_made_requests/") return Promise.resolve(mockRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );

        await waitFor(() => expect(contextValue.friends).toEqual(mockFriends));
        await waitFor(() => expect(contextValue.invitationsRequests).toEqual(mockRequests));

        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

        act(() => {
            contextValue.onAccept(2, "create_friend_request", "POST");
        });

        /*authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_friends/") return Promise.resolve([...mockFriends, mockRequests[0]]);
            return Promise.resolve([]);
        });

        await waitFor(() => {
            expect(contextValue.friends).toContainEqual(mockRequests[0]);
            expect(contextValue.friendRequests).not.toContainEqual(mockRequests[0]);
        });*/
    });

    test("reject an invitations request and update list", async () => {
        const mockRequests = [
            { id: 2, username: "jane_doe", name: "Jane", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        const mockFriends = [
            { id: 1, username: "john_doe", name: "John", surname: "Doe", image: "https://example.com/avatar.png" },
        ];
        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_pending_friends/") return Promise.resolve([]);
            if (url === "/get_friends/") return Promise.resolve(mockFriends);
            if (url === "/get_made_requests/") return Promise.resolve(mockRequests);
            return Promise.resolve([]);
        });

        let contextValue;
        render(
            <FriendsProvider>
                <FriendsContext.Consumer>
                    {(value) => {
                        contextValue = value;
                        return null;
                    }}
                </FriendsContext.Consumer>
            </FriendsProvider>
        );

        await waitFor(() => expect(contextValue.friends).toEqual(mockFriends));
        await waitFor(() => expect(contextValue.invitationsRequests).toEqual(mockRequests));

        authService.getAuthenticatedRequest.mockResolvedValueOnce({ status: 1 });

        act(() => {
            contextValue.onReject(2, "reject_friend", "DELETE");
        });

        authService.getAuthenticatedRequest.mockImplementation((url) => {
            if (url === "/get_made_requests/") return Promise.resolve([...mockFriends, mockRequests[0]]);
            return Promise.resolve([]);
        });

        await waitFor(() => {
            expect(contextValue.invitationsRequests).not.toContainEqual(mockRequests[0]);
        });
    });

});
