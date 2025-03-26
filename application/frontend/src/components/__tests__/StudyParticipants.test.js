import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useNavigate, useParams } from 'react-router-dom';
import StudyParticipants from '../StudyParticipants';
import { getAuthenticatedRequest } from '../../utils/authService';
import { ref, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';

//mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../utils/authService');
jest.mock('firebase/storage');
jest.mock('../../firebase-config.js');

jest.mock('../../assets/avatars/avatar_2.png', () => 'mock-default-avatar.png');

jest.mock('react-toastify', () => {
  const actual = jest.requireActual('react-toastify');
  return {
    ...actual,
    toast: {
      error: jest.fn(),
      success: jest.fn(),
      dismiss: jest.fn(),
      clearWaitingQueue: jest.fn(),
    },
  };
});

describe('StudyParticipants', () => {
  let consoleSpy;
  let mockSocket;
  const mockNavigate = jest.fn();
  const mockParticipants = [
    { username: 'user1' },
    { username: 'user2' }
  ];

  beforeEach(() => {
    //setup WebSocket mock
    mockSocket = {
      onmessage: jest.fn(),
      onerror: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN
    };
    global.WebSocket = jest.fn(() => mockSocket);

    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ roomCode: 'TEST123' });
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: mockParticipants })
      .mockResolvedValueOnce({});

  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  test('renders participants with avatars', async () => {
    render(<StudyParticipants />);

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getAllByAltText('profile')).toHaveLength(2);
    });
  });

  test('handles WebSocket participant updates', async () => {
    render(<StudyParticipants />);

    const newParticipants = [
      { username: 'user3', imageUrl: 'https://example.com/avatar3.png' },
      { username: 'user4', imageUrl: 'https://example.com/avatar4.png' }
    ];

    await waitFor(() => {
      mockSocket.onmessage({
        data: JSON.stringify({
          type: 'participants_update',
          participants: newParticipants
        })
      });

      expect(screen.getByText('user3')).toBeInTheDocument();
      expect(screen.getByText('user4')).toBeInTheDocument();
    });
  });

  test('handles participant data fetch failure', async () => {
    getAuthenticatedRequest.mockRejectedValueOnce(
      new Error('Failed to fetch participants')
    );
  
    render(<StudyParticipants />);
  
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'error fetching user data'
      );
    });
  });

  test('logs WebSocket errors to console', async () => {
    const mockError = new Error('WebSocket connection failed');
    global.WebSocket.mockImplementation(() => {
      const socket = {
        onmessage: jest.fn(),
        onerror: jest.fn(),
        close: jest.fn(),
        readyState: WebSocket.OPEN
      };

      setTimeout(() => {
        socket.onerror(mockError);
      }, 10);
      return socket;
    });

    render(<StudyParticipants />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'WebSocket error:',
        expect.objectContaining({
          message: 'WebSocket connection failed'
        })
      );
    });
  });

  test('handles malformed participant data', async () => {
    getAuthenticatedRequest.mockResolvedValueOnce({
      invalidField: 'bad data'
    });
  
    render(<StudyParticipants />);
  
    await waitFor(() => {
      expect(screen.queryByTestId('participant-item')).not.toBeInTheDocument();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  test('renders default avatar when image fetch fails', async () => {
    getDownloadURL.mockRejectedValueOnce(new Error('Image not found'));

    //mock API requests
    getAuthenticatedRequest
      .mockResolvedValueOnce({ participantsList: [{ username: 'testuser1' }] })
      .mockResolvedValueOnce({});

    render(<StudyParticipants />);

    await waitFor(() => {
        const avatars = screen.getAllByAltText('profile');
        expect(avatars[0]).toHaveAttribute('src', 'mock-default-avatar.png');
        
        avatars.forEach(avatar => {
          expect(avatar).toHaveAttribute('src', 'mock-default-avatar.png');
        });
    });
  });
  
});

describe('fetchParticipants Error Handling', () => {
    let consoleErrorSpy;
    const mockParticipants = [
        { username: 'user3', imageUrl: 'https://example.com/avatar3.png' },
        { username: 'user4', imageUrl: 'https://example.com/avatar4.png' }
      ];
  
    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      useParams.mockReturnValue({ roomCode: 'TEST123' });
    });
  
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });
  
    test('logs error when participant fetch fails', async () => {
      const mockError = new Error('Network error');
      getAuthenticatedRequest.mockRejectedValueOnce(mockError);
  
      render(<StudyParticipants />);
  
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching participants:',
          mockError
        );
      });
  
      expect(screen.queryByText('user1')).not.toBeInTheDocument();
      expect(screen.queryByText('user2')).not.toBeInTheDocument();
    });
  
    test('handles empty participants list', async () => {
      getAuthenticatedRequest.mockResolvedValueOnce({ participantsList: [] });
  
      render(<StudyParticipants />);
  
      await waitFor(() => {
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

});